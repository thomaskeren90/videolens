/**
 * AIHighlight.js — Dual-AI pipeline: DeepSeek + Gemini
 *
 * Step 1: DeepSeek V4 Flash (opencode-go) → finds 10 best moments
 * Step 2: Gemini 2.0 Flash (OpenRouter free) → writes viral hooks for each
 *
 * Falls back gracefully if either API is unavailable.
 */
const axios = require('axios');

const OPENCODE_BASE = process.env.OPENCODE_BASE || 'https://opencode.ai/zen/go/v1';
const OPENCODE_KEY = process.env.OPENCODE_KEY || process.env.VIOSTUDIO_KEY || '';
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// DeepSeek prompt — analytical, finding the best moments
const HIGHLIGHT_PROMPT = `You are an expert viral video editor analyzing a transcript. Find the 10 best moments to clip for TikTok/Reels.

Scoring criteria:
- Emotional peak: laughter, surprise, shock, revelation (30%)
- Quotability: standalone one-liners, memorable phrases (25%)
- Visual action: demo, product reveal, physical gag (20%)
- Story arc: setup+punchline, before/after (15%)
- Engagement hook: first 3 seconds must grab attention (10%)

For each clip: 15–60 seconds (ideal 30–45s). Prioritize moments with emotional closure.

Return ONLY a JSON array (no markdown):
[
  {
    "rank": 1,
    "start_sec": 45.0,
    "end_sec": 78.0,
    "title": "Short punchy title (max 8 words)",
    "reason": "Why this moment is viral-worthy (1 sentence)",
    "score": 9.2,
    "text": "The transcript text for this segment"
  }
]`;

// Gemini prompt — creative, writes scroll-stopping hooks
const HOOK_PROMPT = `You are a TikTok hook expert. Given a transcript segment, write ONE scroll-stopping hook (max 8 words).

Rules:
- MUST create curiosity gap
- Use power words
- Match the emotion of the clip
- Return ONLY the hook text, nothing else

Examples:
- "Wait till you hear this..."
- "I couldn't believe my eyes 🤯"
- "The ending changes everything"
- "This changes EVERYTHING"
- "3 seconds that shocked me"
- "Stop scrolling and watch this"

Transcript: `;

async function detectHighlights(videoInfo) {
  const { title, description, duration, transcript, chapters } = videoInfo;

  const userContent = `Video Title: ${title}
Duration: ${Math.floor(duration / 60)}m ${duration % 60}s
Description: ${(description || '').slice(0, 500)}
${chapters?.length ? `\nChapters:\n${chapters.map(c => `${c.time}s - ${c.title}`).join('\n')}` : ''}
${transcript ? `\nTranscript (excerpt):\n${transcript.slice(0, 3000)}` : ''}

Find the 10 best moments to clip.`;

  // Step 1: DeepSeek finds the moments
  let highlights = await callDeepSeek(userContent, duration);
  
  // Step 2: Gemini writes hooks for each moment (if available)
  if (OPENROUTER_KEY && highlights.length > 0) {
    for (const h of highlights) {
      h.hook = await callGemini(h.text || h.title);
    }
  }

  return highlights;
}

// ─── Step 1: DeepSeek (analytical) ──────────────────────────────────────────
async function callDeepSeek(userContent, duration) {
  if (!OPENCODE_KEY) {
    console.warn('[AIHighlight] No OPENCODE_KEY');
    return fallbackHighlights(duration);
  }

  try {
    const resp = await axios.post(
      `${OPENCODE_BASE}/chat/completions`,
      {
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: HIGHLIGHT_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: { 'Authorization': `Bearer ${OPENCODE_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const text = resp.data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response');
    const clean = text.replace(/```json|```/g, '').trim();
    const highlights = JSON.parse(clean);

    return highlights.slice(0, 10).map((h, i) => ({
      rank: i + 1,
      start_sec: Math.max(0, parseFloat(h.start_sec) || 0),
      end_sec: Math.min(duration, parseFloat(h.end_sec) || 30),
      title: h.title || `Moment #${i + 1}`,
      reason: h.reason || '',
      score: Math.min(10, Math.max(0, parseFloat(h.score) || 7)),
      hook: '',
      text: h.text || h.title || '',
    }));
  } catch (err) {
    console.error('[AIHighlight] DeepSeek error:', err.message);
    return fallbackHighlights(duration);
  }
}

// ─── Step 2: Gemini (creative hooks) via OpenRouter ─────────────────────────
async function callGemini(segmentText) {
  try {
    const resp = await axios.post(
      `${OPENROUTER_BASE}/chat/completions`,
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          { role: 'system', content: HOOK_PROMPT },
          { role: 'user', content: segmentText.slice(0, 500) },
        ],
        max_tokens: 50,
        temperature: 0.8,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://videosummerizer.com',
          'X-Title': 'VideoSummerizer',
        },
        timeout: 10000,
      }
    );

    const hook = resp.data.choices?.[0]?.message?.content?.trim();
    return hook || '';
  } catch (err) {
    console.warn('[AIHighlight] Gemini hook failed:', err.message.slice(0, 80));
    return '';
  }
}

// ─── Fallback ──────────────────────────────────────────────────────────────
function fallbackHighlights(duration, count = 10) {
  const interval = Math.floor(duration / (count + 1));
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    start_sec: interval * (i + 1),
    end_sec: Math.min(duration, interval * (i + 1) + 30),
    title: `Moment #${i + 1}`,
    reason: 'Auto-detected highlight',
    score: 7.0,
    hook: '',
    text: '',
  }));
}

module.exports = { detectHighlights, fallbackHighlights };
