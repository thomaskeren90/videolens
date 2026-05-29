#!/bin/bash
# KlikClip build script — install system deps + Node packages
set -e

echo "=== Installing ffmpeg (static build) ==="
curl -sL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz
tar xf /tmp/ffmpeg.tar.xz -C /tmp
cp /tmp/ffmpeg-*-static/ffmpeg /usr/local/bin/ffmpeg
cp /tmp/ffmpeg-*-static/ffprobe /usr/local/bin/ffprobe
chmod a+rx /usr/local/bin/ffmpeg /usr/local/bin/ffprobe
ffmpeg -version 2>&1 | head -1

echo "=== Installing yt-dlp ==="
curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version

echo "=== Installing Node packages ==="
cd api && npm install

echo "=== Build complete ==="
