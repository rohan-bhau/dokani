'use client';

import { useState } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useImportProductsCsvMutation, type CsvImportResult } from '@/store/productApi';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_CSV = `name,nameBn,sku,barcode,unit,costPrice,sellPrice,vatRate,reorderLevel,initialStock
Teer Soybean Oil 5L,তীর সয়াবিন তেল ৫ লিটার,OIL-TEER-5L,8941100001,bottle,750,820,0,10,50
Aci Pure Salt 1kg,এসিআই লবণ ১ কেজি,SALT-ACI-1K,8941100002,packet,35,42,0,20,100
Pran Mustard Oil 250ml,প্রাণ সরিষার তেল ২৫০ মি.লি.,OIL-PRAN-250,,bottle,80,95,0,5,30`;

export function CsvUploadModal({ isOpen, onClose }: CsvUploadModalProps) {
  const [importCsv, { isLoading }] = useImportProductsCsvMutation();
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvContent(text);
        setResult(null);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please provide CSV data to import.');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const res = await importCsv({ csvData: csvContent }).unwrap();
      setResult(res.data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to process CSV file. Ensure valid headers and formatting.';
      setError(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="relative w-full max-w-2xl rounded-lg bg-surface border border-border shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand" />
            <h2 id="csv-modal-title" className="text-base font-semibold text-slate-900">
              Bulk Import Products via CSV
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="font-medium">
                  Successfully imported {result.importedCount} products.
                </span>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span>Errors encountered in {result.errors.length} rows:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto text-amber-900">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.errors.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Upload CSV File or Paste Raw CSV Data
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-brand">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>Choose .csv file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={() => setCsvContent(SAMPLE_CSV)}
                className="text-xs text-brand hover:underline font-medium"
              >
                Reset to sample format
              </button>
            </div>

            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste comma-separated rows here..."
              className="block w-full rounded border border-border p-3 text-xs font-mono text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50"
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1 bg-slate-50 border border-border rounded p-3">
            <p className="font-semibold text-slate-700">Required CSV Columns:</p>
            <p className="font-mono text-[11px] text-slate-600">
              name, nameBn, sku, barcode, unit, costPrice, sellPrice, vatRate, reorderLevel, initialStock
            </p>
            <p>SKU must be unique per tenant. Barcode is optional but unique if provided.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded border border-border px-4 py-2 text-xs font-medium text-slate-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isLoading || !csvContent.trim()}
            className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import Products
          </button>
        </div>
      </div>
    </div>
  );
}
