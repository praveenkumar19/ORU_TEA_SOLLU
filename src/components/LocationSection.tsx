import React from 'react';
import { CAFE_INFO } from '../data/menu';
import { MapPin, Phone, MessageSquare, Clock, Navigation, ExternalLink } from 'lucide-react';

export const LocationSection: React.FC = () => {
  return (
    <section id="location" className="py-24 bg-[#24150F] relative border-t border-[#C98242]/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
            <span>Visit Us in Ponmar</span>
            <span aria-hidden="true">·</span>
            <span>Chennai, Tamil Nadu</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
            Find Your Tea Spot.
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75 leading-relaxed">
            Conveniently situated in Ponmar, Chennai. Drop by for your morning eye-opener, a quick post-lunch cutting chai, or an evening snack session with friends.
          </p>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Details Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#151311] rounded-2xl p-8 border border-[#C98242]/20 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                  Cafe Name & Hub
                </span>
                <h3 className="text-2xl font-bold text-[#FFF3DF] font-serif-display">
                  {CAFE_INFO.name}
                </h3>
                <p className="text-xs text-[#FFF3DF]/60 mt-0.5">
                  &ldquo;{CAFE_INFO.tagline}&rdquo;
                </p>
              </div>

              {/* Address info */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-[#24150F] rounded-xl border border-white/5 text-[#C98242] shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242] mb-1">
                    Location
                  </h4>
                  <p className="text-sm text-[#FFF3DF] font-medium">
                    {CAFE_INFO.location}
                  </p>
                  <p className="text-xs text-[#FFF3DF]/60 mt-1">
                    Exact landmark details can be updated by cafe management.
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-[#24150F] rounded-xl border border-white/5 text-[#C98242] shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242] mb-1">
                    Hours of Operation
                  </h4>
                  <p className="text-sm text-[#FFF3DF] font-medium">
                    {CAFE_INFO.openingHours}
                  </p>
                  <p className="text-xs text-[#FFF3DF]/60 mt-1">
                    Hot chai and snacks available throughout the day.
                  </p>
                </div>
              </div>

              {/* Phone / WhatsApp */}
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-[#24150F] rounded-xl border border-white/5 text-[#C98242] shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C98242] mb-1">
                    Contact & Orders
                  </h4>
                  <p className="text-sm text-[#FFF3DF] font-medium font-mono">
                    {CAFE_INFO.phone}
                  </p>
                  <p className="text-xs text-[#FFF3DF]/60 mt-1">
                    Direct phone calls & WhatsApp orders welcome.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:${CAFE_INFO.phoneClean}`}
                className="flex-1 py-3 bg-[#24150F] hover:bg-[#341e15] border border-[#C98242]/40 text-[#FFF3DF] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-[#C98242]" />
                <span>Call Now</span>
              </a>

              <a
                href={CAFE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Simulated Interactive Map Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#151311] rounded-2xl p-8 border border-[#C98242]/20 flex flex-col justify-between overflow-hidden relative min-h-[380px]">
            {/* Visual Map Backdrop */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C98242" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Stylized road lines */}
                <path d="M 0 150 Q 250 80 500 220 T 1000 180" fill="none" stroke="#C98242" strokeWidth="2.5" />
                <path d="M 120 0 Q 300 300 450 600" fill="none" stroke="#E78B45" strokeWidth="2" />
                <path d="M 600 0 Q 400 250 800 500" fill="none" stroke="#506B45" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Map Card Header */}
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#C98242]">
                  <span>Ponmar Main Road Zone</span>
                  <span aria-hidden="true">·</span>
                  <span>Chennai 600127</span>
                </div>
                <span className="text-[11px] text-[#506B45] font-semibold bg-[#506B45]/20 border border-[#506B45]/40 px-2 py-0.5 rounded">
                  Open Today
                </span>
              </div>
            </div>

            {/* Map Center Pin Callout */}
            <div className="relative z-10 my-auto text-center py-8">
              <div className="w-16 h-16 bg-[#C98242]/20 border-2 border-[#C98242] rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <MapPin className="w-8 h-8 text-[#C98242]" />
              </div>
              <h4 className="text-xl font-bold text-[#FFF3DF] font-serif-display">
                Oru Tea Sollu! Cafe
              </h4>
              <p className="text-xs text-[#FFF3DF]/70 mt-1 max-w-sm mx-auto">
                Ponmar, Chennai, Tamil Nadu, India
              </p>
            </div>

            {/* Map Card Bottom Directions CTA */}
            <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#FFF3DF]/70">
                Ready to visit? Open Google Maps for live driving or walking navigation.
              </p>
              <a
                href={CAFE_INFO.mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
