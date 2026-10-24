import React from 'react';
import { Coffee, Users, UtensilsCrossed, Sparkles } from 'lucide-react';

export const WhyUsSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Freshly Prepared',
      description: 'A comforting cup for your everyday tea break, brewed in small fresh batches throughout the day.',
      icon: Coffee,
      detail: 'Traditional kadai boiling technique with natural whole spices and rich milk.',
    },
    {
      num: '02',
      title: 'Your Local Hangout',
      description: 'A welcoming spot to meet friends, take a pause from work or college, and enjoy good conversations.',
      icon: Users,
      detail: 'Easy open seating, warm ambient lighting, and welcoming Tamil hospitality.',
    },
    {
      num: '03',
      title: 'Tea-Time Snacks',
      description: 'The perfect companions for your favourite drink, prepared golden hot straight from the kadai.',
      icon: UtensilsCrossed,
      detail: 'Samosas, crunchy medu vadas, crispy onion bajjis, and bakery rusks.',
    },
    {
      num: '04',
      title: 'Good Vibes Only',
      description: 'Simple moments, memorable conversations, and the timeless joy of sharing a cutting chai.',
      icon: Sparkles,
      detail: 'Every sip has a story — whether an early morning pause or an evening catchup.',
    },
  ];

  return (
    <section id="why-us" className="py-24 bg-[#151311] relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
            <span>Our Philosophy</span>
            <span aria-hidden="true">·</span>
            <span>Ponmar, Chennai</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
            Why Oru Tea Sollu?
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75 leading-relaxed">
            In Tamil culture, asking &ldquo;Oru Tea Sollu!&rdquo; is never just about the beverage — it is an invitation to connect, unwind, and share a story.
          </p>
        </div>

        {/* 4 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="bg-[#24150F] rounded-2xl p-6 border border-[#C98242]/20 hover:border-[#C98242]/50 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  {/* Top editorial numbering & icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-bold text-[#C98242] font-serif-display">
                      {pillar.num}
                    </span>
                    <div className="p-2.5 bg-[#151311] rounded-xl border border-white/5 text-[#FFF3DF] group-hover:text-[#C98242] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-[#FFF3DF] font-serif-display mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#FFF3DF]/80 leading-relaxed mb-4">
                    {pillar.description}
                  </p>
                </div>

                {/* Subtle detail note */}
                <div className="pt-4 border-t border-white/5 text-[11px] text-[#FFF3DF]/50 leading-normal">
                  {pillar.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
