import { baseApi } from './api';

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  usersCount?: number;
  productsCount?: number;
  invoicesCount?: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTenants: builder.query<{ success: boolean; data: AdminTenant[] }, void>({
      query: () => '/admin/tenants',
      providesTags: ['AuditLog'],
    }),

    getAdminTenantDetails: builder.query<{ success: boolean; data: AdminTenant }, string>({
      query: (id) => `/admin/tenants/${id}`,
      providesTags: ['AuditLog'],
    }),

    updateTenantStatus: builder.mutation<
      { success: boolean; message: string },
      { id: string; status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/tenants/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AuditLog'],
    }),

    assignTenantSubscription: builder.mutation<
      { success: boolean; message: string },
      { id: string; planCode: string }
    >({
      query: ({ id, planCode }) => ({
        url: `/admin/tenants/${id}/subscription`,
        method: 'POST',
        body: { planCode },
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetAdminTenantsQuery,
  useGetAdminTenantDetailsQuery,
  useUpdateTenantStatusMutation,
  useAssignTenantSubscriptionMutation,
} = adminApi;
