'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth-guard';
import { useGetStockValuationQuery } from '@/store/reportApi';

import {
  useGetProductsQuery,
  useGetLowStockAlertsQuery,
  useAdjustStockMutation,
} from '@/store/productApi';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Scale,
  PlusCircle,
  CheckCircle2,
  PackageCheck,
  Search,
} from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'VALUATION' | 'ALERTS' | 'ADJUST'>('VALUATION');

  // Valuation
  const { data: valuationData, isLoading: isValuationLoading } = useGetStockValuationQuery();

  // Low stock
  const { data: lowStockData, isLoading: isAlertsLoading } = useGetLowStockAlertsQuery();

  // Products for adjustment
  const [searchTerm, setSearchTerm] = useState('');
  const { data: productsData } = useGetProductsQuery({
    page: 1,
    limit: 50,
    q: searchTerm.trim() || undefined,
  });
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

  // Form state for adjustment
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical count audit difference');
  const [adjustMessage, setAdjustMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustMessage(null);

    if (!selectedProductId) {
      setAdjustMessage({ text: 'Please select a product to adjust.', isError: true });
      return;
    }

    if (adjustmentQuantity === 0) {
      setAdjustMessage({ text: 'Adjustment quantity cannot be zero.', isError: true });
      return;
    }

    try {
      await adjustStock({
        productId: selectedProductId,
        quantity: adjustmentQuantity,
        type: 'ADJUSTMENT_CORRECTION',
        reason: adjustmentReason,
      }).unwrap();


      setAdjustMessage({ text: 'Stock level adjusted and movement recorded successfully.' });
      setSelectedProductId('');
      setAdjustmentQuantity(0);
    } catch (err: any) {
      setAdjustMessage({
        text: err?.data?.message || 'Failed to adjust stock. Check permissions.',
        isError: true,
      });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory Operations</h1>
              <p className="text-sm text-slate-600">
                Stock valuation, reorder threshold alerts, and physical count audit adjustments.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/products"
                className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Product Catalog
              </Link>
              <Link
                href="/purchases"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                Receive Stock
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('VALUATION')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'VALUATION'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Stock Valuation & Breakdown
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALERTS')}
              className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'ALERTS'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Low-Stock Alerts</span>
              {lowStockData?.data && lowStockData.data.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
                  {lowStockData.data.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ADJUST')}
              className={`pb-3 border-b-2 transition ${
                activeTab === 'ADJUST'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Physical Stock Adjustment
            </button>
          </div>

          {/* Tab 1: Valuation */}
          {activeTab === 'VALUATION' && (
            <div className="space-y-6">
              {isValuationLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">Calculating stock values...</div>
              ) : (
                <>
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                        Total Stock Units
                      </span>
                      <span className="text-2xl font-bold text-slate-900 mt-1 block">
                        {valuationData?.totalUnits?.toLocaleString() || 0}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Across {valuationData?.totalProducts || 0} active catalog items
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                        Valuation at Cost (COGS)
                      </span>
                      <span className="text-2xl font-bold text-indigo-700 mt-1 block font-mono">
                        ৳{formatBdt(valuationData?.costValuation || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Capital locked in inventory
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                        Valuation at Retail
                      </span>
                      <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
                        ৳{formatBdt(valuationData?.retailValuation || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Expected sales realization
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                        Potential Gross Margin
                      </span>
                      <span className="text-2xl font-bold text-emerald-600 mt-1 block font-mono">
                        ৳{formatBdt(valuationData?.potentialGrossProfit || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Retail value minus unit cost
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown Table */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h2 className="text-sm font-bold text-slate-900">Inventory by Category</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4">Category</th>
                            <th className="py-3 px-4 text-center">SKU Count</th>
                            <th className="py-3 px-4 text-center">Total Units</th>
                            <th className="py-3 px-4 text-right">Cost Value</th>
                            <th className="py-3 px-4 text-right">Retail Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {valuationData?.categories?.map((cat: any) => (
                            <tr key={cat.categoryId} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {cat.categoryName}
                              </td>
                              <td className="py-3 px-4 text-center font-mono">{cat.productCount}</td>
                              <td className="py-3 px-4 text-center font-semibold text-slate-800">
                                {cat.units}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-indigo-700">
                                ৳{formatBdt(cat.costValuation)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                ৳{formatBdt(cat.retailValuation)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Low-Stock Alerts */}
          {activeTab === 'ALERTS' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Items Requiring Reorder</h2>
                  <p className="text-xs text-slate-500">
                    Products where on-hand quantity is at or below the minimum reorder threshold.
                  </p>
                </div>
                <Link
                  href="/purchases"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  Create Purchase Order
                </Link>
              </div>

              {isAlertsLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">Checking inventory levels...</div>
              ) : lowStockData?.data?.length === 0 ? (
                <div className="p-12 text-center">
                  <PackageCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">All Stock Levels Healthy</p>
                  <p className="text-xs text-slate-500">No items are currently below reorder levels.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Item & SKU</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-center">Reorder Threshold</th>
                        <th className="py-3 px-4 text-center">Deficit</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lowStockData?.data?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{item.name}</span>
                            <span className="text-xs font-mono text-slate-400">{item.sku}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-700">
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600 font-mono">
                            -{Math.max(0, item.reorderLevel - item.currentStock)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(item.id);
                                setActiveTab('ADJUST');
                              }}
                              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold"
                            >
                              Adjust Count
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Stock Physical Adjustment */}
          {activeTab === 'ADJUST' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Audit Stock Adjustment</h2>
                <p className="text-xs text-slate-500">
                  Manually increase or decrease shelf stock to match physical inventory audits. All adjustments generate an irreversible audit trail.
                </p>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Select Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Choose item from catalog --</option>
                    {productsData?.data?.products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) &bull; Current Stock: {p.stock} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Quantity Delta *
                    </label>
                    <input
                      type="number"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value, 10) || 0)}
                      required
                      placeholder="+5 or -3"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Use positive number to add stock, negative to subtract.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Mandatory Reason *
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      required
                      placeholder="e.g. Broken package, physical count difference"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {adjustMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      adjustMessage.isError
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {adjustMessage.isError ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{adjustMessage.text}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAdjusting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isAdjusting ? 'Saving Adjustment...' : 'Record Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}

