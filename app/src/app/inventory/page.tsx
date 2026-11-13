'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Permission } from '@dokani/shared';
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
  Wallet,
  SlidersHorizontal,
  CheckCircle2,
  PackageCheck,
  Search,
  ArrowRight,
  X,
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
    <AuthGuard requireAnyPermissions={[Permission.STOCK_VIEW, Permission.STOCK_ADJUST]}>
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
          <div
            role="tablist"
            aria-label="Inventory sections"
            className="flex overflow-x-auto border-b border-slate-200 gap-2 sm:gap-6 text-sm font-semibold"
          >
            <button
              type="button"
              role="tab"
              id="tab-valuation"
              aria-selected={activeTab === 'VALUATION'}
              aria-controls="panel-valuation"
              onClick={() => setActiveTab('VALUATION')}
              className={`pb-3 px-1 border-b-2 transition inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-t ${
                activeTab === 'VALUATION'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Stock Valuation &amp; Breakdown</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-alerts"
              aria-selected={activeTab === 'ALERTS'}
              aria-controls="panel-alerts"
              onClick={() => setActiveTab('ALERTS')}
              className={`pb-3 px-1 border-b-2 transition inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-t ${
                activeTab === 'ALERTS'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Low-Stock Alerts</span>
              {lowStockData?.data && lowStockData.data.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold tabular-nums">
                  {lowStockData.data.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-adjust"
              aria-selected={activeTab === 'ADJUST'}
              aria-controls="panel-adjust"
              onClick={() => setActiveTab('ADJUST')}
              className={`pb-3 px-1 border-b-2 transition inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-t ${
                activeTab === 'ADJUST'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Physical Stock Adjustment</span>
            </button>
          </div>

          {/* Tab 1: Valuation */}
          {activeTab === 'VALUATION' && (
            <div role="tabpanel" id="panel-valuation" aria-labelledby="tab-valuation" className="space-y-6">
              {isValuationLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-28 rounded-xl bg-white border border-slate-200 p-5" />
                    ))}
                  </div>
                  <div className="h-64 rounded-xl bg-white border border-slate-200" />
                </div>
              ) : (
                <>
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total Stock Units
                        </span>
                        <Boxes className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900 mt-1.5 block tabular-nums">
                        {valuationData?.totalUnits?.toLocaleString() || 0}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Across {valuationData?.totalProducts || 0} active catalog items
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Valuation at Cost (COGS)
                        </span>
                        <Wallet className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="text-2xl font-bold text-indigo-700 mt-1.5 block font-mono tabular-nums">
                        ৳{formatBdt(valuationData?.costValuation || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Capital locked in inventory
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Valuation at Retail
                        </span>
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-2xl font-bold text-slate-900 mt-1.5 block font-mono tabular-nums">
                        ৳{formatBdt(valuationData?.retailValuation || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Expected sales realization
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Potential Gross Margin
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-2xl font-bold text-emerald-600 mt-1.5 block font-mono tabular-nums">
                        ৳{formatBdt(valuationData?.potentialGrossProfit || 0)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Retail value minus unit cost
                      </span>
                    </div>
                  </div>

                  {/* Category Breakdown Table */}
                  <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                      <h2 className="text-sm font-bold text-slate-900">Inventory by Category</h2>
                      <Link
                        href="/products"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        <span>View Products</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    {!valuationData?.categories || valuationData.categories.length === 0 ? (
                      <div className="p-10 text-center">
                        <Boxes className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-800">No Inventory Categories Yet</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Add products to your catalog to see category-wise stock valuation.
                        </p>
                      </div>
                    ) : (
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
                            {valuationData.categories.map((cat: any) => (
                              <tr key={cat.categoryId} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-semibold text-slate-900">
                                  {cat.categoryName}
                                </td>
                                <td className="py-3 px-4 text-center font-mono tabular-nums">{cat.productCount}</td>
                                <td className="py-3 px-4 text-center font-semibold text-slate-800 tabular-nums">
                                  {cat.units}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-indigo-700 tabular-nums">
                                  ৳{formatBdt(cat.costValuation)}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                                  ৳{formatBdt(cat.retailValuation)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 2: Low-Stock Alerts */}
          {activeTab === 'ALERTS' && (
            <div
              role="tabpanel"
              id="panel-alerts"
              aria-labelledby="tab-alerts"
              className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Items Requiring Reorder</h2>
                  <p className="text-xs text-slate-500">
                    Products where on-hand quantity is at or below the minimum reorder threshold.
                  </p>
                </div>
                <Link
                  href="/purchases"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
                >
                  Create Purchase Order
                </Link>
              </div>

              {isAlertsLoading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg" />
                  ))}
                </div>
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
                        <th className="py-3 px-4">Item &amp; SKU</th>
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 tabular-nums">
                              <AlertTriangle className="w-3 h-3" />
                              {item.currentStock} {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-700 tabular-nums">
                            {item.reorderLevel} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-rose-600 font-mono tabular-nums">
                            -{Math.max(0, item.reorderLevel - item.currentStock)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              aria-label={`Adjust stock count for ${item.name}`}
                              onClick={() => {
                                setSelectedProductId(item.id);
                                setActiveTab('ADJUST');
                              }}
                              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
          {activeTab === 'ADJUST' && (() => {
            const availableProducts = productsData?.data?.products ?? [];
            const selectedFromProducts = availableProducts.find((p) => p.id === selectedProductId);
            const selectedFromAlerts = lowStockData?.data?.find((item) => item.id === selectedProductId);
            const selectedProduct = selectedFromProducts
              ? {
                  id: selectedFromProducts.id,
                  name: selectedFromProducts.name,
                  sku: selectedFromProducts.sku,
                  stock: selectedFromProducts.stock,
                  unit: selectedFromProducts.unit,
                }
              : selectedFromAlerts
              ? {
                  id: selectedFromAlerts.id,
                  name: selectedFromAlerts.name,
                  sku: selectedFromAlerts.sku,
                  stock: selectedFromAlerts.currentStock,
                  unit: selectedFromAlerts.unit,
                }
              : null;

            const projectedStock = selectedProduct
              ? selectedProduct.stock + adjustmentQuantity
              : null;

            return (
              <div
                role="tabpanel"
                id="panel-adjust"
                aria-labelledby="tab-adjust"
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 max-w-2xl mx-auto space-y-6"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900">Audit Stock Adjustment</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manually increase or decrease shelf stock to match physical inventory audits. All adjustments generate an irreversible audit trail.
                  </p>
                </div>

                <form onSubmit={handleAdjustSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="adjust-product-search"
                      className="block text-xs font-semibold text-slate-700 uppercase mb-1.5"
                    >
                      Product *
                    </label>

                    {selectedProduct ? (
                      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {selectedProduct.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {selectedProduct.sku} &bull; Current: {selectedProduct.stock} {selectedProduct.unit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId('');
                            setAdjustMessage(null);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="adjust-product-search"
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search product by name, SKU, or barcode..."
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>

                        <div
                          role="listbox"
                          aria-label="Matching products"
                          className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white"
                        >
                          {availableProducts.length === 0 ? (
                            <p className="p-4 text-center text-xs text-slate-500">
                              No products match &ldquo;{searchTerm}&rdquo;.
                            </p>
                          ) : (
                            availableProducts.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                role="option"
                                aria-selected={false}
                                onClick={() => {
                                  setSelectedProductId(p.id);
                                  setAdjustMessage(null);
                                }}
                                className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition focus-visible:outline-none focus-visible:bg-slate-100"
                              >
                                <div className="min-w-0">
                                  <span className="text-sm font-medium text-slate-900 block truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400 block">
                                    {p.sku}
                                  </span>
                                </div>
                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums">
                                  {p.stock} {p.unit}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedProduct && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 block">Current Stock</span>
                        <span className="font-bold text-slate-900 text-sm tabular-nums">
                          {selectedProduct.stock} {selectedProduct.unit}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="text-right">
                        <span className="text-slate-500 block">After Adjustment</span>
                        <span
                          className={`font-bold text-sm tabular-nums ${
                            projectedStock !== null && projectedStock < 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {projectedStock} {selectedProduct.unit}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="adjust-quantity"
                        className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                      >
                        Quantity Delta *
                      </label>
                      <input
                        id="adjust-quantity"
                        type="number"
                        value={adjustmentQuantity}
                        onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value, 10) || 0)}
                        aria-describedby="adjust-quantity-hint"
                        required
                        placeholder="+5 or -3"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[-10, -5, -1, 1, 5, 10].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => setAdjustmentQuantity((q) => q + delta)}
                            className="px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 tabular-nums"
                          >
                            {delta > 0 ? `+${delta}` : delta}
                          </button>
                        ))}
                      </div>
                      <span id="adjust-quantity-hint" className="text-[11px] text-slate-400 mt-1 block">
                        Positive adds stock, negative subtracts.
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="adjust-reason"
                        className="block text-xs font-semibold text-slate-700 uppercase mb-1"
                      >
                        Mandatory Reason *
                      </label>
                      <input
                        id="adjust-reason"
                        type="text"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        required
                        placeholder="e.g. Broken package, physical count difference"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  {adjustMessage && (
                    <div
                      role="status"
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
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                    >
                      {isAdjusting ? 'Saving Adjustment...' : 'Record Adjustment'}
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}
      </div>
    </AuthGuard>
  );
}

