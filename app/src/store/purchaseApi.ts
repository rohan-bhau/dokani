import { baseApi } from './api';

export interface Supplier {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  address: string | null;
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
  purchaseNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  subtotal: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  notes: string | null;
  createdAt: string;
  _count?: {
    items: number;
  };
  items?: PurchaseItem[];
}

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      { success: boolean; data: { items: Supplier[]; total: number; page: number; limit: number; totalPages: number } },
      { q?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/purchases/suppliers',
        params,
      }),
      providesTags: ['Product'],
    }),

    createSupplier: builder.mutation<
      { success: boolean; data: Supplier },
      { name: string; company?: string; phone: string; email?: string; address?: string; openingPayable?: number }
    >({
      query: (body) => ({
        url: '/purchases/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product'],
    }),

    getPurchases: builder.query<
      { success: boolean; data: { items: Purchase[]; total: number; page: number; limit: number; totalPages: number } },
      { supplierId?: string; status?: string; page?: number; limit?: number }
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
      invalidatesTags: ['Stock', 'Product', 'InventoryAlert', 'Report'],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useGetPurchasesQuery,
  useCreatePurchaseMutation,
} = purchaseApi;
