'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  Users,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  Calendar,
  AlertCircle,
  Banknote,
  DollarSign,
  Package,
  Download,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetSummaryQuery,
  useGetTopProductsQuery,
  useGetDuesAgingQuery,
  useGetAuditLogsQuery,
} from '@/store/reportApi';

type DatePreset = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

function formatPaisa(amountInPaisa: number): string {
  const bdt = amountInPaisa / 100;
  return `৳${bdt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('MONTH');

  // Compute ISO date range based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === 'WEEK') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    if (datePreset === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset]);

  // RTK Query hooks
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetSummaryQuery({ startDate, endDate });

  const {
    data: topProducts,
    isLoading: isTopProductsLoading,
    isError: isTopProductsError,
    error: topProductsError,
    refetch: refetchTopProducts,
  } = useGetTopProductsQuery({ limit: 5, startDate, endDate });

  const {
    data: duesAging,
    isLoading: isDuesLoading,
    isError: isDuesError,
    error: duesError,
    refetch: refetchDues,
  } = useGetDuesAgingQuery();

  const {
    data: auditLogsData,
    isLoading: isAuditLoading,
    isError: isAuditError,
    refetch: refetchAudit,
  } = useGetAuditLogsQuery({ limit: 10 });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchTopProducts();
    refetchDues();
    refetchAudit();
  };

  const isAnyLoading = isSummaryLoading || isTopProductsLoading || isDuesLoading;
  const isAnyError = isSummaryError || isTopProductsError || isDuesError;

  const errorDetails = useMemo(() => {
    const err = summaryError || topProductsError || duesError;
    if (!err) return null;
    if (typeof err === 'object' && 'status' in err) {
      if (err.status === 401) {
        return { message: 'Your login session has expired. Please sign in again to view live metrics.', isAuth: true };
      }
      if (err.status === 403) {
        return { message: 'Your user role does not have permission to view store reports.', isAuth: false };
      }
      if ('data' in err && typeof err.data === 'object' && err.data && 'message' in err.data) {
        return { message: String((err.data as { message: string }).message), isAuth: false };
      }
    }
    return { message: 'Could not retrieve aggregated metrics from server. Please verify network connection or retry.', isAuth: false };
  }, [summaryError, topProductsError, duesError]);

  const exportSummaryCsv = () => {
    if (!summary) return;
    const headers = ['Report Category', 'Metric', 'Value'];
    const rows: Array<[string, string, string | number]> = [
      ['Sales & Revenue', 'Total Revenue (BDT)', (summary.sales.totalRevenue / 100).toFixed(2)],
      ['Sales & Revenue', 'Total Completed Invoices', summary.sales.totalInvoices],
      ['Sales & Revenue', 'Cost of Goods Sold - COGS (BDT)', (summary.sales.cogs / 100).toFixed(2)],
      ['Sales & Revenue', 'Gross Profit (BDT)', (summary.sales.grossProfit / 100).toFixed(2)],
      ['Sales & Revenue', 'Total VAT (BDT)', ((summary.sales.totalVat ?? 0) / 100).toFixed(2)],
      ['Sales & Revenue', 'Total Discounts (BDT)', ((summary.sales.totalDiscount ?? 0) / 100).toFixed(2)],
      ['Customer Receivables', 'Total Outstanding Baki (BDT)', (summary.receivables.totalOutstandingDue / 100).toFixed(2)],
      ['Customer Receivables', 'Customers with Due', summary.receivables.totalCustomersWithDue],
      ['Inventory Assets', 'Total Active Products', summary.inventory.totalProducts],
      ['Inventory Assets', 'Total Stock Units On Hand', summary.inventory.totalStockUnits],
      ['Inventory Assets', 'Inventory Cost Valuation (BDT)', (summary.inventory.totalCostValuation / 100).toFixed(2)],
      ['Inventory Assets', 'Retail Sales Potential (BDT)', (summary.inventory.totalRetailValuation / 100).toFixed(2)],
      ['Tender Breakdown', 'Cash (BDT)', (summary.sales.tenderBreakdown.CASH / 100).toFixed(2)],
      ['Tender Breakdown', 'bKash (BDT)', (summary.sales.tenderBreakdown.BKASH / 100).toFixed(2)],
      ['Tender Breakdown', 'Nagad (BDT)', (summary.sales.tenderBreakdown.NAGAD / 100).toFixed(2)],
      ['Tender Breakdown', 'Card (BDT)', (summary.sales.tenderBreakdown.CARD / 100).toFixed(2)],
      ['Tender Breakdown', 'Credit Baki (BDT)', (summary.sales.tenderBreakdown.CREDIT_BAKI / 100).toFixed(2)],
    ];

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dokani-executive-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Tender percentage helper
  const totalTenderRevenue = summary?.sales.totalRevenue || 0;

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
        {/* Top Header & Filter Bar */}
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Merchant Analytics
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Executive Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Real-time revenue, profit & loss, inventory valuation, and customer dues aging.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setDatePreset('TODAY')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'TODAY'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('WEEK')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'WEEK'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('MONTH')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'MONTH'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('ALL')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  datePreset === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefreshAll}
              title="Refresh Analytics"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnyLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={exportSummaryCsv}
              disabled={!summary}
              title="Export Analytics Summary to CSV"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>New POS Sale</span>
            </Link>
          </div>
        </div>

        {/* Error State */}
        {isAnyError && errorDetails && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>Failed to load store metrics</span>
            </div>
            <p className="mt-1 text-red-700">
              {errorDetails.message}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshAll}
                className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Retry
              </button>
              {errorDetails.isAuth && (
                <Link
                  href="/login"
                  className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Sign In Again
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {isSummaryLoading && !summary && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 p-5"
              />
            ))}
          </div>
        )}

        {/* KPI Primary Stat Cards */}
        {summary && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Gross Revenue */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Gross Sales Revenue</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-brand">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                {formatPaisa(summary.sales.totalRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">
                  {summary.sales.totalInvoices.toLocaleString()}
                </span>
                <span>completed invoices</span>
              </div>
            </div>

            {/* 2. Cost of Goods Sold (COGS) */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Cost of Goods Sold (COGS)</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Package className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-900 tabular-nums">
                {formatPaisa(summary.sales.cogs)}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                Direct item purchase costs of sold goods
              </div>
            </div>

            {/* 3. Gross Profit */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Gross Profit (P&L)</span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    summary.sales.grossProfit >= 0
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`mt-3 text-2xl font-black tracking-tight tabular-nums ${
                  summary.sales.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatPaisa(summary.sales.grossProfit)}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                {summary.sales.totalRevenue > 0 ? (
                  <span>
                    Margin:{' '}
                    <strong className="text-slate-800">
                      {((summary.sales.grossProfit / summary.sales.totalRevenue) * 100).toFixed(1)}%
                    </strong>
                  </span>
                ) : (
                  <span>Net margin on sales</span>
                )}
              </div>
            </div>

            {/* 4. Total Outstanding Due (Baki) */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Outstanding Baki</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CreditCard className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-amber-700 tabular-nums">
                {formatPaisa(summary.receivables.totalOutstandingDue)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  <strong>{summary.receivables.totalCustomersWithDue}</strong> customer accounts
                </span>
                <Link
                  href="/customers"
                  className="font-semibold text-brand hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Collect</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Secondary Row: Inventory Valuation & Tender Breakdown */}
        {summary && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Inventory Asset Valuation Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Inventory Valuation & Assets</h2>
                  <p className="text-xs text-slate-500">
                    Total wholesale cost versus retail sales capacity of in-stock items
                  </p>
                </div>
                <Link
                  href="/products"
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Manage Catalog
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <span className="text-[11px] font-semibold text-slate-500">Total Catalog Items</span>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {summary.inventory.totalProducts.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Unique Active SKUs</span>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <span className="text-[11px] font-semibold text-slate-500">Total Stock On Hand</span>
                  <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                    {summary.inventory.totalStockUnits.toLocaleString()} units
                  </p>
                  <span className="text-[10px] text-slate-400">Physical units count</span>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <span className="text-[11px] font-semibold text-slate-500">Cost Price Valuation</span>
                  <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums">
                    {formatPaisa(summary.inventory.totalCostValuation)}
                  </p>
                  <span className="text-[10px] text-slate-400">Total procurement asset value</span>
                </div>

                <div className="rounded-lg bg-emerald-50/60 p-4">
                  <span className="text-[11px] font-semibold text-emerald-800">Retail Sales Potential</span>
                  <p className="mt-1 text-lg font-bold text-emerald-900 tabular-nums">
                    {formatPaisa(summary.inventory.totalRetailValuation)}
                  </p>
                  <span className="text-[10px] text-emerald-700">Projected full retail return</span>
                </div>
              </div>
            </div>

            {/* Payment Tender Breakdown Card */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Payment Tender Breakdown</h2>
                <p className="text-xs text-slate-500">
                  Distribution of collected tenders for the selected period
                </p>
              </div>

              <div className="mt-5 space-y-3.5">
                {[
                  {
                    key: 'CASH',
                    label: 'Cash (নগদ টাকা)',
                    amount: summary.sales.tenderBreakdown.CASH,
                    color: 'bg-emerald-600',
                  },
                  {
                    key: 'BKASH',
                    label: 'bKash Merchant Pay',
                    amount: summary.sales.tenderBreakdown.BKASH,
                    color: 'bg-pink-600',
                  },
                  {
                    key: 'NAGAD',
                    label: 'Nagad Gateway',
                    amount: summary.sales.tenderBreakdown.NAGAD,
                    color: 'bg-orange-600',
                  },
                  {
                    key: 'CARD',
                    label: 'POS Card Terminal',
                    amount: summary.sales.tenderBreakdown.CARD,
                    color: 'bg-blue-600',
                  },
                  {
                    key: 'CREDIT_BAKI',
                    label: 'Credit (বাকি খাত)',
                    amount: summary.sales.tenderBreakdown.CREDIT_BAKI,
                    color: 'bg-amber-600',
                  },
                ].map((tender) => {
                  const pct =
                    totalTenderRevenue > 0
                      ? Math.min(100, Math.round((tender.amount / totalTenderRevenue) * 100))
                      : 0;

                  return (
                    <div key={tender.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{tender.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatPaisa(tender.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">({pct}%)</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${tender.color} rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Middle Section: Top Selling Products & Dues Aging Analysis */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Selling Products */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Top Selling Products</h2>
                <p className="text-xs text-slate-500">Highest volume items by units sold and revenue</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                Ranked
              </span>
            </div>

            {isTopProductsLoading ? (
              <div className="mt-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : !topProducts || topProducts.length === 0 ? (
              <div className="mt-8 text-center py-6">
                <Package className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">No sales recorded yet</p>
                <p className="text-[11px] text-slate-500">
                  Completed POS sales will rank your highest revenue products here.
                </p>
                <Link
                  href="/pos"
                  className="mt-3 inline-block rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-hover"
                >
                  Open POS Counter
                </Link>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {topProducts.map((prod, idx) => (
                  <div
                    key={prod.productId}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 tabular-nums">
                        {formatPaisa(prod.totalRevenue)}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {prod.totalQuantity.toLocaleString()} units sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receivables Dues Aging Buckets */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customer Dues Aging (বাকি খাতা)</h2>
                <p className="text-xs text-slate-500">Aging breakdown across outstanding debt buckets</p>
              </div>
              <Link
                href="/customers"
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                View All Ledgers
              </Link>
            </div>

            {isDuesLoading ? (
              <div className="mt-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : !duesAging ? (
              <div className="mt-6 text-center py-6 text-xs text-slate-500">
                No due records found.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* 3 Buckets Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">
                      0-30 Days
                    </span>
                    <p className="mt-1 text-xs font-black text-emerald-900 tabular-nums">
                      {formatPaisa(duesAging.summary.bucket0To30)}
                    </p>
                    <span className="text-[9px] text-emerald-600">Current</span>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase text-amber-800">
                      31-60 Days
                    </span>
                    <p className="mt-1 text-xs font-black text-amber-900 tabular-nums">
                      {formatPaisa(duesAging.summary.bucket31To60)}
                    </p>
                    <span className="text-[9px] text-amber-600">Needs Followup</span>
                  </div>

                  <div className="rounded-lg border border-red-200 bg-red-50/50 p-2.5">
                    <span className="text-[10px] font-bold uppercase text-red-800">
                      60+ Days
                    </span>
                    <p className="mt-1 text-xs font-black text-red-900 tabular-nums">
                      {formatPaisa(duesAging.summary.bucket61Plus)}
                    </p>
                    <span className="text-[9px] text-red-600">High Risk</span>
                  </div>
                </div>

                {/* Overdue Customers List */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Overdue Customer Accounts
                  </span>

                  {duesAging.customers.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      Zero overdue accounts. All customers are fully settled.
                    </p>
                  ) : (
                    <div className="mt-2 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {duesAging.customers.slice(0, 5).map((cust) => (
                        <div
                          key={cust.customerId}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{cust.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {cust.phone} • {cust.oldestDueDays} days overdue
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600 tabular-nums">
                              {formatPaisa(cust.dueBalance)}
                            </p>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                cust.bucket === '61_PLUS'
                                  ? 'bg-red-100 text-red-700'
                                  : cust.bucket === '31_TO_60'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {cust.bucket.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Audit Trail Activity Feed */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security & Operational Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Immutable record of stock adjustments, customer due collections, and critical actions
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetchAudit()}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {isAuditLoading ? (
            <div className="mt-4 space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ) : !auditLogsData || auditLogsData.logs.length === 0 ? (
            <div className="mt-6 text-center py-6 text-xs text-slate-500">
              No audit entries recorded yet. System activities will appear here.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2 pr-4">Initiated By</th>
                    <th className="py-2 pr-4">Details</th>
                    <th className="py-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogsData.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 pr-4 font-mono font-bold text-slate-900">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {log.entityType}
                        {log.entityId && (
                          <span className="block text-[9px] font-mono text-slate-400">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-800 font-medium">
                        {log.user ? `${log.user.name} (${log.user.phone})` : 'System / Background'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500 max-w-xs truncate">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
