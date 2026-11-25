'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Permission } from '@dokani/shared';
import type { AppDispatch, RootState } from '@/store';
import { updateTenantInfo } from '@/store/authSlice';
import { AuthGuard, hasAnyPermission } from '@/components/auth-guard';
import { ShopLogo } from '@/components/dokani-logo';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/settingsApi';
import {
  Store,
  Printer,
  Percent,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
} from 'lucide-react';

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const canViewStaff = hasAnyPermission(currentUser?.permissions, [
    Permission.STAFF_VIEW,
    Permission.STAFF_MANAGE,
  ]);

  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'PRINT' | 'RULES'>('BUSINESS');
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    binNumber: '',
    logoUrl: '',
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
    defaultCreditLimit: '' as string,
    overdueDays: 15,
  });

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setFormData({
        name: s.name || '',
        phone: s.phone || '',
        address: s.address || '',
        binNumber: s.binNumber || '',
        logoUrl: s.logoUrl || '',
        businessType: s.businessType || 'Grocery',
        paperSize: s.paperSize || 'RECEIPT_80MM',
        receiptFooter: s.receiptFooter || 'Thank you for shopping with us!',
        showLogoOnInvoice: s.showLogoOnInvoice ?? true,
        showBinOnInvoice: s.showBinOnInvoice ?? true,
        showBanglaOnInvoice: s.showBanglaOnInvoice ?? false,
        pricesIncludeVat: s.pricesIncludeVat ?? false,
        allowNegativeStock: s.allowNegativeStock ?? false,
        maxCashierDiscount: s.maxCashierDiscount ?? 5,
        returnApprovalLimit: s.returnApprovalLimit ? Math.round(s.returnApprovalLimit) : 2000,
        defaultCreditLimit:
          s.defaultCreditLimit !== null && s.defaultCreditLimit !== undefined
            ? String(Math.round(s.defaultCreditLimit))
            : '',
        overdueDays: s.overdueDays ?? 15,
      });
    }
  }, [data]);

  const handleChange = (field: string, val: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (statusMessage) setStatusMessage(null);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmedLogo = formData.logoUrl.trim();
    if (
      trimmedLogo &&
      !trimmedLogo.startsWith('https://') &&
      !trimmedLogo.startsWith('http://') &&
      !trimmedLogo.startsWith('/')
    ) {
      setStatusMessage({
        text: 'Logo URL must start with https://, http://, or /',
        isError: true,
      });
      return;
    }

    const parsedCreditLimit =
      formData.defaultCreditLimit.trim() !== ''
        ? Math.max(0, Math.round(Number(formData.defaultCreditLimit)))
        : null;

    try {
      const updated = await updateSettings({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        binNumber: formData.binNumber.trim() || undefined,
        logoUrl: trimmedLogo || null,
        businessType: formData.businessType,
        paperSize: formData.paperSize,
        receiptFooter: formData.receiptFooter.trim() || undefined,
        showLogoOnInvoice: formData.showLogoOnInvoice,
        showBinOnInvoice: formData.showBinOnInvoice,
        showBanglaOnInvoice: formData.showBanglaOnInvoice,
        pricesIncludeVat: formData.pricesIncludeVat,
        allowNegativeStock: formData.allowNegativeStock,
        maxCashierDiscount: formData.maxCashierDiscount,
        returnApprovalLimit: Math.round(formData.returnApprovalLimit),
        defaultCreditLimit: parsedCreditLimit,
        overdueDays: formData.overdueDays,
      }).unwrap();

      dispatch(
        updateTenantInfo({
          name: updated.data?.name || formData.name.trim(),
          logoUrl: updated.data?.logoUrl ?? (trimmedLogo || null),
        })
      );

      setStatusMessage({ text: 'Settings updated successfully.' });
    } catch (err: any) {
      setStatusMessage({
        text: err?.data?.message || 'Failed to update settings.',
        isError: true,
      });
    }
  };

  return (
    <AuthGuard requireAnyPermissions={[Permission.TENANT_SETTINGS_MANAGE]}>
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <ShopLogo
                name={formData.name || data?.data?.name || 'Store'}
                logoUrl={formData.logoUrl.trim() || data?.data?.logoUrl || null}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formData.name || data?.data?.name || 'Store'} Settings
                </h1>
                <p className="text-sm text-slate-600">
                  Configure store identity, receipt printing, and POS cashier rules.
                </p>
              </div>
            </div>

            {canViewStaff && (
              <Link
                href="/staff"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold transition self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Employees &amp; Roles</span>
              </Link>
            )}
          </div>

          {/* Segmented Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Store settings sections"
            className="inline-flex w-full sm:w-auto overflow-x-auto rounded-xl border border-slate-200 bg-slate-100/80 p-1 gap-1 text-xs font-semibold"
          >
            <button
              type="button"
              role="tab"
              id="tab-business"
              aria-selected={activeTab === 'BUSINESS'}
              aria-controls="panel-business"
              onClick={() => setActiveTab('BUSINESS')}
              className={`min-h-[40px] px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === 'BUSINESS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Shop Profile</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-print"
              aria-selected={activeTab === 'PRINT'}
              aria-controls="panel-print"
              onClick={() => setActiveTab('PRINT')}
              className={`min-h-[40px] px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === 'PRINT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Invoice &amp; Printing</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-rules"
              aria-selected={activeTab === 'RULES'}
              aria-controls="panel-rules"
              onClick={() => setActiveTab('RULES')}
              className={`min-h-[40px] px-4 py-2 rounded-lg transition flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                activeTab === 'RULES'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>POS &amp; Cashier Rules</span>
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
              <div className="h-16 bg-slate-100 rounded-lg" />
            </div>
          ) : (
            <form onSubmit={handleSaveSubmit} className="space-y-6">
              {/* Tab 1: Business Profile */}
              {activeTab === 'BUSINESS' && (
                <div
                  role="tabpanel"
                  id="panel-business"
                  aria-labelledby="tab-business"
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4"
                >
                  <h2 className="text-sm font-bold text-slate-900">Store Profile</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Store Name *
                      </label>
                      <input
                        id="settings-name"
                        type="text"
                        required
                        minLength={2}
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="settings-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Official Phone Number
                      </label>
                      <input
                        id="settings-phone"
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="settings-industry" className="block text-xs font-semibold text-slate-700 mb-1">
                        Retail Industry Type
                      </label>
                      <select
                        id="settings-industry"
                        value={formData.businessType}
                        onChange={(e) => handleChange('businessType', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="Grocery">Grocery / General Store (Mudi)</option>
                        <option value="Pharmacy">Pharmacy / Medicine</option>
                        <option value="Electronics">Electronics &amp; Hardware</option>
                        <option value="Clothing">Clothing &amp; Garments</option>
                        <option value="Wholesale">Wholesale Distributor</option>
                        <option value="Other">Other Retail</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="settings-bin" className="block text-xs font-semibold text-slate-700 mb-1">
                        VAT / BIN Registration Number
                      </label>
                      <input
                        id="settings-bin"
                        type="text"
                        value={formData.binNumber}
                        onChange={(e) => handleChange('binNumber', e.target.value)}
                        placeholder="e.g. 001234567-0101"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="settings-address" className="block text-xs font-semibold text-slate-700 mb-1">
                        Shop Address
                      </label>
                      <input
                        id="settings-address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="e.g. House 12, Road 4, Mirpur 10, Dhaka"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                      <label htmlFor="settings-logo" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Shop Logo URL (Displayed on Navbar, Invoices &amp; Payment Pages)
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <ShopLogo
                          name={formData.name || 'Shop'}
                          logoUrl={formData.logoUrl.trim() || null}
                          size="lg"
                        />
                        <div className="flex-1 w-full flex gap-2">
                          <input
                            id="settings-logo"
                            type="text"
                            aria-describedby="settings-logo-hint"
                            value={formData.logoUrl}
                            onChange={(e) => handleChange('logoUrl', e.target.value)}
                            placeholder="https://example.com/shop-logo.png or /logos/karim-store.svg"
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          {formData.logoUrl && (
                            <button
                              type="button"
                              onClick={() => handleChange('logoUrl', '')}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <p id="settings-logo-hint" className="text-[11px] text-slate-500 mt-1.5">
                        Leave empty to automatically use your shop initials badge.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Print Settings */}
              {activeTab === 'PRINT' && (
                <div
                  role="tabpanel"
                  id="panel-print"
                  aria-labelledby="tab-print"
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4"
                >
                  <h2 className="text-sm font-bold text-slate-900">Receipt &amp; Invoice Customization</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-paper" className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Paper Format
                      </label>
                      <select
                        id="settings-paper"
                        value={formData.paperSize}
                        onChange={(e) => handleChange('paperSize', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="RECEIPT_80MM">80mm POS Thermal Receipt</option>
                        <option value="RECEIPT_58MM">58mm POS Mini Thermal</option>
                        <option value="A4">A4 Full Page Invoice</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="settings-footer" className="block text-xs font-semibold text-slate-700 mb-1">
                        Receipt Footer Text
                      </label>
                      <input
                        id="settings-footer"
                        type="text"
                        value={formData.receiptFooter}
                        onChange={(e) => handleChange('receiptFooter', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showLogoOnInvoice}
                        onChange={(e) => handleChange('showLogoOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Print Store Logo on Receipt Header</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showBinOnInvoice}
                        onChange={(e) => handleChange('showBinOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Display VAT / BIN Registration Number on Bills</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.showBanglaOnInvoice}
                        onChange={(e) => handleChange('showBanglaOnInvoice', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Format Currency &amp; Quantities in Bengali Numerals (বাংলা সংখ্যা)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 3: POS Rules */}
              {activeTab === 'RULES' && (
                <div
                  role="tabpanel"
                  id="panel-rules"
                  aria-labelledby="tab-rules"
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4"
                >
                  <h2 className="text-sm font-bold text-slate-900">POS Rules &amp; Authorizations</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-discount" className="block text-xs font-semibold text-slate-700 mb-1">
                        Max Cashier Discount Percentage (%)
                      </label>
                      <input
                        id="settings-discount"
                        type="number"
                        min={0}
                        max={100}
                        aria-describedby="settings-discount-hint"
                        value={formData.maxCashierDiscount}
                        onChange={(e) =>
                          handleChange('maxCashierDiscount', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <span id="settings-discount-hint" className="text-[11px] text-slate-400 mt-0.5 block">
                        Discounts exceeding this require Supervisor PIN approval at POS.
                      </span>
                    </div>

                    <div>
                      <label htmlFor="settings-return-limit" className="block text-xs font-semibold text-slate-700 mb-1">
                        Return Approval Threshold (৳)
                      </label>
                      <input
                        id="settings-return-limit"
                        type="number"
                        min={0}
                        aria-describedby="settings-return-hint"
                        value={formData.returnApprovalLimit}
                        onChange={(e) =>
                          handleChange('returnApprovalLimit', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <span id="settings-return-hint" className="text-[11px] text-slate-400 mt-0.5 block">
                        Sale returns above this amount require Manager PIN verification.
                      </span>
                    </div>

                    <div>
                      <label htmlFor="settings-credit-limit" className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Customer Credit Limit (৳)
                      </label>
                      <input
                        id="settings-credit-limit"
                        type="number"
                        min={0}
                        aria-describedby="settings-credit-hint"
                        value={formData.defaultCreditLimit}
                        onChange={(e) => handleChange('defaultCreditLimit', e.target.value)}
                        placeholder="No limit"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <span id="settings-credit-hint" className="text-[11px] text-slate-400 mt-0.5 block">
                        Leave blank for unlimited baki unless overridden per customer.
                      </span>
                    </div>

                    <div>
                      <label htmlFor="settings-overdue" className="block text-xs font-semibold text-slate-700 mb-1">
                        Customer Due Overdue Days Threshold
                      </label>
                      <input
                        id="settings-overdue"
                        type="number"
                        min={1}
                        max={365}
                        aria-describedby="settings-overdue-hint"
                        value={formData.overdueDays}
                        onChange={(e) =>
                          handleChange('overdueDays', parseInt(e.target.value, 10) || 15)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <span id="settings-overdue-hint" className="text-[11px] text-slate-400 mt-0.5 block">
                        Days before uncollected dues trigger aged receivables alert.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.pricesIncludeVat}
                        onChange={(e) => handleChange('pricesIncludeVat', e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Item Shelf Prices Already Include VAT (Tax-inclusive pricing)</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
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
                  role="status"
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
