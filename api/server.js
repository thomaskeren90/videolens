/* ============================================
   VideoLens — API Server
   Express + OpenAI Whisper + GPT-4o
   ============================================ */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests. Slow down.' }
});
app.use(limiter);

// ── Config ──
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ── In-memory transcript cache ──
const transcriptCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ============================================
// ROUTES
// ============================================

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'VideoLens API', version: '1.0.0' });
});

// ── Get transcript ──
app.get('/transcript', async (req, res) => {
  try {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    // Check cache
    const cached = transcriptCache.get(videoId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Step 1: Try YouTube's auto-generated captions
    let transcript = await fetchYouTubeTranscript(videoId);

    // Step 2: Fallback to Whisper if no captions
    if (!transcript || !transcript.segments?.length) {
      console.log(`[VideoLens] No captions for ${videoId}, using Whisper fallback`);
      transcript = await whisperFallback(videoId);
    }

    if (!transcript) {
      return res.status(404).json({ error: 'Could not extract transcript' });
    }

    // Cache it
    transcriptCache.set(videoId, { data: transcript, timestamp: Date.now() });

    res.json(transcript);
  } catch (err) {
    console.error('[VideoLens] Transcript error:', err.message);
    res.status(500).json({ error: 'Failed to get transcript' });
  }
});

// ── Summarize video ──
app.post('/summarize', async (req, res) => {
  try {
    const { videoId, videoUrl, title, options = {} } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    const {
      includeKeywords = true,
      includeStoryline = true,
      includeTimestamps = true,
      language = 'en'
    } = options;

    // Get transcript
    let transcript = await fetchYouTubeTranscript(videoId);
    if (!transcript?.segments?.length) {
      transcript = await whisperFallback(videoId);
    }

    if (!transcript) {
      return res.status(404).json({ error: 'Could not extract transcript' });
    }

    // Build full text from segments
    const fullText = transcript.segments.map(s => s.text).join(' ');

    // Generate summary with GPT-4o
    const summaryResult = await generateSummary(fullText, {
      title: title || 'YouTube Video',
      includeKeywords,
      includeStoryline,
      includeTimestamps,
      language,
      segments: transcript.segments
    });

    res.json({
      videoId,
      videoUrl,
      title,
      source: transcript.source, // 'captions' or 'whisper'
      ...summaryResult
    });

  } catch (err) {
    console.error('[VideoLens] Summarize error:', err.message);
    res.status(500).json({ error: 'Failed to summarize video' });
  }
});

// ── Ask question about video ──
app.post('/ask', async (req, res) => {
  try {
    const { videoId, question } = req.body;
    if (!videoId || !question) {
      return res.status(400).json({ error: 'videoId and question required' });
    }

    // Get transcript (should be cached)
    let transcript = await fetchYouTubeTranscript(videoId);
    if (!transcript?.segments?.length) {
      transcript = await whisperFallback(videoId);
    }

    if (!transcript) {
      return res.status(404).json({ error: 'Could not get transcript' });
    }

    const fullText = transcript.segments.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n');

    const answer = await answerQuestion(fullText, question);

    res.json(answer);
  } catch (err) {
    console.error('[VideoLens] Ask error:', err.message);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});


// ============================================
// CORE FUNCTIONS
// ============================================

// ── Fetch YouTube transcript ──
async function fetchYouTubeTranscript(videoId) {
  try {
    // Use YouTube's timedtext API
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Fetch the video page to get caption tracks
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = await response.text();

    // Extract caption track URL from page
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return null;

    const captions = JSON.parse(captionMatch[1]);
    if (!captions || !captions.length) return null;

    // Prefer English, then first available
    const track = captions.find(c => c.languageCode === 'en') || captions[0];

    // Fetch the actual captions XML
    const captionResponse = await fetch(track.baseUrl);
    const captionXml = await captionResponse.text();

    // Parse XML to segments
    const segments = parseCaptionXml(captionXml);

    return {
      source: 'captions',
      language: track.languageCode,
      segments
    };
  } catch (err) {
    console.log(`[VideoLens] YouTube transcript failed for ${videoId}:`, err.message);
    return null;
  }
}

// ── Parse YouTube caption XML ──
function parseCaptionXml(xml) {
  const segments = [];
  const textRegex = /<text\s+start="([\d.]+)"\s+duration="([\d.]+)"[^>]*>(.*?)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n/g, ' ');

    segments.push({
      start,
      duration,
      end: start + duration,
      text: text.trim()
    });
  }

  return segments;
}

