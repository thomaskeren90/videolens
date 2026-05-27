/**
 * Video Summarizer — Express Server
 * Paste YouTube link → AI detects 10 best moments → cut/crop/caption → TikTok-ready
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { requireAuth, optionalAuth, register, login, checkAndDecrementQuota } = require('./lib/Auth');
const { createPayment, handleWebhook } = require('./lib/Midtrans');
const { getVideoInfo, downloadVideo, processClip, cleanupTmp, getClipPath, clipExists } = require('./lib/Clipper');
const { detectHighlights, fallbackHighlights } = require('./lib/AIHighlight');
const { getDb } = require('./lib/DB');

const app = express();
const PORT = process.env.PORT || 3030;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CLIPS_DIR = process.env.CLIPS_DIR || path.join(__dirname, 'clips');

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/clips', express.static(CLIPS_DIR)); // serve generated clips

const wrap = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    console.error('[VS]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
  }
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', wrap(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib' });
  if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  const result = await register(email, password, name);
  res.json(result);
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password wajib' });
  const result = await login(email, password);
  res.json(result);
}));

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, plan, clips_today, clips_reset FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const FREE_LIMIT = parseInt(process.env.FREE_CLIPS_PER_DAY || '5');
  const today = new Date().toISOString().slice(0, 10);
  const clipsToday = user.clips_reset === today ? user.clips_today : 0;
  res.json({ ...user, clips_today: clipsToday, clips_remaining: user.plan === 'free' ? Math.max(0, FREE_LIMIT - clipsToday) : 999 });
}));

// ─── ANALYZE: extract highlights ─────────────────────────────────────────────
app.post('/api/analyze', optionalAuth, wrap(async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('youtu')) return res.status(400).json({ error: 'URL YouTube tidak valid' });

  const db = getDb();
  const userId = req.user?.id || 'anonymous';
  const jobId = uuidv4();

  // Create job
  db.prepare(`
    INSERT INTO jobs (id, user_id, youtube_url, status) VALUES (?, ?, ?, 'analyzing')
  `).run(jobId, userId, url);

  res.json({ jobId, status: 'analyzing' });

  // Process async
  (async () => {
    try {
      // 1. Get video metadata
      const info = await getVideoInfo(url);
      db.prepare('UPDATE jobs SET video_title=?, video_thumb=?, video_duration=?, updated_at=datetime("now") WHERE id=?')
        .run(info.title, info.thumbnail, info.duration, jobId);

      // 2. AI highlight detection
      let highlights;
      try {
        highlights = await detectHighlights(info);
      } catch (e) {
        console.warn('[VS] AI highlight failed, using fallback:', e.message);
        highlights = fallbackHighlights(info.duration);
      }

      // 3. Store highlights + create clip records
      const clipInsert = db.prepare(`
        INSERT INTO clips (id, job_id, user_id, title, start_sec, end_sec, score, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')
      `);

      const insertMany = db.transaction((clips) => {
        for (const h of clips) clipInsert.run(uuidv4(), jobId, userId, h.title, h.start_sec, h.end_sec, h.score, h.reason);
      });
      insertMany(highlights);

      db.prepare("UPDATE jobs SET status='done', highlights=?, updated_at=datetime('now') WHERE id=?")
        .run(JSON.stringify(highlights), jobId);

    } catch (err) {
      console.error('[VS] Analyze error:', err.message);
      db.prepare("UPDATE jobs SET status='error', error=?, updated_at=datetime('now') WHERE id=?")
        .run(err.message, jobId);
    }
  })();
}));

// ─── JOB STATUS ──────────────────────────────────────────────────────────────
app.get('/api/job/:jobId', optionalAuth, wrap(async (req, res) => {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const clips = db.prepare('SELECT * FROM clips WHERE job_id = ? ORDER BY score DESC').all(job.id);
  res.json({
    ...job,
    highlights: job.highlights ? JSON.parse(job.highlights) : null,
    clips: clips.map(c => ({
      ...c,
      download_url: c.file_path ? `${BASE_URL}/clips/${path.basename(c.file_path)}` : null,
    })),
  });
}));

// ─── CLIP: cut + crop + caption ───────────────────────────────────────────────
app.post('/api/clip', requireAuth, wrap(async (req, res) => {
  const { jobId, clipId, caption, cropMode = 'center', addCaptions = true } = req.body;
  if (!jobId || !clipId) return res.status(400).json({ error: 'jobId dan clipId wajib' });

  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const clip = db.prepare('SELECT * FROM clips WHERE id = ? AND job_id = ?').get(clipId, jobId);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  // Check quota
  checkAndDecrementQuota(req.user.id);

  db.prepare("UPDATE clips SET status='processing' WHERE id=?").run(clipId);
  res.json({ clipId, status: 'processing' });

  // Process async
  (async () => {
    let sourcePath;
    try {
      // Download video if not cached
      const videoId = job.id;
      const cachedPath = path.join(process.env.TMP_DIR || './tmp', `${videoId}.mp4`);

      if (!fs.existsSync(cachedPath)) {
        db.prepare("UPDATE clips SET status='downloading' WHERE id=?").run(clipId);
        sourcePath = await downloadVideo(job.youtube_url, videoId);
      } else {
        sourcePath = cachedPath;
      }

      // Process clip
      db.prepare("UPDATE clips SET status='processing' WHERE id=?").run(clipId);
      const result = await processClip({
        sourcePath,
        startSec: clip.start_sec,
        endSec: clip.end_sec,
        clipId,
        caption: caption || clip.title,
        cropMode,
        addCaptions,
      });

      db.prepare("UPDATE clips SET status='done', file_path=?, file_size=? WHERE id=?")
        .run(result.path, result.size, clipId);

    } catch (err) {
      console.error('[VS] Clip error:', err.message);
      db.prepare("UPDATE clips SET status='error', reason=? WHERE id=?").run(err.message, clipId);
    }
  })();
}));

// ─── CLIP STATUS ──────────────────────────────────────────────────────────────
app.get('/api/clip/:clipId', requireAuth, wrap(async (req, res) => {
  const db = getDb();
  const clip = db.prepare('SELECT * FROM clips WHERE id = ?').get(req.params.clipId);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  res.json({
    ...clip,
    download_url: clip.file_path ? `${BASE_URL}/clips/${path.basename(clip.file_path)}` : null,
  });
}));

// ─── CLIP DOWNLOAD ────────────────────────────────────────────────────────────
app.get('/api/download/:clipId', requireAuth, wrap(async (req, res) => {
  const db = getDb();
  const clip = db.prepare('SELECT * FROM clips WHERE id = ? AND user_id = ?').get(req.params.clipId, req.user.id);
  if (!clip || !clip.file_path) return res.status(404).json({ error: 'Clip not found or not ready' });

  const filename = `videosummarizer_${clip.title?.replace(/[^a-z0-9]/gi, '_') || clip.id}.mp4`;
  res.download(clip.file_path, filename);
}));

// ─── PAYMENT ──────────────────────────────────────────────────────────────────
app.post('/api/payment/create', requireAuth, wrap(async (req, res) => {
  const { plan } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const result = await createPayment(req.user.id, plan, user.email, user.name);
  res.json(result);
}));

app.post('/api/payment/webhook', wrap(async (req, res) => {
  const result = await handleWebhook(req.body);
  res.json(result);
}));

// ─── MY JOBS HISTORY ─────────────────────────────────────────────────────────
app.get('/api/jobs', requireAuth, wrap(async (req, res) => {
  const db = getDb();
  const jobs = db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(jobs);
}));

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, version: '1.0.0', ts: new Date().toISOString() }));

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎬 Video Summarizer running at ${BASE_URL}`);
  console.log(`   Free tier: ${process.env.FREE_CLIPS_PER_DAY || 5} clips/day`);
  console.log(`   Midtrans: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'Sandbox'}\n`);
});

module.exports = app;
