import { baseApi } from './api';

export interface Expense {
  id: string;
  category: 'RENT' | 'UTILITIES' | 'SALARY' | 'SUPPLIES' | 'MAINTENANCE' | 'TRANSPORT' | 'OTHER';
  amount: number;
  spentOn: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<
      { success: boolean; data: ExpenseListResponse },
      { category?: string; page?: number; limit?: number; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/expenses',
        params,
      }),
      providesTags: ['Report'],
    }),

    createExpense: builder.mutation<
      { success: boolean; data: Expense },
      { category: string; amount: number; spentOn: string; notes?: string }
    >({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Report'],
    }),

    deleteExpense: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Report'],
    }),
  }),
});

export const {
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;
