import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  QueryCustomerInput,
  CollectDueInput,
} from '@dokani/shared';
import { baseApi } from './api';

export interface CustomerResponse {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  dueBalance: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
    ledger: number;
  };
}

export interface CustomerLedgerResponse {
  id: string;
  tenantId: string;
  customerId: string;
  type: 'SALE_DUE' | 'PAYMENT_RECEIVED' | 'RETURN_CREDIT' | 'OPENING_BALANCE';
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<
      PaginatedResponse<CustomerResponse>,
      { page?: number; limit?: number; q?: string }
    >({
      query: (params) => ({
        url: '/customers',
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.q ? { q: params.q } : {}),
        },
      }),
      transformResponse: (response: {
        success: boolean;
        data: PaginatedResponse<CustomerResponse>;
      }) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Customer' as const, id })),
              { type: 'Customer', id: 'LIST' },
            ]
          : [{ type: 'Customer', id: 'LIST' }],
    }),

    getCustomerById: builder.query<CustomerResponse, string>({
      query: (id) => `/customers/${id}`,
      transformResponse: (response: { success: boolean; data: CustomerResponse }) =>
        response.data,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),

    createCustomer: builder.mutation<CustomerResponse, CreateCustomerInput>({
      query: (body) => ({
        url: '/customers',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: CustomerResponse }) =>
        response.data,
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    updateCustomer: builder.mutation<
      CustomerResponse,
      { id: string; data: UpdateCustomerInput }
    >({
      query: ({ id, data }) => ({
        url: `/customers/${id}`,
        method: 'PATCH',
        body: data,
      }),
      transformResponse: (response: { success: boolean; data: CustomerResponse }) =>
        response.data,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Customer', id },
        { type: 'Customer', id: 'LIST' },
      ],
    }),

    collectDue: builder.mutation<
      { customer: CustomerResponse; payment: unknown; ledger: CustomerLedgerResponse },
      { customerId: string; data: CollectDueInput }
    >({
      query: ({ customerId, data }) => ({
        url: `/customers/${customerId}/collect-due`,
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: {
        success: boolean;
        data: { customer: CustomerResponse; payment: unknown; ledger: CustomerLedgerResponse };
      }) => response.data,
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Customer', id: customerId },
        { type: 'Customer', id: 'LIST' },
        { type: 'CustomerLedger', id: customerId },
      ],
    }),

    getCustomerLedger: builder.query<
      PaginatedResponse<CustomerLedgerResponse>,
      { customerId: string; page?: number; limit?: number }
    >({
      query: ({ customerId, page = 1, limit = 20 }) => ({
        url: `/customers/${customerId}/ledger`,
        params: { page, limit },
      }),
      transformResponse: (response: {
        success: boolean;
        data: PaginatedResponse<CustomerLedgerResponse>;
      }) => response.data,
      providesTags: (_result, _error, { customerId }) => [
        { type: 'CustomerLedger', id: customerId },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useCollectDueMutation,
  useGetCustomerLedgerQuery,
} = customerApi;
