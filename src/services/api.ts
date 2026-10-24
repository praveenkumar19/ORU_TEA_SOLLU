import { MenuItem } from '../data/menu';

export interface OrderCalculation {
  merchandiseSubtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  cgstRate: number;
  sgst: number;
  sgstRate: number;
  deliveryCharge: number;
  grandTotal: number;
  isDeliveryEligible: boolean;
  deliveryError?: string;
  earns50thMilestoneCoupon?: boolean;
  customerCompletedOrders?: number;
  appliedCoupon?: {
    code: string;
    discount: number;
    description: string;
  } | null;
  validatedItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
}

export interface PlacedOrder {
  id: string;
  orderCode: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  orderType: 'dine_in' | 'delivery';
  deliveryAddress?: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'upi';
  paymentStatus: 'pending' | 'paid';
  status: string;
  estimatedMinutes: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    lineTotal: number;
  }[];
  createdAt: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  min_subtotal: number;
  status: 'active' | 'redeemed' | 'expired';
  issued_at: string;
  expires_at: string;
}

export interface CustomerProfile {
  customer: {
    id: string;
    phone: string;
    name: string;
    created_at: string;
  };
  completedCount: number;
  totalSpent: number;
  orders: any[];
  coupons: CouponItem[];
  milestones: any[];
  addresses: any[];
}

export const api = {
  // Menu
  async getMenu(): Promise<MenuItem[]> {
    const res = await fetch('/api/menu');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.items.map((it: any) => ({
      id: it.id,
      name: it.name,
      tamilName: it.tamil_name,
      category: it.category,
      price: it.price,
      description: it.description,
      badge: it.badge,
      available: Boolean(it.available),
    }));
  },

  // Authoritative Calculation
  async calculateOrder(params: {
    items: { id: string; quantity: number }[];
    orderType: 'dine_in' | 'delivery';
    pincode?: string;
    couponCode?: string;
    customerPhone?: string;
  }): Promise<OrderCalculation> {
    const res = await fetch('/api/orders/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.calculation;
  },

  // Submit Order
  async placeOrder(params: {
    customerName: string;
    customerPhone: string;
    orderType: 'dine_in' | 'delivery';
    deliveryAddress?: {
      flatNo: string;
      street: string;
      landmark?: string;
      pincode: string;
      saveAsDefault?: boolean;
    };
    deliveryInstructions?: string;
    paymentMethod: 'cash' | 'upi';
    items: { id: string; quantity: number }[];
    couponCode?: string;
  }): Promise<PlacedOrder> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.order;
  },

  // Track Order Status
  async trackOrder(orderCode: string): Promise<any> {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/track`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.tracking;
  },

  // Get full order details with token
  async getOrder(orderCode: string, token?: string, phone?: string): Promise<any> {
    let url = `/api/orders/${encodeURIComponent(orderCode)}?`;
    if (token) url += `token=${encodeURIComponent(token)}&`;
    if (phone) url += `phone=${encodeURIComponent(phone)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.order;
  },

  // Auth: Customer login
  async loginCustomer(phone: string, name?: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.customer;
  },

  // Customer Profile
  async getCustomerProfile(phone: string): Promise<CustomerProfile> {
    const res = await fetch(`/api/customer/profile?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.profile;
  },

  // Admin APIs
  async getAdminOrders(passkey: string, status?: string, search?: string) {
    let url = `/api/admin/orders?passkey=${encodeURIComponent(passkey)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.orders;
  },

  async updateOrderStatus(passkey: string, orderId: string, status: string, rejectionReason?: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey, status, rejectionReason }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateOrderPayment(
    passkey: string,
    orderId: string,
    paymentStatus?: 'pending' | 'paid',
    paymentMethod?: 'cash' | 'upi'
  ) {
    const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey, paymentStatus, paymentMethod }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updatePaymentStatus(
    passkey: string,
    orderId: string,
    paymentStatus?: 'pending' | 'paid',
    paymentMethod?: 'cash' | 'upi'
  ) {
    return this.updateOrderPayment(passkey, orderId, paymentStatus, paymentMethod);
  },

  async updateCustomerPaymentMethod(
    orderCode: string,
    paymentMethod: 'cash' | 'upi',
    token?: string,
    phone?: string
  ) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/payment-method`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, token, phone }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async getAdminSettings() {
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async updateAdminSettings(passkey: string, payload: any) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey, ...payload }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  async verifyStaffPasskey(passkey: string): Promise<boolean> {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Access denied');
    return true;
  },

  async changeStaffPasskey(currentPasskey: string, newPasskey: string): Promise<string> {
    const res = await fetch('/api/admin/change-passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPasskey, newPasskey }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to change password');
    return data.message;
  },

  // 15. Analytics: Products sold, Total Amount, Profit/Loss, Monthly-wise
  async getAdminAnalytics(passkey: string, month?: string): Promise<AnalyticsData> {
    let url = `/api/admin/analytics?passkey=${encodeURIComponent(passkey)}`;
    if (month && month !== 'all') {
      url += `&month=${encodeURIComponent(month)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },

  // 16. Products CRUD
  async getAdminProducts(passkey: string): Promise<AdminProduct[]> {
    const res = await fetch(`/api/admin/products?passkey=${encodeURIComponent(passkey)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.products;
  },

  async saveAdminProduct(passkey: string, product: Partial<AdminProduct>): Promise<string> {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey, product }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.message;
  },

  async deleteAdminProduct(passkey: string, productId: string): Promise<string> {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}?passkey=${encodeURIComponent(passkey)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.message;
  },
};

export interface MonthlyAnalyticsItem {
  monthKey: string;
  monthLabel: string;
  ordersCount: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
  status: 'profit' | 'loss' | 'break_even';
}

export interface ProductAnalyticsItem {
  id: string;
  name: string;
  tamilName?: string;
  category: string;
  price: number;
  costPrice: number;
  available: boolean;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPct: number;
  status: 'profit' | 'loss' | 'break_even';
}

export interface AnalyticsData {
  selectedMonth: string;
  availableMonths: { key: string; label: string }[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    profitMarginPct: number;
    totalUnitsSold: number;
    totalOrders: number;
    averageOrderValue: number;
    status: 'profit' | 'loss' | 'break_even';
  };
  monthlyBreakdown: MonthlyAnalyticsItem[];
  productBreakdown: ProductAnalyticsItem[];
}

export interface AdminProduct {
  id: string;
  name: string;
  tamil_name?: string;
  category: string;
  price: number;
  cost_price?: number;
  description: string;
  badge?: string;
  available: number | boolean;
}

