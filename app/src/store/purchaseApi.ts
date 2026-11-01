import { baseApi } from './api';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  payableBalance: number;
  openingPayable: number;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
}

export interface Purchase {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  totalCost: number;
  paidAmount: number;
  notes: string | null;
  createdAt: string;
  items: PurchaseItem[];
}

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      { success: boolean; data: { suppliers: Supplier[]; total: number } },
      { search?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/purchases/suppliers',
        params,
      }),
      providesTags: ['Product'],
    }),

    createSupplier: builder.mutation<
      { success: boolean; data: Supplier },
      { name: string; contactPerson?: string; phone: string; email?: string; address?: string; openingPayable?: number }
    >({
      query: (body) => ({
        url: '/purchases/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),

    getPurchases: builder.query<
      { success: boolean; data: { purchases: Purchase[]; total: number } },
      { supplierId?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/purchases',
        params,
      }),
      providesTags: ['Stock', 'Product'],
    }),

    createPurchase: builder.mutation<
      { success: boolean; data: Purchase },
      {
        supplierId: string;
        items: Array<{ productId: string; quantity: number; unitCost: number }>;
        paidAmount?: number;
        notes?: string;
      }
    >({
      query: (body) => ({
        url: '/purchases',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stock', 'Product', 'Report'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useGetPurchasesQuery,
  useCreatePurchaseMutation,
} = purchaseApi;
