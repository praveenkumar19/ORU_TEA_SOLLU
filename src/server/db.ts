import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'oru_tea_sollu.db');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for concurrency & performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize all database schemas, constraints, and seed data.
 */
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      flat_no TEXT NOT NULL,
      street TEXT NOT NULL,
      landmark TEXT,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tamil_name TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      description TEXT NOT NULL,
      badge TEXT,
      available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS order_id_counters (
      type TEXT PRIMARY KEY,
      current_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      tracking_token TEXT UNIQUE NOT NULL,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_type TEXT NOT NULL, -- 'dine_in' or 'delivery'
      delivery_address TEXT,
      delivery_instructions TEXT,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      delivery_charge REAL NOT NULL DEFAULT 0,
      cgst REAL NOT NULL DEFAULT 0,
      sgst REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'cash' or 'upi'
      payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'paid'
      status TEXT NOT NULL DEFAULT 'placed', -- 'placed', 'awaiting_confirmation', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'
      rejection_reason TEXT,
      estimated_minutes INTEGER DEFAULT 15,
      coupon_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'fixed', -- 'fixed' or 'percentage'
      discount_value REAL NOT NULL,
      min_subtotal REAL NOT NULL DEFAULT 0,
      qualifying_order_id TEXT,
      issued_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'redeemed', 'expired'
      redeemed_order_id TEXT,
      redeemed_at TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS loyalty_milestones (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      milestone_count INTEGER NOT NULL,
      reward_description TEXT NOT NULL,
      coupon_id TEXT,
      achieved_at TEXT NOT NULL,
      UNIQUE (customer_id, milestone_count),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_config (
      id TEXT PRIMARY KEY,
      base_fee REAL NOT NULL,
      min_order REAL NOT NULL,
      free_threshold REAL NOT NULL,
      eligible_pincodes TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      estimated_time_mins INTEGER DEFAULT 25
    );

    CREATE TABLE IF NOT EXISTS tax_config (
      id TEXT PRIMARY KEY,
      cgst_rate REAL NOT NULL,
      sgst_rate REAL NOT NULL,
      is_inclusive INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admin_config (
      id TEXT PRIMARY KEY,
      passkey TEXT NOT NULL,
      upi_vpa TEXT,
      upi_name TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default counters if empty
  const countRow = db.prepare('SELECT count(*) as count FROM order_id_counters').get() as { count: number };
  if (countRow.count === 0) {
    db.exec(`
      INSERT INTO order_id_counters (type, current_value) VALUES
      ('dine_in', 101),
      ('delivery', 0);
    `);
  }

  // Seed delivery config if empty
  const delivRow = db.prepare('SELECT count(*) as count FROM delivery_config').get() as { count: number };
  if (delivRow.count === 0) {
    db.prepare(`
      INSERT INTO delivery_config (id, base_fee, min_order, free_threshold, eligible_pincodes, is_enabled, estimated_time_mins)
      VALUES ('default', 20.00, 50.00, 300.00, '600127,600126,600130,600048,600119,600073', 1, 25)
    `).run();
  }

  // Seed tax config (5% restaurant GST: 2.5% CGST + 2.5% SGST)
  const taxRow = db.prepare('SELECT count(*) as count FROM tax_config').get() as { count: number };
  if (taxRow.count === 0) {
    db.prepare(`
      INSERT INTO tax_config (id, cgst_rate, sgst_rate, is_inclusive)
      VALUES ('default', 2.5, 2.5, 0)
    `).run();
  }

  // Seed admin config (Default staff passkey: '92300' matching cafe phone suffix)
  const adminRow = db.prepare('SELECT count(*) as count FROM admin_config').get() as { count: number };
  if (adminRow.count === 0) {
    db.prepare(`
      INSERT INTO admin_config (id, passkey, upi_vpa, upi_name)
      VALUES ('default', '92300', '9094392300@upi', 'Oru Tea Sollu')
    `).run();
  }

  // Seed menu items if empty
  const menuRow = db.prepare('SELECT count(*) as count FROM menu_items').get() as { count: number };
  if (menuRow.count === 0) {
    const insertMenu = db.prepare(`
      INSERT INTO menu_items (id, name, tamil_name, category, price, description, badge, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialItems = [
      ['tea-classic', 'Classic Milk Tea', 'பால் டீ', 'tea', 15.00, 'Freshly boiled full-cream milk brewed with premium CTC tea dust, poured with authentic frothy aeration.', 'Kadai Special', 1],
      ['tea-strong', 'Strong Tea', 'ஸ்ட்ராங் டீ', 'tea', 18.00, 'Extra decoction brew with deep malt flavours, designed for serious tea drinkers needing that punchy morning kick.', 'Popular', 1],
      ['tea-ginger', 'Ginger Tea (Inji Chai)', 'இஞ்சி டீ', 'tea', 20.00, 'Crushed fresh native ginger root simmered to perfection, warming your throat and refreshing your senses.', 'Soothing', 1],
      ['tea-cardamom', 'Cardamom Tea (Elaichi)', 'ஏலக்காய் டீ', 'tea', 22.00, 'Fragrant green cardamom pods gently bruised and infused into piping hot milk tea with royal aroma.', 'Aromatic', 1],
      ['tea-masala', 'Masala Chai', 'மசாலா டீ', 'tea', 25.00, 'Handcrafted blend of cinnamon, cloves, pepper, dry ginger, and cardamom simmered with slow-boiled milk.', 'Signature', 1],
      ['tea-black', 'Sulemani / Black Tea', 'கருப்பு டீ', 'tea', 15.00, 'Clear golden-amber tea steeped light with a squeeze of fresh lemon and mint leaf for pure refreshment.', 'Zero Milk', 1],
      ['coffee-filter', 'Degree Filter Coffee', 'பில்டர் காபி', 'coffee', 25.00, 'Traditional South Indian brass filter decoction blended with thick frothy milk and served in stainless steel tumbler.', 'Traditional', 1],
      ['drink-lime', 'Fresh Lime Juice / Soda', 'எலுமிச்சை சாறு', 'coffee', 25.00, 'Hand-squeezed sun-ripened lemons served sweet, salted, or mixed with chilled soda water.', 'Chilled', 1],
      ['drink-nannari', 'Nannari Sarbath', 'நன்னாரி சர்பத்', 'coffee', 30.00, 'Natural herbal sarsaparilla root extract chilled with fresh lemon juice and basil seeds (sabja).', 'Summer Cooler', 1],
      ['snack-samosa', 'Hot Vegetable Samosa', 'காய்கறி சமோசா', 'snacks', 20.00, 'Golden flaky pyramid pastry packed with spiced potatoes, green peas, and fresh coriander. Served with mint chutney.', 'Hot & Crisp', 1],
      ['snack-vada', 'Crispy Medu Vada', 'மெது வடை', 'snacks', 15.00, 'Golden crispy lentil doughnut with tender fluffy interior, spiced with cracked black pepper and curry leaves.', 'Kadai Favourite', 1],
      ['snack-bajji', 'Hot Onion & Mirchi Bajji', 'வெங்காயம் & மிளகாய் பஜ்ஜி', 'snacks', 20.00, 'Gram flour batter-dipped fresh onions and spiced green chillies deep-fried golden hot straight from the wok.', 'Evening Hot', 1],
      ['bite-biscuits', 'Osmania / Tea-Time Biscuits', 'டீ பிஸ்கட்', 'bites', 10.00, 'Classic crumbly melt-in-mouth bakery biscuits, perfectly made to dip into your cutting chai.', 'Chai Companion', 1],
      ['bite-bun-butter', 'Bun Butter Jam', 'பன் பட்டர் ஜாம்', 'bites', 30.00, 'Soft pillow milk bun generously stuffed with fresh butter and mixed fruit jam. The quintessential Chennai tea break.', 'Nostalgic', 1],
      ['bite-rusk', 'Cardamom Milk Rusk', 'ரஸ்க்', 'bites', 15.00, 'Crunchy twice-baked milk bread infused with cardamom seeds for an unforgettable tea dip ritual.', 'Crunchy', 1],
    ];

    for (const item of initialItems) {
      insertMenu.run(...item);
    }
  }

  // Column migration for cost_price if table already existed
  try {
    db.exec('ALTER TABLE menu_items ADD COLUMN cost_price REAL DEFAULT 0;');
  } catch {
    // column already exists
  }

  // Populate realistic default cost prices (ingredients & preparation costs) if zero or null
  db.exec(`
    UPDATE menu_items SET cost_price = 7.00 WHERE id = 'tea-classic' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 8.00 WHERE id = 'tea-strong' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 9.00 WHERE id = 'tea-ginger' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 10.00 WHERE id = 'tea-cardamom' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 11.00 WHERE id = 'tea-masala' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 5.00 WHERE id = 'tea-black' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 12.00 WHERE id = 'coffee-filter' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 8.00 WHERE id = 'drink-lime' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 11.00 WHERE id = 'drink-nannari' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 9.00 WHERE id = 'snack-samosa' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 6.00 WHERE id = 'snack-vada' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 8.00 WHERE id = 'snack-bajji' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 4.00 WHERE id = 'bite-biscuits' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 13.00 WHERE id = 'bite-bun-butter' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = 6.00 WHERE id = 'bite-rusk' AND (cost_price IS NULL OR cost_price = 0);
    UPDATE menu_items SET cost_price = ROUND(price * 0.45, 1) WHERE cost_price IS NULL OR cost_price = 0;
  `);

  // Seed sample analytics orders if orders table has few records so staff can immediately see monthly trends
  const ordersCountRow = db.prepare('SELECT count(*) as count FROM orders').get() as { count: number };
  if (ordersCountRow.count < 6) {
    const seedOrders = [
      // October 2026 orders
      {
        id: 'ord_seed_oct_1',
        code: 'P@98',
        token: 'tok_oct_1',
        name: 'Vignesh Kumar',
        phone: '9094392300',
        type: 'dine_in',
        subtotal: 140.00,
        discount: 0,
        delivery: 0,
        cgst: 3.50,
        sgst: 3.50,
        total: 147.00,
        payment: 'upi',
        status: 'delivered',
        date: '2026-10-18T10:15:00.000Z',
        items: [
          { id: 'tea-classic', name: 'Classic Milk Tea', price: 15.00, qty: 4, total: 60.00 },
          { id: 'snack-samosa', name: 'Hot Vegetable Samosa', price: 20.00, qty: 4, total: 80.00 },
        ],
      },
      {
        id: 'ord_seed_oct_2',
        code: 'DEL-20261020-0012',
        token: 'tok_oct_2',
        name: 'Praveen Raj',
        phone: '9840123456',
        type: 'delivery',
        subtotal: 220.00,
        discount: 20.00,
        delivery: 20.00,
        cgst: 5.00,
        sgst: 5.00,
        total: 230.00,
        payment: 'cash',
        status: 'delivered',
        date: '2026-10-20T16:30:00.000Z',
        items: [
          { id: 'tea-masala', name: 'Masala Chai', price: 25.00, qty: 4, total: 100.00 },
          { id: 'snack-bajji', name: 'Hot Onion & Mirchi Bajji', price: 20.00, qty: 3, total: 60.00 },
          { id: 'bite-bun-butter', name: 'Bun Butter Jam', price: 30.00, qty: 2, total: 60.00 },
        ],
      },
      {
        id: 'ord_seed_oct_3',
        code: 'P@99',
        token: 'tok_oct_3',
        name: 'Kavitha S',
        phone: '9789012345',
        type: 'dine_in',
        subtotal: 105.00,
        discount: 0,
        delivery: 0,
        cgst: 2.62,
        sgst: 2.62,
        total: 110.24,
        payment: 'upi',
        status: 'delivered',
        date: '2026-10-22T17:45:00.000Z',
        items: [
          { id: 'tea-ginger', name: 'Ginger Tea (Inji Chai)', price: 20.00, qty: 3, total: 60.00 },
          { id: 'snack-vada', name: 'Crispy Medu Vada', price: 15.00, qty: 3, total: 45.00 },
        ],
      },
      // September 2026 orders
      {
        id: 'ord_seed_sep_1',
        code: 'P@82',
        token: 'tok_sep_1',
        name: 'Suresh Babu',
        phone: '9123456780',
        type: 'dine_in',
        subtotal: 340.00,
        discount: 0,
        delivery: 0,
        cgst: 8.50,
        sgst: 8.50,
        total: 357.00,
        payment: 'cash',
        status: 'delivered',
        date: '2026-09-14T09:20:00.000Z',
        items: [
          { id: 'coffee-filter', name: 'Degree Filter Coffee', price: 25.00, qty: 6, total: 150.00 },
          { id: 'snack-samosa', name: 'Hot Vegetable Samosa', price: 20.00, qty: 5, total: 100.00 },
          { id: 'bite-bun-butter', name: 'Bun Butter Jam', price: 30.00, qty: 3, total: 90.00 },
        ],
      },
      {
        id: 'ord_seed_sep_2',
        code: 'DEL-20260925-0008',
        token: 'tok_sep_2',
        name: 'Anand Natarajan',
        phone: '9841238910',
        type: 'delivery',
        subtotal: 420.00,
        discount: 40.00,
        delivery: 0,
        cgst: 9.50,
        sgst: 9.50,
        total: 399.00,
        payment: 'upi',
        status: 'delivered',
        date: '2026-09-25T15:10:00.000Z',
        items: [
          { id: 'tea-masala', name: 'Masala Chai', price: 25.00, qty: 8, total: 200.00 },
          { id: 'tea-ginger', name: 'Ginger Tea (Inji Chai)', price: 20.00, qty: 5, total: 100.00 },
          { id: 'snack-bajji', name: 'Hot Onion & Mirchi Bajji', price: 20.00, qty: 6, total: 120.00 },
        ],
      },
      // August 2026 orders
      {
        id: 'ord_seed_aug_1',
        code: 'P@65',
        token: 'tok_aug_1',
        name: 'Deepak V',
        phone: '9940129988',
        type: 'dine_in',
        subtotal: 260.00,
        discount: 0,
        delivery: 0,
        cgst: 6.50,
        sgst: 6.50,
        total: 273.00,
        payment: 'upi',
        status: 'delivered',
        date: '2026-08-19T18:00:00.000Z',
        items: [
          { id: 'tea-classic', name: 'Classic Milk Tea', price: 15.00, qty: 8, total: 120.00 },
          { id: 'snack-vada', name: 'Crispy Medu Vada', price: 15.00, qty: 6, total: 90.00 },
          { id: 'bite-rusk', name: 'Cardamom Milk Rusk', price: 15.00, qty: 3, total: 45.00 },
          { id: 'bite-biscuits', name: 'Osmania / Tea-Time Biscuits', price: 10.00, qty: 1, total: 10.00 },
        ],
      },
    ];

    const insertOrderStmt = db.prepare(`
      INSERT OR IGNORE INTO orders (
        id, order_code, tracking_token, customer_id, customer_name, customer_phone,
        order_type, delivery_address, delivery_instructions, subtotal, discount,
        delivery_charge, cgst, sgst, grand_total, payment_method, payment_status,
        status, estimated_minutes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, 'paid', ?, 15, ?, ?)
    `);

    const insertItemStmt = db.prepare(`
      INSERT OR IGNORE INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of seedOrders) {
      insertOrderStmt.run(
        o.id,
        o.code,
        o.token,
        'cust_' + o.phone,
        o.name,
        o.phone,
        o.type,
        o.subtotal,
        o.discount,
        o.delivery,
        o.cgst,
        o.sgst,
        o.total,
        o.payment,
        o.status,
        o.date,
        o.date
      );

      for (let idx = 0; idx < o.items.length; idx++) {
        const item = o.items[idx];
        insertItemStmt.run(
          `it_${o.id}_${idx}`,
          o.id,
          item.id,
          item.name,
          item.price,
          item.qty,
          item.total
        );
      }
    }
  }
}

/**
 * Transactionally generates a unique, persistent order ID.
 * - Dine-in format: P@102, P@103, P@104... (guaranteed monotonic from DB counter)
 * - Parcel format: DEL-YYYYMMDD-XXXX (e.g. DEL-20261023-0001)
 */
export function generateNextOrderId(orderType: 'dine_in' | 'delivery'): string {
  if (orderType === 'dine_in') {
    db.exec('BEGIN IMMEDIATE;');
    try {
      const row = db.prepare("SELECT current_value FROM order_id_counters WHERE type = 'dine_in'").get() as { current_value: number };
      const nextVal = (row ? row.current_value : 101) + 1;
      db.prepare("UPDATE order_id_counters SET current_value = ? WHERE type = 'dine_in'").run(nextVal);
      db.exec('COMMIT;');
      return `P@${nextVal}`;
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }
  } else {
    db.exec('BEGIN IMMEDIATE;');
    try {
      const row = db.prepare("SELECT current_value FROM order_id_counters WHERE type = 'delivery'").get() as { current_value: number };
      const nextVal = (row ? row.current_value : 0) + 1;
      db.prepare("UPDATE order_id_counters SET current_value = ? WHERE type = 'delivery'").run(nextVal);
      db.exec('COMMIT;');

      // Format date in Asia/Kolkata YYYYMMDD
      const now = new Date();
      const istString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).replace(/-/g, '');
      const paddedNum = String(nextVal).padStart(4, '0');
      return `DEL-${istString}-${paddedNum}`;
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }
  }
}
