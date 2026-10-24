import React from 'react';
import { PlacedOrder } from '../services/api';
import { CAFE_INFO } from '../data/menu';
import { X, Printer, Navigation, Phone, CheckCircle2, Clock, MapPin, Coffee, Tag } from 'lucide-react';

interface BillReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PlacedOrder | null;
  onTrackOrder: (orderCode: string) => void;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  onTrackOrder,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-lg bg-[#151311] border border-[#C98242]/40 rounded-2xl shadow-2xl overflow-hidden text-[#FFF3DF] print:bg-white print:text-black print:border-none print:shadow-none print:max-w-none">
        {/* Top Header / Actions */}
        <div className="p-4 bg-[#24150F] border-b border-white/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#506B45]" />
            <span className="text-sm font-semibold text-[#FFF3DF]">
              Order Placed Successfully!
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#151311] hover:bg-black border border-white/10 text-xs text-[#FFF3DF] font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              title="Print Receipt / Bill"
            >
              <Printer className="w-3.5 h-3.5 text-[#C98242]" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bill Paper Container */}
        <div id="cafe-invoice" className="p-6 md:p-8 space-y-6 print:p-4 text-xs md:text-sm">
          {/* Cafe Header */}
          <div className="text-center pb-5 border-b border-dashed border-white/20 print:border-black/30">
            <h1 className="text-2xl font-bold font-serif-display tracking-wide uppercase text-[#FFF3DF] print:text-black">
              ORU TEA SOLLU!
            </h1>
            <p className="text-xs text-[#C98242] print:text-black font-medium mt-0.5">
              Ponmar, Chennai, Tamil Nadu, India
            </p>
            <p className="text-[11px] text-[#FFF3DF]/60 print:text-black/70">
              Phone: {CAFE_INFO.phone} · GST Food & Beverage Receipt
            </p>
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-2 gap-3 pb-4 border-b border-dashed border-white/20 print:border-black/30 text-xs">
            <div>
              <span className="block text-[11px] text-[#FFF3DF]/50 print:text-black/60">ORDER ID:</span>
              <span className="text-base font-bold font-mono text-[#E78B45] print:text-black">
                {order.orderCode}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[11px] text-[#FFF3DF]/50 print:text-black/60">DATE & TIME (IST):</span>
              <span className="font-mono text-[#FFF3DF]/90 print:text-black">{formattedDate}</span>
            </div>

            <div>
              <span className="block text-[11px] text-[#FFF3DF]/50 print:text-black/60">ORDER TYPE:</span>
              <span className="font-semibold capitalize text-[#FFF3DF] print:text-black">
                {order.orderType === 'dine_in' ? 'Enjoy Here (Dine-In)' : 'Parcel / Home Delivery'}
              </span>
            </div>

            <div className="text-right">
              <span className="block text-[11px] text-[#FFF3DF]/50 print:text-black/60">PAYMENT METHOD:</span>
              <span className="font-semibold uppercase text-[#C98242] print:text-black">
                {order.paymentMethod} (At Delivery)
              </span>
              <span className="block text-[10px] text-amber-300 print:text-black">
                Status: {order.paymentStatus.toUpperCase()}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-white/5 print:border-black/10">
              <span className="block text-[11px] text-[#FFF3DF]/50 print:text-black/60">CUSTOMER:</span>
              <span className="font-medium text-[#FFF3DF] print:text-black">
                {order.customerName} · {order.customerPhone}
              </span>
              {order.orderType === 'delivery' && order.deliveryAddress && (
                <p className="text-[11px] text-[#FFF3DF]/70 print:text-black mt-1">
                  📍 {order.deliveryAddress}
                </p>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-[#C98242] print:text-black uppercase tracking-wider pb-2 border-b border-white/10 print:border-black/20">
              <span>Item Description</span>
              <span className="text-right">Amount (₹)</span>
            </div>

            <div className="divide-y divide-white/5 print:divide-black/10 py-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-medium text-[#FFF3DF] print:text-black">
                      {it.name}
                    </span>
                    <span className="text-[11px] text-[#FFF3DF]/60 print:text-black/70 ml-2 font-mono">
                      × {it.quantity} @ ₹{it.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-[#FFF3DF] print:text-black font-semibold">
                    ₹{it.lineTotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Breakdown */}
          <div className="pt-3 border-t border-dashed border-white/20 print:border-black/30 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#FFF3DF]/80 print:text-black">
              <span>Merchandise Subtotal:</span>
              <span className="font-mono tabular-nums">₹{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-[#8ec07c] print:text-black">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Coupon Discount:</span>
                </span>
                <span className="font-mono tabular-nums">-₹{order.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-[#FFF3DF]/70 print:text-black">
              <span>CGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.cgst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[#FFF3DF]/70 print:text-black">
              <span>SGST (2.5%):</span>
              <span className="font-mono tabular-nums">₹{order.sgst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[#FFF3DF]/80 print:text-black">
              <span>Delivery Fee ({order.orderType === 'dine_in' ? 'Dine-in' : 'Parcel'}):</span>
              <span className="font-mono tabular-nums">
                {order.deliveryCharge === 0 ? 'FREE (₹0.00)' : `₹${order.deliveryCharge.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-3 border-t-2 border-white/20 print:border-black flex justify-between text-base font-bold text-[#FFF3DF] print:text-black">
              <span>Grand Total Payable:</span>
              <span className="font-mono text-[#E78B45] print:text-black">
                ₹{order.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Notice */}
          <div className="p-3 bg-[#24150F] print:bg-gray-100 rounded-xl text-center text-[11px] text-[#FFF3DF]/70 print:text-black">
            <p className="font-medium text-[#C98242] print:text-black mb-0.5">
              Pay when your order arrives.
            </p>
            <p>
              Choose cash or UPI at delivery. Your payment will be marked complete after the cafe confirms receipt.
            </p>
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-[#FFF3DF]/40 print:text-black/60 pt-2 border-t border-dashed border-white/10 print:border-black/20">
            Thank you for choosing Oru Tea Sollu! Every Sip Has a Story.
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-5 bg-[#24150F] border-t border-white/10 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={() => {
              onClose();
              onTrackOrder(order.orderCode);
            }}
            className="flex-1 py-3 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Track Order Status</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 bg-[#151311] hover:bg-black border border-white/10 text-[#FFF3DF] font-medium text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
