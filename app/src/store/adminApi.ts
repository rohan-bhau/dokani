import { baseApi } from './api';

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  createdAt: string;
  counts?: {
    users: number;
    products: number;
    invoices: number;
  };
}

export interface AdminTenantListResponse {
  tenants: AdminTenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminTenants: builder.query<{ success: boolean; data: AdminTenantListResponse }, void>({
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
  }),
});

export const {
  useGetAdminTenantsQuery,
  useGetAdminTenantDetailsQuery,
  useUpdateTenantStatusMutation,
} = adminApi;
