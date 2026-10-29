'use client';

import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { stockAdjustmentSchema, type StockAdjustmentInput } from '@dokani/shared';
import { useAdjustStockMutation, type ProductItem } from '@/store/productApi';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

export function StockAdjustModal({ isOpen, onClose, product }: StockAdjustModalProps) {
  const [adjustStock, { isLoading }] = useAdjustStockMutation();

  const [type, setType] = useState<'ADJUSTMENT_DAMAGE' | 'ADJUSTMENT_EXPIRY' | 'ADJUSTMENT_CORRECTION'>(
    'ADJUSTMENT_DAMAGE'
  );
  const [quantity, setQuantity] = useState<number>(-1);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const projectedStock = currentStock + quantity;
  const isNegative = projectedStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity === 0) {
      setError('Adjustment quantity must not be zero.');
      return;
    }

    if (isNegative) {
      setError(`Cannot reduce stock below zero. Current stock is ${currentStock}.`);
      return;
    }

    const payload: StockAdjustmentInput = {
      productId: product.id,
      type,
      quantity,
      reason: reason.trim(),
    };

    const validation = stockAdjustmentSchema.safeParse(payload);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Invalid adjustment inputs.');
      return;
    }

    try {
      await adjustStock(payload).unwrap();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to adjust stock. Please try again.';
      setError(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="relative w-full max-w-md rounded-lg bg-surface border border-border shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 id="adjust-modal-title" className="text-base font-semibold text-slate-900">
              Adjust Stock Level
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{product.name} ({product.sku})</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded border border-border bg-slate-50 p-3 flex justify-between text-xs">
            <div>
              <span className="text-slate-500">Current Stock:</span>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {currentStock} {product.unit}
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500">New Projected Stock:</span>
              <p
                className={`text-base font-bold tabular-nums ${
                  isNegative ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {projectedStock} {product.unit}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="adjust-type" className="block text-xs font-medium text-slate-700">
              Reason Type *
            </label>
            <select
              id="adjust-type"
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as 'ADJUSTMENT_DAMAGE' | 'ADJUSTMENT_EXPIRY' | 'ADJUSTMENT_CORRECTION'
                )
              }
              className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-white"
            >
              <option value="ADJUSTMENT_DAMAGE">Damaged Goods (Defect/Broken)</option>
              <option value="ADJUSTMENT_EXPIRY">Expired Product</option>
              <option value="ADJUSTMENT_CORRECTION">Stock Count Audit Correction</option>
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-xs font-medium text-slate-700">
              Quantity Adjustment (+ to add, - to deduct) *
            </label>
            <input
              id="quantity"
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="-1 or 5"
              className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand tabular-nums font-semibold"
            />
            <p className="mt-1 text-xs text-slate-500">
              Negative value (e.g. -2) reduces stock; positive value increases stock.
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs font-medium text-slate-700">
              Audit Justification / Note *
            </label>
            <textarea
              id="reason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Water damage during warehouse transport"
              className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
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
              disabled={isLoading || isNegative}
              className="flex items-center gap-1.5 rounded bg-brand px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
