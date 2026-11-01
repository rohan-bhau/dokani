'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  UserMinus,
  AlertCircle,
  ExternalLink,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { useCreateSaleMutation, type InvoiceResponse } from '@/store/salesApi';
import { useGetCustomersQuery, useCreateCustomerMutation } from '@/store/customerApi';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  vatTotal: number;
  discount: number;
  total: number;
  items: Array<{ productId: string; quantity: number; discount?: number }>;
  onSuccess: (invoice: InvoiceResponse) => void;
}

type PaymentMethodType = 'CASH' | 'BKASH' | 'CARD' | 'CREDIT_BAKI';

export function CheckoutModal({
  isOpen,
  onClose,
  discount,
  total,
  items,
  onSuccess,
}: CheckoutModalProps) {
  const [createSale, { isLoading: isCreatingSale }] = useCreateSaleMutation();
  const { data: customerData } = useGetCustomersQuery({ limit: 100 });
  const [createCustomer, { isLoading: isCreatingCustomer }] = useCreateCustomerMutation();

  const [method, setMethod] = useState<PaymentMethodType>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<number>(total);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Customer state (for Baki or named invoices)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isQuickAddCustomer, setIsQuickAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const customers = customerData?.items ?? [];
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, receivedAmount - total);

  // Quick Customer Creation
  const handleQuickAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      setError('Please provide customer name and phone number.');
      return;
    }
    try {
      const res = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        openingDue: 0,
      }).unwrap();
      setSelectedCustomerId(res.id);
      setIsQuickAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setError(null);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to add customer.');
    }
  };

  const extractErrorMessage = (err: any, fallback: string) => {
    if (err?.data?.details && Array.isArray(err.data.details) && err.data.details.length > 0) {
      return `${err.data.message || 'Validation error'}: ${err.data.details.map((d: any) => `${d.path} (${d.message})`).join(', ')}`;
    }
    return err?.data?.message || fallback;
  };

  // 1. In-Store Cash Checkout
  const handleCashCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (receivedAmount < total) {
      setError(`Received cash amount is short by ৳${(total - receivedAmount).toLocaleString()}.`);
      return;
    }

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await createSale({
        sale: {
          customerId: selectedCustomerId?.trim() || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: Math.round(item.quantity),
            discount: Math.round(item.discount || 0),
          })),
          discount: Math.round(discount || 0),
          payments: [
            {
              method: 'CASH',
              amount: Math.round(total),
            },
          ],
          notes: notes.trim() || undefined,
        },
        idempotencyKey,
      }).unwrap();

      onSuccess(res.data);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to complete cash sale.'));
    }
  };

  // 2. In-Store Baki (Credit) Checkout
  const handleBakiCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId || !selectedCustomerId.trim()) {
      setError('Please select or add a customer to record a Baki (Due) sale.');
      return;
    }

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await createSale({
        sale: {
          customerId: selectedCustomerId.trim(),
          items: items.map((item) => ({
            productId: item.productId,
            quantity: Math.round(item.quantity),
            discount: Math.round(item.discount || 0),
          })),
          discount: Math.round(discount || 0),
          payments: [
            {
              method: 'CREDIT_BAKI',
              amount: 0,
            },
          ],
          notes: notes.trim() || undefined,
        },
        idempotencyKey,
      }).unwrap();

      onSuccess(res.data);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to record baki sale in customer ledger.'));
    }
  };

  // 3. Hosted Gateway Redirection (bKash or SSLCommerz)
  const handleRedirectGateway = async (provider: 'BKASH' | 'SSLCOMMERZ') => {
    setError(null);
    setIsRedirecting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const saleMethod = provider === 'BKASH' ? 'BKASH' : 'CARD';

      const res = await createSale({
        sale: {
          customerId: selectedCustomerId?.trim() || undefined,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: Math.round(item.quantity),
            discount: Math.round(item.discount || 0),
          })),
          discount: Math.round(discount || 0),
          payments: [
            {
              method: saleMethod,
              amount: 0,
            },
          ],
          notes: notes.trim() || undefined,
        },
        idempotencyKey,
      }).unwrap();

      const paymentToken = res.data.paymentToken;
      if (paymentToken) {
        window.location.href = `/pay/${paymentToken}?provider=${provider}`;
      } else {
        onSuccess(res.data);
      }
    } catch (err: any) {
      setIsRedirecting(false);
      setError(extractErrorMessage(err, `Failed to initiate ${provider} payment gateway.`));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-slate-50">
          <div>
            <h2 id="checkout-modal-title" className="text-base font-bold text-slate-900">
              Checkout & Payment
            </h2>
            <p className="text-xs text-slate-500">
              Total payable:{' '}
              <span className="font-extrabold text-slate-900 text-sm">
                ৳{total.toLocaleString()}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreatingSale || isRedirecting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* 4 Primary Payment Methods Tab Bar */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-4 gap-2">
            {/* CASH */}
            <button
              type="button"
              onClick={() => {
                setMethod('CASH');
                setError(null);
                setReceivedAmount(total);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition ${
                method === 'CASH'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Banknote className="h-4 w-4 text-emerald-600" />
              <span>Cash</span>
            </button>

            {/* BKASH PAY */}
            <button
              type="button"
              onClick={() => {
                setMethod('BKASH');
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition ${
                method === 'BKASH'
                  ? 'border-[#E2136E] bg-pink-50 text-[#E2136E] shadow-xs ring-2 ring-pink-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="h-4 w-4 text-[#E2136E]" />
              <span>bKash</span>
            </button>

            {/* SSLCOMMERZ */}
            <button
              type="button"
              onClick={() => {
                setMethod('CARD');
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition ${
                method === 'CARD'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="h-4 w-4 text-indigo-600" />
              <span>SSLCommerz</span>
            </button>

            {/* BAKI / DUE */}
            <button
              type="button"
              onClick={() => {
                setMethod('CREDIT_BAKI');
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold transition ${
                method === 'CREDIT_BAKI'
                  ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserMinus className="h-4 w-4 text-amber-600" />
              <span>Baki (Due)</span>
            </button>
          </div>
        </div>

        {/* Modal Dynamic Body */}
        <div className="p-6 space-y-4">
          {/* Customer Selection Block (Always available, mandatory for Baki) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="customerSelect" className="font-semibold text-slate-800">
                Customer {method === 'CREDIT_BAKI' ? <span className="text-rose-600">* (Required)</span> : '(Optional)'}
              </label>
              {!isQuickAddCustomer ? (
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomer(true)}
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <UserPlus className="h-3 w-3" />
                  + Add New
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomer(false)}
                  className="font-medium text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            {isQuickAddCustomer ? (
              <form
                onSubmit={handleQuickAddCustomerSubmit}
                className="rounded-xl border border-border bg-slate-50 p-3 space-y-2.5"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone (017...)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingCustomer}
                  className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isCreatingCustomer ? 'Saving Customer...' : 'Save & Select Customer'}
                </button>
              </form>
            ) : (
              <select
                id="customerSelect"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">Walk-in Customer (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Due: ৳{c.dueBalance.toLocaleString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 1. CASH CONTENT */}
          {method === 'CASH' && (
            <form onSubmit={handleCashCheckout} className="space-y-4">
              <div>
                <label htmlFor="receivedAmount" className="block text-xs font-semibold text-slate-800 mb-1">
                  Cash Received Amount (৳)
                </label>
                <div className="relative">
                  <input
                    id="receivedAmount"
                    type="number"
                    min="0"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                    autoFocus
                  />
                </div>
                {/* Quick Tender Buttons */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReceivedAmount(total)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Exact (৳{total.toLocaleString()})
                  </button>
                  {[50, 100, 500, 1000].map((add) => (
                    <button
                      key={add}
                      type="button"
                      onClick={() => setReceivedAmount((prev) => prev + add)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      +{add}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Return Box */}
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-emerald-900 block">Change to Return</span>
                  <span className="text-[11px] text-emerald-700">Cash returned to customer</span>
                </div>
                <span className="text-xl font-black text-emerald-700 tabular-nums">
                  ৳{changeDue.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                disabled={isCreatingSale}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isCreatingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <span>Confirm Cash Payment & Print</span>
                )}
              </button>
            </form>
          )}

          {/* 2. BAKI (CREDIT) CONTENT */}
          {method === 'CREDIT_BAKI' && (
            <form onSubmit={handleBakiCheckout} className="space-y-4">
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-medium">Current Customer Due:</span>
                  <span className="font-bold text-amber-900">
                    ৳{selectedCustomer?.dueBalance?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-amber-200/60 pt-2">
                  <span className="text-amber-900 font-semibold">New Due Balance After Sale:</span>
                  <span className="text-base font-extrabold text-amber-900 tabular-nums">
                    ৳{((selectedCustomer?.dueBalance || 0) + total).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingSale || !selectedCustomerId}
                className="w-full py-3 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isCreatingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Recording Baki...</span>
                  </>
                ) : (
                  <span>Record Baki Sale in Ledger</span>
                )}
              </button>
            </form>
          )}

          {/* 3. BKASH HOSTED GATEWAY CONTENT */}
          {method === 'BKASH' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-pink-200 bg-pink-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E2136E] text-white">
                    <Smartphone className="h-3.5 w-3.5" />
                    bKash Payment Gateway
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Official Checkout</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  You will be redirected to the secure official <span className="font-bold text-[#E2136E]">bKash Payment Gateway</span> to authorize payment for <span className="font-bold">৳{total.toLocaleString()}</span>.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Customer enters Account, OTP, and PIN on the hosted gateway page.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRedirectGateway('BKASH')}
                disabled={isCreatingSale || isRedirecting}
                className="w-full py-3 rounded-xl bg-[#E2136E] text-white text-sm font-bold hover:bg-[#c2105e] transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isRedirecting || isCreatingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting to bKash Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to bKash</span>
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* 4. SSLCOMMERZ HOSTED GATEWAY CONTENT */}
          {method === 'CARD' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                    <CreditCard className="h-3.5 w-3.5" />
                    SSLCommerz Gateway
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Official Checkout</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  You will be redirected to the official <span className="font-bold text-indigo-900">SSLCommerz Hosted Gateway</span> to pay <span className="font-bold">৳{total.toLocaleString()}</span> via Debit/Credit Cards (Visa, Mastercard, Amex), Mobile Banking (Nagad, Rocket, Upay), or Internet Banking.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>3D Secure verification & 256-bit encrypted bank checkout.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRedirectGateway('SSLCOMMERZ')}
                disabled={isCreatingSale || isRedirecting}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {isRedirecting || isCreatingSale ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting to SSLCommerz...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to SSLCommerz</span>
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
