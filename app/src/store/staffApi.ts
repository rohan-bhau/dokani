import { baseApi } from './api';

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  language: string;
  userRoles: Array<{
    role: {
      id: string;
      name: string;
      isSystem: boolean;
    };
  }>;
  createdAt: string;
}

export interface StaffInvitation {
  id: string;
  name: string;
  emailOrPhone: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
}

export interface RolePermissionItem {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffList: builder.query<
      {
        success: boolean;
        data: {
          staff: StaffMember[];
          invitations: StaffInvitation[];
          roles: Array<{ id: string; name: string }>;
        };
      },
      void
    >({
      query: () => '/staff',
      providesTags: ['AuditLog'],
    }),

    inviteStaff: builder.mutation<
      { success: boolean; message: string; invitation: StaffInvitation },
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
      { success: boolean; data: RolePermissionItem[] },
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
