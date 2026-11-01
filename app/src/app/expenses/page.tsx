'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import {

  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} from '@/store/expenseApi';
import {
  Wallet,
  Plus,
  Filter,
  Calendar,
  Trash2,
  AlertCircle,
  TrendingDown,
  Tag,
} from 'lucide-react';

export default function ExpensesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useGetExpensesQuery({
    category: selectedCategory || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: 20,
  });

  const [createExpense, { isLoading: isSubmitting }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  // Modal form
  const [category, setCategory] = useState('UTILITIES');
  const [amount, setAmount] = useState(0);
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const expenses = data?.data?.expenses || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (amount <= 0) {
      setFormError('Expense amount must be greater than zero.');
      return;
    }

    try {
      await createExpense({
        category,
        amount: Math.round(amount * 100), // convert to paisa
        spentOn: new Date(spentOn).toISOString(),
        notes: notes.trim() || undefined,
      }).unwrap();

      setIsModalOpen(false);
      setAmount(0);
      setNotes('');
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to record expense.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      try {
        await deleteExpense(id).unwrap();
      } catch (err: any) {
        alert(err?.data?.message || 'Failed to delete expense.');
      }
    }
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operating Expenses</h1>
              <p className="text-sm text-slate-600">
                Log recurring bills, rent, logistics, and store operational outlays.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-4 h-4 text-slate-400" />
                Category:
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="">All Categories</option>
                <option value="RENT">Rent & Lease</option>
                <option value="UTILITIES">Electricity & Internet</option>
                <option value="SALARY">Staff Salaries</option>
                <option value="SUPPLIES">Packaging & Bags</option>
                <option value="MAINTENANCE">Repairs & Maintenance</option>
                <option value="TRANSPORT">Freight & Delivery</option>
                <option value="OTHER">Other Expenses</option>
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

            <div className="text-xs font-semibold text-slate-700">
              Filtered Total: <span className="font-mono text-rose-700">৳{formatBdt(calculateTotalExpenses())}</span>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Expenses Recorded</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Keep track of all retail shop costs by recording outlays as they happen.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Record First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Notes / Purpose</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">
                          {new Date(exp.spentOn).toLocaleDateString('en-BD', {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {exp.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          ৳{formatBdt(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

          {/* Add Expense Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Record Store Expense</h3>

                <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expense Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="UTILITIES">Electricity & Internet</option>
                      <option value="RENT">Rent & Lease</option>
                      <option value="SALARY">Staff Salaries</option>
                      <option value="SUPPLIES">Packaging & Bags</option>
                      <option value="MAINTENANCE">Repairs & Maintenance</option>
                      <option value="TRANSPORT">Freight & Delivery</option>
                      <option value="OTHER">Other Expenses</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Amount (৳) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        step="any"
                        required
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Date Spent *
                      </label>
                      <input
                        type="date"
                        required
                        value={spentOn}
                        onChange={(e) => setSpentOn(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Remarks / Details
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. DESCO electricity bill for October"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {formError}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Expense'}
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

