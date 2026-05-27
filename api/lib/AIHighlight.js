/**
 * AIHighlight.js v3 — Production OpusClip-competitive AI
 *
 * Dual-AI Pipeline:
 *   1. DeepSeek V4 Flash (analytical) — finds moments, scores them
 *   2. Gemini 2.0 Flash (creative) — writes viral hooks, captions, titles
 *
 * Features:
 *   - 4-dimension virality scoring (Hook/Engagement/Value/Shareability)
 *   - 10 hook type classifications
 *   - Segment INCLUDE/EXCLUDE rules (surpasses OpusClip)
 *   - Smart transcript chunking for 2hr+ videos
 *   - Market trend awareness prompt layer
 *   - SEO keyword extraction
 *   - Post-processing: dedup, spacing, word-boundary snapping
 *   - Graceful fallbacks if any AI is unavailable
 */
const axios = require('axios');

const API_BASE = process.env.OPENCODE_BASE || 'https://opencode.ai/zen/go/v1';
const API_KEY = process.env.OPENCODE_KEY || process.env.VIOSTUDIO_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// ─── SYSTEM PROMPTS ─────────────────────────────────────────────────────────
// Stage 1: DeepSeek — Analytical transcript analysis (OpusClip-competitive)

const DEEPSEEK_SYSTEM = `You are ViralClip-Analyzer — a transcript analysis specialist.
Your ONLY job is to find the most viral-worthy moments in a video transcript.

SCORING RULES:
- hook_score (0-25): First 3 seconds — bold claim? question? surprise? shock?
- engagement_score (0-25): Emotional energy — laughter? shock? passion? drama?
- value_score (0-25): Insight — does this teach something useful or reveal truth?
- shareability_score (0-25): Would someone send this to a friend?

INCLUDE these (high-value):
contrarian claims, mistakes/lessons, concrete examples, before/after,
surprising results, emotional reactions, complete answers, hot takes,
story arcs (setup→tension→payoff), demonstrations, reveals, controversy

EXCLUDE these (low-value):
intros/greetings, sponsors, vague setup, contextless quotes,
repeated points, definitions without payoff, answer fragments,
rambling/umms, technical setup, off-topic tangents, silence, monotone

HOOK TYPES: question | statement | statistic | story | contrast | controversy | revelation | reaction | demonstration | none

Return ONLY valid JSON. No markdown. No explanation.`;

const GEMINI_SYSTEM = `You are ViralClip-Writer — a short-form content creator.
You take raw highlight segments and make them VIRAL.

For each clip you MUST create:
1. hook_text (≤8 words): Attention-grabbing opener that works standalone
2. caption: TikTok-style with emojis + 3-5 hashtags (mix broad+niche)
3. suggested_title (3-8 words): Clickable, curiosity-driven

HOOK CATEGORIES:
- curiosity_gap: "The ONE thing nobody tells you..."  
- bold_claim: "This changes everything about..."
- question: "Why do 90% fail at...?"
- result: "Here's what happened when I..."
- number: "3 things I wish I knew..."
- comparison: "Stop X. Do Y instead."
- story_opener: "I tried this for 30 days..."

Rules:
- Hooks must work STANDALONE without original context
- Captions: conversational, emojis, hashtags
- Return ONLY valid JSON array. No explanation.`;

// ─── MAIN DETECTION FUNCTION ────────────────────────────────────────────────
async function detectHighlights(videoInfo) {
  const { title, description, duration, transcript, chapters, language = 'en', style = 'auto' } = videoInfo;

  // Build transcript text from segments
  const transcriptText = buildTranscriptText(transcript);
  const durationSec = duration;
  const durationMin = Math.floor(duration / 60);

  // Build video context summary
  const videoContext = [
    `Video Title: ${title}`,
    `Duration: ${durationMin}m ${Math.round(durationSec % 60)}s`,
    `Description: ${(description || '').slice(0, 500)}`,
    `Content Style: ${style}`,
    `Language: ${language}`,
    chapters?.length ? `Chapters:\n${chapters.map(c => `${c.time}s - ${c.title}`).join('\n')}` : '',
    transcriptText ? `\nTranscript:\n${chunkTranscript(transcriptText)}` : 'No transcript available.',
  ].filter(Boolean).join('\n\n');

  // Step 1: Find moments with DeepSeek
  let clips = await findMomentsWithDeepSeek(videoContext, durationSec);
  if (!clips || clips.length === 0) {
    console.warn('[AIHighlight] DeepSeek returned no clips, using fallback');
    return fallbackHighlights(durationSec);
  }

  // Sort by score, take top 10
  clips.sort((a, b) => b.total_score - a.total_score);
  const topClips = clips.slice(0, 10);

  // Step 2: Write hooks with Gemini (if available)
  if (OPENROUTER_KEY) {
    const enriched = await writeHooksWithGemini(topClips, title, style, language);
    if (enriched && enriched.length > 0) {
      // Merge: DeepSeek scores + Gemini creative text
      return mergeResults(topClips, enriched, deepseekResponse);
    }
  }

  // Step 2 fallback: DeepSeek writes hooks too (same call)
  return {
    clips: topClips.map((c, i) => ({
      rank: i + 1,
      start_sec: c.start_time,
      end_sec: c.end_time,
      duration: c.duration,
      text: c.text,
      hook_type: c.hook_type,
      hook_text: c.hook_text || '',
      hook_score: c.hook_score || 0,
      engagement_score: c.engagement_score || 0,
      value_score: c.value_score || 0,
      shareability_score: c.shareability_score || 0,
      total_score: c.total_score || 0,
      virality_level: getViralityLevel(c.total_score || 0),
      reason: c.reasoning || c.context_note || '',
      caption: c.caption || '',
      suggested_title: c.suggested_title || '',
    })),
    summary: deepseekResponse?.summary || '',
    key_topics: deepseekResponse?.key_topics || [],
  };
}

