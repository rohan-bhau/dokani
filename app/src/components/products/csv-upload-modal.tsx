'use client';

import { useRef, useState } from 'react';
import { X, Upload, Loader2, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { useImportProductsCsvMutation, type CsvImportResult } from '@/store/productApi';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CSV_HEADER = `name,nameBn,sku,barcode,category,unit,costPrice,sellPrice,vatRate,reorderLevel,initialStock`;

export function CsvUploadModal({ isOpen, onClose }: CsvUploadModalProps) {
  const [importCsv, { isLoading }] = useImportProductsCsvMutation();
  const [csvContent, setCsvContent] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const hasHeaderRow = (text: string): boolean => {
    const firstLine = text.trim().split(/\r?\n/, 1)[0]?.toLowerCase() ?? '';
    return firstLine.includes('sku') && (firstLine.includes('name') || firstLine.includes('product'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text.replace(/^\uFEFF/, ''));
        setSelectedFileName(file.name);
        setResult(null);
        setError(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleDownloadSample = () => {
    const blob = new Blob(['\uFEFF' + CSV_HEADER + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dokani-products-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please provide CSV data to import.');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const payloadCsv = hasHeaderRow(csvContent)
        ? csvContent
        : `${CSV_HEADER}\n${csvContent.trim()}`;
      const res = await importCsv({ csvData: payloadCsv }).unwrap();
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
      className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
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
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-brand">
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                <span>{selectedFileName ? `File: ${selectedFileName}` : 'Choose .csv file'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium border border-border rounded px-2.5 py-1.5 bg-white hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Download Template</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvContent('');
                  setSelectedFileName(null);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Clear
              </button>
            </div>

            <div className="mb-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Expected CSV Header
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(CSV_HEADER);
                    setCopiedHeader(true);
                    setTimeout(() => setCopiedHeader(false), 2000);
                  }}
                  className="text-[11px] font-medium text-brand hover:underline"
                >
                  {copiedHeader ? 'Copied' : 'Copy header'}
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-700 break-all">{CSV_HEADER}</p>
            </div>

            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste product rows here (header row is optional if columns follow the order above)..."
              className="block w-full rounded border border-border p-3 text-xs font-mono text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-slate-50"
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1 bg-slate-50 border border-border rounded p-3">
            <p>SKU must be unique per store. Category names are created automatically if new, and UTF-8 Excel CSV files are supported.</p>
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
