'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetAdminTenantsQuery,
  useUpdateTenantStatusMutation,
  useAssignTenantSubscriptionMutation,
} from '@/store/adminApi';
import {
  ShieldAlert,
  Store,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  KeyRound,
  Zap,
} from 'lucide-react';

export default function AdminPortalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [newPlanCode, setNewPlanCode] = useState('PRO');

  const { data, isLoading, refetch } = useGetAdminTenantsQuery();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateTenantStatusMutation();
  const [assignPlan, { isLoading: isAssigningPlan }] = useAssignTenantSubscriptionMutation();

  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const tenants = data?.data || [];
  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.phone && t.phone.includes(searchTerm))
  );

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.subscriptionStatus === 'ACTIVE').length;

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setActionMsg(null);
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateStatus({ id, status: nextStatus as any }).unwrap();
      setActionMsg({ text: `Tenant status successfully changed to ${nextStatus}.` });
      refetch();
    } catch (err: any) {
      setActionMsg({ text: err?.data?.message || 'Failed to update tenant status.', isError: true });
    }
  };

  const handleAssignPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setActionMsg(null);
    try {
      await assignPlan({ id: selectedTenant.id, planCode: newPlanCode }).unwrap();
      setActionMsg({ text: `Assigned plan ${newPlanCode} to ${selectedTenant.name}.` });
      setSelectedTenant(null);
      refetch();
    } catch (err: any) {
      setActionMsg({ text: err?.data?.message || 'Failed to assign plan.', isError: true });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Super Admin Restricted
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Dokani Platform Administration
              </h1>
              <p className="text-sm text-slate-600">
                Superuser control plane for store tenancy lifecycle, billing overrides, and system health.
              </p>
            </div>
          </div>

          {actionMsg && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                actionMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMsg.text}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Total Registered Shops
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {totalTenants}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Active Stores
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                {activeTenants}
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                System Status
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>
          </div>

          {/* Tenants Directory Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stores by name, slug or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="text-xs text-slate-500">
                Showing {filteredTenants.length} of {totalTenants} stores
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading platform tenants...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No stores found matching search.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Shop Name</th>
                      <th className="py-3 px-4">Slug ID</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Assigned Plan</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{t.slug}</td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-700">
                          {t.phone || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                            <Zap className="w-3 h-3 text-indigo-500" />
                            {t.subscriptionPlan || 'FREE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              t.subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {t.subscriptionStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTenant(t)}
                              className="px-2.5 py-1 text-xs font-semibold border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition"
                            >
                              Assign Plan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(t.id, t.subscriptionStatus)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                t.subscriptionStatus === 'ACTIVE'
                                  ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                  : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {t.subscriptionStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assign Plan Modal */}
          {selectedTenant && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Assign Plan: {selectedTenant.name}
                </h3>

                <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Subscription Tier
                    </label>
                    <select
                      value={newPlanCode}
                      onChange={(e) => setNewPlanCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="FREE">Free Tier (100 products, 1 user)</option>
                      <option value="STARTER">Starter Plan (1,500 products, 3 users)</option>
                      <option value="PRO">Pro Merchant Plan (Unlimited, 10 users)</option>
                      <option value="ENTERPRISE">Enterprise Multi-Store</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(null)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAssigningPlan}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isAssigningPlan ? 'Applying...' : 'Confirm Assignment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}
