'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetPurchasesQuery,

  useCreatePurchaseMutation,
  useGetSuppliersQuery,
} from '@/store/purchaseApi';
import { useGetProductsQuery } from '@/store/productApi';
import {
  PackagePlus,
  Plus,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

export default function PurchasesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: purchaseData, isLoading } = useGetPurchasesQuery({});
  const { data: supplierData } = useGetSuppliersQuery({});
  const { data: productsData } = useGetProductsQuery({ page: 1, limit: 100 });

  const [createPurchase, { isLoading: isSubmitting }] = useCreatePurchaseMutation();

  // New Purchase Form state
  const [supplierId, setSupplierId] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: '', quantity: 1, unitCost: 0 },
  ]);

  const purchases = purchaseData?.data?.purchases || [];
  const suppliers = supplierData?.data?.suppliers || [];
  const products = productsData?.data?.products || [];

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  };

  const handleCreatePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId) {
      setFormError('Please select a supplier.');
      return;
    }

    const validItems = items.filter((it) => it.productId && it.quantity > 0 && it.unitCost >= 0);
    if (validItems.length === 0) {
      setFormError('Please add at least one valid product item.');
      return;
    }

    try {
      await createPurchase({
        supplierId,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost * 100, // convert BDT to paisa
        })),
        paidAmount: paidAmount * 100,
        notes: notes.trim() || undefined,
      }).unwrap();

      setIsModalOpen(false);
      setSupplierId('');
      setPaidAmount(0);
      setNotes('');
      setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to record purchase.');
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Purchases</h1>
              <p className="text-sm text-slate-600">
                Receive incoming wholesale inventory and update cost prices via weighted average costing.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/suppliers"
                className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Supplier Directory
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                <Plus className="w-4 h-4" />
                Receive Stock
              </button>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading purchases...</div>
            ) : purchases.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No Purchase Bills Recorded</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Receive your first stock order from a vendor to replenish store inventory.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Receive First Stock
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">PO Number</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4 text-center">Items Received</th>
                      <th className="py-3 px-4 text-right">Bill Total</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                          #{p.poNumber}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString('en-BD', {
                            dateStyle: 'medium',
                          })}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {p.supplier?.name || 'Vendor'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-center">
                          {p.items?.length || 0} line(s)
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ৳{formatBdt(p.totalCost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                          ৳{formatBdt(p.paidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* New Purchase Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-slate-900">Receive Stock / New Purchase</h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleCreatePurchaseSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Supplier *
                      </label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="">-- Choose Vendor --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.phone})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Immediate Paid Amount (৳)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Dynamic Items Row */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Received Products
                      </span>
                      <button
                        type="button"
                        onClick={handleAddItemRow}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Another Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {items.map((row, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            value={row.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            required
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)
                            }
                            required
                            className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-center"
                          />

                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="Unit Cost (৳)"
                            value={row.unitCost}
                            onChange={(e) =>
                              handleItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)
                            }
                            required
                            className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                          />

                          <span className="w-24 text-right font-mono text-xs font-bold text-slate-800">
                            ৳{(row.unitCost * row.quantity).toFixed(2)}
                          </span>

                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-sm font-semibold border-t border-slate-100">
                      <span>Total Invoice Cost:</span>
                      <span className="font-mono text-base font-bold text-slate-900">
                        ৳{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Notes / Invoice Number from Vendor
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Challan #CH-88219"
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
                      {isSubmitting ? 'Receiving...' : 'Save & Restock'}
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

