/**
 * AIHighlight.js — DeepSeek-powered highlight detection
 * Uses opencode-go (DeepSeek V4 Flash) via OpenAI-compatible API
 * No Anthropic dependency, no extra cost
 */
const axios = require('axios');

const OPENCODE_BASE = process.env.OPENCODE_BASE || 'https://opencode.ai/zen/go/v1';
const OPENCODE_KEY = process.env.OPENCODE_KEY || process.env.VIOSTUDIO_KEY || '';

const HIGHLIGHT_PROMPT = `You are an expert viral video editor specializing in short-form content for TikTok and YouTube Shorts. Your job is to find the 10 best moments from a video to clip.

Analyze the video information provided and return EXACTLY 10 highlight moments.

Scoring criteria (weight each factor):
- Emotional peak: laughter, surprise, shock, revelation (30%)
- Quotability: standalone one-liners, memorable phrases (25%)
- Visual action: demo, product reveal, physical gag (20%)
- Story arc: setup+punchline, before/after (15%)
- Engagement hook: first 3 seconds must grab attention (10%)

For each clip:
- Duration: 15–60 seconds (ideal: 30–45s)
- Must have clear start/end context
- Prioritize moments with emotional closure

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {
    "rank": 1,
    "start_sec": 45.0,
    "end_sec": 78.0,
    "title": "Short punchy title (max 8 words)",
    "reason": "Why this moment is viral-worthy (1 sentence)",
    "score": 9.2,
    "hook": "First 5 words of the clip to grab attention"
  }
]`;

async function detectHighlights(videoInfo) {
  const { title, description, duration, transcript, chapters } = videoInfo;

  const userContent = `Video Title: ${title}
Duration: ${Math.floor(duration / 60)}m ${duration % 60}s
Description: ${(description || '').slice(0, 500)}
${chapters?.length ? `\nChapters:\n${chapters.map(c => `${c.time}s - ${c.title}`).join('\n')}` : ''}
${transcript ? `\nTranscript (excerpt):\n${transcript.slice(0, 3000)}` : ''}

Find the 10 best moments to clip.`;

  const apiKey = OPENCODE_KEY;
  if (!apiKey) {
    console.warn('[AIHighlight] No API key set, using fallback');
    return fallbackHighlights(duration);
  }

  try {
    const response = await axios.post(
      `${OPENCODE_BASE}/chat/completions`,
      {
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: HIGHLIGHT_PROMPT },
          { role: 'user', content: userContent }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    if (!text) throw new Error('No response from AI');

    // Parse JSON from response (strip markdown if present)
    const clean = text.replace(/```json|```/g, '').trim();
    const highlights = JSON.parse(clean);

    // Validate and clamp
    return highlights.slice(0, 10).map((h, i) => ({
      rank: i + 1,
      start_sec: Math.max(0, parseFloat(h.start_sec) || 0),
      end_sec: Math.min(duration, parseFloat(h.end_sec) || 30),
      title: h.title || `Momen #${i + 1}`,
      reason: h.reason || '',
      score: Math.min(10, Math.max(0, parseFloat(h.score) || 7)),
      hook: h.hook || '',
    }));
  } catch (err) {
    console.error('[AIHighlight] Detection error:', err.message);
    return fallbackHighlights(duration);
  }
}

// Fallback: evenly spaced clips if AI fails
function fallbackHighlights(duration, count = 10) {
  const interval = Math.floor(duration / (count + 1));
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    start_sec: interval * (i + 1),
    end_sec: Math.min(duration, interval * (i + 1) + 30),
    title: `Momen #${i + 1}`,
    reason: 'Auto-detected highlight',
    score: 7.0,
    hook: '',
  }));
}

module.exports = { detectHighlights, fallbackHighlights };
