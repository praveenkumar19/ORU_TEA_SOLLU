import React, { useState, useEffect } from 'react';
import { api, PlacedOrder, AnalyticsData, AdminProduct } from '../services/api';
import {
  X,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Eye,
  EyeOff,
  LogOut,
  KeyRound,
  SlidersHorizontal,
  BarChart3,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Coffee,
  Check,
  Tag,
  Calendar,
  Package,
  Layers,
  Utensils,
  ChevronDown,
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBill: (order: PlacedOrder) => void;
  onMenuChanged?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onViewBill,
  onMenuChanged,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Authenticated state backed by sessionStorage (locks on session end)
  const [authenticatedPasskey, setAuthenticatedPasskey] = useState(
    () => sessionStorage.getItem('ots_staff_session') || ''
  );
  const [authError, setAuthError] = useState('');

  // Active Tab: 'orders' | 'analytics' | 'products' | 'delivery' | 'security'
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'products' | 'delivery' | 'security'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Delivery & Admin Settings State
  const [settings, setSettings] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Rejection modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Password change form state
  const [currentPasskeyInput, setCurrentPasskeyInput] = useState('');
  const [newPasskeyInput, setNewPasskeyInput] = useState('');
  const [confirmPasskeyInput, setConfirmPasskeyInput] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- ANALYTICS & MONTHLY PROFIT STATE ---
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState<string>('all');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsCategoryFilter, setAnalyticsCategoryFilter] = useState('all');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');

  // --- PRODUCTS MANAGEMENT (CRUD) STATE ---
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');

  // Add / Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    tamil_name: '',
    category: 'tea',
    price: 20,
    cost_price: 9,
    description: '',
    badge: '',
    available: true,
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState('');

  // Delete Confirmation state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<AdminProduct | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  const loadOrders = async (key: string) => {
    try {
      setIsLoadingOrders(true);
      const list = await api.getAdminOrders(key, statusFilter, searchQuery);
      setOrders(list);
      setIsLoadingOrders(false);
    } catch (err: any) {
      setIsLoadingOrders(false);
      setAuthError(err.message || 'Failed to load orders.');
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getAdminSettings();
      setSettings(data);
    } catch {
      // ignore
    }
  };

  const loadAnalytics = async (key: string, month: string = selectedAnalyticsMonth) => {
    try {
      setIsLoadingAnalytics(true);
      const data = await api.getAdminAnalytics(key, month);
      setAnalyticsData(data);
      setIsLoadingAnalytics(false);
    } catch (err: any) {
      setIsLoadingAnalytics(false);
    }
  };

  const loadProducts = async (key: string) => {
    try {
      setIsLoadingProducts(true);
      const data = await api.getAdminProducts(key);
      setProducts(data);
      setIsLoadingProducts(false);
    } catch (err: any) {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isOpen && authenticatedPasskey) {
      if (activeTab === 'orders') {
        loadOrders(authenticatedPasskey);
        loadSettings();
        const timer = setInterval(() => {
          loadOrders(authenticatedPasskey);
        }, 8000);
        return () => clearInterval(timer);
      } else if (activeTab === 'analytics') {
        loadAnalytics(authenticatedPasskey, selectedAnalyticsMonth);
      } else if (activeTab === 'products') {
        loadProducts(authenticatedPasskey);
      } else if (activeTab === 'delivery') {
        loadSettings();
      }
    }
  }, [isOpen, authenticatedPasskey, activeTab, statusFilter, searchQuery, selectedAnalyticsMonth]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const key = passkeyInput.trim();
    if (!key) {
      setAuthError('Please enter the staff access password.');
      return;
    }

    try {
      setIsVerifying(true);
      await api.verifyStaffPasskey(key);
      const orderList = await api.getAdminOrders(key);
      setAuthenticatedPasskey(key);
      sessionStorage.setItem('ots_staff_session', key);
      localStorage.removeItem('ots_staff_passkey');
      setOrders(orderList);
      loadSettings();
      setPasskeyInput('');
      setIsVerifying(false);
    } catch (err: any) {
      setIsVerifying(false);
      setAuthError(err.message || 'Access Denied: Incorrect staff password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ots_staff_session');
    localStorage.removeItem('ots_staff_passkey');
    setAuthenticatedPasskey('');
    setPasskeyInput('');
    setAuthError('');
    setActiveTab('orders');
  };

  const handleUpdateStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      await api.updateOrderStatus(authenticatedPasskey, orderId, status, reason);
      setActionNotice(`Order status changed to ${status.toUpperCase()}`);
      setTimeout(() => setActionNotice(''), 3000);
      loadOrders(authenticatedPasskey);
      if (rejectOrderId) {
        setRejectOrderId(null);
        setRejectionReason('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  const handleTogglePaymentStatus = async (order: any) => {
    const nextStatus = order.payment_status === 'paid' ? 'pending' : 'paid';
    try {
      await api.updatePaymentStatus(authenticatedPasskey, order.id, nextStatus, undefined);
      setActionNotice(`Payment marked as ${nextStatus.toUpperCase()}`);
      setTimeout(() => setActionNotice(''), 3000);
      loadOrders(authenticatedPasskey);
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setIsSavingSettings(true);
      await api.updateAdminSettings(authenticatedPasskey, {
        delivery: settings.delivery,
        upi: settings.admin,
      });
      setIsSavingSettings(false);
      setActionNotice('Cafe delivery and UPI settings saved.');
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err: any) {
      setIsSavingSettings(false);
      alert(err.message || 'Failed to save settings.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg(null);

    if (!currentPasskeyInput.trim()) {
      setPasswordChangeMsg({ text: 'Please enter your current staff password.', isError: true });
      return;
    }
    if (!newPasskeyInput.trim() || newPasskeyInput.trim().length < 4) {
      setPasswordChangeMsg({ text: 'New password must be at least 4 characters long.', isError: true });
      return;
    }
    if (newPasskeyInput.trim() !== confirmPasskeyInput.trim()) {
      setPasswordChangeMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const msg = await api.changeStaffPasskey(currentPasskeyInput.trim(), newPasskeyInput.trim());
      const newKey = newPasskeyInput.trim();
      setAuthenticatedPasskey(newKey);
      sessionStorage.setItem('ots_staff_session', newKey);
      setIsUpdatingPassword(false);
      setPasswordChangeMsg({ text: msg || 'Staff password changed successfully!', isError: false });
      setCurrentPasskeyInput('');
      setNewPasskeyInput('');
      setConfirmPasskeyInput('');
      setTimeout(() => setPasswordChangeMsg(null), 4000);
    } catch (err: any) {
      setIsUpdatingPassword(false);
      setPasswordChangeMsg({ text: err.message || 'Failed to change password.', isError: true });
    }
  };

  // --- PRODUCT MANAGEMENT ACTIONS ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: '',
      name: '',
      tamil_name: '',
      category: 'tea',
      price: 20,
      cost_price: 9,
      description: '',
      badge: '',
      available: true,
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setProductForm({
      id: prod.id,
      name: prod.name,
      tamil_name: prod.tamil_name || '',
      category: prod.category,
      price: prod.price,
      cost_price: prod.cost_price != null ? prod.cost_price : Math.round(prod.price * 0.45 * 10) / 10,
      description: prod.description || '',
      badge: prod.badge || '',
      available: Boolean(prod.available),
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');

    if (!productForm.name.trim()) {
      setProductFormError('Product name is required.');
      return;
    }
    if (productForm.price <= 0) {
      setProductFormError('Price must be greater than zero.');
      return;
    }

    try {
      setIsSavingProduct(true);
      const msg = await api.saveAdminProduct(authenticatedPasskey, {
        id: productForm.id || undefined,
        name: productForm.name.trim(),
        tamil_name: productForm.tamil_name.trim(),
        category: productForm.category,
        price: Number(productForm.price),
        cost_price: Number(productForm.cost_price),
        description: productForm.description.trim(),
        badge: productForm.badge.trim(),
        available: productForm.available ? 1 : 0,
      });

      setIsSavingProduct(false);
      setIsProductModalOpen(false);
      setActionNotice(msg || 'Product saved successfully.');
      setTimeout(() => setActionNotice(''), 3000);
      loadProducts(authenticatedPasskey);
      if (onMenuChanged) onMenuChanged();
    } catch (err: any) {
      setIsSavingProduct(false);
      setProductFormError(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      setIsDeletingProduct(true);
      const msg = await api.deleteAdminProduct(authenticatedPasskey, deleteConfirmProduct.id);
      setIsDeletingProduct(false);
      setDeleteConfirmProduct(null);
      setActionNotice(msg || 'Product deleted.');
      setTimeout(() => setActionNotice(''), 3000);
      loadProducts(authenticatedPasskey);
      if (onMenuChanged) onMenuChanged();
    } catch (err: any) {
      setIsDeletingProduct(false);
      alert(err.message || 'Failed to delete product.');
    }
  };

  const handleToggleProductAvailability = async (prod: AdminProduct) => {
    try {
      const nextAvailable = !Boolean(prod.available);
      await api.saveAdminProduct(authenticatedPasskey, {
        ...prod,
        available: nextAvailable ? 1 : 0,
      });
      setActionNotice(`"${prod.name}" marked as ${nextAvailable ? 'IN STOCK' : 'SOLD OUT'}`);
      setTimeout(() => setActionNotice(''), 2500);
      loadProducts(authenticatedPasskey);
      if (onMenuChanged) onMenuChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability.');
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesQuery =
      !productSearchQuery.trim() ||
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.tamil_name && p.tamil_name.includes(productSearchQuery)) ||
      p.id.toLowerCase().includes(productSearchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Filtered product analytics
  const filteredProductAnalytics = (analyticsData?.productBreakdown || []).filter((p) => {
    const matchesCat = analyticsCategoryFilter === 'all' || p.category === analyticsCategoryFilter;
    const matchesQuery =
      !analyticsSearchQuery.trim() ||
      p.name.toLowerCase().includes(analyticsSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(analyticsSearchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#151311] border border-[#C98242]/40 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF] my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-[#24150F] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#C98242]" />
            <div>
              <h2 className="text-lg font-bold font-serif-display text-[#FFF3DF]">
                Oru Tea Sollu! Staff Portal
              </h2>
              <span className="text-xs text-[#FFF3DF]/60">
                Ponmar Counter, Sales Analytics, Profit & Loss, and Menu Manager
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authenticatedPasskey && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded-lg text-xs text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Lock session and exit staff portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock & Logout</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!authenticatedPasskey ? (
          /* Staff Passkey Login Screen (Strictly Protected) */
          <div className="p-8 sm:p-12 max-w-md mx-auto text-center space-y-5 my-auto">
            <div className="w-16 h-16 bg-[#24150F] border border-[#C98242]/40 rounded-2xl flex items-center justify-center mx-auto text-[#C98242] shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-semibold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Restricted Access · Staff Only</span>
              </div>
              <h3 className="text-xl font-bold font-serif-display text-[#FFF3DF]">
                Staff Authentication
              </h3>
              <p className="text-xs text-[#FFF3DF]/70 leading-relaxed">
                Client access is restricted. Only authorized cafe staff and managers can enter this portal to view orders, sales analytics, monthly profit/loss, and manage products.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter staff password..."
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3 bg-[#24150F] border border-white/15 rounded-xl text-center text-sm font-mono tracking-wider text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:border-[#C98242] focus:outline-none focus:ring-1 focus:ring-[#C98242]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#FFF3DF]/50 hover:text-[#C98242] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authenticate & Access Portal</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-[11px] text-[#FFF3DF]/40">
              Session is encrypted & automatically locks on tab closure.
            </div>
          </div>
        ) : (
          /* Authenticated Staff Dashboard */
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Action Notice Toast */}
            {actionNotice && (
              <div className="p-3 bg-[#506B45]/30 border border-[#506B45]/50 rounded-xl text-xs text-[#8ec07c] flex items-center justify-between">
                <span>{actionNotice}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            {/* Dashboard Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Live Orders */}
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#C98242] text-[#151311] shadow-md'
                      : 'bg-[#24150F] text-[#FFF3DF]/70 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Live Orders ({orders.length})</span>
                </button>

                {/* 2. Sales & Profit Analytics */}
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-[#C98242] text-[#151311] shadow-md'
                      : 'bg-[#24150F] text-[#FFF3DF]/70 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Sales & Monthly Profit Analytics</span>
                </button>

                {/* 3. Products & Menu Manager */}
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-[#C98242] text-[#151311] shadow-md'
                      : 'bg-[#24150F] text-[#FFF3DF]/70 hover:text-white'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Product & Menu Manager</span>
                </button>

                {/* 4. Delivery & Pricing Settings */}
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'delivery'
                      ? 'bg-[#C98242] text-[#151311] shadow-md'
                      : 'bg-[#24150F] text-[#FFF3DF]/70 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Delivery & UPI</span>
                </button>

                {/* 5. Security & Password */}
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-[#C98242] text-[#151311] shadow-md'
                      : 'bg-[#24150F] text-[#FFF3DF]/70 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Password Security</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (activeTab === 'orders') loadOrders(authenticatedPasskey);
                    else if (activeTab === 'analytics') loadAnalytics(authenticatedPasskey);
                    else if (activeTab === 'products') loadProducts(authenticatedPasskey);
                    else loadSettings();
                  }}
                  className="p-2 bg-[#24150F] hover:bg-[#341e15] border border-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: ORDERS DASHBOARD */}
            {/* ======================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#24150F] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'placed', 'preparing', 'ready', 'delivered', 'cancelled'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-[#C98242] text-[#151311] font-bold shadow-sm'
                            : 'bg-[#151311] text-[#FFF3DF]/70 hover:text-white'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#FFF3DF]/40" />
                    <input
                      type="text"
                      placeholder="Search Order ID, Name, Phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:border-[#C98242] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Orders List */}
                {isLoadingOrders ? (
                  <div className="text-center py-12 text-xs text-[#FFF3DF]/60">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C98242]" />
                    <span>Loading real-time orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#FFF3DF]/60 bg-[#24150F]/50 rounded-2xl border border-white/5">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-[#C98242]/40" />
                    <p className="font-semibold text-[#FFF3DF]">No orders found matching criteria</p>
                    <p className="text-[11px] text-[#FFF3DF]/50 mt-1">
                      New customer orders placed from the website counter will appear here immediately.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-[#24150F] rounded-xl border border-white/5 hover:border-[#C98242]/30 transition-all space-y-3"
                      >
                        {/* Order Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#C98242]">
                              {ord.order_code}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                ord.order_type === 'dine_in'
                                  ? 'bg-[#506B45]/30 text-[#8ec07c]'
                                  : 'bg-[#E78B45]/20 text-[#E78B45]'
                              }`}
                            >
                              {ord.order_type === 'dine_in' ? 'Enjoy Here' : 'Doorstep Parcel'}
                            </span>
                            <span className="text-[11px] text-[#FFF3DF]/50">
                              {new Date(ord.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Payment Status Badge */}
                            <button
                              onClick={() => handleTogglePaymentStatus(ord)}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                                ord.payment_status === 'paid'
                                  ? 'bg-[#506B45]/30 text-[#8ec07c] hover:bg-[#506B45]/50'
                                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
                              }`}
                              title="Click to toggle Paid/Pending"
                            >
                              <span>{ord.payment_method?.toUpperCase()}</span>
                              <span>·</span>
                              <span>{ord.payment_status === 'paid' ? 'PAID ✓' : 'PENDING'}</span>
                            </button>

                            {/* View Bill Action */}
                            <button
                              onClick={() => onViewBill(ord)}
                              className="p-1.5 hover:bg-white/10 rounded text-[#FFF3DF]/70 hover:text-white cursor-pointer"
                              title="Print GST Bill Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#C98242]" />
                            </button>
                          </div>
                        </div>

                        {/* Customer & Items Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="font-semibold text-[#FFF3DF] flex items-center gap-1.5">
                              <span>{ord.customer_name}</span>
                              <span className="text-[#C98242] font-mono">({ord.customer_phone})</span>
                            </div>
                            {ord.delivery_address && (
                              <p className="text-[11px] text-[#FFF3DF]/60 mt-0.5 leading-relaxed">
                                📍 {ord.delivery_address}
                              </p>
                            )}
                          </div>

                          <div className="md:text-right">
                            <span className="text-[#FFF3DF]/70">Grand Total: </span>
                            <span className="font-mono font-bold text-sm text-[#E78B45]">
                              ₹{Number(ord.grand_total).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Items in Order */}
                        <div className="bg-[#151311] p-2.5 rounded-lg border border-white/5 text-xs space-y-1">
                          {ord.items?.map((it: any) => (
                            <div key={it.id} className="flex justify-between items-center text-[#FFF3DF]/80">
                              <span>
                                {it.quantity}x {it.product_name}
                              </span>
                              <span className="font-mono text-[#FFF3DF]/60">₹{it.line_total}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Status Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
                          <div className="text-xs text-[#FFF3DF]/60">
                            Current Status:{' '}
                            <span className="font-semibold text-[#C98242] uppercase">
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {ord.status === 'placed' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'confirmed')}
                                className="px-2.5 py-1 bg-[#506B45] hover:bg-[#628455] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Accept & Confirm
                              </button>
                            )}
                            {ord.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'preparing')}
                                className="px-2.5 py-1 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Start Brewing / Prep
                              </button>
                            )}
                            {ord.status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, ord.order_type === 'dine_in' ? 'ready' : 'out_for_delivery')}
                                className="px-2.5 py-1 bg-[#E78B45] hover:bg-[#ff9e56] text-[#151311] font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                {ord.order_type === 'dine_in' ? 'Ready for Counter Handoff' : 'Out for Delivery'}
                              </button>
                            )}
                            {(ord.status === 'ready' || ord.status === 'out_for_delivery') && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                                className="px-2.5 py-1 bg-[#506B45] hover:bg-[#628455] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Mark Delivered / Completed ✓
                              </button>
                            )}
                            {ord.status !== 'delivered' && ord.status !== 'cancelled' && ord.status !== 'rejected' && (
                              <button
                                onClick={() => setRejectOrderId(ord.id)}
                                className="px-2 py-1 bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                Reject / Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Rejection Prompt In-Place */}
                        {rejectOrderId === ord.id && (
                          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl space-y-2 mt-2">
                            <span className="text-xs text-red-200 font-semibold block">
                              Reason for Rejection / Cancellation:
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Sold out of fresh full-cream milk..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="flex-1 p-2 bg-[#151311] border border-red-800/50 rounded-lg text-xs text-red-200 focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'rejected', rejectionReason)}
                                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                              >
                                Confirm Reject
                              </button>
                              <button
                                onClick={() => setRejectOrderId(null)}
                                className="px-2 py-1.5 bg-transparent text-white/70 text-xs hover:text-white cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DATA ANALYSIS & MONTHLY PROFIT / LOSS */}
            {/* ======================================================== */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Analytics Control Bar with Month Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#24150F] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#C98242]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                        Sales, Cost & Monthly Profit/Loss Analytics
                      </h3>
                      <p className="text-[11px] text-[#FFF3DF]/60">
                        Real-time calculation of products sold, total sales revenue, production costs, and net margins.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#151311] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-[#C98242]" />
                      <span className="text-[#FFF3DF]/60">Filter Month:</span>
                      <select
                        value={selectedAnalyticsMonth}
                        onChange={(e) => {
                          setSelectedAnalyticsMonth(e.target.value);
                          loadAnalytics(authenticatedPasskey, e.target.value);
                        }}
                        className="bg-transparent text-[#FFF3DF] font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-[#151311] text-[#FFF3DF]">
                          All Months (Cumulative)
                        </option>
                        {analyticsData?.availableMonths.map((m) => (
                          <option key={m.key} value={m.key} className="bg-[#151311] text-[#FFF3DF]">
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {isLoadingAnalytics ? (
                  <div className="text-center py-16 text-xs text-[#FFF3DF]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C98242]" />
                    <span>Crunching sales data, costs and profit margins...</span>
                  </div>
                ) : analyticsData ? (
                  <>
                    {/* 4 Overarching Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Card 1: Total Revenue / Amount */}
                      <div className="p-4 bg-[#24150F] rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#FFF3DF]/70">
                          <span>Total Sales Revenue</span>
                          <div className="p-1.5 bg-[#C98242]/20 rounded-lg text-[#C98242]">
                            <IndianRupee className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-mono text-[#FFF3DF]">
                          ₹{analyticsData.summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#C98242] flex items-center justify-between pt-1 border-t border-white/5">
                          <span>Avg Order Value:</span>
                          <span className="font-mono font-bold">₹{analyticsData.summary.averageOrderValue.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Card 2: Total Products Sold (Units) */}
                      <div className="p-4 bg-[#24150F] rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#FFF3DF]/70">
                          <span>Total Products Sold</span>
                          <div className="p-1.5 bg-[#E78B45]/20 rounded-lg text-[#E78B45]">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-mono text-[#FFF3DF]">
                          {analyticsData.summary.totalUnitsSold.toLocaleString('en-IN')}{' '}
                          <span className="text-sm font-normal text-[#FFF3DF]/60">Units</span>
                        </div>
                        <div className="text-[11px] text-[#FFF3DF]/60 flex items-center justify-between pt-1 border-t border-white/5">
                          <span>Completed Orders:</span>
                          <span className="font-mono font-bold text-[#FFF3DF]">{analyticsData.summary.totalOrders}</span>
                        </div>
                      </div>

                      {/* Card 3: Total Cost (COGS) */}
                      <div className="p-4 bg-[#24150F] rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs text-[#FFF3DF]/70">
                          <span>Estimated Cost of Goods</span>
                          <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
                            <Package className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-mono text-[#FFF3DF]">
                          ₹{analyticsData.summary.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-[#FFF3DF]/60 flex items-center justify-between pt-1 border-t border-white/5">
                          <span>Cost Ratio:</span>
                          <span className="font-mono font-bold text-[#FFF3DF]">
                            {analyticsData.summary.totalRevenue > 0
                              ? ((analyticsData.summary.totalCost / analyticsData.summary.totalRevenue) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Card 4: Net Profit or Loss */}
                      <div
                        className={`p-4 rounded-2xl border space-y-2 ${
                          analyticsData.summary.totalProfit >= 0
                            ? 'bg-[#1a2416] border-[#506B45]/50'
                            : 'bg-red-950/40 border-red-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={analyticsData.summary.totalProfit >= 0 ? 'text-[#8ec07c]' : 'text-red-300'}>
                            {analyticsData.summary.totalProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                          </span>
                          <div
                            className={`p-1.5 rounded-lg ${
                              analyticsData.summary.totalProfit >= 0
                                ? 'bg-[#506B45]/30 text-[#8ec07c]'
                                : 'bg-red-800/30 text-red-300'
                            }`}
                          >
                            {analyticsData.summary.totalProfit >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                        <div
                          className={`text-2xl font-bold font-mono ${
                            analyticsData.summary.totalProfit >= 0 ? 'text-[#8ec07c]' : 'text-red-400'
                          }`}
                        >
                          {analyticsData.summary.totalProfit >= 0 ? '+' : '-'}₹
                          {Math.abs(analyticsData.summary.totalProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] flex items-center justify-between pt-1 border-t border-white/10">
                          <span className="text-[#FFF3DF]/60">Net Profit Margin:</span>
                          <span
                            className={`font-mono font-bold ${
                              analyticsData.summary.totalProfit >= 0 ? 'text-[#8ec07c]' : 'text-red-400'
                            }`}
                          >
                            {analyticsData.summary.profitMarginPct}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section A: Monthly-Wise Profit & Loss Analysis */}
                    <div className="p-5 bg-[#24150F] rounded-2xl border border-white/10 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#C98242]" />
                          <h4 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                            Monthly Profit & Loss Breakdown
                          </h4>
                        </div>
                        <span className="text-[11px] text-[#FFF3DF]/50">
                          Click any month to inspect product-level sales for that month
                        </span>
                      </div>

                      {analyticsData.monthlyBreakdown.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#FFF3DF]/60">
                          No monthly order history recorded yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {analyticsData.monthlyBreakdown.map((m) => (
                            <div
                              key={m.monthKey}
                              onClick={() => {
                                setSelectedAnalyticsMonth(m.monthKey);
                                loadAnalytics(authenticatedPasskey, m.monthKey);
                              }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                selectedAnalyticsMonth === m.monthKey
                                  ? 'bg-[#151311] border-[#C98242] shadow-lg ring-1 ring-[#C98242]'
                                  : 'bg-[#1a1410] border-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-[#FFF3DF]">{m.monthLabel}</span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    m.status === 'profit'
                                      ? 'bg-[#506B45]/30 text-[#8ec07c]'
                                      : 'bg-red-950/50 text-red-300'
                                  }`}
                                >
                                  {m.status === 'profit' ? `+${m.marginPct}% Profit` : 'Loss'}
                                </span>
                              </div>

                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-[#FFF3DF]/70">
                                  <span>Revenue:</span>
                                  <span className="font-mono text-[#FFF3DF]">₹{m.revenue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[#FFF3DF]/70">
                                  <span>COGS (Cost):</span>
                                  <span className="font-mono text-[#FFF3DF]/60">₹{m.cost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-1 border-t border-white/5">
                                  <span className={m.profit >= 0 ? 'text-[#8ec07c]' : 'text-red-400'}>
                                    Net Profit:
                                  </span>
                                  <span className={`font-mono ${m.profit >= 0 ? 'text-[#8ec07c]' : 'text-red-400'}`}>
                                    {m.profit >= 0 ? '+' : '-'}₹{Math.abs(m.profit).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-[11px] text-[#FFF3DF]/50 pt-1">
                                  <span>{m.ordersCount} Orders</span>
                                  <span>{m.unitsSold} Units Sold</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section B: Product-by-Product Sales & Profit Performance */}
                    <div className="p-5 bg-[#24150F] rounded-2xl border border-white/10 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-[#C98242]" />
                            <h4 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                              Product Sales Volume & Profit Per Item
                            </h4>
                          </div>
                          <span className="text-[11px] text-[#FFF3DF]/60">
                            Showing {filteredProductAnalytics.length} products for{' '}
                            <strong className="text-[#C98242]">
                              {selectedAnalyticsMonth === 'all'
                                ? 'All Months (Cumulative)'
                                : analyticsData.availableMonths.find((m) => m.key === selectedAnalyticsMonth)?.label || selectedAnalyticsMonth}
                            </strong>
                          </span>
                        </div>

                        {/* Search & Category Filter */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          <select
                            value={analyticsCategoryFilter}
                            onChange={(e) => setAnalyticsCategoryFilter(e.target.value)}
                            className="bg-[#151311] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none cursor-pointer"
                          >
                            <option value="all">All Categories</option>
                            <option value="tea">Signature Teas</option>
                            <option value="coffee">Coffee & Chilled</option>
                            <option value="snacks">Hot Snacks</option>
                            <option value="bites">Tea-Time Bites</option>
                          </select>

                          <div className="relative flex-1 sm:w-48">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#FFF3DF]/40" />
                            <input
                              type="text"
                              placeholder="Search product..."
                              value={analyticsSearchQuery}
                              onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:border-[#C98242] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product Analytics Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-[#FFF3DF]/60 text-[11px]">
                              <th className="py-2.5 px-3">Product</th>
                              <th className="py-2.5 px-3 text-right">Units Sold</th>
                              <th className="py-2.5 px-3 text-right">Price / Cost</th>
                              <th className="py-2.5 px-3 text-right">Revenue (₹)</th>
                              <th className="py-2.5 px-3 text-right">Total Cost (₹)</th>
                              <th className="py-2.5 px-3 text-right">Net Profit (₹)</th>
                              <th className="py-2.5 px-3 text-right">Margin %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-mono">
                            {filteredProductAnalytics.map((prod) => (
                              <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 px-3 font-sans">
                                  <div className="font-semibold text-[#FFF3DF] flex items-center gap-1.5">
                                    <span>{prod.name}</span>
                                    {prod.unitsSold > 10 && (
                                      <span className="text-[9px] bg-[#C98242]/20 text-[#C98242] px-1.5 py-0.2 rounded font-semibold uppercase">
                                        Top Seller
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-[#FFF3DF]/50 uppercase tracking-wider">
                                    {prod.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-bold text-sm text-[#FFF3DF]">{prod.unitsSold}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right text-[11px] text-[#FFF3DF]/70">
                                  <span>₹{prod.price}</span> /{' '}
                                  <span className="text-[#FFF3DF]/40">₹{prod.costPrice}</span>
                                </td>
                                <td className="py-2.5 px-3 text-right text-[#FFF3DF] font-bold">
                                  ₹{prod.totalRevenue.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-[#FFF3DF]/60">
                                  ₹{prod.totalCost.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`font-bold ${prod.profit >= 0 ? 'text-[#8ec07c]' : 'text-red-400'}`}>
                                    {prod.profit >= 0 ? '+' : '-'}₹{Math.abs(prod.profit).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      prod.marginPct >= 50
                                        ? 'bg-[#506B45]/30 text-[#8ec07c]'
                                        : prod.marginPct > 0
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-red-950/40 text-red-300'
                                    }`}
                                  >
                                    {prod.marginPct}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: PRODUCT & MENU MANAGER (CRUD) */}
            {/* ======================================================== */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Product Manager Control Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#24150F] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-[#C98242]" />
                    <div>
                      <h3 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                        Cafe Menu & Product Editor
                      </h3>
                      <p className="text-[11px] text-[#FFF3DF]/60">
                        Add new products, edit names, update selling prices and unit costs, or remove items from the live cafe menu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-[#24150F]/70 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'tea', 'coffee', 'snacks', 'bites'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setProductCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all cursor-pointer ${
                          productCategoryFilter === cat
                            ? 'bg-[#C98242] text-[#151311] font-bold shadow-sm'
                            : 'bg-[#151311] text-[#FFF3DF]/70 hover:text-white'
                        }`}
                      >
                        {cat === 'all' ? 'All Items' : cat === 'tea' ? 'Teas' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#FFF3DF]/40" />
                    <input
                      type="text"
                      placeholder="Search by name, tamil name, ID..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:border-[#C98242] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                {isLoadingProducts ? (
                  <div className="text-center py-16 text-xs text-[#FFF3DF]/60">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C98242]" />
                    <span>Loading products from database...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-xs text-[#FFF3DF]/60 bg-[#24150F]/50 rounded-2xl border border-white/5">
                    <Coffee className="w-8 h-8 mx-auto mb-2 text-[#C98242]/40" />
                    <p className="font-semibold text-[#FFF3DF]">No products found</p>
                    <button
                      onClick={handleOpenAddProduct}
                      className="mt-3 px-3 py-1.5 bg-[#C98242] text-[#151311] font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Add First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProducts.map((p) => {
                      const cost = p.cost_price != null ? p.cost_price : Math.round(p.price * 0.45 * 10) / 10;
                      const unitProfit = Math.round((p.price - cost) * 100) / 100;
                      const marginPct = p.price > 0 ? Math.round(((unitProfit / p.price) * 100) * 10) / 10 : 0;
                      const isAvail = Boolean(p.available);

                      return (
                        <div
                          key={p.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                            isAvail
                              ? 'bg-[#24150F] border-white/10 hover:border-[#C98242]/40'
                              : 'bg-[#1a1410] border-white/5 opacity-65'
                          }`}
                        >
                          <div>
                            {/* Category & Badge */}
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] text-[#C98242] uppercase font-mono font-bold px-2 py-0.5 bg-[#151311] rounded">
                                {p.category}
                              </span>
                              {p.badge && (
                                <span className="text-[10px] bg-[#506B45]/30 text-[#8ec07c] font-semibold px-2 py-0.5 rounded">
                                  {p.badge}
                                </span>
                              )}
                            </div>

                            {/* Product Name & Tamil Name */}
                            <h4 className="text-sm font-bold text-[#FFF3DF] leading-snug">
                              {p.name}
                            </h4>
                            {p.tamil_name && (
                              <span className="text-xs text-[#FFF3DF]/50 block">
                                {p.tamil_name}
                              </span>
                            )}

                            {p.description && (
                              <p className="text-xs text-[#FFF3DF]/70 mt-1 line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-white/5 space-y-2">
                            {/* Price, Cost & Unit Profit breakdown */}
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[#FFF3DF]/60 text-[11px] block">Selling Price:</span>
                                <span className="font-mono font-bold text-sm text-[#E78B45]">
                                  ₹{p.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#FFF3DF]/60 text-[11px] block">Unit Cost:</span>
                                <span className="font-mono text-xs text-[#FFF3DF]/70">
                                  ₹{cost.toFixed(2)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#8ec07c] text-[11px] block">Unit Profit:</span>
                                <span className="font-mono font-semibold text-xs text-[#8ec07c]">
                                  +₹{unitProfit.toFixed(2)} ({marginPct}%)
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons: Availability, Edit, Delete */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                              <button
                                onClick={() => handleToggleProductAvailability(p)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                  isAvail
                                    ? 'bg-[#506B45]/30 text-[#8ec07c] hover:bg-[#506B45]/50'
                                    : 'bg-red-950/40 text-red-300 hover:bg-red-900/50'
                                }`}
                              >
                                {isAvail ? 'In Stock ✓' : 'Sold Out ✕'}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1.5 bg-[#151311] hover:bg-[#2e1b13] border border-white/10 rounded text-[#FFF3DF]/80 hover:text-[#C98242] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                                  title="Edit Product Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmProduct(p)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: DELIVERY & PRICING SETTINGS */}
            {/* ======================================================== */}
            {activeTab === 'delivery' && settings && (
              <form onSubmit={handleSaveSettings} className="max-w-xl space-y-6">
                <div className="p-6 bg-[#24150F] rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <SlidersHorizontal className="w-5 h-5 text-[#C98242]" />
                    <h4 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                      Delivery Pricing & Coverage Thresholds
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Base Delivery Charge (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settings.delivery.base_fee}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            delivery: { ...settings.delivery, base_fee: Number(e.target.value) },
                          })
                        }
                        className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Free Delivery Threshold (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settings.delivery.free_threshold}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            delivery: { ...settings.delivery, free_threshold: Number(e.target.value) },
                          })
                        }
                        className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Minimum Order for Delivery (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settings.delivery.min_order}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            delivery: { ...settings.delivery, min_order: Number(e.target.value) },
                          })
                        }
                        className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Est. Delivery Time (Minutes)
                      </label>
                      <input
                        type="number"
                        min={5}
                        value={settings.delivery.estimated_time_mins}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            delivery: { ...settings.delivery, estimated_time_mins: Number(e.target.value) },
                          })
                        }
                        className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Eligible PIN Codes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={settings.delivery.eligible_pincodes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          delivery: { ...settings.delivery, eligible_pincodes: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                    />
                    <span className="text-[10px] text-[#FFF3DF]/50 mt-1 block">
                      Orders outside these PIN codes will be politely notified before checkout.
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Cafe UPI ID for Delivery QR / Verification
                    </label>
                    <input
                      type="text"
                      value={settings.admin?.upi_vpa || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          admin: { ...settings.admin, upi_vpa: e.target.value },
                        })
                      }
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-5 py-2.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB 5: SECURITY & PASSWORD SETTINGS */}
            {/* ======================================================== */}
            {activeTab === 'security' && (
              <div className="max-w-xl space-y-6">
                <form onSubmit={handleChangePassword} className="p-6 bg-[#24150F] rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                    <KeyRound className="w-5 h-5 text-[#C98242]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#FFF3DF] font-serif-display">
                        Change Staff Portal Password
                      </h4>
                      <p className="text-[11px] text-[#FFF3DF]/60">
                        Set a secure custom password so clients and outsiders cannot access counter billing and orders.
                      </p>
                    </div>
                  </div>

                  {passwordChangeMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        passwordChangeMsg.isError
                          ? 'bg-red-950/40 border border-red-800/40 text-red-300'
                          : 'bg-[#506B45]/30 border border-[#506B45]/50 text-[#8ec07c]'
                      }`}
                    >
                      {passwordChangeMsg.isError ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      )}
                      <span>{passwordChangeMsg.text}</span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Current Staff Password:
                      </label>
                      <input
                        type="password"
                        placeholder="Enter current password..."
                        value={currentPasskeyInput}
                        onChange={(e) => setCurrentPasskeyInput(e.target.value)}
                        className="w-full p-2.5 bg-[#151311] border border-white/10 rounded-xl text-xs font-mono text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        New Staff Password (minimum 4 characters):
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new strong password..."
                        value={newPasskeyInput}
                        onChange={(e) => setNewPasskeyInput(e.target.value)}
                        className="w-full p-2.5 bg-[#151311] border border-white/10 rounded-xl text-xs font-mono text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                        Confirm New Password:
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new password..."
                        value={confirmPasskeyInput}
                        onChange={(e) => setConfirmPasskeyInput(e.target.value)}
                        className="w-full p-2.5 bg-[#151311] border border-white/10 rounded-xl text-xs font-mono text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-5 py-2.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Update Staff Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Session Security Best Practices Card */}
                <div className="p-4 bg-[#151311] border border-white/10 rounded-2xl text-xs text-[#FFF3DF]/70 space-y-2">
                  <h5 className="font-semibold text-[#FFF3DF] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C98242]" />
                    <span>Staff Portal Security Protocol</span>
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-[#FFF3DF]/60">
                    <li>Clients and customers browsing on mobile/desktop cannot view this portal.</li>
                    <li>Always click <strong>Lock & Logout</strong> when leaving the counter tablet or computer unattended.</li>
                    <li>If password is changed, notify current staff members on duty immediately.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ADD / EDIT PRODUCT MODAL (SUB-MODAL) */}
        {/* ======================================================== */}
        {isProductModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg bg-[#151311] border border-[#C98242]/40 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF]">
              <div className="p-4 bg-[#24150F] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#C98242]" />
                  <h3 className="text-sm font-bold font-serif-display text-[#FFF3DF]">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Product'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                {productFormError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{productFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masala Spiced Chai"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Tamil Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. மசாலா டீ"
                      value={productForm.tamil_name}
                      onChange={(e) => setProductForm({ ...productForm, tamil_name: e.target.value })}
                      className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none cursor-pointer"
                    >
                      <option value="tea">Signature Teas</option>
                      <option value="coffee">Coffee & Chilled</option>
                      <option value="snacks">Hot Snacks</option>
                      <option value="bites">Tea-Time Bites</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Selling Price (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={0.5}
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs font-mono font-bold text-[#E78B45] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Unit Cost (₹) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      required
                      value={productForm.cost_price}
                      onChange={(e) => setProductForm({ ...productForm, cost_price: Number(e.target.value) })}
                      className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs font-mono text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-[#24150F] rounded-lg border border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-[#FFF3DF]/60">Expected Profit per unit:</span>
                  <span className="font-mono font-bold text-[#8ec07c]">
                    +₹{(productForm.price - productForm.cost_price).toFixed(2)} (
                    {productForm.price > 0
                      ? (((productForm.price - productForm.cost_price) / productForm.price) * 100).toFixed(1)
                      : 0}
                    % Margin)
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                    Badge Label (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bestseller, Must Try, New Launch, Evening Hot"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short description of ingredients, aroma, and taste profile..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="productAvailableCheck"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                    className="rounded border-white/20 bg-[#24150F] text-[#C98242] focus:ring-[#C98242] cursor-pointer"
                  />
                  <label htmlFor="productAvailableCheck" className="text-xs text-[#FFF3DF] cursor-pointer">
                    Available in Stock for customers to order
                  </label>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-3.5 py-2 bg-transparent hover:bg-white/10 rounded-xl text-xs text-[#FFF3DF]/70 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingProduct ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DELETE CONFIRMATION DIALOG */}
        {/* ======================================================== */}
        {deleteConfirmProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-sm bg-[#151311] border border-red-800/50 rounded-2xl p-5 shadow-2xl text-[#FFF3DF] space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-950/60 text-red-400 rounded-xl border border-red-800/50">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-serif-display text-white">
                    Delete Product?
                  </h4>
                  <p className="text-xs text-red-200">
                    Are you sure you want to delete <strong>"{deleteConfirmProduct.name}"</strong>?
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[#FFF3DF]/60 leading-relaxed">
                This will permanently remove the item from the customer menu and order tray. This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmProduct(null)}
                  className="px-3.5 py-2 bg-[#24150F] hover:bg-[#341e15] rounded-xl text-xs text-[#FFF3DF]/70 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingProduct}
                  onClick={handleDeleteProduct}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeletingProduct ? 'Deleting...' : 'Yes, Delete Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
