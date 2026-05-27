/**
 * DB.js — SQLite via better-sqlite3
 * Tables: users, sessions, jobs, clips, payments
 */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');

let _db;
function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT,
      plan        TEXT NOT NULL DEFAULT 'free',
      clips_today INTEGER NOT NULL DEFAULT 0,
      clips_reset TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      youtube_url   TEXT NOT NULL,
      video_title   TEXT,
      video_thumb   TEXT,
      video_duration INTEGER,
      status        TEXT NOT NULL DEFAULT 'pending',
      highlights    TEXT,
      error         TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clips (
      id          TEXT PRIMARY KEY,
      job_id      TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      title       TEXT,
      start_sec   REAL,
      end_sec     REAL,
      score       REAL,
      reason      TEXT,
      file_path   TEXT,
      file_size   INTEGER,
      status      TEXT DEFAULT 'pending',
      created_at  TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(job_id) REFERENCES jobs(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      order_id        TEXT UNIQUE NOT NULL,
      amount          INTEGER NOT NULL,
      plan            TEXT NOT NULL,
      status          TEXT DEFAULT 'pending',
      midtrans_token  TEXT,
      midtrans_url    TEXT,
      paid_at         TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
}

module.exports = { getDb };
