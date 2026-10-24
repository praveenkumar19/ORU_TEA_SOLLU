export interface MenuItem {
  id: string;
  name: string;
  tamilName?: string;
  category: 'tea' | 'coffee' | 'snacks' | 'bites';
  price: number;
  description: string;
  badge?: string;
  available: boolean;
  image?: string;
}

export const CAFE_INFO = {
  name: 'Oru Tea Sollu!',
  tagline: 'Every Sip Has a Story.',
  secondaryTagline: 'Tea, Talks & Timeless Moments.',
  phone: '+91 90943 92300',
  phoneClean: '919094392300',
  whatsappUrl: 'https://wa.me/919094392300',
  location: 'Ponmar, Chennai, Tamil Nadu, India',
  mapsSearchUrl: 'https://www.google.com/maps/search/?api=1&query=Oru+Tea+Sollu+Ponmar+Chennai+Tamil+Nadu',
  openingHours: '6:00 AM – 10:30 PM (Daily)',
};

/**
 * Configurable menu items.
 * Note: These are sample menu items and prices until the cafe's actual menu and prices are confirmed.
 */
export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Tea Category
  {
    id: 'tea-classic',
    name: 'Classic Milk Tea',
    tamilName: 'பால் டீ',
    category: 'tea',
    price: 15,
    description: 'Freshly boiled full-cream milk brewed with premium CTC tea dust, poured with authentic frothy aeration.',
    badge: 'Kadai Special',
    available: true,
  },
  {
    id: 'tea-strong',
    name: 'Strong Tea',
    tamilName: 'ஸ்ட்ராங் டீ',
    category: 'tea',
    price: 18,
    description: 'Extra decoction brew with deep malt flavours, designed for serious tea drinkers needing that punchy morning kick.',
    badge: 'Popular',
    available: true,
  },
  {
    id: 'tea-ginger',
    name: 'Ginger Tea (Inji Chai)',
    tamilName: 'இஞ்சி டீ',
    category: 'tea',
    price: 20,
    description: 'Crushed fresh native ginger root simmered to perfection, warming your throat and refreshing your senses.',
    badge: 'Soothing',
    available: true,
  },
  {
    id: 'tea-cardamom',
    name: 'Cardamom Tea (Elaichi)',
    tamilName: 'ஏலக்காய் டீ',
    category: 'tea',
    price: 22,
    description: 'Fragrant green cardamom pods gently bruised and infused into piping hot milk tea with royal aroma.',
    badge: 'Aromatic',
    available: true,
  },
  {
    id: 'tea-masala',
    name: 'Masala Chai',
    tamilName: 'மசாலா டீ',
    category: 'tea',
    price: 25,
    description: 'Handcrafted blend of cinnamon, cloves, pepper, dry ginger, and cardamom simmered with slow-boiled milk.',
    badge: 'Signature',
    available: true,
  },
  {
    id: 'tea-black',
    name: 'Sulemani / Black Tea',
    tamilName: 'கருப்பு டீ',
    category: 'tea',
    price: 15,
    description: 'Clear golden-amber tea steeped light with a squeeze of fresh lemon and mint leaf for pure refreshment.',
    badge: 'Zero Milk',
    available: true,
  },

  // Coffee & Coolers
  {
    id: 'coffee-filter',
    name: 'Degree Filter Coffee',
    tamilName: 'பில்டர் காபி',
    category: 'coffee',
    price: 25,
    description: 'Traditional South Indian brass filter decoction blended with thick frothy milk and served in stainless steel tumbler.',
    badge: 'Traditional',
    available: true,
  },
  {
    id: 'drink-lime',
    name: 'Fresh Lime Juice / Soda',
    tamilName: 'எலுமிச்சை சாறு',
    category: 'coffee',
    price: 25,
    description: 'Hand-squeezed sun-ripened lemons served sweet, salted, or mixed with chilled soda water.',
    badge: 'Chilled',
    available: true,
  },
  {
    id: 'drink-nannari',
    name: 'Nannari Sarbath',
    tamilName: 'நன்னாரி சர்பத்',
    category: 'coffee',
    price: 30,
    description: 'Natural herbal sarsaparilla root extract chilled with fresh lemon juice and basil seeds (sabja).',
    badge: 'Summer Cooler',
    available: true,
  },

  // Hot Snacks
  {
    id: 'snack-samosa',
    name: 'Hot Vegetable Samosa',
    tamilName: 'காய்கறி சமோசா',
    category: 'snacks',
    price: 20,
    description: 'Golden flaky pyramid pastry packed with spiced potatoes, green peas, and fresh coriander. Served with mint chutney.',
    badge: 'Hot & Crisp',
    available: true,
  },
  {
    id: 'snack-vada',
    name: 'Crispy Medu Vada',
    tamilName: 'மெது வடை',
    category: 'snacks',
    price: 15,
    description: 'Golden crispy lentil doughnut with tender fluffy interior, spiced with cracked black pepper and curry leaves.',
    badge: 'Kadai Favourite',
    available: true,
  },
  {
    id: 'snack-bajji',
    name: 'Hot Onion & Mirchi Bajji',
    tamilName: 'வெங்காயம் & மிளகாய் பஜ்ஜி',
    category: 'snacks',
    price: 20,
    description: 'Gram flour batter-dipped fresh onions and spiced green chillies deep-fried golden hot straight from the wok.',
    badge: 'Evening Hot',
    available: true,
  },

  // Bakery & Bites
  {
    id: 'bite-biscuits',
    name: 'Osmania / Tea-Time Biscuits',
    tamilName: 'டீ பிஸ்கட்',
    category: 'bites',
    price: 10,
    description: 'Classic crumbly melt-in-mouth bakery biscuits, perfectly made to dip into your cutting chai.',
    badge: 'Chai Companion',
    available: true,
  },
  {
    id: 'bite-bun-butter',
    name: 'Bun Butter Jam',
    tamilName: 'பன் பட்டர் ஜாம்',
    category: 'bites',
    price: 30,
    description: 'Soft pillow milk bun generously stuffed with fresh butter and mixed fruit jam. The quintessential Chennai tea break.',
    badge: 'Nostalgic',
    available: true,
  },
  {
    id: 'bite-rusk',
    name: 'Cardamom Milk Rusk',
    tamilName: 'ரஸ்க்',
    category: 'bites',
    price: 15,
    description: 'Crunchy twice-baked milk bread infused with cardamom seeds for an unforgettable tea dip ritual.',
    badge: 'Crunchy',
    available: true,
  },
];

