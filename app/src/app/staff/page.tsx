'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import {
  useGetStaffListQuery,
  useInviteStaffMutation,
  useUpdateStaffRoleMutation,
  useDeactivateStaffMutation,
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: staffData, isLoading, refetch } = useGetStaffListQuery();
  const { data: permData } = useGetRolePermissionsQuery();

  const [inviteStaff, { isLoading: isInviting }] = useInviteStaffMutation();
  const [updateRole] = useUpdateStaffRoleMutation();
  const [deactivateStaff] = useDeactivateStaffMutation();

  // Invite modal form
  const [inviteName, setInviteName] = useState('');
  const [inviteContact, setInviteContact] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  const staff = staffData?.data?.staff || [];
  const invitations = staffData?.data?.invitations || [];
  const roles = staffData?.data?.roles || [];
  const rolePermissions = permData?.data || [];

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccessMsg('');

    if (!inviteRoleId) {
      setInviteError('Please select a role for the new team member.');
      return;
    }

    try {
      const res = await inviteStaff({
        name: inviteName.trim(),
        phoneOrEmail: inviteContact.trim(),
        roleId: inviteRoleId,
      }).unwrap();

      setInviteSuccessMsg(res.message || 'Invitation sent successfully!');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteName('');
        setInviteContact('');
        setInviteRoleId('');
        setInviteSuccessMsg('');
        refetch();
      }, 1500);
    } catch (err: any) {
      setInviteError(err?.data?.message || 'Failed to send invitation.');
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to toggle active status for ${name}?`)) {
      try {
        await deactivateStaff(id).unwrap();
        refetch();
      } catch (err: any) {
        alert(err?.data?.message || 'Action failed.');
      }
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Roles</h1>
              <p className="text-sm text-slate-600">
                Manage cashier accounts, team invitations, and role-based access permissions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
            >
              <UserPlus className="w-4 h-4" />
              Invite Team Member
            </button>
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
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                <KeyRound className="w-3 h-3 text-indigo-500" />
                                {member.userRoles[0]?.role?.name || 'Staff'}
                              </span>
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
                              {member.userRoles[0]?.role?.name !== 'OWNER' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivate(member.id, member.name)}
                                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
                                >
                                  {member.isActive ? 'Deactivate' : 'Reactivate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900">Pending Invitations</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {invitations.map((inv) => (
                      <div key={inv.id} className="p-4 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{inv.name}</p>
                          <p className="text-xs text-slate-500">
                            Sent to: {inv.emailOrPhone} &bull; Role: {inv.role?.name}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Invite Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Invite New Team Member</h3>

                <form onSubmit={handleInviteSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Staff Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Rafiqul Islam"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number or Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteContact}
                      onChange={(e) => setInviteContact(e.target.value)}
                      placeholder="01XXXXXXXXX or staff@shop.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role Assignment *
                    </label>
                    <select
                      value={inviteRoleId}
                      onChange={(e) => setInviteRoleId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="">-- Choose Role --</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {inviteError && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                      {inviteError}
                    </p>
                  )}

                  {inviteSuccessMsg && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {inviteSuccessMsg}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isInviting ? 'Inviting...' : 'Send Invitation'}
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
