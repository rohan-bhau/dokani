import { baseApi } from './api';

export interface ReportSummaryResponse {
  period: {
    startDate: string | null;
    endDate: string | null;
  };
  sales: {
    totalInvoices: number;
    totalRevenue: number;
    totalVat?: number;
    totalDiscount?: number;
    cogs: number;
    grossProfit: number;
    tenderBreakdown: {
      CASH: number;
      BKASH: number;
      NAGAD: number;
      CARD: number;
      CREDIT_BAKI: number;
    };
  };
  inventory: {
    totalProducts: number;
    totalStockUnits: number;
    totalCostValuation: number;
    totalRetailValuation: number;
  };
  receivables: {
    totalOutstandingDue: number;
    totalCustomersWithDue: number;
  };
}

export interface TopProductResponse {
  productId: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface DuesAgingResponse {
  summary: {
    bucket0To30: number;
    bucket31To60: number;
    bucket61Plus: number;
    totalOutstanding: number;
  };
  customers: Array<{
    customerId: string;
    name: string;
    phone: string;
    dueBalance: number;
    oldestDueDays: number;
    bucket: '0_TO_30' | '31_TO_60' | '61_PLUS';
  }>;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportFilterQuery {
  startDate?: string;
  endDate?: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSummary: builder.query<ReportSummaryResponse, ReportFilterQuery | void>({
      query: (params) => ({
        url: '/reports/summary',
        params: params || {},
      }),
      transformResponse: (response: { success: boolean; data: ReportSummaryResponse }) => response.data,
      providesTags: ['Report'],
    }),
    getTopProducts: builder.query<TopProductResponse[], { limit?: number; startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/reports/top-products',
        params: params || {},
      }),
      transformResponse: (response: { success: boolean; data: TopProductResponse[] }) => response.data,
      providesTags: ['Report'],
    }),
    getDuesAging: builder.query<DuesAgingResponse, void>({
      query: () => '/reports/dues-aging',
      transformResponse: (response: { success: boolean; data: DuesAgingResponse }) => response.data,
      providesTags: ['Report', 'CustomerLedger'],
    }),
    getAuditLogs: builder.query<AuditLogsResponse, AuditLogQuery | void>({
      query: (params) => ({
        url: '/audit/logs',
        params: params || {},
      }),
      transformResponse: (response: { success: boolean; data: AuditLogsResponse }) => response.data,
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetSummaryQuery,
  useGetTopProductsQuery,
  useGetDuesAgingQuery,
  useGetAuditLogsQuery,
} = reportApi;
