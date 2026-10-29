'use client';

import { Edit2, SlidersHorizontal, Trash2, AlertTriangle, PackageOpen } from 'lucide-react';
import { useDeleteProductMutation, type ProductItem } from '@/store/productApi';

interface ProductTableProps {
  products: ProductItem[];
  isLoading: boolean;
  onEdit: (product: ProductItem) => void;
  onAdjustStock: (product: ProductItem) => void;
}

export function ProductTable({
  products,
  isLoading,
  onEdit,
  onAdjustStock,
}: ProductTableProps) {
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete product '${name}'?`);
    if (!confirmed) return;

    try {
      await deleteProduct(id).unwrap();
    } catch {
      alert('Failed to delete product.');
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface p-12 text-center">
        <PackageOpen className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-semibold text-slate-900">No products found</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          No inventory products match your current search criteria. Try a different keyword or create a new product.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-surface-subtle text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="px-4 py-3">Product / SKU</th>
            <th className="px-4 py-3">Barcode</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3 text-right">Cost Price</th>
            <th className="px-4 py-3 text-right">Sell Price</th>
            <th className="px-4 py-3 text-center">Stock</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-slate-800">
          {products.map((p) => {
            const isOutOfStock = p.stock === 0;
            const isLowStock = !isOutOfStock && p.stock <= p.reorderLevel;

            return (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 text-sm">{p.name}</div>
                  {p.nameBn && (
                    <div className="text-xs text-slate-600 font-bangla">{p.nameBn}</div>
                  )}
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    SKU: {p.sku}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">
                  {p.barcode || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600 capitalize">{p.unit}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-700">
                  ৳{p.costPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  ৳{p.sellPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center font-bold tabular-nums">
                  <span
                    className={
                      isOutOfStock
                        ? 'text-rose-600'
                        : isLowStock
                        ? 'text-amber-700'
                        : 'text-slate-900'
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-200">
                      Out of stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                      <AlertTriangle className="h-3 w-3" />
                      Low ({p.stock}/{p.reorderLevel})
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                      In Stock
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onAdjustStock(p)}
                      title="Adjust Stock"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      title="Edit Product"
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={isDeleting}
                      title="Delete Product"
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
