import React from 'react';
import { Quote, MessageCircle, Star } from 'lucide-react';
import { CAFE_INFO } from '../data/menu';

interface PreviewReview {
  id: string;
  authorType: string;
  communityGroup: string;
  quote: string;
  favoriteItem: string;
}

const PREVIEW_STORIES: PreviewReview[] = [
  {
    id: 'rev-1',
    authorType: 'Ponmar Resident & Morning Walker',
    communityGroup: 'Neighbourhood Regular',
    quote: 'Nothing beats that first cutting chai after an early morning walk in Ponmar. The natural ginger spice clears the head and sets the tone for the entire day.',
    favoriteItem: 'Inji (Ginger) Chai',
  },
  {
    id: 'rev-2',
    authorType: 'Local Engineering Student',
    communityGroup: 'College Group',
    quote: 'Our evening project discussions always start with "Oru Tea Sollu!". Hot samosas, crispy bajjis, and unlimited laughs under the warm lighting.',
    favoriteItem: 'Strong Chai + Hot Samosa',
  },
  {
    id: 'rev-3',
    authorType: 'IT Professional & Weekend Explorer',
    communityGroup: 'Chai Enthusiast',
    quote: 'The foam aeration on their meter chai reminds me of classic roadside tea stalls, but in a clean, contemporary aesthetic. A wonderful neighbourhood gem.',
    favoriteItem: 'Classic Kadai Milk Tea',
  },
];

export const ReviewsSection: React.FC = () => {
  return (
    <section className="py-24 bg-[#151311] relative border-t border-[#C98242]/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
              <span>Community Stories</span>
              <span aria-hidden="true">·</span>
              <span>Ponmar Tea Lovers</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
              Every Sip Has a Story.
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75 max-w-xl">
              Preview impressions and community love from students, working professionals, and local families who make our cafe their daily pause.
            </p>
          </div>

          <div className="text-xs text-[#FFF3DF]/60 max-w-xs">
            * Curated community preview cards. Live Google reviews link will be integrated upon official grand opening.
          </div>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PREVIEW_STORIES.map((story) => (
            <div
              key={story.id}
              className="bg-[#24150F] rounded-2xl p-7 border border-[#C98242]/20 hover:border-[#C98242]/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-[#151311] rounded-lg border border-white/5 text-[#C98242]">
                    <Quote className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1 text-[#C98242]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[#FFF3DF]/85 leading-relaxed italic mb-6">
                  &ldquo;{story.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-sm font-semibold text-[#FFF3DF]">
                  {story.authorType}
                </h4>
                <div className="flex items-center justify-between text-xs text-[#C98242] mt-1">
                  <span>{story.communityGroup}</span>
                  <span className="text-[#FFF3DF]/50">Fav: {story.favoriteItem}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback CTA */}
        <div className="mt-12 text-center">
          <a
            href={CAFE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-[#C98242] hover:text-[#E78B45] font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Have feedback or want to leave a review for Oru Tea Sollu? Message us on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
