import { baseApi } from './api';

export interface Plan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  maxProducts: number;
  maxUsers: number;
  maxInvoicesPerMonth: number;
}

export interface TenantSubscription {
  tenantId: string;
  plan: Plan;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: {
    productsCount: number;
    usersCount: number;
    invoicesThisMonth: number;
  };
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<{ success: boolean; data: Plan[] }, void>({
      query: () => '/billing/plans',
    }),

    getSubscription: builder.query<{ success: boolean; data: TenantSubscription }, void>({
      query: () => '/billing/subscription',
      providesTags: ['AuditLog'],
    }),

    subscribePlan: builder.mutation<
      { success: boolean; message: string },
      { planCode: string }
    >({
      query: (body) => ({
        url: '/billing/subscribe',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useSubscribePlanMutation,
} = billingApi;
