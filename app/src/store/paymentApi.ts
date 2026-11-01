import type { InitiatePaymentInput } from '@dokani/shared';
import { baseApi } from './api';

export interface InitiatePaymentResponse {
  paymentId: string;
  provider: 'BKASH' | 'SSLCOMMERZ';
  providerRef: string;
  redirectUrl: string;
  amount: number;
}

export interface PaymentStatusResponse {
  paymentId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  amount: number;
  method: string;
  provider: string;
  reference: string | null;
  invoiceId: string | null;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<
      { success: boolean; data: InitiatePaymentResponse },
      InitiatePaymentInput
    >({
      query: (body) => ({
        url: '/payments/initiate',
        method: 'POST',
        body,
      }),
    }),

    getPaymentStatus: builder.query<
      { success: boolean; data: PaymentStatusResponse },
      string
    >({
      query: (id) => `/payments/${id}/status`,
    }),

    getPublicInvoice: builder.query<
      {
        success: boolean;
        data: {
          id: string;
          invoiceNumber: string;
          createdAt: string;
          status: string;
          subtotal: number;
          discount: number;
          vatTotal: number;
          total: number;
          paidTotal: number;
          dueTotal: number;
          tenant: {
            name: string;
            phone: string | null;
            logoUrl: string | null;
            receiptFooter: string | null;
          };
          customer: {
            name: string;
            phone: string;
          } | null;
          items: Array<{
            id: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
          }>;
        };
      },
      string
    >({
      query: (token) => `/payments/public/${token}`,
    }),

    completeSimulatedPayment: builder.mutation<
      {
        success: boolean;
        message: string;
        invoiceNumber: string;
        transactionId: string;
        amount: number;
      },
      {
        token: string;
        provider: 'BKASH' | 'SSLCOMMERZ';
        account?: string;
        pin?: string;
      }
    >({
      query: ({ token, ...body }) => ({
        url: `/payments/public/${token}/complete-simulated`,
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useGetPaymentStatusQuery,
  useGetPublicInvoiceQuery,
  useCompleteSimulatedPaymentMutation,
} = paymentApi;

