'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth-guard';
import { useGetSaleByIdQuery, useProcessReturnMutation } from '@/store/salesApi';

import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function SaleReturnPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data, isLoading } = useGetSaleByIdQuery(id, { skip: !id });
  const [processReturn, { isLoading: isSubmitting }] = useProcessReturnMutation();

  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<'DAMAGED' | 'CHANGED_MIND' | 'WRONG_ITEM' | 'OTHER'>('DAMAGED');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'BKASH' | 'CREDIT_ADJUST'>('CASH');
  const [notes, setNotes] = useState('');
  const [approvalPin, setApprovalPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ returnNumber: string; refundAmount: number } | null>(null);

  const invoice = data?.data;

  const formatBdt = (paisas: number) => {
    return (paisas / 100).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleQuantityChange = (productId: string, val: number, maxQty: number) => {
    const clamped = Math.max(0, Math.min(val, maxQty));
    setReturnQuantities((prev) => ({
      ...prev,
      [productId]: clamped,
    }));
  };

  // Calculate total refund amount
  const calculateTotalRefund = () => {
    if (!invoice) return 0;
    let sum = 0;
    for (const item of invoice.items) {
      const qty = returnQuantities[item.productId] || 0;
      sum += item.unitPrice * qty;
    }
    return sum;
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }));

    if (itemsToReturn.length === 0) {
      setErrorMsg('Please specify at least one item quantity to return.');
      return;
    }

    try {
      const result = await processReturn({
        id,
        body: {
          items: itemsToReturn,
          reason,
          refundMethod,
          notes: notes.trim() || undefined,
          approvalPin: approvalPin.trim() || undefined,
        },
      }).unwrap();

      setSuccessInfo({
        returnNumber: result.data.returnNumber,
        refundAmount: result.data.refundAmount,
      });
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to process return. Please check requirements.');
    }
  };

  if (isLoading || !invoice) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-slate-500">Loading invoice items...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">

            <Link
              href={`/sales/${invoice.id}`}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-600 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Process Sale Return
              </h1>
              <p className="text-xs text-slate-500">
                Invoice #{invoice.invoiceNumber} &bull; Total: ৳{formatBdt(invoice.total)}
              </p>
            </div>
          </div>

          {successInfo ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Return Processed Successfully</h2>
              <div className="bg-slate-50 rounded-lg p-4 max-w-sm mx-auto text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Return Slip #:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {successInfo.returnNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refund Amount:</span>
                  <span className="font-bold text-emerald-600">
                    ৳{formatBdt(successInfo.refundAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Disbursement:</span>
                  <span className="font-medium text-slate-800">{refundMethod}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href={`/sales/${invoice.id}`}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Return to Invoice
                </Link>
                <Link
                  href="/sales"
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  View Sales List
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReturn} className="space-y-6">
              {/* Items selection card */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Return Quantities
                </h2>
                <div className="divide-y divide-slate-100">
                  {invoice.items.map((item) => {
                    const currentQty = returnQuantities[item.productId] || 0;
                    return (
                      <div
                        key={item.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-sm text-slate-900">
                            {item.product?.name || 'Product'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Sold: {item.quantity} units @ ৳{formatBdt(item.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-500">Return Qty:</label>
                          <input
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={currentQty}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.productId,
                                parseInt(e.target.value, 10) || 0,
                                item.quantity
                              )
                            }
                            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-center font-semibold text-sm"
                          />
                          <span className="text-xs font-mono font-bold text-slate-700 w-24 text-right">
                            ৳{formatBdt(item.unitPrice * currentQty)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">Calculated Refund Total:</span>
                  <span className="text-lg font-bold text-emerald-600 font-mono">
                    ৳{formatBdt(calculateTotalRefund())}
                  </span>
                </div>
              </div>

              {/* Reason & Refund Method */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Return Particulars
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Return Reason *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="DAMAGED">Damaged / Defective Goods</option>
                      <option value="CHANGED_MIND">Customer Changed Mind</option>
                      <option value="WRONG_ITEM">Wrong Item Handed Over</option>
                      <option value="OTHER">Other Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Refund Method *
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="CASH">Cash Drawer Refund</option>
                      <option value="BKASH">bKash MFS Disbursement</option>
                      <option value="CREDIT_ADJUST">Customer Due Balance Adjustment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for audit logs..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Supervisor / Manager 4-Digit PIN (If return value exceeds threshold)
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="password"
                      maxLength={4}
                      value={approvalPin}
                      onChange={(e) => setApprovalPin(e.target.value)}
                      placeholder="••••"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-mono tracking-widest"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Link
                  href={`/sales/${invoice.id}`}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || calculateTotalRefund() === 0}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing Return...' : 'Confirm Return & Restock'}
                </button>
              </div>
            </form>
          )}
      </div>
    </AuthGuard>
  );
}

