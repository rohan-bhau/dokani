'use client';

import { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  PauseCircle,
  Package,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useGetProductsQuery, type ProductItem } from '@/store/productApi';
import { useLazyGetSaleByIdQuery, type InvoiceResponse } from '@/store/salesApi';
import { useGetSettingsQuery } from '@/store/settingsApi';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useSocket } from '@/hooks/useSocket';
import { CheckoutModal } from '@/components/pos/checkout-modal';
import { PrintableReceipt } from '@/components/pos/printable-receipt';
import { Permission } from '@dokani/shared';
import { AuthGuard } from '@/components/auth-guard';
import { DokaniLogo, ShopLogo } from '@/components/dokani-logo';

interface CartItem {
  product: ProductItem;
  quantity: number;
  discount: number;
}

interface HeldOrder {
  id: string;
  timestamp: string;
  items: CartItem[];
  customerName?: string;
}

interface GatewaySuccessData {
  invoice: InvoiceResponse;
  tranId: string;
  valId: string;
  bankTranId: string;
  amount: string;
}

function PosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [triggerGetSale] = useLazyGetSaleByIdQuery();
  const userTenant = useSelector((state: RootState) => state.auth.user?.tenant);
  const { data: settingsData } = useGetSettingsQuery();
  const shopName = settingsData?.data?.name || userTenant?.name || 'Dokani Store';
  const shopLogoUrl = settingsData?.data?.logoUrl ?? null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Held orders
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceResponse | null>(null);
  const [gatewaySuccessData, setGatewaySuccessData] = useState<GatewaySuccessData | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<{ type: 'error' | 'warning'; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Handle return from official SSLCommerz hosted payment gateway
  useEffect(() => {
    const paymentStatus = searchParams?.get('payment_status');
    const invoiceId = searchParams?.get('invoice_id');

    if (paymentStatus === 'success' && invoiceId) {
      triggerGetSale(invoiceId)
        .unwrap()
        .then((res) => {
          setGatewaySuccessData({
            invoice: res.data,
            tranId: searchParams.get('tran_id') || '',
            valId: searchParams.get('val_id') || '',
            bankTranId: searchParams.get('bank_tran_id') || '',
            amount: searchParams.get('amount') || '',
          });
          setCart([]);
          setCartDiscount(0);
          router.replace('/pos');
        })
        .catch(() => {
          setPaymentBanner({
            type: 'error',
            message: 'Failed to retrieve invoice details after payment.',
          });
          router.replace('/pos');
        });
    } else if (paymentStatus === 'cancelled') {
      setPaymentBanner({
        type: 'warning',
        message: 'SSLCommerz payment session was cancelled.',
      });
      router.replace('/pos');
    } else if (paymentStatus === 'failed') {
      const reason = searchParams?.get('reason') || 'Transaction could not be completed.';
      setPaymentBanner({
        type: 'error',
        message: `SSLCommerz payment failed: ${reason}`,
      });
      router.replace('/pos');
    }
  }, [searchParams, router, triggerGetSale]);

  // Real-time synchronization via Socket.io
  useSocket({
    onPaymentConfirmed: (event) => {
      if (event.invoiceId) {
        triggerGetSale(event.invoiceId)
          .unwrap()
          .then((res) => {
            setGatewaySuccessData({
              invoice: res.data,
              tranId: event.reference || 'TXN_VERIFIED',
              valId: '',
              bankTranId: event.reference || '',
              amount: event.amount ? String(event.amount) : '',
            });
            setCart([]);
            setCartDiscount(0);
          })
          .catch(() => {});
      }
    },
  });

  // Products query (loaded in memory for zero-latency instant POS responsiveness)
  const { data: productsData, isLoading } = useGetProductsQuery({
    page: 1,
    limit: 100,
  });

  const products = productsData?.data.products ?? [];

  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      showToast(`${product.name} is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more. Stock limit (${product.stock}) reached.`);
          return prev;
        }
        showToast(`Updated ${product.name} quantity to ${existing.quantity + 1}`);
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      showToast(`Added ${product.name} to cart.`);
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const qty = Math.min(newQty, item.product.stock);
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
  };

  const holdCart = () => {
    if (cart.length === 0) {
      showToast('Cart is empty. Add products before holding.');
      return;
    }
    const order: HeldOrder = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart,
    };
    setHeldOrders((prev) => [order, ...prev]);
    clearCart();
    showToast(`Order held (${order.items.length} items). Access via "Held" button.`);
  };

  const resumeHeldOrder = (order: HeldOrder) => {
    setCart(order.items);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    setShowHeldOrders(false);
    showToast(`Restored order from ${order.timestamp}.`);
  };

  // Barcode scanner integration: instantly adds product to cart on hardware scan
  useBarcodeScanner({
    onScan: (barcode) => {
      const clean = barcode.trim().toLowerCase();
      const matched = products.find(
        (p) =>
          p.barcode?.trim().toLowerCase() === clean ||
          p.sku?.trim().toLowerCase() === clean
      );
      if (matched) {
        addToCart(matched);
      } else {
        showToast(`Scanned barcode "${barcode}" not found in store inventory.`);
      }
    },
  });

  // Client-side search and category filtering (instant zero-latency)
  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== 'ALL') {
      list = list.filter((p) => (p as any).category?.name?.toUpperCase() === selectedCategory);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameBn && p.nameBn.toLowerCase().includes(q)) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategory, searchTerm]);

  // Handle Enter key inside search box to immediately add product to cart
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchTerm.trim().toLowerCase();
      if (!q) return;

      // 1. Exact match by barcode or SKU
      const exactMatch = products.find(
        (p) =>
          p.barcode?.trim().toLowerCase() === q ||
          p.sku.trim().toLowerCase() === q
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        return;
      }

      // 2. First product in filtered list
      if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
        return;
      }

      showToast(`No product found matching "${searchTerm.trim()}".`);
    }
  };

  // Global Keyboard shortcuts:
  // - Focus Search: F1 or Ctrl+K / Cmd+K or '/' (when not typing in an input)
  // - Hold Cart: F8 or Ctrl+H
  // - Pay Now / Checkout: F9 or Ctrl+Enter
  // - Escape: Close checkout / clear focus
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Search focus shortcut
      if (
        e.key === 'F1' ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') ||
        (e.key === '/' && !isInput)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Hold cart shortcut
      if (e.key === 'F8' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        holdCart();
        return;
      }

      // Checkout shortcut
      if (
        e.key === 'F9' ||
        ((e.ctrlKey || e.metaKey) && e.key === 'Enter')
      ) {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        } else {
          showToast('Cart is empty. Select products before checkout.');
        }
        return;
      }

      // Escape key to dismiss modals
      if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        } else if (showHeldOrders) {
          setShowHeldOrders(false);
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, isCheckoutOpen, showHeldOrders, products, filteredProducts, searchTerm]);

  // Calculations
  const { subtotal, vatTotal, grandTotal } = useMemo(() => {
    let sub = 0;
    let vat = 0;

    cart.forEach((item) => {
      const itemSubtotal = item.product.sellPrice * item.quantity - item.discount;
      const itemVat = (itemSubtotal * item.product.vatRate) / 10000;
      sub += itemSubtotal;
      vat += itemVat;
    });

    const total = Math.max(0, sub + vat - cartDiscount);
    return { subtotal: sub, vatTotal: Math.round(vat), grandTotal: Math.round(total) };
  }, [cart, cartDiscount]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      const catName = (p as any).category?.name;
      if (catName) list.add(catName.toUpperCase());
    });
    return ['ALL', ...Array.from(list)];
  }, [products]);

  return (
    <AuthGuard requireAnyPermissions={[Permission.SALE_CREATE]}>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl border border-slate-700 pointer-events-none transition-all animate-in fade-in slide-in-from-top-2"
        >
          {toastMessage}
        </div>
      )}
      <div className="mx-auto max-w-7xl w-full px-4 py-4 sm:px-6 md:px-8 flex-1 flex flex-col">
        {paymentBanner && (
          <div
            className={`mb-3 flex items-center justify-between rounded-xl border p-3 text-xs ${
              paymentBanner.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{paymentBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentBanner(null)}
              className="p-1 hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start">
          {/* LEFT: Product Catalog & Search (65%) */}
      <div className="flex flex-1 flex-col rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        {/* Search & Category Header */}
        <div className="p-3 border-b border-border bg-surface-subtle flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="flex w-full items-center gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                data-barcode-target="true"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or type & press Enter... (F1 / Ctrl+K)"
                className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
              className="lg:hidden flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white shrink-0 shadow-2xs"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="tabular-nums">
                ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-brand text-white font-semibold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-28 rounded-lg bg-slate-100 animate-pulse border border-border" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <Package className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-xs">No matching products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = !isOutOfStock && p.stock <= p.reorderLevel;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`group relative flex flex-col justify-between rounded-lg border p-2.5 text-left transition-all ${
                      isOutOfStock
                        ? 'opacity-40 cursor-not-allowed bg-slate-50 border-border'
                        : 'bg-white hover:border-brand hover:shadow-sm border-border active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-brand">
                        {p.name}
                      </h4>
                      {p.nameBn && (
                        <p className="text-[10px] text-slate-500 font-bangla line-clamp-1">
                          {p.nameBn}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {p.sku}
                      </p>
                    </div>

                    <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        ৳{p.sellPrice.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-medium tabular-nums ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : isLowStock
                            ? 'text-amber-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {isOutOfStock ? '0 stock' : `${p.stock} ${p.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Active Cart Drawer (35%) */}
      <div
        className={`flex w-full flex-col rounded-lg border border-border bg-surface shadow-sm overflow-hidden lg:w-[380px] xl:w-[420px] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] ${
          isMobileCartOpen
            ? 'fixed inset-x-0 bottom-0 top-16 z-50 rounded-none border-t shadow-2xl p-2 lg:p-0 lg:rounded-lg lg:border'
            : 'hidden lg:flex'
        }`}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-subtle p-3 text-xs">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-brand" />
            <h3 className="font-bold text-slate-900">Current Cart</h3>
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[11px] font-semibold text-brand">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className="lg:hidden rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
            >
              Close
            </button>
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeldOrders(!showHeldOrders)}
                className="flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900"
              >
                <Layers className="h-3 w-3" />
                <span>Held ({heldOrders.length})</span>
              </button>
            )}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Held Orders View or Cart Items View */}
        {showHeldOrders ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Held Transactions</h4>
            {heldOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded border border-border p-2.5 text-xs bg-slate-50"
              >
                <div>
                  <span className="font-semibold text-slate-900">Held at {order.timestamp}</span>
                  <p className="text-[11px] text-slate-500">
                    {order.items.length} unique products
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resumeHeldOrder(order)}
                  className="rounded bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-hover"
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-border p-2">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400">
                <ShoppingCart className="h-8 w-8 mb-2 stroke-1" />
                <p className="text-xs">Your cart is empty.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click a product or scan a barcode to add.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="p-2 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        ৳{item.product.sellPrice} / {item.product.unit}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      ৳{(item.product.sellPrice * item.quantity - item.discount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center rounded border border-border">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center font-bold tabular-nums text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="p-1 hover:bg-slate-100 text-slate-600 disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Totals & Action Checkout Bar */}
        <div className="border-t border-border bg-surface p-4 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="tabular-nums font-medium text-slate-900">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT:</span>
              <span className="tabular-nums font-medium text-slate-900">৳{vatTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Discount:</span>
              <input
                type="number"
                min="0"
                value={cartDiscount}
                onChange={(e) => setCartDiscount(Number(e.target.value))}
                className="w-20 rounded border border-border px-1.5 py-0.5 text-right font-medium text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-slate-900">
              <span>TOTAL:</span>
              <span className="text-xl tabular-nums text-brand">৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) {
                  showToast('Cart is empty. Add products before holding.');
                } else {
                  holdCart();
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded border py-2.5 text-xs font-semibold transition ${
                cart.length === 0
                  ? 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                  : 'border-border bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
              }`}
            >
              <PauseCircle className="h-4 w-4" />
              <span>Hold Cart [F8]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (cart.length === 0) {
                  showToast('Cart is empty. Add products before checkout.');
                } else {
                  setIsCheckoutOpen(true);
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded py-2.5 text-xs font-bold text-white shadow-sm transition ${
                cart.length === 0
                  ? 'bg-brand/60 cursor-pointer'
                  : 'bg-brand hover:bg-brand-hover active:scale-[0.99]'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Now [F9]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        subtotal={subtotal}
        vatTotal={vatTotal}
        discount={cartDiscount}
        total={grandTotal}
        items={cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        }))}
        onSuccess={(invoice) => {
          setIsCheckoutOpen(false);
          clearCart();
          setCompletedInvoice(invoice);
        }}
      />

      {/* SSLCommerz Verified Transaction Modal */}
      {gatewaySuccessData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white border border-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            {/* Brand + Shop Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <ShopLogo name={shopName} logoUrl={shopLogoUrl} size="sm" />
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{shopName}</p>
                  <p className="text-[10px] text-slate-500">Digital Payment Confirmation</p>
                </div>
              </div>
              <DokaniLogo size={24} showWordmark subtitle="Verified" />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payment Verified via SSLCommerz
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Invoice settled and inventory updated.
                  </p>
                </div>
              </div>
              <span className="rounded border-2 border-emerald-700 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-800">
                PAID
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900">{gatewaySuccessData.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Transaction ID (tran_id):</span>
                <span className="font-mono font-bold text-indigo-700">{gatewaySuccessData.tranId || 'TXN_VERIFIED'}</span>
              </div>
              {gatewaySuccessData.bankTranId && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Bank Tran ID:</span>
                  <span className="font-mono text-slate-800">{gatewaySuccessData.bankTranId}</span>
                </div>
              )}
              {gatewaySuccessData.valId && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Validation ID (val_id):</span>
                  <span className="font-mono text-slate-700">{gatewaySuccessData.valId}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 pt-1">
                <span className="font-semibold text-slate-700">Amount Paid:</span>
                <span className="text-base font-extrabold text-emerald-700 tabular-nums">
                  ৳{Number(gatewaySuccessData.amount || gatewaySuccessData.invoice.total).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setGatewaySuccessData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                New Sale
              </button>
              <button
                type="button"
                onClick={() => {
                  const inv = gatewaySuccessData.invoice;
                  setGatewaySuccessData(null);
                  setCompletedInvoice(inv);
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-hover transition flex items-center justify-center gap-2 shadow-xs"
              >
                <span>View Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Printable 80mm Receipt */}
        <PrintableReceipt
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
        </div>
      </div>
    </AuthGuard>
  );
}

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <PosContent />
    </Suspense>
  );
}
