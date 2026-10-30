'use client';

import { Printer, X } from 'lucide-react';
import type { InvoiceResponse } from '@/store/salesApi';

interface PrintableReceiptProps {
  invoice: InvoiceResponse | null;
  onClose: () => void;
  tenantName?: string;
}

export function PrintableReceipt({
  invoice,
  onClose,
  tenantName = 'Karim Store',
}: PrintableReceiptProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = new Date(invoice.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
    >
      <div className="relative w-full max-w-sm rounded-lg bg-surface border border-border shadow-xl flex flex-col max-h-[90vh]">
        {/* Modal Controls (hidden during print) */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 print:hidden">
          <h2 className="text-sm font-semibold text-slate-900">Print 80mm Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 80mm Receipt Body */}
        <div
          id="printable-receipt"
          className="p-4 overflow-y-auto text-xs text-slate-900 font-mono space-y-3 bg-white"
        >
          {/* Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
            <h1 className="text-base font-bold tracking-tight text-slate-900 uppercase">
              {tenantName}
            </h1>
            <p className="text-[11px] text-slate-600">DokanPro Smart Retail POS</p>
            <p className="text-[11px] text-slate-600">Invoice: {invoice.invoiceNumber}</p>
            <p className="text-[10px] text-slate-500">{invoiceDate}</p>
          </div>

          {/* Line Items */}
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="border-b border-dashed border-slate-300 text-slate-700">
                <th className="py-1">Item</th>
                <th className="py-1 text-center">Qty</th>
                <th className="py-1 text-right">Price</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id} className="py-1">
                  <td className="py-1 pr-1">
                    <div className="font-semibold">{item.product?.name || 'Item'}</div>
                    {item.product?.nameBn && (
                      <div className="text-[10px] font-bangla text-slate-600">
                        {item.product.nameBn}
                      </div>
                    )}
                  </td>
                  <td className="py-1 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-1 text-right tabular-nums">৳{item.unitPrice}</td>
                  <td className="py-1 text-right tabular-nums font-semibold">
                    ৳{item.lineTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal:</span>
              <span className="tabular-nums">৳{invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="tabular-nums">-৳{invoice.discount.toLocaleString()}</span>
              </div>
            )}
            {invoice.vatTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT Total:</span>
                <span className="tabular-nums">৳{invoice.vatTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-900 pt-1 text-sm font-bold">
              <span>TOTAL PAYABLE:</span>
              <span className="tabular-nums">৳{invoice.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payments & Change */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-[11px]">
            {invoice.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between text-slate-700">
                <span>Paid via {p.method}:</span>
                <span className="tabular-nums">৳{p.amount.toLocaleString()}</span>
              </div>
            ))}
            {invoice.dueTotal > 0 && (
              <div className="flex justify-between font-bold text-amber-800">
                <span>Remaining Due (Baki):</span>
                <span className="tabular-nums">৳{invoice.dueTotal.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500">
            <p className="font-semibold text-slate-700">ধন্যবাদ, আবার আসবেন!</p>
            <p>Goods once sold can be exchanged within 3 days with receipt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
