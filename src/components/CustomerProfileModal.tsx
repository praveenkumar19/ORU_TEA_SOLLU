import React, { useState, useEffect } from 'react';
import { api, CustomerProfile, PlacedOrder } from '../services/api';
import { X, User, Phone, ShoppingBag, Tag, Award, Clock, MapPin, CheckCircle2, LogOut, Printer, Edit2, Check, Plus, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomerPhone: string;
  onLoginSuccess: (phone: string, name: string) => void;
  onLogout: () => void;
  onTrackOrder: (orderCode: string) => void;
  onViewBill: (order: PlacedOrder) => void;
  onApplyCouponToCart?: (couponCode: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  activeCustomerPhone,
  onLoginSuccess,
  onLogout,
  onTrackOrder,
  onViewBill,
  onApplyCouponToCart,
}) => {
  const [phoneInput, setPhoneInput] = useState(activeCustomerPhone || '');
  const [nameInput, setNameInput] = useState('');
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthMode, setIsAuthMode] = useState(!activeCustomerPhone);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const fetchProfile = async (phone: string) => {
    if (!phone) {
      setIsAuthMode(true);
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const p = await api.getCustomerProfile(phone);
      setProfile(p);
      setEditedName(p.customer.name);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Could not load profile. Please sign in again.');
      setIsLoading(false);
      setIsAuthMode(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeCustomerPhone) {
        setPhoneInput(activeCustomerPhone);
        setIsAuthMode(false);
        fetchProfile(activeCustomerPhone);
      } else {
        setIsAuthMode(true);
        setProfile(null);
      }
    }
  }, [isOpen, activeCustomerPhone]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    try {
      setIsLoading(true);
      const cust = await api.loginCustomer(clean, nameInput.trim() || undefined);
      onLoginSuccess(cust.phone, cust.name);
      setIsAuthMode(false);
      await fetchProfile(cust.phone);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your phone number.');
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !profile) return;
    try {
      setIsSavingName(true);
      const updated = await api.loginCustomer(profile.customer.phone, editedName.trim());
      onLoginSuccess(updated.phone, updated.name);
      setProfile((prev) =>
        prev ? { ...prev, customer: { ...prev.customer, name: updated.name } } : null
      );
      setIsEditingName(false);
      setIsSavingName(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update name.');
      setIsSavingName(false);
    }
  };

  const completedCount = profile?.completedCount || 0;
  const progressPercent = Math.min(100, Math.round((completedCount / 50) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#151311] border border-[#C98242]/30 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF] my-8">
        {/* Header */}
        <div className="p-5 bg-[#24150F] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#C98242]" />
            <h2 className="text-lg font-bold font-serif-display text-[#FFF3DF]">
              {isAuthMode ? 'Customer Sign In / Register' : 'My Oru Tea Sollu! Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {isAuthMode ? (
            /* Sign In / Register Screen */
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto py-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#24150F] border border-[#C98242]/30 rounded-full flex items-center justify-center mx-auto mb-3 text-[#C98242]">
                  <Phone className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif-display text-[#FFF3DF]">
                  Enter Your Phone Number
                </h3>
                <p className="text-xs text-[#FFF3DF]/70 mt-1">
                  Sign in or register in seconds. Access your order history, track live deliveries, and view 50th milestone coupons.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#FFF3DF]/80 mb-1">
                  Mobile Number (10 Digits) <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#24150F] border border-r-0 border-white/10 rounded-l-xl text-xs text-[#FFF3DF]/70">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9094392300"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full p-2.5 bg-[#24150F] border border-white/10 rounded-r-xl text-xs font-mono text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#FFF3DF]/80 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vignesh Kumar"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2.5 bg-[#24150F] border border-white/10 rounded-xl text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Access My Profile</span>
                )}
              </button>

              <p className="text-[11px] text-center text-[#FFF3DF]/50 mt-2">
                No passwords required. Your phone number is your secure cafe account identifier.
              </p>
            </form>
          ) : isLoading ? (
            /* Loading State */
            <div className="text-center py-16 text-xs text-[#FFF3DF]/60 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C98242]" />
              <p>Loading your profile and order history...</p>
            </div>
          ) : error && !profile ? (
            /* Error Fallback (Never empty!) */
            <div className="text-center py-12 space-y-4">
              <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 max-w-md mx-auto">
                <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                <p>{error}</p>
              </div>
              <button
                onClick={() => {
                  setIsAuthMode(true);
                  setError('');
                }}
                className="px-4 py-2 bg-[#C98242] text-[#151311] font-semibold text-xs rounded-xl"
              >
                Sign In with Phone
              </button>
            </div>
          ) : profile ? (
            /* Logged-In Profile View */
            <div className="space-y-6">
              {/* Profile Top Bar */}
              <div className="p-5 bg-[#24150F] rounded-2xl border border-[#C98242]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="px-2 py-1 bg-[#151311] border border-white/20 rounded text-sm text-[#FFF3DF] font-bold"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName}
                        className="p-1.5 bg-[#C98242] text-[#151311] rounded text-xs"
                        title="Save Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 bg-white/10 text-white rounded text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-serif-display text-[#FFF3DF]">
                        {profile.customer.name}
                      </h3>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-[#FFF3DF]/50 hover:text-[#C98242] transition-colors"
                        title="Edit Name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#FFF3DF]/70 mt-1 font-mono">
                    <span>+91 {profile.customer.phone}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#C98242]">
                      Member since {new Date(profile.customer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block text-xs text-[#FFF3DF]/60">Completed Orders</span>
                    <span className="text-lg font-bold font-mono text-[#E78B45]">
                      {profile.completedCount}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsAuthMode(true);
                      setProfile(null);
                    }}
                    className="p-2 bg-[#151311] hover:bg-black rounded-xl border border-white/10 text-xs text-[#FFF3DF]/60 hover:text-white"
                    title="Sign Out / Switch Phone"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LOYALTY MILESTONE TRACKER: 50th Order Milestone Focus */}
              <div className="p-5 bg-[#24150F] rounded-2xl border border-[#C98242]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C98242]">
                    <Award className="w-4 h-4" />
                    <span>Loyalty Progress: 50th Order VIP Milestone</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FFF3DF]">
                    {completedCount} / 50 Orders
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#151311] h-3 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-[#C98242] to-[#E78B45] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#FFF3DF]/70">
                  <span>
                    Reward: Exclusive VIP 50th Order Coupon Code (₹50 OFF on orders &gt; ₹200)
                  </span>
                  <span className="text-[#E78B45] font-semibold">
                    {50 - completedCount > 0
                      ? `${50 - completedCount} orders away`
                      : '50th Milestone Unlocked!'}
                  </span>
                </div>
              </div>

              {/* ACTIVE & UNLOCKED COUPONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242] flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span>My Coupons ({profile.coupons.filter((c) => c.status === 'active').length} Active)</span>
                  </h4>
                  <span className="text-[11px] text-[#FFF3DF]/50">
                    Awarded exclusively upon crossing 50th order above ₹200
                  </span>
                </div>

                {profile.coupons.length === 0 ? (
                  <div className="p-4 bg-[#24150F]/50 rounded-xl border border-white/5 text-center text-xs text-[#FFF3DF]/60">
                    No active coupons. Coupon codes are unlocked exclusively when your loyalty progress crosses the 50th order with an order above ₹200!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.coupons.map((c) => {
                      const isActive = c.status === 'active';
                      const expiresDate = new Date(c.expires_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });

                      return (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-[#24150F] border-[#C98242]/40 hover:border-[#C98242]'
                              : 'bg-[#1a1410] border-white/5 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono font-bold text-sm text-[#E78B45]">
                              {c.code}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isActive
                                  ? 'bg-[#506B45] text-white'
                                  : 'bg-white/10 text-white/50'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>

                          <p className="text-xs text-[#FFF3DF] font-semibold">
                            ₹{c.discount_value} OFF your next break
                          </p>

                          <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#FFF3DF]/60">
                            <span>Expires: {expiresDate} IST</span>
                            {isActive && onApplyCouponToCart && (
                              <button
                                onClick={() => {
                                  onApplyCouponToCart(c.code);
                                  onClose();
                                }}
                                className="text-[#C98242] hover:text-white font-medium"
                              >
                                Use Now
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ORDER HISTORY */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Order History ({profile.orders.length})</span>
                </h4>

                {profile.orders.length === 0 ? (
                  <div className="p-6 bg-[#24150F]/50 rounded-xl border border-white/5 text-center text-xs text-[#FFF3DF]/60 space-y-2">
                    <p>No orders placed yet under this phone number.</p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-[#C98242] text-[#151311] font-semibold text-xs rounded-lg"
                    >
                      Explore Menu & Place First Order
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.orders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 bg-[#24150F] rounded-xl border border-white/10 hover:border-[#C98242]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#FFF3DF]">
                              {ord.order_code}
                            </span>
                            <span className="text-[11px] text-[#C98242] capitalize">
                              {ord.order_type === 'dine_in' ? 'Dine-In' : 'Delivery'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase font-mono text-[#FFF3DF]/80">
                              {ord.payment_method?.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#FFF3DF]/60 mt-0.5">
                            {new Date(ord.created_at).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono font-bold text-[#FFF3DF] text-sm">
                              ₹{ord.grand_total.toFixed(2)}
                            </span>
                            <span
                              className={`block text-[10px] uppercase font-bold ${
                                ord.status === 'delivered'
                                  ? 'text-[#506B45]'
                                  : ord.status === 'cancelled' || ord.status === 'rejected'
                                  ? 'text-red-400'
                                  : 'text-[#E78B45]'
                              }`}
                            >
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onClose();
                                onTrackOrder(ord.order_code);
                              }}
                              className="px-2.5 py-1.5 bg-[#151311] hover:bg-black rounded-lg border border-white/10 text-xs text-[#C98242]"
                              title="Track Order"
                            >
                              Track
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const full = await api.getOrder(ord.order_code);
                                  onClose();
                                  onViewBill(full);
                                } catch {
                                  // ignore
                                }
                              }}
                              className="px-2.5 py-1.5 bg-[#151311] hover:bg-black rounded-lg border border-white/10 text-xs text-[#FFF3DF]"
                              title="View Bill"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Fallback if somehow state is unset */
            <div className="text-center py-8">
              <button
                onClick={() => setIsAuthMode(true)}
                className="px-4 py-2 bg-[#C98242] text-[#151311] font-semibold text-xs rounded-xl"
              >
                Sign In with Phone
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
