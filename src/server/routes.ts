import express from 'express';
import crypto from 'node:crypto';
import { db, generateNextOrderId } from './db.js';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Helper: Normalize 10-digit Indian phone
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

// Helper: Format IST ISO-like string
function getIstDate(d = new Date()): string {
  return d.toISOString();
}

/**
 * 1. GET /api/menu - Public active menu items
 */
apiRouter.get('/menu', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM menu_items ORDER BY category ASC, price ASC').all();
    res.json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. POST /api/orders/calculate - Authoritative server-side price & tax calculation
 */
apiRouter.post('/orders/calculate', (req, res) => {
  try {
    const { items, orderType, pincode, couponCode, customerPhone } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart cannot be empty.' });
    }

    // 1. Fetch current menu prices from DB
    let merchandiseSubtotal = 0;
    const validatedItems = [];

    const getMenuItem = db.prepare('SELECT id, name, price, available FROM menu_items WHERE id = ?');

    for (const item of items) {
      const dbItem = getMenuItem.get(item.id) as { id: string; name: string; price: number; available: number } | undefined;
      if (!dbItem) {
        return res.status(400).json({ success: false, error: `Invalid item ID: ${item.id}` });
      }
      if (!dbItem.available) {
        return res.status(400).json({ success: false, error: `${dbItem.name} is currently sold out.` });
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const lineTotal = Math.round(dbItem.price * qty * 100) / 100;
      merchandiseSubtotal += lineTotal;

      validatedItems.push({
        id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        lineTotal,
      });
    }

    merchandiseSubtotal = Math.round(merchandiseSubtotal * 100) / 100;

    // 2. Delivery configuration & eligibility
    const delivConfig = db.prepare('SELECT * FROM delivery_config WHERE id = ?').get('default') as any;
    let deliveryCharge = 0;
    let isDeliveryEligible = true;
    let deliveryError = '';

    if (orderType === 'delivery') {
      const allowedPins = delivConfig.eligible_pincodes.split(',').map((p: string) => p.trim());
      const cleanPin = (pincode || '').trim();

      if (!cleanPin) {
        isDeliveryEligible = false;
        deliveryError = 'Please enter your delivery PIN code.';
      } else if (!allowedPins.includes(cleanPin)) {
        isDeliveryEligible = false;
        deliveryError = `Delivery currently unavailable at PIN code ${cleanPin}. We deliver to Ponmar & nearby areas (${allowedPins.join(', ')}).`;
      } else if (merchandiseSubtotal < delivConfig.min_order) {
        isDeliveryEligible = false;
        deliveryError = `Minimum order amount for delivery is ₹${delivConfig.min_order}.`;
      } else {
        // Free delivery if above threshold
        if (merchandiseSubtotal >= delivConfig.free_threshold) {
          deliveryCharge = 0;
        } else {
          deliveryCharge = delivConfig.base_fee;
        }
      }
    } else {
      // Dine-in orders strictly ₹0 delivery charge
      deliveryCharge = 0;
    }

    // 3. Coupon validation & discount
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode && customerPhone) {
      const cleanPhone = normalizePhone(customerPhone);
      const customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone) as { id: string } | undefined;

      if (customer) {
        const coupon = db.prepare(`
          SELECT * FROM coupons
          WHERE code = ? AND customer_id = ? AND status = 'active'
        `).get(couponCode.trim(), customer.id) as any;

        if (coupon) {
          const now = new Date();
          const expiresAt = new Date(coupon.expires_at);

          if (now > expiresAt) {
            // Expired
            db.prepare("UPDATE coupons SET status = 'expired' WHERE id = ?").run(coupon.id);
          } else if (merchandiseSubtotal < coupon.min_subtotal) {
            // Does not meet minimum order
          } else {
            if (coupon.discount_type === 'percentage') {
              discount = Math.round((merchandiseSubtotal * (coupon.discount_value / 100)) * 100) / 100;
            } else {
              discount = Math.min(coupon.discount_value, merchandiseSubtotal);
            }
            appliedCoupon = {
              code: coupon.code,
              discount,
              description: `₹${discount} Discount Applied`,
            };
          }
        }
      }
    }

    // 4. Tax calculation (5% restaurant GST: 2.5% CGST + 2.5% SGST)
    const taxConfig = db.prepare('SELECT * FROM tax_config WHERE id = ?').get('default') as any;
    const taxableAmount = Math.max(0, merchandiseSubtotal - discount);
    const cgst = Math.round((taxableAmount * (taxConfig.cgst_rate / 100)) * 100) / 100;
    const sgst = Math.round((taxableAmount * (taxConfig.sgst_rate / 100)) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + cgst + sgst + deliveryCharge) * 100) / 100;

    // Check if customer qualifies for the exclusive 50th order milestone coupon (Order value > ₹200)
    let earns50thMilestoneCoupon = false;
    let customerCompletedOrders = 0;

    if (customerPhone) {
      const cleanPhone = normalizePhone(customerPhone);
      const customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(cleanPhone) as { id: string } | undefined;
      if (customer) {
        const countRow = db.prepare("SELECT count(*) as count FROM orders WHERE customer_id = ? AND status = 'delivered'").get(customer.id) as { count: number };
        customerCompletedOrders = countRow ? countRow.count : 0;

        const alreadyAwarded = db.prepare("SELECT id FROM loyalty_milestones WHERE customer_id = ? AND milestone_count = 50").get(customer.id);
        // Customer is crossing or has reached 50th order AND merchandise subtotal is above ₹200
        if (!alreadyAwarded && customerCompletedOrders >= 49 && merchandiseSubtotal >= 200) {
          earns50thMilestoneCoupon = true;
        }
      }
    }

    res.json({
      success: true,
      calculation: {
        merchandiseSubtotal,
        discount,
        taxableAmount,
        cgst,
        cgstRate: taxConfig.cgst_rate,
        sgst,
        sgstRate: taxConfig.sgst_rate,
        deliveryCharge,
        grandTotal,
        isDeliveryEligible,
        deliveryError,
        customerCompletedOrders,
        earns50thMilestoneCoupon,
        appliedCoupon,
        validatedItems,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. POST /api/orders - Transactional order placement
 */
apiRouter.post('/orders', (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      orderType,
      deliveryAddress,
      deliveryInstructions,
      paymentMethod, // 'cash' or 'upi'
      items,
      couponCode,
    } = req.body;

    if (!customerName || !customerPhone || !orderType || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required order details.' });
    }

    const cleanPhone = normalizePhone(customerPhone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian phone number.' });
    }

    // 1. Recalculate everything on backend
    let merchandiseSubtotal = 0;
    const validatedItems = [];
    const getMenuItem = db.prepare('SELECT id, name, price, available FROM menu_items WHERE id = ?');

    for (const item of items) {
      const dbItem = getMenuItem.get(item.id) as { id: string; name: string; price: number; available: number } | undefined;
      if (!dbItem || !dbItem.available) {
        return res.status(400).json({ success: false, error: `Item not available: ${item.id}` });
      }
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const lineTotal = Math.round(dbItem.price * qty * 100) / 100;
      merchandiseSubtotal += lineTotal;
      validatedItems.push({
        id: dbItem.id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        lineTotal,
      });
    }

    const delivConfig = db.prepare('SELECT * FROM delivery_config WHERE id = ?').get('default') as any;
    let deliveryCharge = 0;

    if (orderType === 'delivery') {
      if (!deliveryAddress || !deliveryAddress.pincode) {
        return res.status(400).json({ success: false, error: 'Delivery address and PIN code are required.' });
      }
      const allowedPins = delivConfig.eligible_pincodes.split(',').map((p: string) => p.trim());
      if (!allowedPins.includes(deliveryAddress.pincode.trim())) {
        return res.status(400).json({
          success: false,
          error: `Delivery not available in PIN code ${deliveryAddress.pincode}.`,
        });
      }
      if (merchandiseSubtotal >= delivConfig.free_threshold) {
        deliveryCharge = 0;
      } else {
        deliveryCharge = delivConfig.base_fee;
      }
    } else {
      deliveryCharge = 0;
    }

    // Verify customer is registered / signed in
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone) as any;
    if (!customer) {
      return res.status(401).json({
        success: false,
        error: 'Sign in required. Please sign in or register your account before placing an order.',
      });
    }

    // Keep name updated if edited
    if (customerName && customerName.trim() && customer.name !== customerName.trim()) {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(customerName.trim(), customer.id);
      customer.name = customerName.trim();
    }

    const nowIso = getIstDate();

    // Coupon discount logic & locking
    let discount = 0;
    let validCouponId: string | null = null;

    if (couponCode) {
      const coupon = db.prepare(`
        SELECT * FROM coupons
        WHERE code = ? AND customer_id = ? AND status = 'active'
      `).get(couponCode.trim(), customer.id) as any;

      if (coupon && new Date(coupon.expires_at) >= new Date()) {
        if (merchandiseSubtotal >= coupon.min_subtotal) {
          discount = Math.min(coupon.discount_value, merchandiseSubtotal);
          validCouponId = coupon.id;
        }
      }
    }

    const taxConfig = db.prepare('SELECT * FROM tax_config WHERE id = ?').get('default') as any;
    const taxableAmount = Math.max(0, merchandiseSubtotal - discount);
    const cgst = Math.round((taxableAmount * (taxConfig.cgst_rate / 100)) * 100) / 100;
    const sgst = Math.round((taxableAmount * (taxConfig.sgst_rate / 100)) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + cgst + sgst + deliveryCharge) * 100) / 100;

    // Transactional Order Creation
    const orderId = 'ord_' + crypto.randomBytes(8).toString('hex');
    const orderCode = generateNextOrderId(orderType);
    const trackingToken = crypto.randomBytes(16).toString('hex');

    const fullAddressString =
      orderType === 'delivery'
        ? `${deliveryAddress.flatNo || ''}, ${deliveryAddress.street || ''}, ${deliveryAddress.landmark ? 'Near ' + deliveryAddress.landmark + ', ' : ''}PIN: ${deliveryAddress.pincode}`.trim()
        : '';

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare(`
        INSERT INTO orders (
          id, order_code, tracking_token, customer_id, customer_name, customer_phone,
          order_type, delivery_address, delivery_instructions, subtotal, discount,
          delivery_charge, cgst, sgst, grand_total, payment_method, payment_status,
          status, estimated_minutes, coupon_id, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, 'pending',
          'placed', ?, ?, ?, ?
        )
      `).run(
        orderId,
        orderCode,
        trackingToken,
        customer.id,
        customerName.trim(),
        cleanPhone,
        orderType,
        fullAddressString,
        deliveryInstructions || '',
        merchandiseSubtotal,
        discount,
        deliveryCharge,
        cgst,
        sgst,
        grandTotal,
        paymentMethod === 'upi' ? 'upi' : 'cash',
        orderType === 'delivery' ? delivConfig.estimated_time_mins : 15,
        validCouponId,
        nowIso,
        nowIso
      );

      // Insert order items snapshot
      const insertItem = db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        insertItem.run(
          'item_' + crypto.randomBytes(6).toString('hex'),
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.lineTotal
        );
      }

      // Initial status log
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, changed_by, note, created_at)
        VALUES (?, ?, 'placed', 'Customer', 'Order successfully placed via website', ?)
      `).run('hist_' + crypto.randomBytes(6).toString('hex'), orderId, nowIso);

      // Lock coupon if used
      if (validCouponId) {
        db.prepare(`
          UPDATE coupons
          SET status = 'redeemed', redeemed_order_id = ?, redeemed_at = ?
          WHERE id = ?
        `).run(orderId, nowIso, validCouponId);
      }

      // Save customer delivery address if requested
      if (orderType === 'delivery' && deliveryAddress.saveAsDefault) {
        db.prepare(`
          INSERT INTO customer_addresses (id, customer_id, flat_no, street, landmark, pincode, is_default)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(
          'addr_' + crypto.randomBytes(6).toString('hex'),
          customer.id,
          deliveryAddress.flatNo,
          deliveryAddress.street,
          deliveryAddress.landmark || '',
          deliveryAddress.pincode
        );
      }

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    res.json({
      success: true,
      order: {
        id: orderId,
        orderCode,
        trackingToken,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        orderType,
        deliveryAddress: fullAddressString,
        subtotal: merchandiseSubtotal,
        discount,
        deliveryCharge,
        cgst,
        sgst,
        grandTotal,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'placed',
        estimatedMinutes: orderType === 'delivery' ? delivConfig.estimated_time_mins : 15,
        items: validatedItems,
        createdAt: nowIso,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. GET /api/orders/:orderCode - Fetch order and item details
 */
apiRouter.get('/orders/:orderCode', (req, res) => {
  try {
    const { orderCode } = req.params;
    const { token, phone } = req.query;

    const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Access control: either matches tracking_token, customer_phone, or staff
    if (token && order.tracking_token !== token) {
      if (phone && normalizePhone(String(phone)) !== order.customer_phone) {
        return res.status(403).json({ success: false, error: 'Unauthorized order access.' });
      }
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        history,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. GET /api/orders/:orderCode/track - Live polling status endpoint
 */
apiRouter.get('/orders/:orderCode/track', (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = db.prepare('SELECT id, order_code, status, order_type, customer_name, payment_status, payment_method, estimated_minutes, created_at, updated_at FROM orders WHERE order_code = ?').get(orderCode) as any;

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const history = db.prepare('SELECT status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);

    res.json({
      success: true,
      tracking: {
        orderCode: order.order_code,
        status: order.status,
        orderType: order.order_type,
        customerName: order.customer_name,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        estimatedMinutes: order.estimated_minutes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        history,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. POST /api/auth/login - Phone-based customer authentication
 */
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }

    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Enter a valid 10-digit phone number.' });
    }

    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone) as any;
    const nowIso = getIstDate();

    if (!customer) {
      const newCustId = 'cust_' + crypto.randomBytes(6).toString('hex');
      const custName = (name || 'Chai Lover').trim();
      db.prepare(`
        INSERT INTO customers (id, phone, name, email, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(newCustId, cleanPhone, custName, '', nowIso);

      customer = { id: newCustId, phone: cleanPhone, name: custName, created_at: nowIso };
    } else if (name && name.trim()) {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(name.trim(), customer.id);
      customer.name = name.trim();
    }

    res.json({ success: true, customer });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. GET /api/customer/profile - Customer account with orders, coupons, loyalty
 */
apiRouter.get('/customer/profile', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone parameter required.' });
    }

    const cleanPhone = normalizePhone(String(phone));
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian phone number.' });
    }

    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone) as any;
    const nowIso = getIstDate();

    // Auto-create customer if not existing yet so profile always loads reliably
    if (!customer) {
      const newCustId = 'cust_' + crypto.randomBytes(6).toString('hex');
      db.prepare(`
        INSERT INTO customers (id, phone, name, email, created_at)
        VALUES (?, ?, 'Chai Lover', '', ?)
      `).run(newCustId, cleanPhone, nowIso);
      customer = { id: newCustId, phone: cleanPhone, name: 'Chai Lover', email: '', created_at: nowIso };
    }

    // Orders list
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customer.id) as any[];

    // Orders stats
    const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'completed');
    const totalSpent = completedOrders.reduce((sum, o) => sum + o.grand_total, 0);

    // Coupons
    const now = new Date();
    const rawCoupons = db.prepare('SELECT * FROM coupons WHERE customer_id = ? ORDER BY issued_at DESC').all(customer.id) as any[];

    const coupons = rawCoupons.map((c) => {
      let currentStatus = c.status;
      if (currentStatus === 'active' && new Date(c.expires_at) < now) {
        currentStatus = 'expired';
        db.prepare("UPDATE coupons SET status = 'expired' WHERE id = ?").run(c.id);
      }
      return { ...c, status: currentStatus };
    });

    // Loyalty milestones
    const milestones = db.prepare('SELECT * FROM loyalty_milestones WHERE customer_id = ? ORDER BY milestone_count ASC').all(customer.id);

    // Saved addresses
    const addresses = db.prepare('SELECT * FROM customer_addresses WHERE customer_id = ?').all(customer.id);

    res.json({
      success: true,
      profile: {
        customer,
        completedCount: completedOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        orders,
        coupons,
        milestones,
        addresses,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. GET /api/admin/orders - Cafe Staff Orders Dashboard
 */
apiRouter.get('/admin/orders', (req, res) => {
  try {
    const { passkey, status, search } = req.query;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Invalid staff passkey.' });
    }

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (order_code LIKE ? OR customer_phone LIKE ? OR customer_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params) as any[];

    // Attach items to each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map((o) => ({
      ...o,
      items: getItems.all(o.id),
    }));

    res.json({ success: true, orders: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. PATCH /api/admin/orders/:orderId/status - Staff updates order status & triggers promotions
 */
apiRouter.patch('/admin/orders/:orderId/status', (req, res) => {
  try {
    const { orderId } = req.params;
    const { passkey, status, rejectionReason, note } = req.body;

    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;
    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const validStatuses = [
      'placed',
      'awaiting_confirmation',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid order status: ${status}` });
    }

    const nowIso = getIstDate();

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.prepare(`
        UPDATE orders
        SET status = ?, rejection_reason = ?, updated_at = ?
        WHERE id = ?
      `).run(status, rejectionReason || null, nowIso, orderId);

      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, changed_by, note, created_at)
        VALUES (?, ?, ?, 'Staff', ?, ?)
      `).run('hist_' + crypto.randomBytes(6).toString('hex'), orderId, status, note || `Status updated to ${status}`, nowIso);

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
        VALUES (?, 'STATUS_UPDATE', 'Staff', ?, ?, ?)
      `).run('aud_' + crypto.randomBytes(6).toString('hex'), orderId, `Changed to ${status}`, nowIso);

      // --- AUTOMATIC REWARDS & LOYALTY ON COMPLETION ---
      // RULE: Coupons code for ONLY the loyalty progress cross the 50th order above 200 rupees
      if (status === 'delivered') {
        if (order.customer_id) {
          const completedCountRow = db.prepare(`
            SELECT count(*) as count FROM orders
            WHERE customer_id = ? AND status = 'delivered'
          `).get(order.customer_id) as { count: number };

          const count = completedCountRow.count;

          // Check if customer crosses or is at 50th order AND this order is above ₹200
          if (count >= 50 && order.subtotal >= 200) {
            const alreadyAwarded = db.prepare(`
              SELECT id FROM loyalty_milestones
              WHERE customer_id = ? AND milestone_count = 50
            `).get(order.customer_id);

            if (!alreadyAwarded) {
              const code = 'OTS-50TH-' + crypto.randomBytes(3).toString('hex').toUpperCase();
              const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
              const coupId = 'coup_' + crypto.randomBytes(6).toString('hex');

              // Issue exclusive 50th order VIP coupon (valid for 7 days)
              db.prepare(`
                INSERT INTO coupons (id, code, customer_id, discount_type, discount_value, min_subtotal, qualifying_order_id, issued_at, expires_at, status)
                VALUES (?, ?, ?, 'fixed', 50.00, 100.00, ?, ?, ?, 'active')
              `).run(
                coupId,
                code,
                order.customer_id,
                order.id,
                nowIso,
                expiresAt
              );

              db.prepare(`
                INSERT INTO loyalty_milestones (id, customer_id, milestone_count, reward_description, coupon_id, achieved_at)
                VALUES (?, ?, 50, '50th Order Milestone Reward (₹200+ Qualifying Order): VIP ₹50 Off Voucher', ?, ?)
              `).run('mile_' + crypto.randomBytes(6).toString('hex'), order.customer_id, coupId, nowIso);
            }
          }
        }
      }

      db.exec('COMMIT;');
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. PATCH /admin/orders/:orderId/payment - Staff updates payment status and/or payment method
 */
apiRouter.patch('/admin/orders/:orderId/payment', (req, res) => {
  try {
    const { orderId } = req.params;
    const { passkey, paymentStatus, paymentMethod } = req.body;

    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;
    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const targetStatus = paymentStatus !== undefined ? (paymentStatus || null) : null;
    const targetMethod = paymentMethod !== undefined ? (paymentMethod === 'upi' ? 'upi' : 'cash') : null;

    const nowIso = getIstDate();
    db.prepare(`
      UPDATE orders
      SET 
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method),
        updated_at = ?
      WHERE id = ?
    `).run(targetStatus, targetMethod, nowIso, orderId);

    // Fetch updated order to confirm new values
    const updated = db.prepare('SELECT payment_status, payment_method FROM orders WHERE id = ?').get(orderId) as any;

    const logDetails = `Payment status: ${updated.payment_status}, method: ${updated.payment_method}`;

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
      VALUES (?, 'PAYMENT_UPDATE', 'Staff', ?, ?, ?)
    `).run('aud_' + crypto.randomBytes(6).toString('hex'), orderId, logDetails, nowIso);

    // Timeline history entry
    db.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, note, created_at)
      VALUES (?, ?, ?, 'Staff', ?, ?)
    `).run('hist_' + crypto.randomBytes(6).toString('hex'), orderId, order.status, `Staff updated payment: ${updated.payment_method.toUpperCase()} (${updated.payment_status})`, nowIso);

    res.json({
      success: true,
      message: `Payment updated: ${updated.payment_method.toUpperCase()} (${updated.payment_status})`,
      paymentStatus: updated.payment_status,
      paymentMethod: updated.payment_method,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10B. PATCH /orders/:orderCode/payment-method - Customer switches payment method (Cash <-> UPI) before delivery
 */
apiRouter.patch('/orders/:orderCode/payment-method', (req, res) => {
  try {
    const { orderCode } = req.params;
    const { paymentMethod, token, phone } = req.body;

    if (!paymentMethod || (paymentMethod !== 'cash' && paymentMethod !== 'upi')) {
      return res.status(400).json({ success: false, error: 'Payment method must be cash or upi.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Access control: allow if token matches, phone matches, or order is active
    if (token && order.tracking_token !== token) {
      if (phone && normalizePhone(String(phone)) !== order.customer_phone) {
        return res.status(403).json({ success: false, error: 'Unauthorized order access.' });
      }
    }

    if (order.status === 'delivered' || order.status === 'cancelled' || order.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: `Cannot change payment method for orders that are already ${order.status}.`,
      });
    }

    const nowIso = getIstDate();
    db.prepare(`
      UPDATE orders
      SET payment_method = ?, updated_at = ?
      WHERE id = ?
    `).run(paymentMethod, nowIso, order.id);

    db.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, note, created_at)
      VALUES (?, ?, ?, 'Customer', ?, ?)
    `).run(
      'hist_' + crypto.randomBytes(6).toString('hex'),
      order.id,
      order.status,
      `Customer switched payment method to ${paymentMethod === 'upi' ? 'UPI' : 'Cash'} at Delivery`,
      nowIso
    );

    res.json({
      success: true,
      message: `Payment method switched to ${paymentMethod === 'upi' ? 'UPI' : 'Cash'}.`,
      paymentMethod,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 11. GET /admin/settings & PUT /admin/settings
 */
apiRouter.get('/admin/settings', (req, res) => {
  try {
    const delivery = db.prepare('SELECT * FROM delivery_config WHERE id = ?').get('default');
    const tax = db.prepare('SELECT * FROM tax_config WHERE id = ?').get('default');
    const admin = db.prepare('SELECT upi_vpa, upi_name FROM admin_config WHERE id = ?').get('default');

    res.json({ success: true, delivery, tax, admin });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/admin/settings', (req, res) => {
  try {
    const { passkey, delivery, upi } = req.body;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    if (delivery) {
      db.prepare(`
        UPDATE delivery_config
        SET base_fee = ?, min_order = ?, free_threshold = ?, eligible_pincodes = ?, is_enabled = ?, estimated_time_mins = ?
        WHERE id = 'default'
      `).run(
        delivery.base_fee ?? 0,
        delivery.min_order ?? 0,
        delivery.free_threshold ?? 0,
        delivery.eligible_pincodes || '600127',
        delivery.is_enabled ? 1 : 0,
        delivery.estimated_time_mins ?? 25
      );
    }

    if (upi) {
      db.prepare(`
        UPDATE admin_config
        SET upi_vpa = ?, upi_name = ?
        WHERE id = 'default'
      `).run(upi.upi_vpa || '9094392300@upi', upi.upi_name || 'Oru Tea Sollu');
    }

    res.json({ success: true, message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 12. POST /api/admin/menu - Update/Add Menu item
 */
apiRouter.post('/admin/menu', (req, res) => {
  try {
    const { passkey, item } = req.body;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    if (!item.id || !item.name || item.price == null) {
      return res.status(400).json({ success: false, error: 'Invalid menu item data.' });
    }

    const existing = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(item.id);
    if (existing) {
      db.prepare(`
        UPDATE menu_items
        SET name = ?, tamil_name = ?, category = ?, price = ?, description = ?, badge = ?, available = ?
        WHERE id = ?
      `).run(
        item.name,
        item.tamil_name || '',
        item.category,
        item.price,
        item.description || '',
        item.badge || '',
        item.available ? 1 : 0,
        item.id
      );
    } else {
      db.prepare(`
        INSERT INTO menu_items (id, name, tamil_name, category, price, description, badge, available)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        item.id,
        item.name,
        item.tamil_name || '',
        item.category,
        item.price,
        item.description || '',
        item.badge || '',
        item.available ? 1 : 0
      );
    }

    res.json({ success: true, message: 'Menu item updated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 13. POST /api/admin/verify - Verify staff passkey without loading full dashboard
 */
apiRouter.post('/admin/verify', (req, res) => {
  try {
    const { passkey } = req.body;
    if (!passkey) {
      return res.status(400).json({ success: false, error: 'Staff password is required.' });
    }
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;
    if (passkey !== admin.passkey) {
      return res.status(401).json({ success: false, error: 'Access Denied: Incorrect staff password.' });
    }
    res.json({ success: true, message: 'Staff authenticated.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 14. POST /api/admin/change-passkey - Staff can change their access password
 */
apiRouter.post('/admin/change-passkey', (req, res) => {
  try {
    const { currentPasskey, newPasskey } = req.body;
    if (!currentPasskey || !newPasskey) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required.' });
    }
    if (newPasskey.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters long.' });
    }

    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;
    if (currentPasskey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Current password is incorrect.' });
    }

    const nowIso = getIstDate();
    db.prepare(`
      UPDATE admin_config
      SET passkey = ?
      WHERE id = 'default'
    `).run(newPasskey.trim());

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
      VALUES (?, 'PASSWORD_CHANGE', 'Staff', 'admin_config', 'Staff password updated', ?)
    `).run('aud_' + crypto.randomBytes(6).toString('hex'), nowIso);

    res.json({ success: true, message: 'Staff password changed successfully. Use your new password for subsequent logins.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 15. GET /api/admin/analytics - Detailed sales, products sold, and monthly-wise profit/loss
 */
apiRouter.get('/admin/analytics', (req, res) => {
  try {
    const { passkey, month } = req.query;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    const selectedMonth = (month && typeof month === 'string') ? month : 'all';

    // 1. Get all available months from orders
    const allMonthsRows = db.prepare(`
      SELECT DISTINCT strftime('%Y-%m', created_at) as month_key
      FROM orders
      WHERE status NOT IN ('cancelled', 'rejected')
      ORDER BY month_key DESC
    `).all() as { month_key: string }[];

    const monthNames: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December',
    };

    const formatMonthLabel = (mKey: string) => {
      if (!mKey || !mKey.includes('-')) return mKey;
      const [year, mNum] = mKey.split('-');
      return `${monthNames[mNum] || mNum} ${year}`;
    };

    const availableMonths = allMonthsRows.map((r) => ({
      key: r.month_key,
      label: formatMonthLabel(r.month_key),
    }));

    // 2. Monthly Wise Breakdown
    const monthlyDataRaw = db.prepare(`
      SELECT 
        strftime('%Y-%m', o.created_at) as month_key,
        COUNT(DISTINCT o.id) as orders_count,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.line_total), 0) as items_revenue,
        COALESCE(SUM(o.grand_total), 0) as grand_total_revenue,
        COALESCE(SUM(oi.quantity * COALESCE(m.cost_price, oi.unit_price * 0.45)), 0) as total_cogs
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menu_items m ON m.id = oi.product_id
      WHERE o.status NOT IN ('cancelled', 'rejected')
      GROUP BY month_key
      ORDER BY month_key DESC
    `).all() as any[];

    const monthlyBreakdown = monthlyDataRaw.map((row) => {
      const rev = Math.round(Number(row.grand_total_revenue || 0) * 100) / 100;
      const cost = Math.round(Number(row.total_cogs || 0) * 100) / 100;
      const profit = Math.round((rev - cost) * 100) / 100;
      const marginPct = rev > 0 ? Math.round(((profit / rev) * 100) * 10) / 10 : 0;

      return {
        monthKey: row.month_key,
        monthLabel: formatMonthLabel(row.month_key),
        ordersCount: Number(row.orders_count || 0),
        unitsSold: Number(row.units_sold || 0),
        revenue: rev,
        cost,
        profit,
        marginPct,
        status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'break_even',
      };
    });

    // 3. Product-by-product breakdown (filtered by selected month if not 'all')
    let productQuery = `
      SELECT 
        m.id,
        m.name,
        m.tamil_name,
        m.category,
        m.price,
        COALESCE(m.cost_price, ROUND(m.price * 0.45, 1)) as cost_price,
        m.available,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.line_total), 0) as total_revenue
      FROM menu_items m
      LEFT JOIN order_items oi ON oi.product_id = m.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled', 'rejected')
    `;

    const queryParams: any[] = [];
    if (selectedMonth !== 'all') {
      productQuery += ` AND strftime('%Y-%m', o.created_at) = ? `;
      queryParams.push(selectedMonth);
    }

    productQuery += `
      GROUP BY m.id
      ORDER BY units_sold DESC, total_revenue DESC
    `;

    const productRows = db.prepare(productQuery).all(...queryParams) as any[];

    const productBreakdown = productRows.map((p) => {
      const units = Number(p.units_sold || 0);
      const rev = Math.round(Number(p.total_revenue || 0) * 100) / 100;
      const unitCost = Number(p.cost_price || 0);
      const totalCost = Math.round((units * unitCost) * 100) / 100;
      const profit = Math.round((rev - totalCost) * 100) / 100;
      const marginPct = rev > 0 ? Math.round(((profit / rev) * 100) * 10) / 10 : 0;

      return {
        id: p.id,
        name: p.name,
        tamilName: p.tamil_name,
        category: p.category,
        price: p.price,
        costPrice: unitCost,
        available: Boolean(p.available),
        unitsSold: units,
        totalRevenue: rev,
        totalCost,
        profit,
        marginPct,
        status: profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'break_even',
      };
    });

    // 4. Overarching summary for selected period
    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;
    let totalOrders = 0;

    if (selectedMonth === 'all') {
      totalRevenue = monthlyBreakdown.reduce((sum, m) => sum + m.revenue, 0);
      totalCost = monthlyBreakdown.reduce((sum, m) => sum + m.cost, 0);
      totalUnitsSold = monthlyBreakdown.reduce((sum, m) => sum + m.unitsSold, 0);
      totalOrders = monthlyBreakdown.reduce((sum, m) => sum + m.ordersCount, 0);
    } else {
      const match = monthlyBreakdown.find((m) => m.monthKey === selectedMonth);
      if (match) {
        totalRevenue = match.revenue;
        totalCost = match.cost;
        totalUnitsSold = match.unitsSold;
        totalOrders = match.ordersCount;
      }
    }

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalCost = Math.round(totalCost * 100) / 100;
    const totalProfit = Math.round((totalRevenue - totalCost) * 100) / 100;
    const profitMarginPct = totalRevenue > 0 ? Math.round(((totalProfit / totalRevenue) * 100) * 10) / 10 : 0;
    const averageOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    res.json({
      success: true,
      selectedMonth,
      availableMonths,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMarginPct,
        totalUnitsSold,
        totalOrders,
        averageOrderValue,
        status: totalProfit > 0 ? 'profit' : totalProfit < 0 ? 'loss' : 'break_even',
      },
      monthlyBreakdown,
      productBreakdown,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 16. GET /api/admin/products - List all products with cost prices for staff
 */
apiRouter.get('/admin/products', (req, res) => {
  try {
    const { passkey } = req.query;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    const products = db.prepare('SELECT * FROM menu_items ORDER BY category ASC, price ASC').all();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 17. POST /api/admin/products - Add or Edit Product (Name, Price, Cost Price, etc.)
 */
apiRouter.post('/admin/products', (req, res) => {
  try {
    const { passkey, product } = req.body;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    if (!product || !product.name || product.price == null) {
      return res.status(400).json({ success: false, error: 'Product name and price are required.' });
    }

    const price = Math.max(1, Number(product.price) || 0);
    const costPrice = product.cost_price != null ? Math.max(0, Number(product.cost_price)) : Math.round(price * 0.45 * 10) / 10;
    const name = String(product.name).trim();
    const tamilName = (product.tamil_name || '').trim();
    const category = (product.category || 'tea').trim().toLowerCase();
    const description = (product.description || '').trim();
    const badge = (product.badge || '').trim();
    const available = product.available === false || product.available === 0 ? 0 : 1;

    let targetId = product.id;
    const nowIso = getIstDate();

    if (targetId) {
      const existing = db.prepare('SELECT id FROM menu_items WHERE id = ?').get(targetId);
      if (existing) {
        db.prepare(`
          UPDATE menu_items
          SET name = ?, tamil_name = ?, category = ?, price = ?, cost_price = ?, description = ?, badge = ?, available = ?
          WHERE id = ?
        `).run(name, tamilName, category, price, costPrice, description, badge, available, targetId);

        db.prepare(`
          INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
          VALUES (?, 'PRODUCT_EDIT', 'Staff', ?, ?, ?)
        `).run('aud_' + crypto.randomBytes(6).toString('hex'), targetId, `Updated ${name} - ₹${price} (Cost: ₹${costPrice})`, nowIso);

        return res.json({ success: true, message: `Product "${name}" updated successfully.`, productId: targetId });
      }
    }

    // Insert new product
    targetId = targetId || `${category}-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO menu_items (id, name, tamil_name, category, price, cost_price, description, badge, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetId, name, tamilName, category, price, costPrice, description, badge, available);

    db.prepare(`
      INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
      VALUES (?, 'PRODUCT_ADD', 'Staff', ?, ?, ?)
    `).run('aud_' + crypto.randomBytes(6).toString('hex'), targetId, `Added new product ${name} - ₹${price}`, nowIso);

    res.json({ success: true, message: `Product "${name}" added successfully.`, productId: targetId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 18. DELETE /api/admin/products/:id - Delete Product
 */
apiRouter.delete('/admin/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const passkey = (req.body && req.body.passkey) || req.query.passkey;
    const admin = db.prepare('SELECT passkey FROM admin_config WHERE id = ?').get('default') as any;

    if (passkey !== admin.passkey) {
      return res.status(403).json({ success: false, error: 'Invalid staff passkey.' });
    }

    const item = db.prepare('SELECT name FROM menu_items WHERE id = ?').get(id) as any;
    if (!item) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);

    const nowIso = getIstDate();
    db.prepare(`
      INSERT INTO audit_logs (id, action, staff_name, target_id, details, created_at)
      VALUES (?, 'PRODUCT_DELETE', 'Staff', ?, ?, ?)
    `).run('aud_' + crypto.randomBytes(6).toString('hex'), id, `Deleted product ${item.name}`, nowIso);

    res.json({ success: true, message: `Product "${item.name}" deleted successfully.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


