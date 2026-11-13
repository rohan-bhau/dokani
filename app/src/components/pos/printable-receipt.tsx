'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Printer, X, Scissors } from 'lucide-react';
import type { InvoiceResponse } from '@/store/salesApi';
import type { RootState } from '@/store';
import { useGetSettingsQuery } from '@/store/settingsApi';
import { DokaniLogo, ShopLogo } from '@/components/dokani-logo';

interface PrintableReceiptProps {
  invoice: InvoiceResponse | null;
  onClose: () => void;
  tenantName?: string;
}

type PrintFormat = 'DUAL_COPY' | 'SINGLE_COPY' | 'THERMAL_80MM';

interface InvoiceCopyProps {
  invoice: InvoiceResponse;
  copyLabel?: 'CUSTOMER COPY' | 'SHOP COPY';
  storeName: string;
  storeLogoUrl?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  storeBin?: string | null;
  showLogo: boolean;
  showBin: boolean;
  receiptFooter: string;
  compact?: boolean;
}

function PaymentStatusStamp({ invoice, compact = false }: { invoice: InvoiceResponse; compact?: boolean }) {
  const label =
    invoice.status === 'VOIDED'
      ? 'VOIDED'
      : invoice.dueTotal > 0
      ? invoice.paidTotal > 0
        ? 'PARTIAL DUE'
        : 'UNPAID'
      : 'PAID';

  const colorClasses =
    invoice.status === 'VOIDED'
      ? 'border-rose-600/30 text-rose-700/25'
      : invoice.dueTotal > 0
      ? 'border-amber-600/35 text-amber-700/25'
      : 'border-emerald-700/30 text-emerald-700/20';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden mix-blend-multiply"
    >
      <span
        className={`inline-block rounded-lg border-4 border-double ${colorClasses} ${
          compact ? 'px-5 py-1 text-2xl' : 'px-7 py-1.5 text-3xl'
        } font-black uppercase tracking-[0.25em] -rotate-12 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]`}
      >
        {label}
      </span>
    </div>
  );
}

