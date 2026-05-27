/**
 * Auth.js — JWT authentication (copied pattern from VIO Studio)
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./DB');

const SECRET = process.env.JWT_SECRET || 'videosummarizer_dev_secret_change_in_production';
const TOKEN_EXPIRY = '30d';

// ─── Middleware ──────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch {}
  }
  next();
}

// ─── Registration ────────────────────────────────────────────────────────────
async function register(email, password, name) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email sudah terdaftar');

  const hashed = await bcrypt.hash(password, 12);
  const id = uuidv4();
  const today = new Date().toISOString().slice(0, 10);

  db.prepare(`
    INSERT INTO users (id, email, password, name, plan, clips_today, clips_reset)
    VALUES (?, ?, ?, ?, 'free', 0, ?)
  `).run(id, email.toLowerCase(), hashed, name || '', today);

  const user = db.prepare('SELECT id, email, name, plan FROM users WHERE id = ?').get(id);
  return { token: jwt.sign({ id, email: user.email, plan: user.plan }, SECRET, { expiresIn: TOKEN_EXPIRY }), user };
}

// ─── Login ───────────────────────────────────────────────────────────────────
async function login(email, password) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) throw new Error('Email atau password salah');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Email atau password salah');

  return {
    token: jwt.sign({ id: user.id, email: user.email, plan: user.plan }, SECRET, { expiresIn: TOKEN_EXPIRY }),
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan }
  };
}

// ─── Quota check ─────────────────────────────────────────────────────────────
function checkAndDecrementQuota(userId) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const today = new Date().toISOString().slice(0, 10);
  const FREE_LIMIT = parseInt(process.env.FREE_CLIPS_PER_DAY || '5');

  // Reset counter if new day
  if (user.clips_reset !== today) {
    db.prepare('UPDATE users SET clips_today = 0, clips_reset = ? WHERE id = ?').run(today, userId);
    user.clips_today = 0;
  }

  if (user.plan === 'free' && user.clips_today >= FREE_LIMIT) {
    throw new Error(`Batas gratis ${FREE_LIMIT} klip/hari tercapai. Upgrade ke Pro untuk unlimited!`);
  }

  db.prepare('UPDATE users SET clips_today = clips_today + 1 WHERE id = ?').run(userId);
  return true;
}

function upgradeUserPlan(userId, plan) {
  const db = getDb();
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, userId);
  // Re-sign token is done by client on next login
}

module.exports = { requireAuth, optionalAuth, register, login, checkAndDecrementQuota, upgradeUserPlan };
