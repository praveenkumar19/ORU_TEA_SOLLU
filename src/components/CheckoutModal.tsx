import React, { useState, useEffect } from 'react';
import { MenuItem } from '../data/menu';
import { api, OrderCalculation, PlacedOrder } from '../services/api';
import {
  X,
  Utensils,
  Truck,
  MapPin,
  Tag,
  Check,
  AlertCircle,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Lock,
  User,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  menuItems: MenuItem[];
  onOrderSuccess: (order: PlacedOrder) => void;
  defaultPhone?: string;
  defaultName?: string;
  initialCouponCode?: string;
  isSignedIn?: boolean;
  onOpenSignIn?: () => void;
  onLoginSuccess?: (phone: string, name: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  menuItems,
  onOrderSuccess,
  defaultPhone = '',
  defaultName = '',
  initialCouponCode = '',
  isSignedIn = false,
  onOpenSignIn,
  onLoginSuccess,
}) => {
  const [orderType, setOrderType] = useState<'dine_in' | 'delivery'>('dine_in');
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);

  // Inline Sign-In state for clients not yet signed in
  const [inlinePhone, setInlinePhone] = useState(defaultPhone);
  const [inlineName, setInlineName] = useState(defaultName);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState('');

  // Delivery address fields
  const [flatNo, setFlatNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('600127'); // Ponmar Chennai default PIN
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  // Payment method: cash or upi
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');

  // Server calculation state
  const [calculation, setCalculation] = useState<OrderCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Cart items array
  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, quantity]) => ({ id, quantity }));

  // Auto-fill from defaults if changed
  useEffect(() => {
    if (defaultPhone) setCustomerPhone(defaultPhone);
    if (defaultName) setCustomerName(defaultName);
    if (initialCouponCode) {
      setCouponCode(initialCouponCode);
      setCouponInput(initialCouponCode);
    }
  }, [defaultPhone, defaultName, initialCouponCode]);

  // Recalculate bill with server whenever cart, orderType, pincode, or coupon changes
  useEffect(() => {
    if (!isOpen || cartItems.length === 0) return;

    let isMounted = true;
    setIsCalculating(true);
    setCalcError('');

    api
      .calculateOrder({
        items: cartItems,
        orderType,
        pincode: orderType === 'delivery' ? pincode : undefined,
        couponCode: couponCode || undefined,
        customerPhone: customerPhone || undefined,
      })
      .then((calc) => {
        if (isMounted) {
          setCalculation(calc);
          setIsCalculating(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCalcError(err.message || 'Error calculating bill.');
          setIsCalculating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderType, pincode, couponCode, customerPhone, JSON.stringify(cartItems)]);

  if (!isOpen) return null;

  const handleApplyCoupon = () => {
    setCouponCode(couponInput.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
  };

  const handleInlineSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    const clean = inlinePhone.replace(/\D/g, '');
    if (clean.length < 10) {
      setSignInError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (!inlineName.trim()) {
      setSignInError('Please enter your full name.');
      return;
    }

    try {
      setIsSigningIn(true);
      const cust = await api.loginCustomer(clean, inlineName.trim());
      setCustomerPhone(cust.phone);
      setCustomerName(cust.name);
      if (onLoginSuccess) {
        onLoginSuccess(cust.phone, cust.name);
      }
      setIsSigningIn(false);
    } catch (err: any) {
      setIsSigningIn(false);
      setSignInError(err.message || 'Failed to sign in. Please try again.');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setSubmitError('Sign in required. Please sign in or register before placing an order.');
      return;
    }

    if (!customerName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    if (orderType === 'delivery') {
      if (!flatNo.trim() || !street.trim()) {
        setSubmitError('Please provide your flat/house number and street name.');
        return;
      }
      if (!pincode.trim()) {
        setSubmitError('Please enter your 6-digit delivery PIN code.');
        return;
      }
      if (calculation && !calculation.isDeliveryEligible) {
        setSubmitError(calculation.deliveryError || 'Delivery not available for this location.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const placed = await api.placeOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType,
        deliveryAddress:
          orderType === 'delivery'
            ? {
                flatNo: flatNo.trim(),
                street: street.trim(),
                landmark: landmark.trim(),
                pincode: pincode.trim(),
                saveAsDefault,
              }
            : undefined,
        deliveryInstructions: deliveryInstructions.trim(),
        paymentMethod,
        items: cartItems,
        couponCode: couponCode || undefined,
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(placed);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'Failed to place order. Please try again.');
    }
  };

  const isUserLoggedIn = Boolean(customerPhone && customerPhone.replace(/\D/g, '').length >= 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#151311] border border-[#C98242]/30 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF] my-8">
        {/* Header */}
        <div className="p-5 bg-[#24150F] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#C98242]" />
            <h2 className="text-lg font-bold font-serif-display text-[#FFF3DF]">
              Complete Your Chai Break Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If client is NOT signed in: Display Sign In Requirement Gate */}
        {!isUserLoggedIn ? (
          <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 bg-[#24150F] border border-[#C98242]/40 rounded-full flex items-center justify-center mx-auto text-[#C98242] shadow-xl">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif-display text-[#FFF3DF]">
                Sign In Required to Place Order
              </h3>
              <p className="text-xs text-[#FFF3DF]/70 leading-relaxed">
                Please sign in with your phone number and name before placing your order. This connects your order to live tracking, bill receipts, and VIP loyalty rewards.
              </p>
            </div>

            {/* Quick In-Place Sign In */}
            <form onSubmit={handleInlineSignIn} className="space-y-4 max-w-md mx-auto bg-[#24150F] p-6 rounded-2xl border border-[#C98242]/30 shadow-2xl">
              <div>
                <label className="block text-xs font-medium text-[#FFF3DF]/80 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vignesh Kumar"
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  className="w-full p-2.5 bg-[#151311] border border-white/10 rounded-xl text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#FFF3DF]/80 mb-1">
                  Mobile Number (10 Digits) <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#151311] border border-r-0 border-white/10 rounded-l-xl text-xs text-[#FFF3DF]/60">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9094392300"
                    value={inlinePhone}
                    onChange={(e) => setInlinePhone(e.target.value)}
                    className="w-full p-2.5 bg-[#151311] border border-white/10 rounded-r-xl text-xs text-[#FFF3DF] font-mono focus:border-[#C98242] focus:outline-none"
                  />
                </div>
              </div>

              {signInError && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{signInError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-3.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In & Continue to Place Order</span>
                )}
              </button>

              {onOpenSignIn && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="text-xs text-[#C98242] hover:underline cursor-pointer"
                  >
                    Already have an account? Sign In here
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* STEP 1: ORDER TYPE SELECTION CARDS */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C98242] mb-3">
                1. Choose Order Type
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Dine-In */}
                <div
                  onClick={() => setOrderType('dine_in')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    orderType === 'dine_in'
                      ? 'bg-[#24150F] border-[#C98242] shadow-md'
                      : 'bg-[#1a1410] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        orderType === 'dine_in'
                          ? 'bg-[#C98242] text-[#151311]'
                          : 'bg-[#24150F] text-[#FFF3DF]'
                      }`}
                    >
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#FFF3DF]">Enjoy Here</h3>
                      <span className="text-[11px] text-[#506B45] font-semibold">Dine-In · ₹0 Fee</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#FFF3DF]/70 leading-relaxed">
                    Order your favourites and enjoy hot cutting chai and snacks directly at our Ponmar cafe counter.
                  </p>
                  <div className="mt-2 text-[10px] text-[#C98242]">
                    Assigned ID format: P@102
                  </div>
                </div>

                {/* Option B: Parcel / Home Delivery */}
                <div
                  onClick={() => setOrderType('delivery')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    orderType === 'delivery'
                      ? 'bg-[#24150F] border-[#C98242] shadow-md'
                      : 'bg-[#1a1410] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${
                        orderType === 'delivery'
                          ? 'bg-[#C98242] text-[#151311]'
                          : 'bg-[#24150F] text-[#FFF3DF]'
                      }`}
                    >
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#FFF3DF]">Order for Delivery</h3>
                      <span className="text-[11px] text-[#E78B45] font-semibold">Doorstep Parcel</span>
                    </div>
                  </div>
                  <p className="text-xs text-[#FFF3DF]/70 leading-relaxed">
                    Fresh piping hot chai and snacks packed carefully and delivered to your home or office.
                  </p>
                  <div className="mt-2 text-[10px] text-[#C98242]">
                    Assigned ID format: DEL-YYYYMMDD-XXXX
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: CUSTOMER & ADDRESS DETAILS */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#C98242]">
                  2. Customer Contact & Location
                </label>
                {onOpenSignIn && (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="text-xs text-[#C98242] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Switch Account</span>
                  </button>
                )}
              </div>

              {/* Verified Signed In Customer Badge */}
              <div className="p-3.5 bg-[#24150F] border border-[#506B45]/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#506B45]/20 text-[#506B45] rounded-lg border border-[#506B45]/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#FFF3DF]">{customerName || 'Chai Customer'}</span>
                      <span className="text-[10px] bg-[#506B45] text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                        Signed In
                      </span>
                    </div>
                    <span className="text-xs text-[#C98242] font-mono">+91 {customerPhone}</span>
                  </div>
                </div>
              </div>

            {/* Address fields ONLY if Delivery */}
            {orderType === 'delivery' && (
              <div className="p-4 bg-[#24150F]/70 border border-[#C98242]/20 rounded-xl space-y-3 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#C98242] font-semibold">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Address (Ponmar & Nearby Chennai)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      House / Flat / Door No. <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 3B, Sri Ram Nagar"
                      value={flatNo}
                      onChange={(e) => setFlatNo(e.target.value)}
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Street / Locality <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ponmar Main Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Ponmar Bus Stop"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                      PIN Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="600127"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] font-mono focus:border-[#C98242] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#FFF3DF]/70 mb-1">
                    Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring the bell, call before arriving..."
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    className="w-full p-2 bg-[#151311] border border-white/10 rounded-lg text-xs text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveAddress"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="accent-[#C98242]"
                  />
                  <label htmlFor="saveAddress" className="text-xs text-[#FFF3DF]/70">
                    Save address to my customer profile
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: COUPON ENTRY */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C98242]">
              3. Offers & Coupons
            </label>

            {calculation?.appliedCoupon ? (
              <div className="p-3 bg-[#506B45]/20 border border-[#506B45]/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#8ec07c]">
                  <Check className="w-4 h-4" />
                  <span>
                    Coupon <strong className="font-mono">{calculation.appliedCoupon.code}</strong> applied ({calculation.appliedCoupon.description})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-red-300 hover:text-red-200 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code (e.g. OTS-7K4P9X)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 p-2 bg-[#24150F] border border-white/10 rounded-lg text-xs font-mono uppercase text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:border-[#C98242] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim()}
                  className="px-4 py-2 bg-[#24150F] hover:bg-[#341e15] border border-[#C98242]/40 text-xs font-semibold text-[#C98242] rounded-lg disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}

            {/* 50th Order Loyalty Milestone Notification Banner */}
            {calculation?.earns50thMilestoneCoupon ? (
              <div className="p-3 bg-[#506B45]/20 border border-[#506B45]/40 rounded-xl flex items-center gap-2.5 text-xs text-[#8ec07c]">
                <Sparkles className="w-5 h-5 shrink-0 text-[#E78B45]" />
                <div>
                  <span className="font-bold block">50th Order Loyalty Milestone Reached!</span>
                  <span>
                    This order crosses your 50th order milestone with a purchase above ₹200! An exclusive 50th Order VIP Coupon (₹50 OFF) will be unlocked for your account upon delivery.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-[#24150F] border border-white/5 rounded-lg flex items-center justify-between text-[11px] text-[#FFF3DF]/60">
                <span>
                  Loyalty Milestone: Complete your 50th order with a break above ₹200 to earn your exclusive VIP coupon code.
                </span>
                {calculation?.customerCompletedOrders !== undefined && (
                  <span className="text-[#C98242] font-mono ml-2 shrink-0">
                    {calculation.customerCompletedOrders} / 50 Orders
                  </span>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: PAYMENT METHOD (Cash or UPI) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#C98242]">
                4. Select Payment Method
              </label>
              <span className="text-[11px] font-mono font-semibold text-[#8ec07c]">
                Selected: {paymentMethod === 'upi' ? 'UPI (QR Code)' : 'Cash'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment Method">
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'cash'}
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 focus:outline-none ${
                  paymentMethod === 'cash'
                    ? 'bg-[#24150F] border-[#C98242] shadow-md ring-1 ring-[#C98242]/50'
                    : 'bg-[#1a1410] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded-lg bg-[#C98242]/20 text-[#C98242]">
                    <Banknote className="w-4 h-4" />
                  </div>
                  {paymentMethod === 'cash' ? (
                    <span className="w-5 h-5 rounded-full bg-[#C98242] text-[#151311] flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-white/20" />
                  )}
                </div>
                <div>
                  <span className="block font-semibold text-xs text-[#FFF3DF]">
                    {orderType === 'dine_in' ? 'Cash at Counter' : 'Cash at Delivery'}
                  </span>
                  <span className="text-[10px] text-[#FFF3DF]/60 block mt-0.5">
                    {orderType === 'dine_in' ? 'Pay cash at our Ponmar billing desk' : 'Pay cash to delivery rider'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === 'upi'}
                onClick={() => setPaymentMethod('upi')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1.5 focus:outline-none ${
                  paymentMethod === 'upi'
                    ? 'bg-[#24150F] border-[#25D366] shadow-md ring-1 ring-[#25D366]/50'
                    : 'bg-[#1a1410] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 rounded-lg bg-[#25D366]/20 text-[#25D366]">
                    <QrCode className="w-4 h-4" />
                  </div>
                  {paymentMethod === 'upi' ? (
                    <span className="w-5 h-5 rounded-full bg-[#25D366] text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-white/20" />
                  )}
                </div>
                <div>
                  <span className="block font-semibold text-xs text-[#FFF3DF]">
                    {orderType === 'dine_in' ? 'UPI / QR at Counter' : 'UPI at Delivery'}
                  </span>
                  <span className="text-[10px] text-[#FFF3DF]/60 block mt-0.5">
                    Scan GPay / PhonePe / Paytm QR
                  </span>
                </div>
              </button>
            </div>

            <div className="p-3 bg-[#24150F] rounded-lg text-xs text-[#FFF3DF]/70 flex items-start gap-2 border border-white/5">
              <ShieldCheck className="w-4 h-4 text-[#506B45] shrink-0 mt-0.5" />
              <p>
                {orderType === 'delivery'
                  ? 'Pay when your order reaches your doorstep. You can freely switch between Cash and UPI at any time from your Live Order Tracker.'
                  : 'Pay directly at our Ponmar cafe billing counter using cash or your preferred UPI app.'}
              </p>
            </div>
          </div>

          {/* STEP 5: ITEM SUMMARY & GST BREAKDOWN */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#C98242]">
              5. Server-Calculated Bill Summary
            </label>

            {isCalculating ? (
              <div className="p-4 text-center text-xs text-[#FFF3DF]/60">
                Calculating taxes and delivery rates...
              </div>
            ) : calculation ? (
              <div className="p-4 bg-[#24150F] rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-[#FFF3DF]/80">
                  <span>Merchandise Subtotal:</span>
                  <span className="font-mono tabular-nums">₹{calculation.merchandiseSubtotal.toFixed(2)}</span>
                </div>

                {calculation.discount > 0 && (
                  <div className="flex justify-between text-[#8ec07c]">
                    <span>Coupon Discount:</span>
                    <span className="font-mono tabular-nums">-₹{calculation.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#FFF3DF]/70">
                  <span>CGST ({calculation.cgstRate}%):</span>
                  <span className="font-mono tabular-nums">₹{calculation.cgst.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#FFF3DF]/70">
                  <span>SGST ({calculation.sgstRate}%):</span>
                  <span className="font-mono tabular-nums">₹{calculation.sgst.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[#FFF3DF]/80">
                  <span>Delivery Charge:</span>
                  <span className="font-mono tabular-nums">
                    {calculation.deliveryCharge === 0 ? 'FREE (₹0.00)' : `₹${calculation.deliveryCharge.toFixed(2)}`}
                  </span>
                </div>

                {orderType === 'delivery' && !calculation.isDeliveryEligible && (
                  <div className="p-2 bg-red-950/40 border border-red-800/40 rounded text-red-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{calculation.deliveryError}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-[#FFF3DF]">
                  <span>Total Amount Payable:</span>
                  <span className="font-mono text-[#E78B45]">
                    ₹{calculation.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}

            {calcError && (
              <p className="text-xs text-red-400">{calcError}</p>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isCalculating || (orderType === 'delivery' && calculation?.isDeliveryEligible === false)}
              className="w-full py-4 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-[#C98242]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Generating Order ID & Bill...</span>
              ) : (
                <span>
                  Confirm & Place Order ({orderType === 'dine_in' ? 'Enjoy Here' : 'Delivery'})
                </span>
              )}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};