// ── Whisper fallback ──
async function whisperFallback(videoId) {
  // In production, you'd download the audio and send to Whisper API
  // This is a placeholder that returns the expected structure
  console.log(`[VideoLens] Whisper fallback triggered for ${videoId}`);

  // TODO: Implement actual Whisper transcription
  // 1. Download audio using yt-dlp or similar
  // 2. Send to OpenAI Whisper API: POST https://api.openai.com/v1/audio/transcriptions
  // 3. Parse response into segments

  return null; // Return null if Whisper is not configured
}

// ── Generate summary with GPT-4o ──
async function generateSummary(text, options) {
  const { title, includeKeywords, includeStoryline, includeTimestamps, language, segments } = options;

  // Truncate if too long (GPT-4o context limit)
  const maxChars = 80000;
  const truncatedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;

  const systemPrompt = `You are VideoLens, an expert video content analyzer. Your job is to extract maximum value from video transcripts.

Respond in valid JSON only. No markdown fences, no extra text.

Required JSON structure:
{
  "summary": "A comprehensive 2-3 paragraph summary that captures the essence, main arguments, and key takeaways. Write it as a narrative, not bullet points.",
  "keywords": ["keyword1", "keyword2", ...] (8-15 relevant keywords/topics/entities),
  "storyline": [
    {
      "time": "0:00 - 2:30",
      "title": "Chapter title",
      "description": "What happens in this section"
    }
  ],
  "timestamps": [
    {
      "time": "2:34",
      "seconds": 154,
      "text": "Key point from this moment"
    }
  ]
}`;

  let userPrompt = `Analyze this video transcript and provide:\n`;

  if (includeKeywords) userPrompt += `- Extract 8-15 keywords/topics that capture the main themes\n`;
  if (includeStoryline) userPrompt += `- Break into 4-8 storyline chapters with time ranges\n`;
  if (includeTimestamps) userPrompt += `- Identify 5-10 key moments with timestamps\n`;
  userPrompt += `- Write a deep, insightful summary (not just restating the transcript)\n`;
  userPrompt += `- Focus on INSIGHTS, not just facts. What can the viewer LEARN?\n`;
  userPrompt += `- Language for output: ${language}\n\n`;
  userPrompt += `Title: "${title}"\n\n`;
  userPrompt += `Transcript:\n${truncatedText}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No response from GPT-4o');

    return JSON.parse(content);
  } catch (err) {
    console.error('[VideoLens] GPT-4o error:', err.message);
    // Return a fallback summary
    return {
      summary: 'Summary generation failed. Please try again.',
      keywords: [],
      storyline: [],
      timestamps: []
    };
  }
}

// ── Answer question about video ──
async function answerQuestion(transcriptText, question) {
  const systemPrompt = `You are VideoLens Q&A. Answer questions about a video based on its transcript.

Your answer must be grounded in the transcript. If the answer isn't in the transcript, say so.

Respond in JSON:
{
  "answer": "Your detailed answer",
  "timestamp": "2:34",
  "timestampSeconds": 154,
  "confidence": "high|medium|low"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Transcript (with timestamps):\n${transcriptText}\n\nQuestion: ${question}` }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return JSON.parse(content);
  } catch (err) {
    return { answer: 'Failed to find an answer. Try rephrasing your question.', confidence: 'low' };
  }
}

// ── Utility ──
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================
// START
// ============================================
app.listen(PORT, () => {
  console.log(`\n🎯 VideoLens API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   POST /summarize — Summarize a YouTube video`);
  console.log(`   POST /ask — Ask questions about a video`);
  console.log(`   GET  /transcript?videoId=xxx — Get raw transcript\n`);

  if (!OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set. Summarization will fail.');
  }
  if (!YOUTUBE_API_KEY) {
    console.log('ℹ️  YOUTUBE_API_KEY not set. Using HTML scraping for transcripts.');
  }
});
