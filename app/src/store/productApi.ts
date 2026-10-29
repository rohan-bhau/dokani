import type {
  CreateProductInput,
  QueryProductInput,
  StockAdjustmentInput,
  UpdateProductInput,
} from '@dokani/shared';
import { baseApi } from './api';

export interface ProductItem {
  id: string;
  tenantId: string;
  name: string;
  nameBn: string | null;
  sku: string;
  barcode: string | null;
  categoryId: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  vatRate: number;
  reorderLevel: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LowStockAlertItem {
  id: string;
  name: string;
  nameBn: string | null;
  sku: string;
  barcode: string | null;
  unit: string;
  reorderLevel: number;
  currentStock: number;
}

export interface CsvImportResult {
  importedCount: number;
  errors: Array<{
    row: number;
    errors: string[];
    data: Record<string, string>;
  }>;
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<{ success: boolean; data: ProductListResponse }, QueryProductInput>({
      query: (params) => ({
        url: '/products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.products.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProductById: builder.query<{ success: boolean; data: ProductItem }, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation<{ success: boolean; data: ProductItem }, CreateProductInput>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'InventoryAlert' }],
    }),

    updateProduct: builder.mutation<
      { success: boolean; data: ProductItem },
      { id: string; data: UpdateProductInput }
    >({
      query: ({ id, data }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        { type: 'InventoryAlert' },
      ],
    }),

    deleteProduct: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'InventoryAlert' }],
    }),

    importProductsCsv: builder.mutation<{ success: boolean; data: CsvImportResult }, { csvData: string }>({
      query: (body) => ({
        url: '/products/import-csv',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, { type: 'InventoryAlert' }],
    }),

    adjustStock: builder.mutation<{ success: boolean }, StockAdjustmentInput>({
      query: (body) => ({
        url: '/inventory/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { productId }) => [
        { type: 'Product', id: productId },
        { type: 'Product', id: 'LIST' },
        { type: 'Stock', id: productId },
        { type: 'InventoryAlert' },
      ],
    }),

    getLowStockAlerts: builder.query<{ success: boolean; data: LowStockAlertItem[] }, void>({
      query: () => '/inventory/alerts/low-stock',
      providesTags: [{ type: 'InventoryAlert' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useImportProductsCsvMutation,
  useAdjustStockMutation,
  useGetLowStockAlertsQuery,
} = productApi;
