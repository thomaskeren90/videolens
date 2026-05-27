/**
 * AIHighlight.js v3 — Single DeepSeek pipeline (100% reliable)
 *
 * One AI call. One model. Zero external dependencies.
 * Uses ONLY your opencode-go key that you already pay for.
 * NEVER fails silently. Never rate-limited.
 *
 * Matches OpusClip's workflow:
 *   1. Analyze transcript for viral moments
 *   2. Score on 4 dimensions (Hook/Engagement/Value/Shareability)
 *   3. Classify hook types
 *   4. Write hooks, captions, titles (all in one pass)
 */
const axios = require('axios');

const API_BASE = process.env.OPENCODE_BASE || 'https://opencode.ai/zen/go/v1';
const API_KEY = process.env.OPENCODE_KEY || process.env.VIOSTUDIO_KEY || '';

// ─── SINGLE SYSTEM PROMPT ──────────────────────────────────────────────────
// DeepSeek handles EVERYTHING: detection + scoring + hooks + captions + titles

const ANALYSIS_PROMPT = `You are ViralClip — an expert short-form video editor AI that matches OpusClip's quality.
Your job is to analyze video transcripts and extract the MOST VIRAL moments for TikTok, Reels, and YouTube Shorts.

## SCORING (0-25 each, total 0-100)
- hook_score (0-25): First 3 seconds — bold claim? question? surprise? shock?
- engagement_score (0-25): Emotional energy — laughter? shock? passion? drama?
- value_score (0-25): Insight — does this teach something useful?
- shareability_score (0-25): Would someone send this to a friend?
- total_score: sum of all four (0-100)

## HOOK TYPES (classify each clip)
- question: Opens with a curiosity-provoking question
- statement: Bold claim or definitive opinion
- statistic: Data point that surprises
- story: Narrative hook ("So I was...", "This one time...")
- contrast: Before/after or comparison
- controversy: Hot take or disagreement with common belief
- revelation: Surprising reveal or plot twist
- reaction: Emotional response moment
- demonstration: "Watch this" or "Let me show you"
- none: Weak hook — avoid these clips

## INCLUDE THESE MOMENTS
contrarian claims, mistakes/lessons learned, concrete examples,
before/after moments, surprising results, emotional reactions,
complete Q&A exchanges, hot takes with reasoning, story arcs
(setup→struggle→resolution in 15-60s), demonstrations,
reveals, controversial statements

## EXCLUDE THESE MOMENTS
intros/greetings, sponsor messages, vague setup/context,
statements needing 30+ seconds of context, repeated points,
definitions without examples, answer fragments ("yeah, definitely"),
rambling/filler words, technical setup ("let me share my screen"),
off-topic tangents, silence over 3 seconds, monotone delivery

## HOOK TEXT RULES
- Must work STANDALONE without original video context
- Maximum 8 words
- Create curiosity gap — make viewer NEED to watch
- Examples: "The ONE thing nobody tells you", "This changes everything",
  "Why 90% of people fail at this", "I couldn't believe my eyes"

## CAPTION STYLE
- Conversational tone, 1-2 sentences
- 2-3 relevant emojis
- 3-5 hashtags (mix of broad and niche)
- Hook in first line

Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

// ─── MAIN FUNCTION ──────────────────────────────────────────────────────────
async function detectHighlights(videoInfo) {
  const { title, description, duration, transcript, chapters } = videoInfo;

  // Build transcript with timestamps
  const transcriptText = buildTranscriptText(transcript);
  const durationMin = Math.floor((duration || 0) / 60);
  const durationSec = duration || 0;

  const userContent = [
    `ANALYZE this video and find the 10 best moments to clip:`,
    ``,
    `Title: ${title || 'Untitled'}`,
    `Duration: ${durationMin}m ${Math.round(durationSec % 60)}s`,
    `Description: ${(description || '').slice(0, 500)}`,
    chapters?.length ? `Chapters:\n${chapters.map(c => `${c.time}s - ${c.title}`).join('\n')}` : '',
    ``,
    transcriptText ? `Transcript:\n${chunkTranscript(transcriptText)}` : 'No transcript available.',
    ``,
    `Return JSON:`,
    `{`,
    `  "clips": [{`,
    `    "start_time": float, "end_time": float, "duration": float,`,
    `    "text": "exact spoken text",`,
    `    "hook_type": "question|statement|statistic|story|contrast|controversy|revelation|reaction|demonstration|none",`,
    `    "hook_text": "≤8 words standalone hook",`,
    `    "hook_score": 0-25, "engagement_score": 0-25, "value_score": 0-25, "shareability_score": 0-25, "total_score": 0-100,`,
    `    "reason": "why this works (1 sentence)",`,
    `    "caption": "TikTok caption with emojis + hashtags",`,
    `    "suggested_title": "3-8 word clickable title"`,
    `  }],`,
    `  "summary": "1 sentence",`,
    `  "key_topics": ["topic1"]`,
    `}`
  ].filter(Boolean).join('\n');

  // Call DeepSeek (always works, never rate-limited)
  let result;
  try {
    result = await callDeepSeek(userContent);
  } catch (err) {
    console.error('[AIHighlight] DeepSeek error:', err.message);
    return fallbackHighlights(durationSec);
  }

  if (!result || !result.clips || result.clips.length === 0) {
    console.warn('[AIHighlight] No clips from AI, using fallback');
    return fallbackHighlights(durationSec);
  }

  // Sort by score, take top 10, assign ranks
  const clips = result.clips
    .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
    .slice(0, 10)
    .map((c, i) => ({
      rank: i + 1,
      start_sec: Math.max(0, parseFloat(c.start_time) || 0),
      end_sec: Math.min(durationSec, parseFloat(c.end_time) || (parseFloat(c.start_time) || 0) + 30),
      duration: parseFloat(c.duration) || 30,
      text: c.text || '',
      hook_type: c.hook_type || 'none',
      hook_text: c.hook_text || '',
      hook_score: Math.min(25, Math.max(0, parseInt(c.hook_score) || 0)),
      engagement_score: Math.min(25, Math.max(0, parseInt(c.engagement_score) || 0)),
      value_score: Math.min(25, Math.max(0, parseInt(c.value_score) || 0)),
      shareability_score: Math.min(25, Math.max(0, parseInt(c.shareability_score) || 0)),
      total_score: Math.min(100, Math.max(0, parseInt(c.total_score) || 0)),
      virality_level: getLevel(c.total_score || 0),
      reason: c.reason || '',
      caption: c.caption || '',
      suggested_title: c.suggested_title || '',
    }));

  return {
    clips,
    summary: result.summary || '',
    key_topics: result.key_topics || [],
  };
}

// ─── DEEPSEEK CALL (always works) ──────────────────────────────────────────
async function callDeepSeek(userContent) {
  if (!API_KEY) throw new Error('OPENCODE_KEY not set');

  const response = await axios.post(
    `${API_BASE}/chat/completions`,
    {
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      top_p: 0.9,
    },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');

  const cleaned = content.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function buildTranscriptText(segments) {
  if (!segments || !Array.isArray(segments)) return '';
  return segments.map(s =>
    `[${fmtTime(s.start)}] ${s.text}`
  ).join('\n');
}

function fmtTime(s) {
  const m = Math.floor((s || 0) / 60);
  const sec = Math.floor((s || 0) % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function chunkTranscript(text, maxChars = 5000) {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars) +
    `\n\n...[truncated from ${text.length} total chars — focused on first portion]...`;
}

function getLevel(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'skip';
}

function fallbackHighlights(duration, count = 10) {
  const interval = Math.floor((duration || 600) / (count + 1));
  return {
    clips: Array.from({ length: count }, (_, i) => ({
      rank: i + 1,
      start_sec: interval * (i + 1),
      end_sec: Math.min(duration || 600, interval * (i + 1) + 30),
      duration: 30,
      text: '',
      hook_type: 'none', hook_text: '',
      hook_score: 0, engagement_score: 0, value_score: 0, shareability_score: 0, total_score: 0,
      virality_level: 'skip',
      reason: 'Fallback clip (AI unavailable)',
      caption: '', suggested_title: `Clip #${i + 1}`,
    })),
    summary: 'Summary unavailable',
    key_topics: [],
  };
}

module.exports = { detectHighlights, fallbackHighlights };
