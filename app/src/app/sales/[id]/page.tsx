'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { useGetSaleByIdQuery, useVoidSaleMutation } from '@/store/salesApi';

import {
  ArrowLeft,
  Printer,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Share2,
} from 'lucide-react';

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data, isLoading, refetch } = useGetSaleByIdQuery(id, { skip: !id });
  const [voidSale, { isLoading: isVoiding }] = useVoidSaleMutation();

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const invoice = data?.data;

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleVoidSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoidError('');
    if (!voidReason.trim()) {
      setVoidError('Please specify a reason for voiding this invoice.');
      return;
    }

    try {
      await voidSale({
        id,
        body: { reason: voidReason.trim() },
      }).unwrap();
      setIsVoidModalOpen(false);
      refetch();
    } catch (err: any) {
      setVoidError(err?.data?.message || 'Failed to void invoice.');
    }
  };

  const handleCopyPaymentLink = () => {
    if (invoice?.idempotencyKey) {
      // paymentToken or public payment url
      const url = `${window.location.origin}/pay/${invoice.idempotencyKey}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading || !invoice) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-slate-500">Loading invoice details...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header navigation & actions */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/sales"
                className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                    #{invoice.invoiceNumber}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      invoice.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : invoice.status === 'VOIDED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Issued on{' '}
                  {new Date(invoice.createdAt).toLocaleString('en-BD', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>

              {invoice.status === 'COMPLETED' && (
                <>
                  <Link
                    href={`/sales/${invoice.id}/return`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Process Return
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsVoidModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    Void Invoice
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Printable Invoice Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6 print:shadow-none print:border-none">
            {/* Meta bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Invoice Info</span>
                <span className="font-mono text-slate-800 font-bold block mt-1">
                  #{invoice.invoiceNumber}
                </span>
                <span className="text-slate-500">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Customer</span>
                <span className="text-slate-800 font-medium block mt-1">
                  {invoice.customerId ? 'Registered Account' : 'Walk-in Retail Customer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Cashier / Staff</span>
                <span className="text-slate-800 font-medium block mt-1">
                  {invoice.createdBy ? 'Authorized Operator' : 'Terminal User'}
                </span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Purchased Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {item.product?.name || 'Product'}
                          {item.product?.sku && (
                            <span className="block text-xs font-mono text-slate-400">
                              {item.product.sku}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          ৳{formatBdt(item.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          ৳{formatBdt(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial summary calculations */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
              <div className="space-y-2 text-xs text-slate-500 max-w-sm">
                <p className="font-semibold text-slate-700">Payment Breakdown:</p>
                <div className="space-y-1">
                  {invoice.payments?.map((p, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-100 py-1">
                      <span>{p.method} Tender:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ৳{formatBdt(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">৳{formatBdt(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono">-৳{formatBdt(invoice.discount)}</span>
                  </div>
                )}
                {invoice.vatTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT</span>
                    <span className="font-mono">৳{formatBdt(invoice.vatTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="font-mono text-lg">৳{formatBdt(invoice.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 pt-1">
                  <span>Paid Total:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ৳{formatBdt(invoice.paidTotal)}
                  </span>
                </div>
                {invoice.dueTotal > 0 && (
                  <div className="flex justify-between text-xs text-rose-600 font-bold">
                    <span>Outstanding Due:</span>
                    <span className="font-mono">৳{formatBdt(invoice.dueTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Void Modal */}
          {isVoidModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Void Invoice</h3>
                <p className="text-xs text-slate-600">
                  Voiding will restore product inventory and cancel all ledger records associated with this sale. This action is permanently logged.
                </p>

                <form onSubmit={handleVoidSale} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Reason for Voiding *
                    </label>
                    <textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      required
                      placeholder="e.g. Wrong items entered, customer canceled transaction"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      rows={3}
                    />
                  </div>

                  {voidError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {voidError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsVoidModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isVoiding}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isVoiding ? 'Voiding...' : 'Confirm Void'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}

