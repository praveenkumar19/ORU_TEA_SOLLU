import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag, User, Clock } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  customerName?: string;
  onOpenOrderTray: () => void;
  onOpenCheckout: () => void;
  onOpenTrackOrder: () => void;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  customerName,
  onOpenOrderTray,
  onOpenCheckout,
  onOpenTrackOrder,
  onOpenProfile,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#151311]/95 backdrop-blur-md border-b border-[#C98242]/20 shadow-lg py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
        {/* Zone 1: Single Element Brand Wordmark */}
        <a
          href="#"
          className="text-xl md:text-2xl font-bold tracking-tight text-[#FFF3DF] font-serif-display whitespace-nowrap shrink-0 hover:text-[#C98242] transition-colors"
        >
          Oru Tea Sollu!
        </a>

        {/* Zone 2: Single-Line Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs md:text-sm font-medium text-[#FFF3DF]/80">
          <a
            href="#menu"
            className="hover:text-[#C98242] transition-colors whitespace-nowrap shrink-0"
          >
            Menu
          </a>
          <button
            onClick={onOpenTrackOrder}
            className="hover:text-[#C98242] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#C98242]" />
            <span>Track Order</span>
          </button>
          <button
            onClick={onOpenProfile}
            className="hover:text-[#C98242] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#C98242]" />
            <span>{customerName ? customerName.split(' ')[0] : 'Sign In'}</span>
          </button>
          <a
            href="#why-us"
            className="hover:text-[#C98242] transition-colors whitespace-nowrap shrink-0"
          >
            Our Story
          </a>
          <a
            href="#location"
            className="hover:text-[#C98242] transition-colors whitespace-nowrap shrink-0"
          >
            Contact
          </a>
        </nav>

        {/* Zone 3: Actions (Order Tray) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenOrderTray}
            className="px-4 py-2 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-semibold text-xs rounded-xl transition-all shadow-md hover:shadow-[#C98242]/20 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#151311] text-[#FFF3DF] text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Buttons */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenTrackOrder}
            aria-label="Track Order"
            className="p-2 text-[#FFF3DF] bg-[#24150F] border border-white/10 rounded-lg text-xs"
          >
            <Clock className="w-4 h-4 text-[#C98242]" />
          </button>

          <button
            onClick={onOpenOrderTray}
            aria-label="View Cart"
            className="p-2 text-[#FFF3DF] bg-[#24150F] border border-[#C98242]/30 rounded-lg relative text-xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#C98242]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E78B45] text-[#151311] text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 text-[#FFF3DF] hover:text-[#C98242] focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#151311]/98 border-b border-[#C98242]/30 px-6 py-5 mt-2 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-[#FFF3DF]">
            <a
              href="#menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-[#C98242] transition-colors"
            >
              Explore Menu
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTrackOrder();
              }}
              className="py-1 text-left flex items-center gap-2 hover:text-[#C98242] transition-colors"
            >
              <Clock className="w-4 h-4 text-[#C98242]" />
              <span>Track My Order</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="py-1 text-left flex items-center gap-2 hover:text-[#C98242] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#C98242]" />
              <span>{customerName ? `Profile (${customerName})` : 'Sign In / Register'}</span>
            </button>
            <a
              href="#why-us"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-[#C98242] transition-colors"
            >
              Our Story & Philosophy
            </a>
            <a
              href="#location"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-1 hover:text-[#C98242] transition-colors"
            >
              Location & Contact
            </a>
          </nav>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3 bg-[#C98242] text-[#151311] font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Proceed to Checkout ({cartCount} Items)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
