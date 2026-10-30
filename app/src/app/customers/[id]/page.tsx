'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  FileText,
} from 'lucide-react';
import {
  useGetCustomerByIdQuery,
  useGetCustomerLedgerQuery,
  useCollectDueMutation,
} from '@/store/customerApi';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);

  // Form states for collection
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'CARD'>('CASH');
  const [collectReference, setCollectReference] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collectError, setCollectError] = useState('');

  const {
    data: customer,
    isLoading: isLoadingCustomer,
    isError: isCustomerError,
  } = useGetCustomerByIdQuery(id);

  const {
    data: ledgerData,
    isLoading: isLoadingLedger,
    isError: isLedgerError,
  } = useGetCustomerLedgerQuery({
    customerId: id,
    page,
    limit: 20,
  });

  const [collectDue, { isLoading: isCollecting }] = useCollectDueMutation();

  const ledgerItems = ledgerData?.items ?? [];

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCollectError('');

    const amountNum = parseFloat(collectAmount);
    if (!amountNum || amountNum <= 0) {
      setCollectError('Please enter a valid payment amount.');
      return;
    }

    try {
      const amountPoisha = Math.round(amountNum * 100);
      await collectDue({
        customerId: id,
        data: {
          amount: amountPoisha,
          method: collectMethod,
          reference: collectReference.trim() || undefined,
          notes: collectNotes.trim() || undefined,
        },
      }).unwrap();

      setIsCollectModalOpen(false);
      setCollectAmount('');
      setCollectReference('');
      setCollectNotes('');
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'data' in err
          ? ((err as { data: { message?: string } }).data?.message ?? 'Failed to record due payment.')
          : 'Failed to record due payment.';
      setCollectError(errorMsg);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            Opening Balance
          </span>
        );
      case 'SALE_DUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Sale Due (Baki)
          </span>
        );
      case 'PAYMENT_RECEIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Payment Received
          </span>
        );
      case 'RETURN_CREDIT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Return Credit
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  if (isLoadingCustomer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 mb-6" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-slate-100 mb-6" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-slate-100" />
      </div>
    );
  }

  if (isCustomerError || !customer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="mt-2 text-lg font-bold text-slate-900">Customer Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">The customer profile could not be loaded.</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Customer Directory
        </Link>
      </div>

      {/* Customer Header Card */}
      <div className="mb-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  Registered:{' '}
                  {new Date(customer.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                Outstanding Due Balance
              </span>
              <div className="text-2xl font-black text-red-600">
                BDT {(customer.dueBalance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </div>
            </div>
            {customer.dueBalance > 0 && (
              <button
                type="button"
                onClick={() => setIsCollectModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
              >
                <DollarSign className="h-3.5 w-3.5" />
                Collect Due Payment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger History Section */}
      <div className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Credit Ledger Timeline (Baki Khata)</h2>
            <p className="text-xs text-slate-500">
              Complete audit trail of sales credit and payment collections.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Records: {ledgerData?.total ?? 0}
          </span>
        </div>

        {isLoadingLedger ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : isLedgerError ? (
          <div className="p-12 text-center text-sm text-red-600">
            Failed to load ledger history.
          </div>
        ) : ledgerItems.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900">No ledger transactions yet</p>
            <p className="mt-1 text-xs text-slate-500">
              When sales are made on credit or dues are collected, ledger entries will appear here.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Balance After
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Notes / Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {ledgerItems.map((entry) => {
                const isDebit = entry.type === 'SALE_DUE' || entry.type === 'OPENING_BALANCE';
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {new Date(entry.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getTypeBadge(entry.type)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">
                      <span className={isDebit ? 'text-red-600' : 'text-emerald-600'}>
                        {isDebit ? '+' : '-'} BDT{' '}
                        {(entry.amount / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                      BDT {(entry.balanceAfter / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-sm truncate">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Collect Due Modal */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Collect Due Payment</h2>
                <p className="text-xs text-slate-500">Customer: {customer.name}</p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3 border border-slate-200 text-xs">
              <span className="text-slate-500">Current Outstanding Due: </span>
              <span className="font-bold text-red-600">
                BDT {(customer.dueBalance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {collectError && (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {collectError}
              </div>
            )}

            <form onSubmit={handleCollectDue} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Payment Amount (BDT) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="CASH">Cash</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="CARD">Bank Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Transaction Reference / TrxID</label>
                <input
                  type="text"
                  value={collectReference}
                  onChange={(e) => setCollectReference(e.target.value)}
                  placeholder="e.g. TrxID-98213812"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes (Optional)</label>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder="Optional remarks"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCollecting}
                  className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                >
                  {isCollecting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
