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
  }),
});

export const { useInitiatePaymentMutation, useGetPaymentStatusQuery } = paymentApi;
