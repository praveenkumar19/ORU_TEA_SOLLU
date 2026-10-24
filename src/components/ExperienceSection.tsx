import React, { useState } from 'react';
import { Eye, X, ZoomIn } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  description: string;
  aspect: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'pour',
    title: 'The Art of the Meter Chai',
    category: 'Craft & Aeration',
    imageSrc: '/src/assets/images/meter_chai_pour_1792772077431.jpg',
    description: 'Stretched between stainless steel tumblers to create that velvety, naturally aerated froth.',
    aspect: 'aspect-4/3',
  },
  {
    id: 'ambiance',
    title: 'Ponmar Cafe Sanctuary',
    category: 'Atmosphere & Design',
    imageSrc: '/src/assets/images/cafe_ambiance_interior_1792772077219.jpg',
    description: 'Polished teak wood counters, brass tea urns, and warm amber illumination designed for relaxing breaks.',
    aspect: 'aspect-16/9',
  },
  {
    id: 'snacks',
    title: 'Fresh Kadai Hot Platter',
    category: 'Culinary Companions',
    imageSrc: '/src/assets/images/south_indian_snacks_1792772077962.jpg',
    description: 'Golden samosas, crunchy medu vadai, and onion bajjis served on banana leaf with mint dip.',
    aspect: 'aspect-4/3',
  },
  {
    id: 'friends',
    title: 'Tea, Talks & Memories',
    category: 'Social Heartbeat',
    imageSrc: '/src/assets/images/tea_kadai_friends_1792772078332.jpg',
    description: 'Where college students, techies, and neighbourhood friends meet over glasses of hot chai.',
    aspect: 'aspect-4/3',
  },
];

export const ExperienceSection: React.FC = () => {
  const [activePhoto, setActivePhoto] = useState<GalleryItem | null>(null);

  return (
    <section id="experience" className="py-24 bg-[#24150F] relative border-t border-[#C98242]/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
              <span>The Chennai Cafe Vibe</span>
              <span aria-hidden="true">·</span>
              <span>Visual Gallery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
              The Oru Tea Sollu Experience.
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75 max-w-xl">
              Step into the warm comfort of a Tamil tea kadai reimagined for the modern world. Brass accents, rich wood, and the unmistakable aroma of boiling spices.
            </p>
          </div>

          <div className="text-xs text-[#FFF3DF]/60 max-w-xs">
            Concept & photography captures the authentic Ponmar cafe atmosphere.
          </div>
        </div>

        {/* Gallery Grid (Bento Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Large Card (Ambiance) */}
          <div
            onClick={() => setActivePhoto(GALLERY_ITEMS[1])}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl cursor-pointer bg-[#151311] border border-white/10 hover:border-[#C98242]/50 transition-all duration-300"
          >
            <div className="relative aspect-16/9 md:aspect-21/9 overflow-hidden">
              <img
                src={GALLERY_ITEMS[1].imageSrc}
                alt={GALLERY_ITEMS[1].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 flex items-end justify-between">
              <div>
                <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                  {GALLERY_ITEMS[1].category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-[#FFF3DF] font-serif-display">
                  {GALLERY_ITEMS[1].title}
                </h3>
                <p className="text-xs md:text-sm text-[#FFF3DF]/80 mt-1 max-w-lg">
                  {GALLERY_ITEMS[1].description}
                </p>
              </div>

              <div className="p-3 bg-[#C98242] text-[#151311] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Meter Chai Card */}
          <div
            onClick={() => setActivePhoto(GALLERY_ITEMS[0])}
            className="group relative overflow-hidden rounded-2xl cursor-pointer bg-[#151311] border border-white/10 hover:border-[#C98242]/50 transition-all duration-300"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <img
                src={GALLERY_ITEMS[0].imageSrc}
                alt={GALLERY_ITEMS[0].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
              <div>
                <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                  {GALLERY_ITEMS[0].category}
                </span>
                <h3 className="text-lg font-bold text-[#FFF3DF] font-serif-display">
                  {GALLERY_ITEMS[0].title}
                </h3>
                <p className="text-xs text-[#FFF3DF]/80 mt-1">
                  {GALLERY_ITEMS[0].description}
                </p>
              </div>
              <div className="p-2 bg-[#C98242] text-[#151311] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Snacks Card */}
          <div
            onClick={() => setActivePhoto(GALLERY_ITEMS[2])}
            className="group relative overflow-hidden rounded-2xl cursor-pointer bg-[#151311] border border-white/10 hover:border-[#C98242]/50 transition-all duration-300"
          >
            <div className="relative aspect-4/3 overflow-hidden">
              <img
                src={GALLERY_ITEMS[2].imageSrc}
                alt={GALLERY_ITEMS[2].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between">
              <div>
                <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                  {GALLERY_ITEMS[2].category}
                </span>
                <h3 className="text-lg font-bold text-[#FFF3DF] font-serif-display">
                  {GALLERY_ITEMS[2].title}
                </h3>
                <p className="text-xs text-[#FFF3DF]/80 mt-1">
                  {GALLERY_ITEMS[2].description}
                </p>
              </div>
              <div className="p-2 bg-[#C98242] text-[#151311] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Hangout Friends Card */}
          <div
            onClick={() => setActivePhoto(GALLERY_ITEMS[3])}
            className="md:col-span-2 group relative overflow-hidden rounded-2xl cursor-pointer bg-[#151311] border border-white/10 hover:border-[#C98242]/50 transition-all duration-300"
          >
            <div className="relative aspect-16/9 md:aspect-21/9 overflow-hidden">
              <img
                src={GALLERY_ITEMS[3].imageSrc}
                alt={GALLERY_ITEMS[3].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>

            <div className="absolute bottom-0 inset-x-0 p-6 flex items-end justify-between">
              <div>
                <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                  {GALLERY_ITEMS[3].category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-[#FFF3DF] font-serif-display">
                  {GALLERY_ITEMS[3].title}
                </h3>
                <p className="text-xs md:text-sm text-[#FFF3DF]/80 mt-1 max-w-lg">
                  {GALLERY_ITEMS[3].description}
                </p>
              </div>
              <div className="p-3 bg-[#C98242] text-[#151311] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-[#151311] rounded-2xl overflow-hidden border border-[#C98242]/30 shadow-2xl">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePhoto.imageSrc}
              alt={activePhoto.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[75vh] object-contain bg-black/40"
            />
            <div className="p-6 bg-[#24150F]">
              <span className="text-xs text-[#C98242] font-semibold uppercase tracking-wider block mb-1">
                {activePhoto.category}
              </span>
              <h3 className="text-xl font-bold text-[#FFF3DF] font-serif-display">
                {activePhoto.title}
              </h3>
              <p className="text-xs md:text-sm text-[#FFF3DF]/80 mt-2">
                {activePhoto.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
