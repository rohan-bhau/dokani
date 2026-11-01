import { baseApi } from './api';

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  businessType: string | null;
  paperSize: string;
  receiptFooter: string | null;
  showLogoOnInvoice: boolean;
  showBinOnInvoice: boolean;
  showBanglaOnInvoice: boolean;
  pricesIncludeVat: boolean;
  allowNegativeStock: boolean;
  maxCashierDiscount: number;
  returnApprovalLimit: number;
  defaultCreditLimit: number | null;
  overdueDays: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<{ success: boolean; data: TenantSettings }, void>({
      query: () => '/settings',
      providesTags: ['AuditLog'],
    }),

    updateSettings: builder.mutation<
      { success: boolean; message: string; data: TenantSettings },
      Partial<TenantSettings>
    >({
      query: (body) => ({
        url: '/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AuditLog'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
