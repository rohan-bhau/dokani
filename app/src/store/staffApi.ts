import { baseApi } from './api';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  role: string;
  roleId?: string;
  createdAt: string;
}

export interface StaffInvitation {
  id: string;
  name: string;
  emailOrPhone: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  role: string;
  roleId: string;
}

export interface RolePermissionItem {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}

export interface RolePermissionMatrixResponse {
  roles: RolePermissionItem[];
  allPermissions: Array<{
    id: string;
    code: string;
    description?: string | null;
  }>;
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffList: builder.query<
      {
        success: boolean;
        data: {
          users: StaffMember[];
          invitations: StaffInvitation[];
        };
      },
      void
    >({
      query: () => '/staff',
      providesTags: ['AuditLog'],
    }),

    inviteStaff: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          invitationId: string;
          inviteUrl: string;
          name: string;
          emailOrPhone: string;
          role: string;
          expiresAt: string;
        };
      },
      { name: string; phoneOrEmail: string; roleId: string }
    >({
      query: (body) => ({
        url: '/staff/invite',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuditLog'],
    }),

    updateStaffRole: builder.mutation<
      { success: boolean; message: string },
      { id: string; roleId: string }
    >({
      query: ({ id, roleId }) => ({
        url: `/staff/${id}/role`,
        method: 'PATCH',
        body: { roleId },
      }),
      invalidatesTags: ['AuditLog'],
    }),

    deactivateStaff: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/staff/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['AuditLog'],
    }),

    getRolePermissions: builder.query<
      { success: boolean; data: RolePermissionMatrixResponse },
      void
    >({
      query: () => '/staff/roles/permissions',
      providesTags: ['AuditLog'],
    }),

    updateRolePermissions: builder.mutation<
      { success: boolean; message: string },
      { roleId: string; permissions: string[] }
    >({
      query: ({ roleId, permissions }) => ({
        url: `/staff/roles/${roleId}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetStaffListQuery,
  useInviteStaffMutation,
  useUpdateStaffRoleMutation,
  useDeactivateStaffMutation,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
} = staffApi;
