import React from 'react';
import { MenuItem, buildWhatsAppOrderUrl, CAFE_INFO } from '../data/menu';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, MessageSquare, ShieldCheck, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  isSignedIn?: boolean;
  customerName?: string;
  customerPhone?: string;
  onOpenSignIn?: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  menuItems,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onProceedToCheckout,
  isSignedIn = false,
  customerName = '',
  customerPhone = '',
  onOpenSignIn,
}) => {
  if (!isOpen) return null;

  // Build items list
  const cartEntries = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === id);
      return { item: item!, quantity: qty };
    })
    .filter((entry) => Boolean(entry.item));

  const totalAmount = cartEntries.reduce(
    (sum, entry) => sum + entry.item.price * entry.quantity,
    0
  );

  const whatsAppUrl = buildWhatsAppOrderUrl(cartEntries);
  const qualifiesForPromo = totalAmount >= 200;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#151311] border-l border-[#C98242]/30 h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden text-[#FFF3DF]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#24150F] rounded-lg border border-[#C98242]/30">
              <ShoppingBag className="w-5 h-5 text-[#C98242]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-display text-[#FFF3DF]">
                Your Chai & Snack Tray
              </h2>
              <p className="text-xs text-[#FFF3DF]/60">
                {cartEntries.length} {cartEntries.length === 1 ? 'item' : 'items'} in your tray
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-[#FFF3DF]/70 hover:text-white transition-colors"
            aria-label="Close Tray"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartEntries.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-[#C98242]/30 mx-auto mb-3" />
              <p className="text-base font-semibold text-[#FFF3DF]">Your tray is empty</p>
              <p className="text-xs text-[#FFF3DF]/60 mt-1 max-w-xs mx-auto">
                Explore our hot teas, cutting chai, and crunchy snacks to build your order.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-4 py-2 bg-[#C98242] text-[#151311] font-semibold text-xs rounded-lg"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* 50th order milestone note */}
              <div className="p-3 bg-[#24150F] border border-[#C98242]/20 rounded-xl text-xs text-[#FFF3DF]/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C98242] shrink-0" />
                  <span>Cross your 50th order with ₹200+ to unlock your exclusive VIP Coupon!</span>
                </div>
                <span className="text-[10px] text-[#C98242] font-semibold uppercase px-2 py-0.5 bg-[#151311] rounded shrink-0 ml-2">
                  50th Milestone
                </span>
              </div>

              {/* Item List */}
              <div className="space-y-3">
                {cartEntries.map(({ item, quantity }) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#24150F] rounded-xl border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#FFF3DF] truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#C98242] font-mono tabular-nums">
                        ₹{item.price} each · ₹{item.price * quantity}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center bg-[#151311] border border-white/10 rounded-lg p-0.5">
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="p-1 hover:bg-[#24150F] rounded text-[#FFF3DF] transition-colors"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-semibold text-[#FFF3DF] font-mono tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onAddToCart(item)}
                        className="p-1 hover:bg-[#24150F] rounded text-[#FFF3DF] transition-colors"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Tray Action */}
              <div className="flex justify-end">
                <button
                  onClick={onClearCart}
                  className="text-xs text-[#FFF3DF]/50 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear tray</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {cartEntries.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#151311] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#FFF3DF]/70">Merchandise Subtotal:</span>
              <span className="text-xl font-bold text-[#FFF3DF] font-mono tabular-nums">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Customer Sign-In State Status */}
            {!isSignedIn ? (
              <div className="p-3 bg-[#24150F] border border-[#C98242]/30 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#FFF3DF]/80">
                  <Lock className="w-4 h-4 text-[#C98242] shrink-0" />
                  <span>Sign in required to place order</span>
                </div>
                {onOpenSignIn && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSignIn();
                    }}
                    className="text-xs text-[#C98242] font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
            ) : (
              <div className="px-1 flex items-center gap-1.5 text-xs text-[#506B45]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Signed in as {customerName || 'Customer'} (+91 {customerPhone})
                </span>
              </div>
            )}

            {/* Primary Action: Direct Checkout Flow or Sign In Prompt */}
            <button
              onClick={() => {
                onClose();
                if (!isSignedIn && onOpenSignIn) {
                  onOpenSignIn();
                } else {
                  onProceedToCheckout();
                }
              }}
              className="w-full py-3.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {!isSignedIn ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Place Order</span>
                </>
              ) : (
                <>
                  <span>Proceed to Checkout (Dine-In or Parcel)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Secondary WhatsApp Handoff */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-[#24150F] hover:bg-[#2e1b13] border border-[#25D366]/40 text-[#FFF3DF] text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Or Order via WhatsApp (+91 90943 92300)</span>
            </a>

            <p className="text-[10px] text-center text-[#FFF3DF]/50">
              GST & delivery charges are calculated transparently during checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
