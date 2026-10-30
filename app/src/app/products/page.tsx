'use client';

import { useState } from 'react';
import { Search, Plus, Upload, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  useGetProductsQuery,
  useGetLowStockAlertsQuery,
  type ProductItem,
} from '@/store/productApi';
import { ProductTable } from '@/components/products/product-table';
import { ProductModal } from '@/components/products/product-modal';
import { StockAdjustModal } from '@/components/products/stock-adjust-modal';
import { CsvUploadModal } from '@/components/products/csv-upload-modal';
import { AuthGuard } from '@/components/auth-guard';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
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
    page,
    limit: 15,
  });

  const { data: lowStockData } = useGetLowStockAlertsQuery();

  const products = productsData?.data.products ?? [];
  const total = productsData?.data.total ?? 0;
  const totalPages = productsData?.data.totalPages ?? 1;
  const lowStockCount = lowStockData?.data?.length ?? 0;

  // Filter if low stock toggle active
  const displayedProducts = showLowStockOnly
    ? products.filter((p) => p.stock <= p.reorderLevel)
    : products;

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="inline-flex items-center gap-1.5 rounded bg-brand px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, বাংলা নাম, SKU, or barcode..."
            className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border transition-colors ${
                showLowStockOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-surface text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
              <span>Low Stock Alerts ({lowStockCount})</span>
            </button>
          )}

          <div className="text-xs text-slate-500">
            Total: <span className="font-semibold text-slate-900 tabular-nums">{total}</span> items
          </div>
        </div>
      </div>

      {/* Product Table */}
      <ProductTable
        products={displayedProducts}
        isLoading={isLoading}
        onEdit={handleOpenEditProduct}
        onAdjustStock={handleOpenAdjustStock}
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
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
