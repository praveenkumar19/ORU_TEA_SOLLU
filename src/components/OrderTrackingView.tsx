import React, { useState, useEffect } from 'react';
import { api, PlacedOrder } from '../services/api';
import { CAFE_INFO } from '../data/menu';
import {
  X,
  CheckCircle2,
  Clock,
  Truck,
  Utensils,
  AlertCircle,
  Phone,
  RefreshCw,
  Printer,
  ShieldCheck,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface OrderTrackingViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderCode?: string;
  onViewBill?: (order: PlacedOrder) => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  isOpen,
  onClose,
  initialOrderCode = '',
  onViewBill,
}) => {
  const [orderCodeInput, setOrderCodeInput] = useState(initialOrderCode);
  const [activeCode, setActiveCode] = useState(initialOrderCode);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [fullOrder, setFullOrder] = useState<PlacedOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSwitchingPayment, setIsSwitchingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Update active code if prop changes
  useEffect(() => {
    if (initialOrderCode) {
      setOrderCodeInput(initialOrderCode);
      setActiveCode(initialOrderCode);
    }
  }, [initialOrderCode]);

  // Fetch and poll order status
  const fetchStatus = async (code: string) => {
    if (!code) return;
    try {
      const data = await api.trackOrder(code);
      setTrackingData(data);
      setError('');

      // Also fetch full order for bill viewing if available
      try {
        const ord = await api.getOrder(code);
        setFullOrder(ord);
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err.message || 'Order not found.');
      setTrackingData(null);
    }
  };

  useEffect(() => {
    if (!isOpen || !activeCode) return;

    setIsLoading(true);
    fetchStatus(activeCode).finally(() => setIsLoading(false));

    // Poll every 5 seconds for real-time status updates
    const interval = setInterval(() => {
      fetchStatus(activeCode);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, activeCode]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderCodeInput.trim()) {
      setActiveCode(orderCodeInput.trim().toUpperCase());
    }
  };

  const handleSwitchPaymentMethod = async (newMethod: 'cash' | 'upi') => {
    if (!activeCode || isSwitchingPayment) return;
    try {
      setIsSwitchingPayment(true);
      setPaymentNotice('');
      const res = await api.updateCustomerPaymentMethod(activeCode, newMethod);
      setPaymentNotice(res.message || `Payment method switched to ${newMethod.toUpperCase()}`);
      await fetchStatus(activeCode);
      setIsSwitchingPayment(false);
      setTimeout(() => setPaymentNotice(''), 3500);
    } catch (err: any) {
      setIsSwitchingPayment(false);
      alert(err.message || 'Failed to update payment method.');
    }
  };

  // Define steps according to order type
  const isDelivery = trackingData?.orderType === 'delivery';

  const steps = isDelivery
    ? [
        { key: 'placed', label: 'Order Placed' },
        { key: 'confirmed', label: 'Cafe Confirmed' },
        { key: 'preparing', label: 'Brewing & Packing' },
        { key: 'out_for_delivery', label: 'Out for Delivery' },
        { key: 'delivered', label: 'Delivered' },
      ]
    : [
        { key: 'placed', label: 'Order Placed' },
        { key: 'confirmed', label: 'Cafe Confirmed' },
        { key: 'preparing', label: 'Brewing Fresh Chai' },
        { key: 'ready', label: 'Ready for Counter Pickup' },
        { key: 'delivered', label: 'Completed' },
      ];

  const getStepIndex = (status: string) => {
    if (status === 'placed' || status === 'awaiting_confirmation') return 0;
    if (status === 'confirmed') return 1;
    if (status === 'preparing') return 2;
    if (status === 'ready' || status === 'out_for_delivery') return 3;
    if (status === 'delivered') return 4;
    return -1;
  };

  const currentStepIdx = trackingData ? getStepIndex(trackingData.status) : 0;
  const isCancelled = trackingData?.status === 'cancelled' || trackingData?.status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#151311] border border-[#C98242]/30 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF] my-8">
        {/* Header */}
        <div className="p-5 bg-[#24150F] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C98242]" />
            <h2 className="text-lg font-bold font-serif-display text-[#FFF3DF]">
              Live Order Tracker
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
          {/* Order Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Order Code (e.g. P@102 or DEL-20261023-0001)"
              value={orderCodeInput}
              onChange={(e) => setOrderCodeInput(e.target.value)}
              className="flex-1 p-2.5 bg-[#24150F] border border-white/10 rounded-xl text-xs font-mono uppercase text-[#FFF3DF] focus:border-[#C98242] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#C98242] text-[#151311] font-semibold text-xs rounded-xl hover:bg-[#E78B45] transition-colors whitespace-nowrap"
            >
              Track
            </button>
          </form>

          {isLoading && !trackingData && (
            <div className="text-center py-12 text-xs text-[#FFF3DF]/60">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C98242]" />
              Fetching order status...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {trackingData && (
            <div className="space-y-6">
              {/* Order Status Badge Card */}
              <div className="p-5 bg-[#24150F] rounded-xl border border-[#C98242]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-[#C98242] uppercase font-semibold tracking-wider block mb-1">
                    {trackingData.orderType === 'dine_in' ? 'Dine-In Cafe Order' : 'Parcel Delivery'}
                  </span>
                  <h3 className="text-2xl font-bold font-mono text-[#FFF3DF]">
                    {trackingData.orderCode}
                  </h3>
                  <p className="text-xs text-[#FFF3DF]/70 mt-1">
                    Customer: {trackingData.customerName}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      isCancelled
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : trackingData.status === 'delivered'
                        ? 'bg-[#506B45] text-white'
                        : 'bg-[#C98242] text-[#151311]'
                    }`}
                  >
                    {trackingData.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-[11px] text-[#FFF3DF]/60 mt-1">
                    Est. Time: ~{trackingData.estimatedMinutes} mins
                  </p>
                </div>
              </div>

              {/* Payment Information & Switch Option */}
              <div className="p-4 bg-[#24150F] rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    {trackingData.paymentMethod === 'upi' ? (
                      <div className="p-2 bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg">
                        <CreditCard className="w-4 h-4 text-[#25D366]" />
                      </div>
                    ) : (
                      <div className="p-2 bg-[#C98242]/20 border border-[#C98242]/30 rounded-lg">
                        <Banknote className="w-4 h-4 text-[#C98242]" />
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-[#FFF3DF]/60 block text-[11px]">Payment Method:</span>
                      <span className="font-bold text-[#FFF3DF] uppercase tracking-wide">
                        {trackingData.paymentMethod === 'upi' ? 'UPI (QR Code / App)' : 'Cash at Counter/Delivery'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase flex items-center gap-1 ${
                        trackingData.paymentStatus === 'paid'
                          ? 'bg-[#506B45] text-white'
                          : 'bg-amber-950/80 text-amber-200 border border-amber-800/60'
                      }`}
                    >
                      {trackingData.paymentStatus === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                      {trackingData.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                    </span>
                  </div>
                </div>

                {paymentNotice && (
                  <div className="p-2.5 bg-[#506B45]/20 border border-[#506B45]/40 rounded-lg text-xs text-[#8ec07c] flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{paymentNotice}</span>
                  </div>
                )}

                {/* Customer can change payment method before delivery if unpaid */}
                {!isCancelled && trackingData.status !== 'delivered' && trackingData.paymentStatus !== 'paid' && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="text-[11px] text-[#FFF3DF]/60">
                      Need to change payment method?
                    </span>
                    <div className="flex items-center gap-2">
                      {trackingData.paymentMethod === 'cash' ? (
                        <button
                          onClick={() => handleSwitchPaymentMethod('upi')}
                          disabled={isSwitchingPayment}
                          className="px-3 py-1.5 bg-[#151311] hover:bg-black border border-[#25D366]/40 text-[#25D366] font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          title="Switch to paying with UPI"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isSwitchingPayment ? 'Updating...' : 'Switch to UPI (QR)'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSwitchPaymentMethod('cash')}
                          disabled={isSwitchingPayment}
                          className="px-3 py-1.5 bg-[#151311] hover:bg-black border border-[#C98242]/40 text-[#C98242] font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          title="Switch to paying with Cash"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{isSwitchingPayment ? 'Updating...' : 'Switch to Cash'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cancelled/Rejected Notice */}
              {isCancelled && (
                <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-xl text-xs text-red-200">
                  <p className="font-semibold mb-1">This order was cancelled or rejected.</p>
                  <p className="text-[11px] text-red-300/80">
                    Please contact our Ponmar cafe directly via phone at {CAFE_INFO.phone} for immediate assistance.
                  </p>
                </div>
              )}

              {/* Visual Stepper Tracker */}
              {!isCancelled && (
                <div className="p-5 bg-[#24150F]/70 rounded-xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#C98242]">
                      Live Preparation Progress
                    </span>
                    <span className="text-[11px] text-[#506B45] font-mono flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#506B45] animate-pulse" />
                      Live Updating
                    </span>
                  </div>

                  <div className="space-y-4">
                    {steps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.key} className="flex items-start gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-[#506B45] text-white'
                                : 'bg-[#151311] border border-white/20 text-[#FFF3DF]/40'
                            } ${isCurrent ? 'ring-4 ring-[#C98242]/30 border-[#C98242]' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-xs font-semibold ${
                                isCompleted ? 'text-[#FFF3DF]' : 'text-[#FFF3DF]/40'
                              } ${isCurrent ? 'text-[#C98242]' : ''}`}
                            >
                              {step.label}
                            </h4>
                            {isCurrent && (
                              <p className="text-[11px] text-[#FFF3DF]/70 mt-0.5">
                                Currently in progress at our Ponmar cafe kitchen.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status History Logs */}
              {trackingData.history && trackingData.history.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#C98242] font-semibold block">
                    Order Timeline
                  </span>
                  <div className="space-y-1.5 text-xs text-[#FFF3DF]/70">
                    {trackingData.history.map((h: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 bg-[#24150F] rounded-lg border border-white/5 flex items-center justify-between text-[11px]"
                      >
                        <span className="capitalize font-medium text-[#FFF3DF]">
                          {h.note || h.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#FFF3DF]/50 font-mono">
                          {new Date(h.created_at).toLocaleTimeString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions: View Bill & Call Cafe */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {fullOrder && onViewBill && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewBill(fullOrder);
                    }}
                    className="flex-1 py-3 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>View & Print Bill</span>
                  </button>
                )}

                <a
                  href={`tel:${CAFE_INFO.phoneClean}`}
                  className="py-3 px-5 bg-[#24150F] hover:bg-[#341e15] border border-white/10 text-xs font-semibold text-[#FFF3DF] rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#C98242]" />
                  <span>Call Cafe (+91 90943 92300)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