/**
 * Builds a readable URL-encoded prefilled WhatsApp order message.
 * Note: Cafe will confirm availability and final total upon receipt.
 */
export function buildWhatsAppOrderUrl(
  items: { item: MenuItem; quantity: number }[],
  customerNote: string = ''
): string {
  if (items.length === 0) {
    const generalText = encodeURIComponent(
      `Vanakkam Oru Tea Sollu! I would like to inquire about today's fresh chai and snacks at Ponmar.`
    );
    return `${CAFE_INFO.whatsappUrl}?text=${generalText}`;
  }

  let text = `*Vanakkam Oru Tea Sollu!* ☕\n\nI would like to place an order from your website:\n\n`;

  let totalEstimate = 0;
  items.forEach(({ item, quantity }) => {
    const lineTotal = item.price * quantity;
    totalEstimate += lineTotal;
    text += `• *${item.name}* x ${quantity} = ₹${lineTotal}\n`;
  });

  text += `\n*Estimated Total:* ₹${totalEstimate}\n`;

  if (customerNote.trim()) {
    text += `*Note:* ${customerNote.trim()}\n`;
  }

  text += `\n📍 *Pickup / Dine-in:* Ponmar, Chennai\n`;
  text += `_Please confirm item availability and preparation time. Nandri!_`;

  return `${CAFE_INFO.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
