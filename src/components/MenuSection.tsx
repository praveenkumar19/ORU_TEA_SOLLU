import React, { useState, useMemo } from 'react';
import { MenuItem, buildWhatsAppOrderUrl } from '../data/menu';
import { Coffee, Flame, Plus, Minus, Search, Check, MessageSquare, SlidersHorizontal } from 'lucide-react';

interface MenuSectionProps {
  menuItems: MenuItem[];
  cart: Record<string, number>;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  onOpenOrderTray: () => void;
  onOpenOwnerConfig: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  menuItems,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenOrderTray,
  onOpenOwnerConfig,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'tea' | 'coffee' | 'snacks' | 'bites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tamilName && item.tamilName.includes(searchQuery)) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const categories = [
    { key: 'all', label: 'All Items' },
    { key: 'tea', label: 'Fresh Chai & Tea' },
    { key: 'coffee', label: 'Coffee & Coolers' },
    { key: 'snacks', label: 'Hot Kadai Snacks' },
    { key: 'bites', label: 'Bakery & Bites' },
  ] as const;

  return (
    <section id="menu" className="relative py-24 bg-[#151311] border-t border-[#C98242]/15">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98242] uppercase mb-2">
              <span>Signature Ponmar Selection</span>
              <span aria-hidden="true">·</span>
              <span>Freshly Made</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-[#FFF3DF] font-serif-display text-balance">
              Made for Your Chai Break.
            </h2>
            <p className="mt-3 text-sm md:text-base text-[#FFF3DF]/75 max-w-xl">
              From our famous kadai cutting chai to piping hot evening samosas and crispy bajjis. Handcrafted daily in Ponmar, Chennai.
            </p>
          </div>

          {/* Search & Cafe Owner Config Trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FFF3DF]/40" />
              <input
                type="text"
                placeholder="Search tea or snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#24150F] border border-[#C98242]/30 rounded-lg text-xs text-[#FFF3DF] placeholder-[#FFF3DF]/40 focus:outline-none focus:border-[#C98242]"
              />
            </div>
            <button
              onClick={onOpenOwnerConfig}
              className="px-3 py-2 bg-[#24150F] hover:bg-[#341e15] border border-[#C98242]/30 rounded-lg text-xs text-[#C98242] hover:text-[#FFF3DF] flex items-center gap-1.5 whitespace-nowrap transition-colors"
              title="Cafe Owner Menu Editor"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Owner Edit</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs (Interactive Functional Buttons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeCategory === cat.key
                  ? 'bg-[#C98242] text-[#151311] font-semibold shadow-md'
                  : 'bg-[#24150F] text-[#FFF3DF]/80 hover:text-white hover:bg-[#2e1c14] border border-[#C98242]/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#24150F]/50 rounded-2xl border border-white/5">
            <p className="text-[#FFF3DF]/70 text-sm">No items found matching your search.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs text-[#C98242] underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const countInCart = cart[item.id] || 0;
              const directOrderUrl = buildWhatsAppOrderUrl([{ item, quantity: 1 }]);

              return (
                <div
                  key={item.id}
                  className="group bg-[#24150F] rounded-2xl p-5 border border-[#C98242]/20 hover:border-[#C98242]/60 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-[#C98242]/5"
                >
                  <div>
                    {/* Top Row: Unboxed clean metadata & Price */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs text-[#C98242]">
                        {item.badge && <span>{item.badge}</span>}
                        {item.tamilName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#FFF3DF]/50">{item.tamilName}</span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#FFF3DF] font-mono tabular-nums">
                          ₹{item.price}
                        </span>
                      </div>
                    </div>

                    {/* Item Name */}
                    <h3 className="text-lg font-bold text-[#FFF3DF] font-serif-display group-hover:text-[#C98242] transition-colors mb-2">
                      {item.name}
                    </h3>

                    {/* Short Description */}
                    <p className="text-xs text-[#FFF3DF]/70 leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Bottom: WhatsApp Quick Order & Quantity Controls */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <a
                      href={directOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#C98242] hover:text-[#E78B45] font-medium transition-colors"
                      title="Direct order this item on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Quantity Selector / Add to Cart */}
                    <div className="flex items-center gap-1.5">
                      {countInCart > 0 ? (
                        <div className="flex items-center bg-[#151311] border border-[#C98242]/40 rounded-lg p-0.5">
                          <button
                            onClick={() => onRemoveFromCart(item.id)}
                            className="p-1 hover:bg-[#24150F] rounded text-[#FFF3DF] transition-colors"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-[#FFF3DF] font-mono tabular-nums">
                            {countInCart}
                          </span>
                          <button
                            onClick={() => onAddToCart(item)}
                            className="p-1 hover:bg-[#24150F] rounded text-[#FFF3DF] transition-colors"
                            aria-label={`Increase ${item.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(item)}
                          className="px-3 py-1.5 bg-[#C98242]/20 hover:bg-[#C98242] text-[#C98242] hover:text-[#151311] border border-[#C98242]/40 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Tray</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer / Notice as required by prompt */}
        <div className="mt-12 p-4 bg-[#24150F]/70 border border-[#C98242]/20 rounded-xl text-center">
          <p className="text-xs text-[#FFF3DF]/60">
            * Sample menu items & prices shown for illustration. Final price and item availability are confirmed by the cafe upon WhatsApp order inquiry.
          </p>
        </div>
      </div>
    </section>
  );
};
