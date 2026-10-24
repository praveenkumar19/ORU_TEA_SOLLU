import React from 'react';
import { CAFE_INFO } from '../data/menu';
import { Phone, MessageSquare, MapPin, ArrowUp, Coffee, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#151311] border-t border-[#C98242]/20 text-[#FFF3DF] relative overflow-hidden">
      {/* Decorative tea leaf silhouette motif in background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C98242]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-serif-display text-[#FFF3DF]">
                Oru Tea Sollu!
              </span>
              <Coffee className="w-5 h-5 text-[#C98242]" />
            </div>

            <p className="text-sm font-medium text-[#C98242]">
              &ldquo;{CAFE_INFO.tagline}&rdquo;
            </p>

            <p className="text-xs text-[#FFF3DF]/70 max-w-sm leading-relaxed">
              Your neighbourhood modern Tamil tea cafe located in Ponmar, Chennai. Crafting fresh kadai chai, South Indian filter coffee, and golden hot snacks every day.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#FFF3DF]/60 pt-2">
              <MapPin className="w-4 h-4 text-[#C98242] shrink-0" />
              <span>{CAFE_INFO.location}</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-[#FFF3DF]/80">
              <li>
                <a href="#menu" className="hover:text-[#C98242] transition-colors">
                  Signature Menu
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-[#C98242] transition-colors">
                  Our Philosophy
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-[#C98242] transition-colors">
                  Cafe Atmosphere
                </a>
              </li>
              <li>
                <a href="#how-to-order" className="hover:text-[#C98242] transition-colors">
                  How to Order
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-[#C98242] transition-colors">
                  Location & Directions
                </a>
              </li>
            </ul>
          </div>

          {/* Cafe Hours & Specialties */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242]">
              Brewing Timings
            </h4>
            <div className="space-y-2 text-xs text-[#FFF3DF]/80">
              <p className="font-semibold text-[#FFF3DF]">Monday – Sunday</p>
              <p className="text-[#C98242] font-mono">6:00 AM – 10:30 PM</p>
              <div className="pt-2 text-[11px] text-[#FFF3DF]/60">
                Fresh chai batches boiled every 15 minutes. Evening hot bajjis start from 4:30 PM.
              </div>
            </div>
          </div>

          {/* Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242]">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs text-[#FFF3DF]/80">
              <a
                href={`tel:${CAFE_INFO.phoneClean}`}
                className="flex items-center gap-2 hover:text-[#C98242] transition-colors font-mono"
              >
                <Phone className="w-3.5 h-3.5 text-[#C98242]" />
                <span>{CAFE_INFO.phone}</span>
              </a>

              <a
                href={CAFE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-[#C98242] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Chat on WhatsApp</span>
              </a>

              <p className="text-[11px] text-[#FFF3DF]/50 pt-2">
                Ponmar, Chennai 600127, Tamil Nadu, India.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFF3DF]/60">
          <div>
            &copy; {currentYear} <span className="text-[#FFF3DF] font-medium">Oru Tea Sollu!</span>. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 text-[#FFF3DF]/40 hover:text-[#C98242] transition-colors text-[11px]"
                title="Authorized Cafe Staff Portal"
              >
                <Lock className="w-3 h-3 text-[#C98242]" />
                <span>Staff Access</span>
              </button>
            )}
            <span>Made with ❤️ for Chennai Chai Lovers</span>
            <button
              onClick={scrollToTop}
              className="p-2 bg-[#24150F] hover:bg-[#341e15] border border-white/10 rounded-lg text-[#FFF3DF] hover:text-[#C98242] transition-colors flex items-center gap-1"
              aria-label="Scroll back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
