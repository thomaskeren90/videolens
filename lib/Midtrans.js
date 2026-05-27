/**
 * Midtrans.js — QRIS/GoPay/VA payment (pattern from VIO Studio)
 */
const midtransClient = require('midtrans-client');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./DB');

const PLANS = {
  pro_monthly: { name: 'Pro Bulanan', amount: 50000, duration_days: 30 },
  pro_yearly:  { name: 'Pro Tahunan', amount: 480000, duration_days: 365 },
};

function getSnap() {
  return new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });
}

async function createPayment(userId, planKey, userEmail, userName) {
  const plan = PLANS[planKey];
  if (!plan) throw new Error('Plan tidak valid');

  const db = getDb();
  const orderId = `VS-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

  const snap = getSnap();
  const result = await snap.createTransaction({
    transaction_details: { order_id: orderId, gross_amount: plan.amount },
    customer_details: { email: userEmail, first_name: userName || 'User' },
    item_details: [{ id: planKey, name: plan.name, price: plan.amount, quantity: 1 }],
    enabled_payments: ['qris', 'gopay', 'shopeepay', 'bank_transfer'],
    callbacks: {
      finish: `${process.env.BASE_URL}/payment/success`,
    },
  });

  db.prepare(`
    INSERT INTO payments (id, user_id, order_id, amount, plan, status, midtrans_token, midtrans_url)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(uuidv4(), userId, orderId, plan.amount, planKey, result.token, result.redirect_url);

  return { orderId, token: result.token, url: result.redirect_url, amount: plan.amount, plan: plan.name };
}

async function handleWebhook(notification) {
  const snap = getSnap();
  const status = await snap.transaction.notification(notification);

  const { order_id, transaction_status, fraud_status } = status;
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order_id);
  if (!payment) return { ok: false, message: 'Order not found' };

  const isPaid =
    (transaction_status === 'capture' && fraud_status === 'accept') ||
    transaction_status === 'settlement';

  if (isPaid && payment.status !== 'paid') {
    db.prepare("UPDATE payments SET status = 'paid', paid_at = datetime('now') WHERE order_id = ?").run(order_id);
    // Upgrade user plan
    const planKey = payment.plan;
    const planInfo = PLANS[planKey];
    if (planInfo) {
      const { upgradeUserPlan } = require('./Auth');
      upgradeUserPlan(payment.user_id, 'pro');
    }
    return { ok: true, upgraded: true, userId: payment.user_id };
  }

  if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
    db.prepare('UPDATE payments SET status = ? WHERE order_id = ?').run(transaction_status, order_id);
  }

  return { ok: true, upgraded: false };
}

module.exports = { createPayment, handleWebhook, PLANS };
