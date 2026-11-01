import type { CreateSaleInput, QuerySaleInput, VoidSaleInput } from '@dokani/shared';
import { baseApi } from './api';

export interface InvoiceItemResponse {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  vatRate: number;
  lineTotal: number;
  product?: {
    name: string;
    nameBn: string | null;
    sku: string;
    unit: string;
  };
}

export interface PaymentResponse {
  id: string;
  invoiceId: string | null;
  method: 'CASH' | 'BKASH' | 'NAGAD' | 'CARD' | 'CREDIT_BAKI';
  amount: number;
  reference: string | null;
  createdAt: string;
}

export interface InvoiceResponse {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string | null;
  status: 'COMPLETED' | 'VOIDED' | 'PARTIAL_RETURN' | 'FULL_RETURN';
  subtotal: number;
  discount: number;
  vatTotal: number;
  total: number;
  paidTotal: number;
  dueTotal: number;
  idempotencyKey: string | null;
  paymentToken?: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemResponse[];
  payments: PaymentResponse[];
}

export interface SalesListResponse {
  invoices: InvoiceResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const salesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSale: builder.mutation<
      { success: boolean; data: InvoiceResponse },
      { sale: CreateSaleInput; idempotencyKey?: string }
    >({
      query: ({ sale, idempotencyKey }) => ({
        url: '/sales',
        method: 'POST',
        body: sale,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
      }),
      invalidatesTags: ['Product', 'Stock', 'InventoryAlert'],
    }),

    getSaleById: builder.query<{ success: boolean; data: InvoiceResponse }, string>({
      query: (id) => `/sales/${id}`,
    }),

    getSales: builder.query<{ success: boolean; data: SalesListResponse }, QuerySaleInput>({
      query: (params) => ({
        url: '/sales',
        params,
      }),
    }),

    voidSale: builder.mutation<
      { success: boolean; data: InvoiceResponse },
      { id: string; body: VoidSaleInput }
    >({
      query: ({ id, body }) => ({
        url: `/sales/${id}/void`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Stock', 'InventoryAlert'],
    }),

    processReturn: builder.mutation<
      {
        success: boolean;
        message: string;
        data: {
          returnNumber: string;
          refundAmount: number;
          invoice: InvoiceResponse;
        };
      },
      {
        id: string;
        body: {
          items: Array<{ productId: string; quantity: number }>;
          reason: 'DAMAGED' | 'CHANGED_MIND' | 'WRONG_ITEM' | 'OTHER';
          refundMethod: 'CASH' | 'BKASH' | 'CREDIT_ADJUST';
          notes?: string;
          approvalPin?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/sales/${id}/return`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Stock', 'InventoryAlert'],
    }),

    getReturns: builder.query<
      {
        success: boolean;
        data: {
          returns: Array<{
            id: string;
            returnNumber: string;
            refundAmount: number;
            refundMethod: string;
            reason: string;
            notes: string | null;
            createdAt: string;
            invoice: {
              invoiceNumber: string;
              customer: { name: string; phone: string } | null;
            };
            items: Array<{
              id: string;
              quantity: number;
              unitPrice: number;
              lineTotal: number;
              product: { name: string; sku: string };
            }>;
          }>;
          total: number;
          page: number;
          totalPages: number;
        };
      },
      { page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/sales/returns/list',
        params,
      }),
    }),
  }),
});

export const {
  useCreateSaleMutation,
  useGetSaleByIdQuery,
  useGetSalesQuery,
  useVoidSaleMutation,
  useProcessReturnMutation,
  useGetReturnsQuery,
} = salesApi;