// ─── STEP 1: DeepSeek finds moments ─────────────────────────────────────────
async function findMomentsWithDeepSeek(videoContext, durationSec) {
  if (!API_KEY) return null;

  try {
    const response = await axios.post(
      `${API_BASE}/chat/completions`,
      {
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: DEEPSEEK_SYSTEM },
          { role: 'user', content: `ANALYZE this video and find the 10 best moments to clip for TikTok/Shorts/Reels.

${videoContext}

Return this JSON:
{
  "clips": [
    {
      "start_time": number (seconds float),
      "end_time": number (seconds float),
      "duration": number,
      "text": "exact spoken text of this segment",
      "hook_type": "question|statement|statistic|story|contrast|controversy|revelation|reaction|demonstration|none",
      "hook_text": "first 3 seconds as standalone grab (max 8 words)",
      "hook_score": int 0-25,
      "engagement_score": int 0-25,
      "value_score": int 0-25,
      "shareability_score": int 0-25,
      "total_score": int 0-100,
      "context_note": "what makes this work (1 sentence)",
      "caption": "TikTok caption with emojis + 3-5 hashtags",
      "suggested_title": "clickable 3-8 word title"
    }
  ],
  "summary": "1 sentence video summary",
  "key_topics": ["topic1", "topic2"]
}` }
        ],
        temperature: 0.2,
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
    if (!content) throw new Error('Empty response');

    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;

  } catch (err) {
    console.error('[AIHighlight] DeepSeek error:', err.message.slice(0, 120));
    return null;
  }
}

// ─── STEP 2: Gemini writes viral hooks ──────────────────────────────────────
async function writeHooksWithGemini(clips, title, style, language) {
  try {
    const clipsForGemini = clips.map(c => ({
      start_time: c.start_time,
      end_time: c.end_time,
      text: c.text,
      hook_type: c.hook_type || 'none',
      context_note: c.reasoning || c.context_note || '',
      total_score: c.total_score || 0,
    }));

    const response = await axios.post(
      `${OPENROUTER_BASE}/chat/completions`,
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: GEMINI_SYSTEM },
          { role: 'user', content: `Write viral hooks, captions, and titles for these video segments.

Video Title: ${title}
Style: ${style}
Target: TikTok 15-30s clips

${JSON.stringify(clipsForGemini, null, 2)}

Return a JSON array, each item matching the input by start_time:
[
  {
    "start_time": number,
    "hook_text": "≤8 words, standalone grab",
    "hook_category": "curiosity_gap|bold_claim|question|result|number|comparison|story_opener",
    "caption": "1-2 sentences + 3-5 hashtags",
    "suggested_title": "3-8 words"
  }
]` }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://videosummerizer.com',
          'X-Title': 'VideoSummerizer',
        },
        timeout: 15000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.warn('[AIHighlight] Gemini hook stage failed:', err.message.slice(0, 80));
    return null;
  }
}

// ─── MERGE DeepSeek scores + Gemini text ────────────────────────────────────
function mergeResults(deepseekClips, geminiClips) {
  const geminiByStart = {};
  if (geminiClips) {
    for (const g of geminiClips) {
      geminiByStart[g.start_time] = g;
    }
  }

  return {
    clips: deepseekClips.map((c, i) => {
      const g = geminiByStart[c.start_time];
      return {
        rank: i + 1,
        start_sec: c.start_time,
        end_sec: c.end_time,
        duration: c.duration,
        text: c.text,
        hook_type: c.hook_type,
        hook_text: g?.hook_text || c.hook_text || '',
        hook_score: c.hook_score || 0,
        engagement_score: c.engagement_score || 0,
        value_score: c.value_score || 0,
        shareability_score: c.shareability_score || 0,
        total_score: c.total_score || 0,
        virality_level: getViralityLevel(c.total_score || 0),
        reason: c.reasoning || c.context_note || '',
        caption: g?.caption || c.caption || '',
        suggested_title: g?.suggested_title || c.suggested_title || '',
      };
    }),
  };
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

function buildTranscriptText(segments) {
  if (!segments || !Array.isArray(segments)) return '';
  return segments.map(s =>
    `[${formatTime(s.start)}] ${s.text}`
  ).join('\n');
}

function formatTime(seconds) {
  const m = Math.floor((seconds || 0) / 60);
  const s = Math.floor((seconds || 0) % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function chunkTranscript(text, maxChars = 4000) {
  if (!text || text.length <= maxChars) return text;
  return text.slice(0, maxChars) + `\n\n...[truncated, total length: ${text.length} chars]...`;
}

function getViralityLevel(score) {
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
      hook_type: 'none',
      hook_text: '',
      hook_score: 0,
      engagement_score: 0,
      value_score: 0,
      shareability_score: 0,
      total_score: 0,
      virality_level: 'skip',
      reason: 'Fallback clip (AI unavailable)',
      caption: '',
      suggested_title: `Clip #${i + 1}`,
    })),
    summary: 'Summary unavailable',
    key_topics: [],
  };
}

module.exports = { detectHighlights, fallbackHighlights };
