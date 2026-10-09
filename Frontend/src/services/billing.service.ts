import api from './core/axiosinstance';

export interface LineItem {
  description: string;
  amount: number;
}

export interface Transaction {
  id: number;
  amount: number;
  payment_method: string;
  reference_id: string;
  status: string;
  paid_by_name: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  flat_number: string;
  category: string;
  title: string;
  description: string;
  line_items: LineItem[];
  total_amount: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';
  created_at: string;
  transactions: Transaction[];
}

export const billingService = {
  getInvoices: async (params?: Record<string, any>): Promise<any> => {
    const response = await api.get('/billing/invoices/', { params });
    return response.data;
  },

  getInvoiceDetails: async (id: number): Promise<Invoice> => {
    const response = await api.get(`/billing/invoices/${id}/`);
    return response.data;
  },

  generateInvoice: async (payload: { flat_id: number, category: string, title: string, description: string, line_items: LineItem[] }): Promise<Invoice> => {
    const response = await api.post('/billing/invoices/', payload);
    return response.data;
  },

  processPayment: async (payload: { invoice_id: number, amount: number, payment_method: string, reference_id: string }): Promise<Transaction> => {
    const response = await api.post('/billing/transactions/', payload);
    return response.data;
  }
};
