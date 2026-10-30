'use client';

import { useState, useCallback } from 'react';
import {
  X,
  Loader2,
  Banknote,
  CreditCard,
  Smartphone,
  UserMinus,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useCreateSaleMutation, type InvoiceResponse } from '@/store/salesApi';
import { useInitiatePaymentMutation } from '@/store/paymentApi';
import { useSocket, type PaymentConfirmedEvent } from '@/hooks/useSocket';

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

export function CheckoutModal({
  isOpen,
  onClose,
  discount,
  total,
  items,
  onSuccess,
}: CheckoutModalProps) {
  const [createSale, { isLoading: isCreatingSale }] = useCreateSaleMutation();
  const [initiatePayment, { isLoading: isInitiatingPayment }] = useInitiatePaymentMutation();

  const [method, setMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'CREDIT_BAKI'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<number>(total);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Online gateway state
  const [useOnlineGateway, setUseOnlineGateway] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    paymentId: string;
    redirectUrl: string;
    provider: 'BKASH' | 'SSLCOMMERZ';
  } | null>(null);

  const executeSale = useCallback(
    async (finalMethod: typeof method, paymentRef?: string) => {
      const idempotencyKey = crypto.randomUUID();

      const res = await createSale({
        sale: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            discount: item.discount || 0,
          })),
          discount,
          payments: [
            {
              method: finalMethod,
              amount: finalMethod === 'CREDIT_BAKI' ? 0 : Math.min(receivedAmount, total),
              reference: paymentRef || (reference.trim() ? reference.trim() : undefined),
            },
          ],
          notes: notes.trim() || undefined,
        },
        idempotencyKey,
      }).unwrap();

      onSuccess(res.data);
    },
    [createSale, items, discount, receivedAmount, total, reference, notes, onSuccess]
  );

  // Real-time socket sync: cashier auto-finishes sale when webhook confirms customer payment
  useSocket({
    onPaymentConfirmed: (event: PaymentConfirmedEvent) => {
      if (pendingPayment && event.paymentId === pendingPayment.paymentId) {
        setPendingPayment(null);
        executeSale(method, `${event.provider}_${event.paymentId}`).catch((err: unknown) => {
          const errorMsg =
            (err as { data?: { message?: string } })?.data?.message ??
            'Failed to complete checkout after payment confirmation.';
          setError(errorMsg);
        });
      }
    },
  });

  if (!isOpen) return null;

  const changeDue = Math.max(0, receivedAmount - total);

  const handleQuickCash = (amount: number) => {
    setReceivedAmount(amount);
  };

  const handleInitiateOnlineGateway = async () => {
    setError(null);
    const provider = method === 'BKASH' ? 'BKASH' : 'SSLCOMMERZ';

    try {
      const res = await initiatePayment({
        provider,
        amount: total * 100, // convert BDT to poisha
        customerPhone: customerPhone.trim() || undefined,
        customerName: customerName.trim() || undefined,
        callbackUrl: typeof window !== 'undefined' ? `${window.location.origin}/pos` : undefined,
      }).unwrap();

      setPendingPayment({
        paymentId: res.data.paymentId,
        redirectUrl: res.data.redirectUrl,
        provider,
      });

      // Automatically open payment gateway URL in a new window/tab for the customer
      if (typeof window !== 'undefined' && res.data.redirectUrl) {
        window.open(res.data.redirectUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to initiate online payment session.';
      setError(errorMsg);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (receivedAmount < total && method !== 'CREDIT_BAKI') {
      setError(`Received amount is less than total. Need ৳${total - receivedAmount} more.`);
      return;
    }

    try {
      await executeSale(method);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to complete checkout. Check stock levels.';
      setError(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
    >
      <div className="relative w-full max-w-lg rounded-lg bg-surface border border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="checkout-modal-title" className="text-base font-semibold text-slate-900">
              Payment & Checkout
            </h2>
            <p className="text-xs text-slate-500">Select payment tender and confirm transaction</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live waiting screen for online payment gateway session */}
        {pendingPayment ? (
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-brand animate-pulse">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Waiting for {pendingPayment.provider} Payment
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Amount payable: <span className="font-bold text-slate-800">৳{total.toLocaleString()}</span>.
                Customer payment session is active.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-900 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Real-time sync active: this window will complete automatically when customer pays.
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={pendingPayment.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <span>Open {pendingPayment.provider} Checkout Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setPendingPayment(null)}
                className="rounded border border-border px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
              >
                Cancel Online Session & Choose Other Tender
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="p-6 space-y-4">
            {/* Big Total Display */}
            <div className="rounded-lg bg-slate-100 p-4 text-center border border-border">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Payable
              </span>
              <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                ৳{total.toLocaleString()}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Payment Tender *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'BKASH', label: 'bKash', icon: Smartphone },
                  { id: 'NAGAD', label: 'Nagad', icon: Smartphone },
                  { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                  { id: 'CREDIT_BAKI', label: 'Baki (Due)', icon: UserMinus },
                ].map((tender) => {
                  const Icon = tender.icon;
                  const isSelected = method === tender.id;

                  return (
                    <button
                      key={tender.id}
                      type="button"
                      onClick={() => {
                        setMethod(tender.id as typeof method);
                        if (tender.id === 'CREDIT_BAKI') setReceivedAmount(0);
                        else if (receivedAmount === 0) setReceivedAmount(total);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-brand bg-emerald-50 text-brand font-semibold shadow-sm'
                          : 'border-border bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tender.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Digital Gateway Options (bKash & SSLCommerz Card) */}
            {(method === 'BKASH' || method === 'CARD') && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Online Payment Gateway
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseOnlineGateway(!useOnlineGateway)}
                    className="text-xs text-brand font-medium hover:underline"
                  >
                    {useOnlineGateway ? 'Switch to Manual TrxID' : 'Initiate Online Gateway'}
                  </button>
                </div>

                {useOnlineGateway ? (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-slate-500">
                      Initiate a live session on {method === 'BKASH' ? 'bKash' : 'SSLCommerz'} with real-time cashier sync.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Customer Phone (optional)"
                        className="rounded border border-border px-3 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none"
                      />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name (optional)"
                        className="rounded border border-border px-3 py-1.5 text-xs text-slate-900 focus:border-brand focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isInitiatingPayment}
                      onClick={handleInitiateOnlineGateway}
                      className="w-full flex items-center justify-center gap-1.5 rounded bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover focus:outline-none disabled:opacity-50"
                    >
                      {isInitiatingPayment ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      <span>Launch {method === 'BKASH' ? 'bKash' : 'SSLCommerz'} Gateway (৳{total})</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="reference" className="block text-xs font-medium text-slate-700">
                      Transaction ID / Reference Number
                    </label>
                    <input
                      id="reference"
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. TrxID: 9X8Y7Z123"
                      className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 font-mono focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cash Amount & Change Calculation */}
            {method === 'CASH' && (
              <div className="space-y-2">
                <label htmlFor="receivedAmount" className="block text-xs font-medium text-slate-700">
                  Cash Received from Customer (BDT) *
                </label>
                <input
                  id="receivedAmount"
                  type="number"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="block w-full rounded border border-border px-3 py-2 text-lg font-bold text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums text-center"
                />

                {/* Quick Cash Buttons */}
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="rounded border border-border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Exact (৳{total})
                  </button>
                  {[500, 1000, 2000].map((cash) => (
                    <button
                      key={cash}
                      type="button"
                      onClick={() => handleQuickCash(cash)}
                      className="rounded border border-border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      ৳{cash}
                    </button>
                  ))}
                </div>

                {receivedAmount > total && (
                  <div className="flex items-center justify-between rounded bg-amber-50 border border-amber-200 p-2.5 text-xs">
                    <span className="font-medium text-amber-900">Change to Return:</span>
                    <span className="text-sm font-bold text-amber-900 tabular-nums">
                      ৳{changeDue.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Reference for Nagad */}
            {method === 'NAGAD' && (
              <div>
                <label htmlFor="reference" className="block text-xs font-medium text-slate-700">
                  Transaction ID / Reference Number
                </label>
                <input
                  id="reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. TrxID: 9X8Y7Z123"
                  className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 font-mono focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            <div>
              <label htmlFor="notes" className="block text-xs font-medium text-slate-700">
                Sale Note (Optional)
              </label>
              <input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Walk-in customer counter 1"
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isCreatingSale}
                className="rounded border border-border px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingSale || useOnlineGateway}
                className="flex items-center gap-1.5 rounded bg-brand px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
              >
                {isCreatingSale && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Complete Sale [Enter]</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
