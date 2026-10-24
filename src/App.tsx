import React, { useState, useEffect } from 'react';
import { MenuItem, INITIAL_MENU_ITEMS, CAFE_INFO } from './data/menu';
import { api, PlacedOrder } from './services/api';
import { Navbar } from './components/Navbar';
import { ThreeHeroCanvas } from './components/ThreeHeroCanvas';
import { WhyUsSection } from './components/WhyUsSection';
import { MenuSection } from './components/MenuSection';
import { ExperienceSection } from './components/ExperienceSection';
import { HowToOrderSection } from './components/HowToOrderSection';
import { LocationSection } from './components/LocationSection';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { OrderDrawer } from './components/OrderDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { BillReceiptModal } from './components/BillReceiptModal';
import { OrderTrackingView } from './components/OrderTrackingView';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { MenuConfigModal } from './components/MenuConfigModal';

export default function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cart, setCart] = useState<Record<string, number>>({});

  // Active customer state
  const [customerPhone, setCustomerPhone] = useState(
    localStorage.getItem('ots_customer_phone') || ''
  );
  const [customerName, setCustomerName] = useState(
    localStorage.getItem('ots_customer_name') || ''
  );

  const isSignedIn = Boolean(customerPhone && customerPhone.trim().length >= 10);
  const [pendingCheckoutAfterLogin, setPendingCheckoutAfterLogin] = useState(false);

  // Modals state
  const [isOrderTrayOpen, setIsOrderTrayOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOwnerConfigOpen, setIsOwnerConfigOpen] = useState(false);

  // Order viewing state
  const [activeOrder, setActiveOrder] = useState<PlacedOrder | null>(null);
  const [trackingOrderCode, setTrackingOrderCode] = useState('');

  // Pre-applied coupon from profile
  const [preAppliedCoupon, setPreAppliedCoupon] = useState('');

  // Fetch active menu from backend
  useEffect(() => {
    api
      .getMenu()
      .then((items) => {
        if (items && items.length > 0) {
          setMenuItems(items);
        }
      })
      .catch(() => {
        // Fallback to initial local items if offline
      });
  }, []);

  // Total quantity in tray
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[itemId] > 1) {
        updated[itemId] -= 1;
      } else {
        delete updated[itemId];
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleSaveMenuItems = (newItems: MenuItem[]) => {
    setMenuItems(newItems);
  };

  const handleResetDefaults = () => {
    setMenuItems(INITIAL_MENU_ITEMS);
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Called when order is successfully placed on backend
  const handleOrderSuccess = (order: PlacedOrder) => {
    setActiveOrder(order);
    setTrackingOrderCode(order.orderCode);
    setCart({}); // clear cart
    setIsBillOpen(true);

    // Save customer phone for auto-login
    if (order.customerPhone) {
      setCustomerPhone(order.customerPhone);
      setCustomerName(order.customerName);
      localStorage.setItem('ots_customer_phone', order.customerPhone);
      localStorage.setItem('ots_customer_name', order.customerName);
    }
  };

  const handleOpenTrackWithCode = (code: string) => {
    setTrackingOrderCode(code);
    setIsTrackOpen(true);
  };

  const handleViewBillFromTracking = (order: PlacedOrder) => {
    setActiveOrder(order);
    setIsBillOpen(true);
  };

  const handleStartCheckout = () => {
    if (!isSignedIn) {
      setPendingCheckoutAfterLogin(true);
      setIsProfileOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#151311] text-[#FFF3DF] flex flex-col selection:bg-[#C98242] selection:text-[#151311]">
      {/* Navigation Top Bar */}
      <Navbar
        cartCount={cartCount}
        customerName={customerName}
        onOpenOrderTray={() => setIsOrderTrayOpen(true)}
        onOpenCheckout={() => {
          if (cartCount > 0) handleStartCheckout();
          else setIsOrderTrayOpen(true);
        }}
        onOpenTrackOrder={() => setIsTrackOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* 3D Hero Section */}
        <ThreeHeroCanvas
          onExploreMenu={scrollToMenu}
        />

        {/* Brand Pillars & Philosophy */}
        <WhyUsSection />

        {/* Signature Menu Section */}
        <MenuSection
          menuItems={menuItems}
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onOpenOrderTray={() => setIsOrderTrayOpen(true)}
          onOpenOwnerConfig={() => setIsOwnerConfigOpen(true)}
        />

        {/* Immersive Cafe Atmosphere & Gallery */}
        <ExperienceSection />

        {/* Simple 3-Step Ordering & Handoff */}
        <HowToOrderSection
          onOpenOrderTray={() => {
            if (cartCount > 0) handleStartCheckout();
            else setIsOrderTrayOpen(true);
          }}
        />

        {/* Location & Directions */}
        <LocationSection />

        {/* Community Stories & Reviews */}
        <ReviewsSection />
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Slide-out Order Tray Drawer */}
      <OrderDrawer
        isOpen={isOrderTrayOpen}
        onClose={() => setIsOrderTrayOpen(false)}
        cart={cart}
        menuItems={menuItems}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleStartCheckout}
        isSignedIn={isSignedIn}
        customerName={customerName}
        customerPhone={customerPhone}
        onOpenSignIn={() => {
          setPendingCheckoutAfterLogin(true);
          setIsProfileOpen(true);
        }}
      />

      {/* Full Server-Backed Checkout Modal (Dine-in vs Parcel) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        menuItems={menuItems}
        defaultPhone={customerPhone}
        defaultName={customerName}
        initialCouponCode={preAppliedCoupon}
        isSignedIn={isSignedIn}
        onOpenSignIn={() => {
          setIsCheckoutOpen(false);
          setPendingCheckoutAfterLogin(true);
          setIsProfileOpen(true);
        }}
        onLoginSuccess={(phone, name) => {
          setCustomerPhone(phone);
          setCustomerName(name);
          localStorage.setItem('ots_customer_phone', phone);
          localStorage.setItem('ots_customer_name', name);
        }}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Printable GST Bill Receipt Modal */}
      <BillReceiptModal
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        order={activeOrder}
        onTrackOrder={handleOpenTrackWithCode}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackingView
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
        initialOrderCode={trackingOrderCode}
        onViewBill={handleViewBillFromTracking}
      />

      {/* Customer Profile & Loyalty System */}
      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setPendingCheckoutAfterLogin(false);
        }}
        activeCustomerPhone={customerPhone}
        onLoginSuccess={(phone, name) => {
          setCustomerPhone(phone);
          setCustomerName(name);
          localStorage.setItem('ots_customer_phone', phone);
          localStorage.setItem('ots_customer_name', name);
          setIsProfileOpen(false);
          if (pendingCheckoutAfterLogin || cartCount > 0) {
            setPendingCheckoutAfterLogin(false);
            setIsCheckoutOpen(true);
          }
        }}
        onLogout={() => {
          setCustomerPhone('');
          setCustomerName('');
          localStorage.removeItem('ots_customer_phone');
          localStorage.removeItem('ots_customer_name');
          setPendingCheckoutAfterLogin(false);
        }}
        onTrackOrder={handleOpenTrackWithCode}
        onViewBill={handleViewBillFromTracking}
        onApplyCouponToCart={(code) => {
          setPreAppliedCoupon(code);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Staff & Manager Admin Console */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onViewBill={handleViewBillFromTracking}
        onMenuChanged={() => {
          api.getMenu().then((items) => {
            if (items && items.length > 0) {
              setMenuItems(items);
            }
          });
        }}
      />

      {/* Quick Menu Config Modal */}
      <MenuConfigModal
        isOpen={isOwnerConfigOpen}
        onClose={() => setIsOwnerConfigOpen(false)}
        menuItems={menuItems}
        onSaveMenuItems={handleSaveMenuItems}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
}
