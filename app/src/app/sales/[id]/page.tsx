'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Permission } from '@dokani/shared';
import { AuthGuard } from '@/components/auth-guard';
import { PrintableReceipt } from '@/components/pos/printable-receipt';
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const invoice = data?.data;

  const formatBdt = (amount: number) => {
    return amount.toLocaleString('en-BD');
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
      <AuthGuard requireAnyPermissions={[Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL]}>
        <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="h-8 w-64 bg-slate-200 rounded-lg" />
            <div className="h-9 w-72 bg-slate-200 rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 h-96" />
        </div>
      </AuthGuard>
    );
  }

  const paidPayments = invoice.payments?.filter((p) => p.amount > 0) ?? [];

  return (
    <AuthGuard requireAnyPermissions={[Permission.REPORT_VIEW_OWN, Permission.REPORT_VIEW_ALL]}>
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header navigation & actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/sales"
              aria-label="Back to sales"
              className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono whitespace-nowrap">
                  Invoice No: {invoice.invoiceNumber}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
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
              <p className="text-xs text-slate-500 mt-1">
                Issued on{' '}
                {new Date(invoice.createdAt).toLocaleString('en-BD', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold whitespace-nowrap transition"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>

            {invoice.status === 'COMPLETED' && (
              <>
                <Link
                  href={`/sales/${invoice.id}/return`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Process Return
                </Link>

                <button
                  type="button"
                  onClick={() => setIsVoidModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold whitespace-nowrap transition"
                >
                  <XCircle className="w-4 h-4" />
                  Void Invoice
                </button>
              </>
            )}
          </div>
        </div>

        {/* Printable Invoice Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          {/* Document Header Strip */}
          <div className="bg-slate-50/80 border-b border-slate-200 px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sales Invoice
              </span>
              <p className="font-mono text-lg font-bold text-slate-900 mt-0.5">
                Invoice No: {invoice.invoiceNumber}
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Issue Date
              </span>
              <p className="text-sm font-medium text-slate-700 mt-0.5">
                {new Date(invoice.createdAt).toLocaleString('en-BD', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          {/* Meta bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 sm:px-8 py-5 border-b border-slate-100 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">
                  Invoice Number
                </span>
                <span className="font-mono text-slate-900 font-bold block mt-0.5 text-sm">
                  {invoice.invoiceNumber}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">
                  Customer
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5 text-sm">
                  {invoice.customerId ? 'Registered Account' : 'Walk-in Retail Customer'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase tracking-wide">
                  Cashier / Staff
                </span>
                <span className="text-slate-800 font-semibold block mt-0.5 text-sm">
                  {invoice.createdBy ? 'Authorized Operator' : 'Terminal User'}
                </span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="px-6 sm:px-8 py-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Purchased Items
              </h2>
              <span className="text-xs font-medium text-slate-400">
                {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {item.product?.name || 'Product'}
                        {item.product?.sku && (
                          <span className="block text-xs font-mono text-slate-400 mt-0.5">
                            {item.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        ৳{formatBdt(item.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-700 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                        ৳{formatBdt(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial summary calculations */}
          <div className="px-6 sm:px-8 py-6 bg-slate-50/70 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Payment Breakdown</span>
              </div>
              {paidPayments.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {paidPayments.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-t border-slate-100 pt-2"
                    >
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase tracking-wide text-[11px]">
                        {p.method}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums text-sm">
                        ৳{formatBdt(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 pt-1">No payments recorded (Credit / Due).</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">৳{formatBdt(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-৳{formatBdt(invoice.discount)}</span>
                </div>
              )}
              {invoice.vatTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT</span>
                  <span className="font-mono tabular-nums">৳{formatBdt(invoice.vatTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-base font-bold text-slate-900 pt-2.5 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-lg tabular-nums">৳{formatBdt(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Paid Total</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  ৳{formatBdt(invoice.paidTotal)}
                </span>
              </div>
              {invoice.dueTotal > 0 && (
                <div className="flex justify-between text-xs text-rose-600 font-bold">
                  <span>Outstanding Due</span>
                  <span className="font-mono tabular-nums">৳{formatBdt(invoice.dueTotal)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Void Modal */}
          {isVoidModalOpen && (
            <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
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

          <PrintableReceipt
            invoice={isPrintModalOpen ? invoice : null}
            onClose={() => setIsPrintModalOpen(false)}
          />
      </div>
    </AuthGuard>
  );
}

