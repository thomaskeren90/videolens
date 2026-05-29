/**
 * Clipper.js — yt-dlp download + FFmpeg cut/crop/caption pipeline
 * Flow: YouTube URL → download → cut → crop 9:16 → burn captions → output MP4
 */
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

// Find ffmpeg & yt-dlp — check env vars, then project bin/, then system PATH
function findBin(name) {
  // Check env override first
  const envKey = name === 'ffmpeg' ? 'FFMPEG_PATH' : 'YTDLP_PATH';
  if (process.env[envKey] && fs.existsSync(process.env[envKey])) return process.env[envKey];
  // Check project bin/ directory
  const localPath = path.join(__dirname, '..', '..', 'bin', name);
  if (fs.existsSync(localPath)) return localPath;
  // Fall back to system PATH
  return name;
}

const YTDLP = findBin('yt-dlp');
const FFMPEG = findBin('ffmpeg');

console.log('[Clipper] YTDLP:', YTDLP);
console.log('[Clipper] FFMPEG:', FFMPEG);

const CLIPS_DIR = process.env.CLIPS_DIR || path.join(__dirname, '..', 'clips');
const TMP_DIR = process.env.TMP_DIR || path.join(__dirname, '..', 'tmp');

// Ensure dirs exist
[CLIPS_DIR, TMP_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ─── Get video metadata ───────────────────────────────────────────────────────
async function getVideoInfo(youtubeUrl) {
  const cmd = `${YTDLP} --dump-json --no-playlist "${youtubeUrl}"`;
  const { stdout } = await execAsync(cmd, { timeout: 30000 });
  const info = JSON.parse(stdout);

  // Extract transcript from subtitles if available
  let transcript = null;
  if (info.subtitles?.id?.[0] || info.automatic_captions?.id?.[0]) {
    try {
      const subCmd = `${YTDLP} --write-auto-sub --sub-lang id,en --sub-format srv3/vtt/best --skip-download -o "${TMP_DIR}/%(id)s" "${youtubeUrl}"`;
      await execAsync(subCmd, { timeout: 30000 });
      const subFiles = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(info.id) && (f.endsWith('.vtt') || f.endsWith('.srv3')));
      if (subFiles[0]) {
        const raw = fs.readFileSync(path.join(TMP_DIR, subFiles[0]), 'utf8');
        transcript = raw.replace(/<[^>]+>/g, '').replace(/\d{2}:\d{2}:\d{2}[^\n]+\n/g, '').slice(0, 4000);
        subFiles.forEach(f => fs.unlinkSync(path.join(TMP_DIR, f)));
      }
    } catch {}
  }

  // Extract chapters
  const chapters = (info.chapters || []).map(c => ({
    time: Math.round(c.start_time),
    title: c.title,
  }));

  return {
    id: info.id,
    title: info.title,
    description: info.description,
    duration: info.duration,
    thumbnail: info.thumbnail,
    uploader: info.uploader,
    chapters,
    transcript,
  };
}

// ─── Download best quality (for FFmpeg processing) ────────────────────────────
async function downloadVideo(youtubeUrl, videoId) {
  const outputPath = path.join(TMP_DIR, `${videoId}.%(ext)s`);
  // Download best quality up to 1080p to keep processing fast
  const cmd = `${YTDLP} -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}" --no-playlist "${youtubeUrl}"`;
  await execAsync(cmd, { timeout: 600000 }); // 10 min timeout

  const mp4 = path.join(TMP_DIR, `${videoId}.mp4`);
  if (fs.existsSync(mp4)) return mp4;

  // Fallback: find any downloaded file
  const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(videoId));
  if (files[0]) return path.join(TMP_DIR, files[0]);
  throw new Error('Download failed: no output file found');
}

// ─── Cut + Crop 9:16 + Burn captions ─────────────────────────────────────────
async function processClip(options) {
  const {
    sourcePath,
    startSec,
    endSec,
    clipId,
    caption = '',
    cropMode = 'center', // center | face-center | wide
    resolution = '1080x1920', // 9:16 for TikTok
    addCaptions = true,
  } = options;

  const outputPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
  const [outW, outH] = resolution.split('x').map(Number);
  const duration = endSec - startSec;

  // Build FFmpeg filter chain:
  // 1. Scale to fill 9:16 (smart crop: auto-detect face area or center)
  // 2. Crop to exact 9:16
  // 3. Add caption overlay if text provided
  const cropFilter = buildCropFilter(outW, outH, cropMode);
  const captionFilter = (addCaptions && caption)
    ? buildCaptionFilter(caption, outW, outH)
    : null;

  const vfilter = [cropFilter, captionFilter].filter(Boolean).join(',');

  const ffmpegArgs = [
    '-ss', String(startSec),
    '-i', sourcePath,
    '-t', String(duration),
    '-vf', vfilter,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputPath,
  ];

  await runFFmpeg(ffmpegArgs);

  const stat = fs.statSync(outputPath);
  return { path: outputPath, size: stat.size, clipId };
}

function buildCropFilter(outW, outH, mode) {
  // Scale: maintain aspect ratio filling the target, then crop
  // For 9:16 (1080x1920): scale wide video to fill height, then center-crop width
  if (mode === 'center') {
    return (
      `scale=${outW}:${outH}:force_original_aspect_ratio=increase,` +
      `crop=${outW}:${outH}:(iw-${outW})/2:(ih-${outH})/2`
    );
  }
  // Wide: letterbox with blur background (cinematic look)
  return (
    `[v0]scale=${outW}:${outH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black[fg];` +
    `[v0]scale=${outW}:${outH},boxblur=20:3[bg];[bg][fg]overlay`
  );
}

function buildCaptionFilter(text, outW, outH) {
  // Escape FFmpeg drawtext special chars
  const safe = text.replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/\\/g, '/');
  const fontSize = Math.round(outW * 0.05); // ~54px for 1080w
  const boxH = Math.round(outH * 0.12);
  const y = outH - boxH - Math.round(outH * 0.05);

  return (
    `drawbox=x=0:y=${y}:w=${outW}:h=${boxH}:color=black@0.65:t=fill,` +
    `drawtext=text='${safe}':fontsize=${fontSize}:fontcolor=white:` +
    `x=(w-text_w)/2:y=${y + Math.round(boxH * 0.3)}:` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `borderw=2:bordercolor=black`
  );
}

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', reject);
  });
}

// ─── Cleanup temp file ────────────────────────────────────────────────────────
function cleanupTmp(videoId) {
  try {
    const files = fs.readdirSync(TMP_DIR).filter(f => f.startsWith(videoId));
    files.forEach(f => fs.unlinkSync(path.join(TMP_DIR, f)));
  } catch {}
}

// ─── Serve clip for download ─────────────────────────────────────────────────
function getClipPath(clipId) {
  return path.join(CLIPS_DIR, `${clipId}.mp4`);
}

function clipExists(clipId) {
  return fs.existsSync(getClipPath(clipId));
}

module.exports = { getVideoInfo, downloadVideo, processClip, cleanupTmp, getClipPath, clipExists };
