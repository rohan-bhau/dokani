'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createProductSchema, type CreateProductInput } from '@dokani/shared';
import { useCreateProductMutation, useUpdateProductMutation, type ProductItem } from '@/store/productApi';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductItem | null;
}

export function ProductModal({ isOpen, onClose, productToEdit }: ProductModalProps) {
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [formData, setFormData] = useState({
    name: '',
    nameBn: '',
    sku: '',
    barcode: '',
    unit: 'pcs',
    costPrice: 0,
    sellPrice: 0,
    vatRate: 0,
    reorderLevel: 5,
    initialStock: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        nameBn: productToEdit.nameBn ?? '',
        sku: productToEdit.sku,
        barcode: productToEdit.barcode ?? '',
        unit: productToEdit.unit,
        costPrice: productToEdit.costPrice,
        sellPrice: productToEdit.sellPrice,
        vatRate: productToEdit.vatRate,
        reorderLevel: productToEdit.reorderLevel,
        initialStock: productToEdit.stock,
      });
    } else {
      setFormData({
        name: '',
        nameBn: '',
        sku: '',
        barcode: '',
        unit: 'pcs',
        costPrice: 0,
        sellPrice: 0,
        vatRate: 0,
        reorderLevel: 5,
        initialStock: 0,
      });
    }
    setErrors({});
    setApiError(null);
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(productToEdit);
  const isLoading = isCreating || isUpdating;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const payload: CreateProductInput = {
      name: formData.name.trim(),
      nameBn: formData.nameBn.trim() || undefined,
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim() || undefined,
      unit: formData.unit.trim(),
      costPrice: formData.costPrice,
      sellPrice: formData.sellPrice,
      vatRate: formData.vatRate,
      reorderLevel: formData.reorderLevel,
      initialStock: formData.initialStock,
    };

    const validation = createProductSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (isEditing && productToEdit) {
        await updateProduct({
          id: productToEdit.id,
          data: payload,
        }).unwrap();
      } else {
        await createProduct(payload).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to save product. Please verify inputs.';
      setApiError(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="relative w-full max-w-2xl rounded-lg bg-surface border border-border shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {apiError && (
          <div className="mx-6 mt-4 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-slate-700">
                Product Name (English) *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Miniket Rice 25kg"
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="nameBn" className="block text-xs font-medium text-slate-700">
                পণ্যের নাম (বাংলা)
              </label>
              <input
                id="nameBn"
                name="nameBn"
                type="text"
                value={formData.nameBn}
                onChange={handleChange}
                placeholder="যেমন: মিনিকেট চাল ২৫ কেজি"
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-bangla"
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-xs font-medium text-slate-700">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g. RICE-MINI-25"
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
              {errors.sku && <p className="mt-1 text-xs text-rose-600">{errors.sku}</p>}
            </div>

            <div>
              <label htmlFor="barcode" className="block text-xs font-medium text-slate-700">
                Barcode
              </label>
              <input
                id="barcode"
                name="barcode"
                type="text"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode"
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-xs font-medium text-slate-700">
                Unit of Measure *
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="gm">Gram (gm)</option>
                <option value="liter">Liter (L)</option>
                <option value="bag">Bag</option>
                <option value="packet">Packet</option>
                <option value="box">Box</option>
              </select>
            </div>

            <div>
              <label htmlFor="reorderLevel" className="block text-xs font-medium text-slate-700">
                Reorder Threshold (Low Stock Alert) *
              </label>
              <input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-xs font-medium text-slate-700">
                Cost Price (BDT) *
              </label>
              <input
                id="costPrice"
                name="costPrice"
                type="number"
                min="0"
                value={formData.costPrice}
                onChange={handleChange}
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="sellPrice" className="block text-xs font-medium text-slate-700">
                Selling Price (BDT) *
              </label>
              <input
                id="sellPrice"
                name="sellPrice"
                type="number"
                min="0"
                value={formData.sellPrice}
                onChange={handleChange}
                className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums font-semibold"
              />
            </div>

            {!isEditing && (
              <div>
                <label htmlFor="initialStock" className="block text-xs font-medium text-slate-700">
                  Opening Stock Quantity
                </label>
                <input
                  id="initialStock"
                  name="initialStock"
                  type="number"
                  min="0"
                  value={formData.initialStock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded border border-border px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
