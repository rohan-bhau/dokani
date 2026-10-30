'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  UserPlus,
  ArrowRight,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useCollectDueMutation,
  type CustomerResponse,
} from '@/store/customerApi';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomerForDue, setSelectedCustomerForDue] = useState<CustomerResponse | null>(null);

  // Form states for Add Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingDue, setOpeningDue] = useState('');
  const [formError, setFormError] = useState('');

  // Form states for Due Collection
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'CARD'>('CASH');
  const [collectReference, setCollectReference] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collectError, setCollectError] = useState('');

  const { data, isLoading, isError, refetch } = useGetCustomersQuery({
    page,
    limit: 20,
    q: searchTerm.trim() || undefined,
  });

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [collectDue, { isLoading: isCollecting }] = useCollectDueMutation();

  const customers = data?.items ?? [];
  const totalDue = customers.reduce((acc, c) => acc + c.dueBalance, 0);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    try {
      const openingDuePoisha = openingDue ? Math.round(parseFloat(openingDue) * 100) : 0;
      await createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        openingDue: openingDuePoisha,
      }).unwrap();

      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setAddress('');
      setOpeningDue('');
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'data' in err
          ? ((err as { data: { message?: string } }).data?.message ?? 'Failed to create customer.')
          : 'Failed to create customer.';
      setFormError(errorMsg);
    }
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForDue) return;
    setCollectError('');

    const amountNum = parseFloat(collectAmount);
    if (!amountNum || amountNum <= 0) {
      setCollectError('Please enter a valid payment amount.');
      return;
    }

    try {
      const amountPoisha = Math.round(amountNum * 100);
      await collectDue({
        customerId: selectedCustomerForDue.id,
        data: {
          amount: amountPoisha,
          method: collectMethod,
          reference: collectReference.trim() || undefined,
          notes: collectNotes.trim() || undefined,
        },
      }).unwrap();

      setSelectedCustomerForDue(null);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header and Stats */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer credit ledger, track outstanding balances, and collect dues.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Customers</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{data?.total ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Active Due (Baki)</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            BDT {(totalDue / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Page Due</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">
            {customers.filter((c) => c.dueBalance > 0).length} customers with dues
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name or phone number..."
            className="w-full rounded-md border border-slate-300 bg-surface pl-10 pr-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-2 text-sm font-medium text-slate-900">Failed to load customers</p>
            <button
              onClick={() => refetch()}
              className="mt-3 text-sm text-brand underline hover:text-brand/80"
            >
              Try again
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-slate-900">No customers found</p>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm
                ? 'Try searching with a different name or phone number.'
                : 'Get started by creating your first customer profile.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Customer
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Due Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {customers.map((customer) => {
                const hasDue = customer.dueBalance > 0;
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-400">ID: {customer.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {customer.address ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          hasDue
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        BDT {(customer.dueBalance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {hasDue && (
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForDue(customer)}
                            className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100"
                          >
                            <DollarSign className="h-3 w-3" />
                            Collect Due
                          </button>
                        )}
                        <Link
                          href={`/customers/${customer.id}`}
                          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand/80 font-medium"
                        >
                          Ledger
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-slate-900">Register New Customer</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rafiqul Islam"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Address (Optional)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 12, Road 4, Mirpur"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Opening Due in BDT (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingDue}
                  onChange={(e) => setOpeningDue(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Previous unpaid balance from past ledger book.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-brand px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand/90 disabled:opacity-50"
                >
                  {isCreating ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {selectedCustomerForDue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Collect Due Payment</h2>
                <p className="text-xs text-slate-500">Customer: {selectedCustomerForDue.name}</p>
              </div>
              <button
                onClick={() => setSelectedCustomerForDue(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3 border border-slate-200 text-xs">
              <span className="text-slate-500">Outstanding Due Balance: </span>
              <span className="font-bold text-red-600">
                BDT {(selectedCustomerForDue.dueBalance / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
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
                  onClick={() => setSelectedCustomerForDue(null)}
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
