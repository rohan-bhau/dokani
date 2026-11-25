'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Permission } from '@dokani/shared';
import type { RootState } from '@/store';
import { AuthGuard, hasAnyPermission } from '@/components/auth-guard';
import {
  useGetStaffListQuery,
  useCreateStaffMutation,
  useUpdateStaffRoleMutation,
  useDeactivateStaffMutation,
  useReactivateStaffMutation,
  useGetRolePermissionsQuery,
} from '@/store/staffApi';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Power,
  ChevronRight,
} from 'lucide-react';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'PERMISSIONS'>('STAFF');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const canManageStaff = hasAnyPermission(currentUser?.permissions, [Permission.STAFF_MANAGE]);

  const { data: staffData, isLoading, refetch } = useGetStaffListQuery();
  const { data: permData } = useGetRolePermissionsQuery();

  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateRole] = useUpdateStaffRoleMutation();
  const [deactivateStaff] = useDeactivateStaffMutation();
  const [reactivateStaff] = useReactivateStaffMutation();

  // Add employee modal form
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const [formError, setFormError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    phone: string;
    password: string;
    role: string;
  } | null>(null);

  const staff = staffData?.data?.users || [];
  const rolePermissions = permData?.data?.roles || [];
  const assignableRoles = rolePermissions.filter((r) => r.name !== 'OWNER');

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!staffRoleId) {
      setFormError('Please select a role for the employee.');
      return;
    }

    if (staffPassword.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await createStaff({
        name: staffName.trim(),
        phone: staffPhone.trim(),
        email: staffEmail.trim() || undefined,
        password: staffPassword,
        roleId: staffRoleId,
      }).unwrap();

      setCreatedCredentials({
        name: res.data.name,
        phone: res.data.phone,
        password: staffPassword,
        role: res.data.role,
      });
      setStaffName('');
      setStaffPhone('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRoleId('');
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to create staff account.');
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await updateRole({ id: userId, roleId }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to update role.');
    }
  };

  const handleToggleActive = async (id: string, name: string, currentlyActive: boolean) => {
    const actionLabel = currentlyActive ? 'deactivate' : 'reactivate';
    if (confirm(`Are you sure you want to ${actionLabel} ${name}'s account?`)) {
      try {
        if (currentlyActive) {
          await deactivateStaff(id).unwrap();
        } else {
          await reactivateStaff(id).unwrap();
        }
        refetch();
      } catch (err: any) {
        alert(err?.data?.message || 'Action failed.');
      }
    }
  };

  return (
    <AuthGuard requireAnyPermissions={[Permission.STAFF_VIEW, Permission.STAFF_MANAGE]}>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff &amp; Roles</h1>
              <p className="text-sm text-slate-600">
                Create employee login accounts, assign store roles, and control account access.
              </p>
            </div>
            {canManageStaff && (
              <button
                type="button"
                onClick={() => {
                  setCreatedCredentials(null);
                  setFormError('');
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
              >
                <UserPlus className="w-4 h-4" />
                Add Employee Account
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('STAFF')}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'STAFF'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members ({staff.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PERMISSIONS')}
              className={`pb-3 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'PERMISSIONS'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Role Permission Matrix</span>
            </button>
          </div>

          {/* Tab 1: Staff Members Table */}
          {activeTab === 'STAFF' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-900">Active Store Operators</h2>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-sm text-slate-500">Loading team...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Phone / Contact</th>
                          <th className="py-3 px-4">Assigned Role</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {staff.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {member.name}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-600">
                              {member.phone}
                            </td>
                            <td className="py-3 px-4">
                              {canManageStaff && member.role !== 'OWNER' && assignableRoles.length > 0 ? (
                                <select
                                  aria-label={`Role for ${member.name}`}
                                  value={member.roleId || ''}
                                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                  className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                                >
                                  {assignableRoles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                  <KeyRound className="w-3 h-3 text-indigo-500" />
                                  {member.role || 'Staff'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  member.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {member.isActive ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {member.role === 'OWNER' ? (
                                <span className="text-[11px] font-medium text-slate-400">
                                  Store Owner
                                </span>
                              ) : canManageStaff ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleActive(member.id, member.name, member.isActive)}
                                  className={`text-xs font-semibold transition ${
                                    member.isActive
                                      ? 'text-rose-600 hover:text-rose-700'
                                      : 'text-emerald-600 hover:text-emerald-700'
                                  }`}
                                >
                                  {member.isActive ? 'Deactivate' : 'Reactivate'}
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Role Permission Matrix */}
          {activeTab === 'PERMISSIONS' && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-sm font-bold text-slate-900">Configured Role Permissions</h2>
                <p className="text-xs text-slate-500">
                  Granular permission grants across POS, Products, Customers, Inventory, and Settings.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Role Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Assigned Permissions Count</th>
                      <th className="py-3 px-4">Key Capabilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rolePermissions.map((rp) => (
                      <tr key={rp.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          {rp.name}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {rp.isSystem ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                              System Built-in
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-mono">
                              Custom Role
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {rp.permissions?.length || 0} permissions
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-md">
                          <div className="flex flex-wrap gap-1">
                            {rp.permissions?.slice(0, 5).map((p, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                                {p}
                              </span>
                            ))}
                            {(rp.permissions?.length || 0) > 5 && (
                              <span className="text-[10px] text-slate-400">
                                +{(rp.permissions?.length || 0) - 5} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Employee Modal */}
          {isAddModalOpen && canManageStaff && (
            <div className="fixed inset-0 !mt-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Employee Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Create a direct login account for your cashier, manager, or inventory staff.
                  </p>
                </div>

                {createdCredentials ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2 text-xs text-emerald-900">
                      <p className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Account Created Successfully</span>
                      </p>
                      <p className="text-emerald-800">
                        Share these login details with <span className="font-semibold">{createdCredentials.name}</span>:
                      </p>
                      <div className="rounded-lg bg-white border border-emerald-200 p-3 space-y-1 font-mono text-xs text-slate-800">
                        <div>Role: <span className="font-bold">{createdCredentials.role}</span></div>
                        <div>Phone: <span className="font-bold">{createdCredentials.phone}</span></div>
                        <div>Password: <span className="font-bold">{createdCredentials.password}</span></div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreatedCredentials(null);
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Add Another
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          setCreatedCredentials(null);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5">
                    <div>
                      <label htmlFor="staff-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Employee Full Name *
                      </label>
                      <input
                        id="staff-name"
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Rafiqul Islam"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="staff-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number (for login) *
                      </label>
                      <input
                        id="staff-phone"
                        type="tel"
                        required
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="01711223344"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="staff-email" className="block text-xs font-semibold text-slate-700 mb-1">
                        Email (Optional)
                      </label>
                      <input
                        id="staff-email"
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@shop.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-700 mb-1">
                        Initial Password *
                      </label>
                      <input
                        id="staff-password"
                        type="password"
                        required
                        minLength={8}
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="staff-role" className="block text-xs font-semibold text-slate-700 mb-1">
                        Assign Role *
                      </label>
                      <select
                        id="staff-role"
                        value={staffRoleId}
                        onChange={(e) => setStaffRoleId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">-- Choose Role --</option>
                        {assignableRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formError && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                        {formError}
                      </p>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          setFormError('');
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                      >
                        {isCreating ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}
