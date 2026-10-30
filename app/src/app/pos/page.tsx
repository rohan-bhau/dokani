'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useGetProductsQuery, type ProductItem } from '@/store/productApi';
import type { InvoiceResponse } from '@/store/salesApi';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { CheckoutModal } from '@/components/pos/checkout-modal';
import { PrintableReceipt } from '@/components/pos/printable-receipt';

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

export default function PosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDiscount, setCartDiscount] = useState<number>(0);

  // Held orders
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [showHeldOrders, setShowHeldOrders] = useState(false);

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<InvoiceResponse | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Products query
  const { data: productsData, isLoading } = useGetProductsQuery({
    page: 1,
    limit: 100,
    q: searchTerm.trim() || undefined,
  });

  const products = productsData?.data.products ?? [];

  // Barcode scanner integration: instantly adds product to cart on hardware scan
  useBarcodeScanner({
    onScan: (barcode) => {
      const matched = products.find((p) => p.barcode === barcode || p.sku === barcode);
      if (matched) {
        addToCart(matched);
      }
    },
  });

  // Global Keyboard shortcuts: F1 (search), F8 (hold cart), F9 (checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) holdCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setIsCheckoutOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
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
    if (cart.length === 0) return;
    const order: HeldOrder = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      items: cart,
    };
    setHeldOrders((prev) => [order, ...prev]);
    clearCart();
  };

  const resumeHeldOrder = (order: HeldOrder) => {
    setCart(order.items);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    setShowHeldOrders(false);
  };

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

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-4 lg:flex-row">
      {/* LEFT: Product Catalog & Search (65%) */}
      <div className="flex flex-1 flex-col rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        {/* Search & Category Header */}
        <div className="p-3 border-b border-border bg-surface-subtle flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              data-barcode-target="true"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="[F1] Scan barcode or search product..."
              className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            {['ALL', 'GROCERY', 'BEVERAGE', 'SNACKS'].map((cat) => (
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
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-28 rounded-lg bg-slate-100 animate-pulse border border-border" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400">
              <Package className="h-10 w-10 mb-2 stroke-1" />
              <p className="text-xs">No matching products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {products.map((p) => {
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
      <div className="flex w-full flex-col rounded-lg border border-border bg-surface shadow-sm lg:w-[380px] xl:w-[420px]">
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
              disabled={cart.length === 0}
              onClick={holdCart}
              className="flex items-center justify-center gap-1.5 rounded border border-border bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-40"
            >
              <PauseCircle className="h-4 w-4" />
              <span>Hold Cart [F8]</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded bg-brand py-2 text-xs font-bold text-white shadow hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-40"
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

      {/* Printable 80mm Receipt */}
      <PrintableReceipt
        invoice={completedInvoice}
        onClose={() => setCompletedInvoice(null)}
      />
    </div>
  );
}
