import React from 'react';
import { CAFE_INFO } from '../data/menu';
import { Search, ShoppingBag, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface HowToOrderProps {
  onOpenOrderTray: () => void;
}

export const HowToOrderSection: React.FC<HowToOrderProps> = ({ onOpenOrderTray }) => {
  const steps = [
    {
      step: 'Step 01',
      title: 'Explore the Menu',
      description: 'Browse our signature kadai teas, fresh milk beverages, and evening hot snacks.',
      icon: Search,
      action: 'Browse items above',
    },
    {
      step: 'Step 02',
      title: 'Choose Tea & Snacks',
      description: 'Add your preferred cutting chai and treats to your order tray with a single click.',
      icon: ShoppingBag,
      action: 'Click "Add to Tray"',
    },
    {
      step: 'Step 03',
      title: 'Send via WhatsApp',
      description: 'Review your prefilled order summary and send directly to our Ponmar counter.',
      icon: MessageSquare,
      action: 'Chat on WhatsApp',
    },
  ];

  return (
    <section id="how-to-order" className="py-24 bg-[#151311] relative border-t border-[#C98242]/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
            <span>Seamless & Simple</span>
            <span aria-hidden="true">·</span>
            <span>Zero App Download</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
            How to Order in 3 Steps.
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75">
            Skip long wait times. Send your tea order directly to our kadai counter via WhatsApp.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-[#24150F] rounded-2xl p-8 border border-[#C98242]/20 hover:border-[#C98242]/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-semibold text-[#C98242] tracking-wider uppercase">
                      {item.step}
                    </span>
                    <div className="p-3 bg-[#151311] rounded-xl border border-white/5 text-[#FFF3DF] group-hover:text-[#C98242] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#FFF3DF] font-serif-display mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#FFF3DF]/75 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#C98242] font-medium">
                  <span>{item.action}</span>
                  {index < 2 ? (
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#C98242] transition-colors" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#506B45]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Central WhatsApp Action CTA Banner */}
        <div className="bg-[#24150F] rounded-2xl p-8 md:p-10 border border-[#C98242]/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-xl md:text-2xl font-bold text-[#FFF3DF] font-serif-display">
              Ready for a Fresh Chai Break?
            </h4>
            <p className="text-xs md:text-sm text-[#FFF3DF]/75 mt-1">
              Connect directly with our tea masters at Ponmar, Chennai on <span className="text-[#C98242] font-semibold">+91 90943 92300</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenOrderTray}
              className="px-6 py-3.5 bg-[#C98242] hover:bg-[#E78B45] text-[#151311] font-semibold text-xs rounded-xl transition-all shadow-md whitespace-nowrap"
            >
              Open Order Tray
            </button>
            <a
              href={CAFE_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Reassurance text */}
        <p className="text-center text-[11px] text-[#FFF3DF]/50 mt-4">
          Note: Final prices and item availability are confirmed by the cafe upon order reception. No online payment required beforehand.
        </p>
      </div>
    </section>
  );
};
