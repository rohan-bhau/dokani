'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/settingsApi';
import {
  Settings,
  Store,
  Printer,
  Receipt,
  Percent,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'PRINT' | 'RULES'>('BUSINESS');
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    businessType: 'Grocery',
    paperSize: 'RECEIPT_80MM',
    receiptFooter: 'Thank you for shopping with us!',
    showLogoOnInvoice: true,
    showBinOnInvoice: true,
    showBanglaOnInvoice: false,
    pricesIncludeVat: false,
    allowNegativeStock: false,
    maxCashierDiscount: 5,
    returnApprovalLimit: 2000,
    overdueDays: 15,
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setFormData({
        name: s.name || '',
        phone: s.phone || '',
        businessType: s.businessType || 'Grocery',
        paperSize: s.paperSize || 'RECEIPT_80MM',
        receiptFooter: s.receiptFooter || 'Thank you for shopping with us!',
        showLogoOnInvoice: s.showLogoOnInvoice ?? true,
        showBinOnInvoice: s.showBinOnInvoice ?? true,
        showBanglaOnInvoice: s.showBanglaOnInvoice ?? false,
        pricesIncludeVat: s.pricesIncludeVat ?? false,
        allowNegativeStock: s.allowNegativeStock ?? false,
        maxCashierDiscount: s.maxCashierDiscount ?? 5,
        returnApprovalLimit: s.returnApprovalLimit ? s.returnApprovalLimit / 100 : 2000,
        overdueDays: s.overdueDays ?? 15,
      });
    }
  }, [data]);

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      await updateSettings({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        businessType: formData.businessType,
        paperSize: formData.paperSize,
        receiptFooter: formData.receiptFooter.trim() || undefined,
        showLogoOnInvoice: formData.showLogoOnInvoice,
        showBinOnInvoice: formData.showBinOnInvoice,
        showBanglaOnInvoice: formData.showBanglaOnInvoice,
        pricesIncludeVat: formData.pricesIncludeVat,
        allowNegativeStock: formData.allowNegativeStock,
        maxCashierDiscount: formData.maxCashierDiscount,
        returnApprovalLimit: formData.returnApprovalLimit * 100, // convert to paisa
        overdueDays: formData.overdueDays,
      }).unwrap();

      setStatusMessage({ text: 'Settings updated successfully.' });
    } catch (err: any) {
      setStatusMessage({
        text: err?.data?.message || 'Failed to update settings.',
        isError: true,
      });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Settings</h1>
            <p className="text-sm text-slate-600">
              Configure store identity, thermal printing layout, VAT rules, and cashier authorization limits.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('BUSINESS')}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'BUSINESS'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Shop Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PRINT')}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'PRINT'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Invoice & Printing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RULES')}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'RULES'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>POS & Cashier Rules</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading settings...</div>
          ) : (
            <form onSubmit={handleSaveSubmit} className="space-y-6">
              {/* Tab 1: Business Profile */}
              {activeTab === 'BUSINESS' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Store Profile</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Retail Industry Type
                      </label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => handleChange('businessType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="Grocery">Grocery / General Store (Mudi)</option>
                        <option value="Pharmacy">Pharmacy / Medicine</option>
                        <option value="Electronics">Electronics & Hardware</option>
                        <option value="Clothing">Clothing & Garments</option>
                        <option value="Wholesale">Wholesale Distributor</option>
                        <option value="Other">Other Retail</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Print Settings */}
              {activeTab === 'PRINT' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Receipt & Invoice Customization</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Paper Format
                      </label>
                      <select
                        value={formData.paperSize}
                        onChange={(e) => handleChange('paperSize', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="RECEIPT_80MM">80mm POS Thermal Receipt</option>
                        <option value="RECEIPT_58MM">58mm POS Mini Thermal</option>
                        <option value="A4">A4 Full Page Invoice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Receipt Footer Text
                      </label>
                      <input
                        type="text"
                        value={formData.receiptFooter}
                        onChange={(e) => handleChange('receiptFooter', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showLogoOnInvoice}
                        onChange={(e) => handleChange('showLogoOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Print Store Logo on Receipt Header</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showBinOnInvoice}
                        onChange={(e) => handleChange('showBinOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Display VAT / BIN Registration Number on Bills</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showBanglaOnInvoice}
                        onChange={(e) => handleChange('showBanglaOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Format Currency & Quantities in Bengali Numerals (বাংলা সংখ্যা)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: POS Rules */}
              {activeTab === 'RULES' && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">POS Rules & Authorizations</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Cashier Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={formData.maxCashierDiscount}
                        onChange={(e) =>
                          handleChange('maxCashierDiscount', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Discounts exceeding this requires a Supervisor PIN approval at POS.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Return Approval Threshold (৳)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.returnApprovalLimit}
                        onChange={(e) =>
                          handleChange('returnApprovalLimit', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Sale returns above this amount require Manager PIN verification.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Customer Due Overdue Days Threshold
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.overdueDays}
                        onChange={(e) =>
                          handleChange('overdueDays', parseInt(e.target.value, 10) || 15)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                      />
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Days before uncollected dues trigger aged receivables alert.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.pricesIncludeVat}
                        onChange={(e) => handleChange('pricesIncludeVat', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Item Shelf Prices Already Include VAT (Tax-inclusive pricing)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.allowNegativeStock}
                        onChange={(e) => handleChange('allowNegativeStock', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Allow Sales Even When Inventory is Zero (Allow negative stock)</span>
                    </label>
                  </div>
                </div>
              )}

              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {statusMessage.isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
      </div>
    </AuthGuard>
  );
}