function InvoiceCopy({
  invoice,
  copyLabel,
  storeName,
  storeLogoUrl,
  storePhone,
  storeAddress,
  storeBin,
  showLogo,
  showBin,
  receiptFooter,
  compact = false,
}: InvoiceCopyProps) {
  const invoiceDate = new Date(invoice.createdAt).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const validPayments = (invoice.payments || []).filter((p) => p.amount > 0);

  return (
    <div
      className={`invoice-copy relative overflow-hidden bg-white text-slate-900 ${
        compact ? 'p-3.5 text-[11px]' : 'p-5 text-xs'
      } border border-slate-200 rounded-lg print:border-slate-300`}
    >
      <PaymentStatusStamp invoice={invoice} compact={compact} />

      <div className={`relative z-10 ${compact ? 'space-y-2.5' : 'space-y-3.5'}`}>
      {/* Header: Shop Info + Invoice Meta */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2.5">
        <div className="flex items-start gap-2.5">
          {showLogo && (
            <ShopLogo
              name={storeName}
              logoUrl={storeLogoUrl}
              size={compact ? 'sm' : 'md'}
            />
          )}
          <div className="space-y-0.5">
            <h1 className={`${compact ? 'text-sm' : 'text-base'} font-extrabold uppercase tracking-tight text-slate-900`}>
              {storeName}
            </h1>
            {storeAddress && (
              <p className="text-[10px] text-slate-600 leading-snug">{storeAddress}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-600">
              {storePhone && <span>Tel: {storePhone}</span>}
              {showBin && storeBin && <span>BIN: {storeBin}</span>}
            </div>
          </div>
        </div>

        <div className="text-right space-y-1 shrink-0">
          {copyLabel && (
            <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-700 border border-slate-200">
              {copyLabel}
            </span>
          )}
          <p className="font-mono font-bold text-slate-900 text-xs">
            Invoice No: {invoice.invoiceNumber}
          </p>
          <p className="text-[10px] text-slate-500">{invoiceDate}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-y border-slate-300 bg-slate-100/50 print:bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <th className="py-1.5 px-2 w-7">#</th>
            <th className="py-1.5 px-2">Item</th>
            <th className="py-1.5 px-2 text-center w-12">Qty</th>
            <th className="py-1.5 px-2 text-right w-20">Price</th>
            <th className="py-1.5 px-2 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoice.items.map((item, index) => (
            <tr key={item.id}>
              <td className="py-1.5 px-2 text-slate-400 tabular-nums">{index + 1}</td>
              <td className="py-1.5 px-2">
                <div className="font-semibold text-slate-900">
                  {item.product?.name || 'Item'}
                </div>
                {item.product?.nameBn && (
                  <div className="text-[10px] font-bangla text-slate-500">
                    {item.product.nameBn}
                  </div>
                )}
              </td>
              <td className="py-1.5 px-2 text-center tabular-nums font-medium">
                {item.quantity}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums">
                ৳{item.unitPrice.toLocaleString()}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-slate-900">
                ৳{item.lineTotal.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment Breakdown + Totals */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-200 pt-2.5">
        <div className="space-y-1 text-[10px] text-slate-600">
          <p className="font-bold uppercase tracking-wider text-slate-500">Payment Details</p>
          {validPayments.length > 0 ? (
            validPayments.map((p, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="font-medium text-slate-700">Paid via {p.method}:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  ৳{p.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <span className="text-slate-500">No payment recorded yet</span>
          )}
          {invoice.dueTotal > 0 && (
            <div className="flex items-center gap-3 font-bold text-rose-700 pt-0.5">
              <span>Balance Due (Baki):</span>
              <span className="font-mono tabular-nums">৳{invoice.dueTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="w-full sm:w-56 space-y-1 text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-mono">৳{invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Discount</span>
              <span className="tabular-nums font-mono">-৳{invoice.discount.toLocaleString()}</span>
            </div>
          )}
          {invoice.vatTotal > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>VAT</span>
              <span className="tabular-nums font-mono">৳{invoice.vatTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-900 pt-1 text-xs font-extrabold text-slate-900">
            <span>GRAND TOTAL</span>
            <span className="tabular-nums font-mono">৳{invoice.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-[10px] text-slate-500">
        <span>{receiptFooter}</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
          <DokaniLogo size={14} />
          <span>Powered by Dokani</span>
        </span>
      </div>
      </div>
    </div>
  );
}

export function PrintableReceipt({
  invoice,
  onClose,
  tenantName,
}: PrintableReceiptProps) {
  const userTenant = useSelector((state: RootState) => state.auth.user?.tenant);
  const { data: settingsData } = useGetSettingsQuery();
  const settings = settingsData?.data;

  const [format, setFormat] = useState<PrintFormat>('DUAL_COPY');

  useEffect(() => {
    if (settings?.paperSize === 'RECEIPT_80MM') {
      setFormat('DUAL_COPY');
    }
  }, [settings?.paperSize]);

  useEffect(() => {
    if (!invoice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;

  const storeName = tenantName || settings?.name || userTenant?.name || 'Dokani Store';
  const storeLogoUrl = settings?.logoUrl ?? null;
  const storePhone = settings?.phone ?? null;
  const storeAddress = settings?.address ?? null;
  const storeBin = settings?.binNumber ?? null;
  const showLogo = settings?.showLogoOnInvoice ?? true;
  const showBin = settings?.showBinOnInvoice ?? true;
  const receiptFooter = settings?.receiptFooter || 'Thank you for shopping with us!';

  const handlePrint = () => {
    window.print();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      id="printable-invoice-portal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 print:static print:block print:bg-transparent print:p-0"
    >
      <div
        className={`relative w-full ${
          format === 'THERMAL_80MM' ? 'max-w-sm' : 'max-w-3xl'
        } rounded-xl bg-surface border border-border shadow-xl flex flex-col max-h-[92vh] print:block print:max-h-none print:max-w-full print:border-none print:shadow-none`}
      >
        {/* Modal Controls (hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <DokaniLogo size={22} />
            <h2 className="text-sm font-semibold text-slate-900">Invoice Preview</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Invoice Print Format"
              value={format}
              onChange={(e) => setFormat(e.target.value as PrintFormat)}
              className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-brand focus:outline-none"
            >
              <option value="DUAL_COPY">Dual Copy (Customer + Shop)</option>
              <option value="SINGLE_COPY">Customer Copy Only</option>
              <option value="THERMAL_80MM">80mm Thermal Receipt</option>
            </select>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Invoice</span>
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

        {/* Printable Invoice Area */}
        <div
          id="printable-invoice-area"
          className="p-4 overflow-y-auto space-y-3 bg-slate-50 print:bg-white print:p-0 print:overflow-visible"
        >
          {format === 'DUAL_COPY' && (
            <>
              <InvoiceCopy
                invoice={invoice}
                copyLabel="CUSTOMER COPY"
                storeName={storeName}
                storeLogoUrl={storeLogoUrl}
                storePhone={storePhone}
                storeAddress={storeAddress}
                storeBin={storeBin}
                showLogo={showLogo}
                showBin={showBin}
                receiptFooter={receiptFooter}
                compact
              />

              <div className="flex items-center gap-2 py-0.5 text-slate-400">
                <Scissors className="h-3.5 w-3.5 shrink-0" />
                <div className="flex-1 border-t border-dashed border-slate-300" />
                <span className="text-[9px] font-semibold uppercase tracking-widest">Cut Here</span>
                <div className="flex-1 border-t border-dashed border-slate-300" />
              </div>

              <InvoiceCopy
                invoice={invoice}
                copyLabel="SHOP COPY"
                storeName={storeName}
                storeLogoUrl={storeLogoUrl}
                storePhone={storePhone}
                storeAddress={storeAddress}
                storeBin={storeBin}
                showLogo={showLogo}
                showBin={showBin}
                receiptFooter={receiptFooter}
                compact
              />
            </>
          )}

          {format === 'SINGLE_COPY' && (
            <InvoiceCopy
              invoice={invoice}
              copyLabel="CUSTOMER COPY"
              storeName={storeName}
              storeLogoUrl={storeLogoUrl}
              storePhone={storePhone}
              storeAddress={storeAddress}
              storeBin={storeBin}
              showLogo={showLogo}
              showBin={showBin}
              receiptFooter={receiptFooter}
            />
          )}

          {format === 'THERMAL_80MM' && (
            <div className="mx-auto max-w-[80mm]">
              <InvoiceCopy
                invoice={invoice}
                storeName={storeName}
                storeLogoUrl={storeLogoUrl}
                storePhone={storePhone}
                storeAddress={storeAddress}
                storeBin={storeBin}
                showLogo={showLogo}
                showBin={showBin}
                receiptFooter={receiptFooter}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
