'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Upload,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  LayoutList,
  FolderKanban,
  Boxes,
} from 'lucide-react';
import {
  useGetProductsQuery,
  useGetLowStockAlertsQuery,
  type ProductItem,
} from '@/store/productApi';
import { useGetStockValuationQuery } from '@/store/reportApi';
import { ProductTable } from '@/components/products/product-table';
import { ProductModal } from '@/components/products/product-modal';
import { StockAdjustModal } from '@/components/products/stock-adjust-modal';
import { CsvUploadModal } from '@/components/products/csv-upload-modal';
import { AuthGuard } from '@/components/auth-guard';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [page, setPage] = useState(1);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductItem | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState<ProductItem | null>(null);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Queries
  const { data: productsData, isLoading, isFetching } = useGetProductsQuery({
    q: searchTerm.trim() || undefined,
    categoryId: selectedCategoryId || undefined,
    page: viewMode === 'grouped' ? 1 : page,
    limit: viewMode === 'grouped' ? 100 : 15,
  });

  const { data: valuationData } = useGetStockValuationQuery();
  const { data: lowStockData } = useGetLowStockAlertsQuery();

  const products = productsData?.data.products ?? [];
  const total = productsData?.data.total ?? 0;
  const totalPages = productsData?.data.totalPages ?? 1;
  const lowStockCount = lowStockData?.data?.length ?? 0;

  const categories = useMemo(
    () =>
      (valuationData?.categories ?? []).filter(
        (cat: any) => cat.categoryId && cat.categoryId !== 'uncategorized'
      ),
    [valuationData?.categories]
  );

  // Filter if low stock toggle active
  const displayedProducts = useMemo(
    () =>
      showLowStockOnly ? products.filter((p) => p.stock <= p.reorderLevel) : products,
    [products, showLowStockOnly]
  );

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, { name: string; items: ProductItem[] }>();
    for (const product of displayedProducts) {
      const key = product.category?.id || 'uncategorized';
      const name = product.category?.name || 'Uncategorized';
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(product);
      } else {
        groups.set(key, { name, items: [product] });
      }
    }
    return Array.from(groups.entries()).map(([id, group]) => ({
      id,
      name: group.name,
      items: group.items,
    }));
  }, [displayedProducts]);

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: ProductItem) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleOpenAdjustStock = (product: ProductItem) => {
    setProductToAdjust(product);
    setIsStockModalOpen(true);
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 md:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your store inventory, SKU barcodes, retail pricing, and stock movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            <span>Inventory</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="inline-flex items-center gap-1.5 rounded bg-brand px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search, View Mode & Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="product-search" className="sr-only">
              Search products by name, SKU, or barcode
            </label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="product-search"
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, বাংলা নাম, SKU, or barcode..."
              className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div
              role="group"
              aria-label="Product view mode"
              className="inline-flex rounded border border-border bg-surface p-0.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  viewMode === 'list'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="h-3.5 w-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                aria-pressed={viewMode === 'grouped'}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  viewMode === 'grouped'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                <span>By Category</span>
              </button>
            </div>

            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                aria-pressed={showLowStockOnly}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  showLowStockOnly
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-surface text-amber-800 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                <span>Low Stock ({lowStockCount})</span>
              </button>
            )}

            <div className="text-xs text-slate-500 pl-1">
              Total: <span className="font-semibold text-slate-900 tabular-nums">{total}</span> items
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="region" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('');
                setPage(1);
              }}
              aria-pressed={selectedCategoryId === ''}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                selectedCategoryId === ''
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-surface text-slate-600 border-border hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => {
                  setSelectedCategoryId(cat.categoryId);
                  setPage(1);
                }}
                aria-pressed={selectedCategoryId === cat.categoryId}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  selectedCategoryId === cat.categoryId
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-surface text-slate-600 border-border hover:bg-slate-50'
                }`}
              >
                <span>{cat.categoryName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    selectedCategoryId === cat.categoryId
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat.productCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Table (List or Grouped by Category) */}
      {viewMode === 'grouped' && !isLoading && displayedProducts.length > 0 ? (
        <div className="space-y-6">
          {groupedByCategory.map((group) => (
            <section key={group.id} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900">{group.name}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 tabular-nums">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              <ProductTable
                products={group.items}
                isLoading={false}
                onEdit={handleOpenEditProduct}
                onAdjustStock={handleOpenAdjustStock}
                showCategory={false}
              />
            </section>
          ))}
        </div>
      ) : (
        <ProductTable
          products={displayedProducts}
          isLoading={isLoading}
          onEdit={handleOpenEditProduct}
          onAdjustStock={handleOpenAdjustStock}
        />
      )}

      {/* Pagination Footer */}
      {viewMode === 'list' && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-slate-600">
          <div>
            Showing page <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      <StockAdjustModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={productToAdjust}
      />

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />
      </div>
    </AuthGuard>
  );
}
