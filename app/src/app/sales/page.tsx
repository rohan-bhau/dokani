'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';
import { useGetSalesQuery } from '@/store/salesApi';

import {
  Receipt,
  Search,
  Filter,
  ArrowRight,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
} from 'lucide-react';

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetSalesQuery({
    page,
    limit: 20,
    status: (statusFilter as any) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const invoices = data?.data?.invoices || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        );
      case 'VOIDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> Voided
          </span>
        );
      case 'PARTIAL_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <RotateCcw className="w-3 h-3" /> Partial Return
          </span>
        );
      case 'FULL_RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3" /> Returned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header & Actions */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales History</h1>
              <p className="text-sm text-slate-600">
                Track retail receipts, payment tenders, returns, and invoice records.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pos"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"
              >
                <Receipt className="w-4 h-4" />
                New Sale (POS)
              </Link>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-4 h-4 text-slate-400" />
                Status:
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Paid / Completed</option>
                <option value="VOIDED">Voided</option>
                <option value="PARTIAL_RETURN">Partial Return</option>
                <option value="FULL_RETURN">Full Return</option>
              </select>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing {invoices.length} of {total} receipts
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Sales Found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  No sales match the current filters or date range. Ring up sales at the POS terminal.
                </p>
                <Link
                  href="/pos"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Go to POS
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Invoice #</th>
                      <th className="px-4 py-3.5">Date & Time</th>
                      <th className="px-4 py-3.5">Items</th>
                      <th className="px-4 py-3.5">Total Amount</th>
                      <th className="px-4 py-3.5">Tenders</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                          #{inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(inv.createdAt).toLocaleString('en-BD', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {inv.items?.length || 0} product(s)
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          ৳{formatBdt(inv.total)}
                          {inv.dueTotal > 0 && (
                            <span className="block text-[11px] text-amber-600 font-normal">
                              Due: ৳{formatBdt(inv.dueTotal)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex flex-wrap gap-1">
                            {inv.payments?.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono"
                              >
                                {p.method}
                              </span>
                            )) || <span className="text-slate-400">None</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/sales/${inv.id}`}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {inv.status === 'COMPLETED' && (
                              <Link
                                href={`/sales/${inv.id}/return`}
                                className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600 transition"
                                title="Process Return"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
      </div>
    </AuthGuard>
  );
}

