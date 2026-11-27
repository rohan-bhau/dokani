'use client';

import React, { useState } from 'react';
import { Permission } from '@dokani/shared';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetAdminTenantsQuery,
  useUpdateTenantStatusMutation,
} from '@/store/adminApi';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function AdminPortalPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, refetch } = useGetAdminTenantsQuery();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateTenantStatusMutation();

  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const tenants = data?.data?.tenants ?? [];
  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.phone && t.phone.includes(searchTerm))
  );

  const totalTenants = data?.data?.total ?? tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') => {
    setActionMsg(null);
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateStatus({ id, status: nextStatus }).unwrap();
      setActionMsg({ text: `Tenant status changed to ${nextStatus}.` });
      refetch();
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string } };
      setActionMsg({ text: errObj?.data?.message || 'Failed to update tenant status.', isError: true });
    }
  };

  return (
    <AuthGuard requireAnyPermissions={[Permission.PLATFORM_MANAGE]}>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
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
              Control plane for registered retail workspaces, operational status, and system health.
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
            {actionMsg.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

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
            <span className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex items-center gap-2 max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                aria-label="Search stores"
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
                    <th className="py-3 px-4">Store Activity</th>
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
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                        {t.counts
                          ? `${t.counts.users} staff · ${t.counts.products} items · ${t.counts.invoices} sales`
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition disabled:opacity-50 ${
                            t.status === 'ACTIVE'
                              ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
