import { useState, useRef, useEffect } from "react";

// ─── i18n ────────────────────────────────────────────────────────────────────
const t = {
  en: {
    hero_title: "Generate 10 Viral Clips Today",
    hero_sub: "Paste a YouTube link or upload your video — AI does the rest",
    input_placeholder: "https://youtube.com/watch?v=...",
    upload_text: "Click or drag to upload video",
    upload_sub: "MP4, MOV, AVI · Max 1 GB",
    cta: "🔥 Generate 10 Clips",
    processing: "Analysing video...",
    style_label: "Content Style",
    lang_label: "Language",
    clips_label: "Clips",
    recent: "Recent Projects",
    no_projects: "No projects yet — generate your first clip!",
    learning: "Need help? Visit the Learning Center",
    nav_home: "Home",
    nav_projects: "Projects",
    nav_new: "New",
    nav_stats: "Stats",
    nav_account: "Account",
    nav_learn: "Learn",
    nav_settings: "Settings",
    url_error: "Please enter a valid YouTube URL",
    toast_success: "10 clips generated successfully!",
    download: "Download",
    viral_score: "Viral Score",
    duration: "Duration",
    search_placeholder: "Search projects...",
    search_articles: "Search articles...",
    popular: "Popular Articles",
    art1: "How to Get 1 Million Views on TikTok",
    art2: "5 Secrets of Professional Clippers",
    art3: "Best Posting Schedule for TikTok Indonesia",
    art4: "How to Use AI to Find Viral Moments",
    getting_started: "Getting Started",
    tutorials: "Tutorials",
    tips: "Tips & Tricks",
    faq: "FAQ",
    pricing_title: "Simple, Transparent Pricing",
    pricing_sub: "Start free. Scale when you're ready.",
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    popular_badge: "⭐ Most Popular",
    per_month: "/mo",
    free_price: "$0",
    starter_price: "Rp 29K",
    pro_price: "Rp 79K",
    free_f1: "1 clip / day",
    free_f2: "720p quality",
    free_f3: "KlikClip watermark",
    free_f4: "Basic AI detection",
    starter_f1: "50 clips / month",
    starter_f2: "1080p quality",
    starter_f3: "No watermark",
    starter_f4: "AI captions",
    pro_f1: "200 clips / month",
    pro_f2: "1080p priority queue",
    pro_f3: "No watermark",
    pro_f4: "API access",
    btn_start: "Get Started",
    btn_subscribe: "Subscribe",
    feature: "Feature",
    plan_free: "Free",
    plan_starter: "Starter",
    plan_pro: "Pro",
    row1: "Clips / month",
    row2: "Resolution",
    row3: "Watermark",
    row4: "AI Captions",
    row5: "Priority Queue",
    row6: "API Access",
    settings_title: "Settings",
    account: "Account",
    billing: "Billing",
    credits: "Credits",
    preferences: "Preferences",
    api_key: "API Key",
    email_label: "Email",
    name_label: "Name",
    edit: "Edit",
    manage: "Manage",
    plan_label: "Plan",
    free_plan: "Free (1 clip/day)",
    used: "Used today",
    reset: "Resets in",
    hours: "hours",
    def_lang: "Default language",
    def_style: "Default style",
    def_clips: "Default clip count",
    auto: "Auto",
    generate_key: "Generate Key",
    credits_badge: "credits",
  },
  id: {
    hero_title: "Hasilkan 10 Klip Viral Hari Ini",
    hero_sub: "Tempel link YouTube atau unggah video — AI bekerja untuk Anda",
    input_placeholder: "https://youtube.com/watch?v=...",
    upload_text: "Klik atau seret untuk unggah video",
    upload_sub: "MP4, MOV, AVI · Maks 1 GB",
    cta: "🔥 Buat 10 Klip",
    processing: "Menganalisis video...",
    style_label: "Gaya Konten",
    lang_label: "Bahasa",
    clips_label: "Jumlah Klip",
    recent: "Proyek Terbaru",
    no_projects: "Belum ada proyek — buat klip pertama Anda!",
    learning: "Butuh bantuan? Kunjungi Pusat Belajar",
    nav_home: "Beranda",
    nav_projects: "Proyek",
    nav_new: "Baru",
    nav_stats: "Statistik",
    nav_account: "Akun",
    nav_learn: "Pelajari",
    nav_settings: "Pengaturan",
    url_error: "Masukkan URL YouTube yang valid",
    toast_success: "10 klip berhasil dibuat!",
    download: "Unduh",
    viral_score: "Skor Viral",
    duration: "Durasi",
    search_placeholder: "Cari proyek...",
    search_articles: "Cari artikel...",
    popular: "Artikel Populer",
    art1: "Cara Mendapat 1 Juta Tayangan di TikTok",
    art2: "5 Rahasia Clipper Profesional",
    art3: "Jadwal Posting Terbaik TikTok Indonesia",
    art4: "Cara Pakai AI untuk Menemukan Momen Viral",
    getting_started: "Mulai",
    tutorials: "Tutorial",
    tips: "Tips & Trik",
    faq: "FAQ",
    pricing_title: "Harga Jelas, Tanpa Kejutan",
    pricing_sub: "Mulai gratis. Tingkatkan saat siap.",
    free: "Gratis",
    starter: "Starter",
    pro: "Pro",
    popular_badge: "⭐ Paling Populer",
    per_month: "/bln",
    free_price: "$0",
    starter_price: "Rp 29K",
    pro_price: "Rp 79K",
    free_f1: "1 klip / hari",
    free_f2: "Kualitas 720p",
    free_f3: "Watermark KlikClip",
    free_f4: "Deteksi AI dasar",
    starter_f1: "50 klip / bulan",
    starter_f2: "Kualitas 1080p",
    starter_f3: "Tanpa watermark",
    starter_f4: "Teks otomatis AI",
    pro_f1: "200 klip / bulan",
    pro_f2: "1080p antrian prioritas",
    pro_f3: "Tanpa watermark",
    pro_f4: "Akses API",
    btn_start: "Mulai Gratis",
    btn_subscribe: "Berlangganan",
    feature: "Fitur",
    plan_free: "Gratis",
    plan_starter: "Starter",
    plan_pro: "Pro",
    row1: "Klip / bulan",
    row2: "Resolusi",
    row3: "Watermark",
    row4: "Teks AI",
    row5: "Antrian Prioritas",
    row6: "Akses API",
    settings_title: "Pengaturan",
    account: "Akun",
    billing: "Tagihan",
    credits: "Kredit",
    preferences: "Preferensi",
    api_key: "Kunci API",
    email_label: "Email",
    name_label: "Nama",
    edit: "Edit",
    manage: "Kelola",
    plan_label: "Paket",
    free_plan: "Gratis (1 klip/hari)",
    used: "Digunakan hari ini",
    reset: "Reset dalam",
    hours: "jam",
    def_lang: "Bahasa default",
    def_style: "Gaya default",
    def_clips: "Jumlah klip default",
    auto: "Otomatis",
    generate_key: "Buat Kunci",
    credits_badge: "kredit",
  },
};

// ─── Mock clip data ───────────────────────────────────────────────────────────
const MOCK_CLIPS = [
  { id: 1, score: 92, duration: "0:32", color: "#00AA13", title: "Epic Moment #1" },
  { id: 2, score: 78, duration: "0:45", color: "#F59E0B", title: "Key Insight #2" },
  { id: 3, score: 85, duration: "0:28", color: "#10B981", title: "Hook Opener #3" },
  { id: 4, score: 67, duration: "0:55", color: "#3B82F6", title: "Reaction #4" },
  { id: 5, score: 91, duration: "0:38", color: "#8B5CF6", title: "Viral Quote #5" },
  { id: 6, score: 74, duration: "0:42", color: "#EF4444", title: "Highlight #6" },
  { id: 7, score: 88, duration: "0:29", color: "#00AA13", title: "Story Arc #7" },
  { id: 8, score: 63, duration: "0:50", color: "#F59E0B", title: "Moment #8" },
  { id: 9, score: 95, duration: "0:24", color: "#EC4899", title: "Power Clip #9" },
  { id: 10, score: 81, duration: "0:36", color: "#10B981", title: "CTA Clip #10" },
];

const ARTICLES = [
  { icon: "🔥", cat: "viral", read: "5 min" },
  { icon: "✂️", cat: "tips", read: "8 min" },
  { icon: "📅", cat: "schedule", read: "6 min" },
  { icon: "🤖", cat: "ai", read: "7 min" },
];

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    bar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    book: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    globe: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    film: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>,
    chevron: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    key: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    credit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    mic: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    gamepad: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1"/><circle cx="17" cy="13" r="1"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>,
    video: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    pricing: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type = "success", onClose }) => (
  <div style={{
    position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
    background: type === "success" ? "#00AA13" : "#EF4444",
    color: "white", padding: "12px 24px", borderRadius: 100, fontSize: 14,
    fontWeight: 600, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
    animation: "slideUp 0.3s ease",
  }}>
    <Icon name={type === "success" ? "check" : "x"} size={16} color="white" />
    {msg}
  </div>
);

// ─── Virality badge ───────────────────────────────────────────────────────────
const ViralBadge = ({ score }) => {
  const color = score >= 85 ? "#00AA13" : score >= 70 ? "#F59E0B" : "#6B7280";
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 100, padding: "2px 8px", fontSize: 11, fontWeight: 700,
    }}>{score}%</span>
  );
};

// ─── Clip Card ────────────────────────────────────────────────────────────────
const ClipCard = ({ clip, lang }) => {
  const [hov, setHov] = useState(false);
  const i18n = t[lang];
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "white", border: "1px solid #E5E7EB", borderRadius: 16,
        overflow: "hidden",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 130, background: `linear-gradient(135deg, ${clip.color}33, ${clip.color}66)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(145deg, ${clip.color}, ${clip.color}cc)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 20px ${clip.color}55`,
        }}>
          <Icon name="film" size={22} color="white" />
        </div>
        <div style={{
          position: "absolute", top: 8, right: 8,
        }}>
          <ViralBadge score={clip.score} />
        </div>
        <div style={{
          position: "absolute", bottom: 8, left: 8,
          background: "rgba(0,0,0,0.6)", color: "white",
          borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600,
        }}>{clip.duration}</div>
      </div>
      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1F2937", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{clip.title}</div>
        <button
          style={{
            width: "100%", height: 34, borderRadius: 100,
            background: "linear-gradient(180deg, #00C416, #00AA13)",
            border: "none", color: "white", fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: "0 3px 10px rgba(0,170,19,0.25)",
          }}
          onClick={() => alert("Download " + clip.title)}
        >
          <Icon name="download" size={13} color="white" />
          {i18n.download}
        </button>
      </div>
    </div>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ progress }) => (
  <div style={{ width: "100%", background: "#E5E7EB", borderRadius: 100, height: 8, overflow: "hidden" }}>
    <div style={{
      height: "100%", borderRadius: 100, width: `${progress}%`,
      background: "linear-gradient(90deg, #00C416, #00AA13)",
      transition: "width 0.4s ease",
      boxShadow: "0 0 8px rgba(0,170,19,0.4)",
    }} />
  </div>
);

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ lang, clips, setClips, setPage }) => {
  const i18n = t[lang];
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [style, setStyle] = useState("podcast");
  const [clipCount, setClipCount] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const isValidYT = (v) => v.includes("youtube.com") || v.includes("youtu.be");

  const handleGenerate = () => {
    if (!url && !fileRef.current?.files?.length) {
      setUrlError(i18n.url_error);
      return;
    }
    if (url && !isValidYT(url)) {
      setUrlError(i18n.url_error);
      return;
    }
    setUrlError("");
    setProcessing(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setProcessing(false);
        setClips(MOCK_CLIPS);
        setToast(i18n.toast_success);
        setTimeout(() => setToast(null), 3000);
      }
      setProgress(Math.min(p, 100));
    }, 280);
  };

  const styles = [
    { key: "podcast", icon: "mic", label: "🎙️ Podcast" },
    { key: "gaming", icon: "gamepad", label: "🎮 Gaming" },
    { key: "vlog", icon: "video", label: "💬 Vlog" },
  ];

  return (
    <div style={{ paddingBottom: 80 }}>
      {toast && <Toast msg={toast} type="success" onClose={() => setToast(null)} />}

      {/* Hero */}
      <div style={{
        background: "linear-gradient(160deg, #F0FFF2 0%, #FFFFFF 60%)",
        padding: "36px 20px 28px", borderBottom: "1px solid #E5E7EB",
      }}>
        {/* 3D icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: "linear-gradient(145deg, #00C416, #00690C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,170,19,0.35), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.2)",
            transform: "perspective(400px) rotateX(5deg)",
          }}>
            <Icon name="film" size={28} color="white" />
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1F2937", textAlign: "center", margin: "0 0 8px", lineHeight: 1.2 }}>
          {i18n.hero_title}
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
          {i18n.hero_sub}
        </p>

        {/* URL Input */}
        <div style={{ marginBottom: 4 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "white", border: `2px solid ${urlError ? "#EF4444" : "#E5E7EB"}`,
            borderRadius: 12, padding: "0 14px", height: 52,
            boxShadow: urlError ? "0 0 0 3px rgba(239,68,68,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
            transition: "all 0.2s",
          }}>
            <Icon name="link" size={18} color={urlError ? "#EF4444" : "#9CA3AF"} />
            <input
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError(""); }}
              placeholder={i18n.input_placeholder}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: 14, color: "#1F2937", background: "transparent",
                fontFamily: "inherit",
              }}
              aria-label="YouTube URL"
            />
            {url && (
              <button onClick={() => setUrl("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, borderRadius: 50 }}>
                <Icon name="x" size={16} color="#9CA3AF" />
              </button>
            )}
          </div>
          {urlError && <p style={{ color: "#EF4444", fontSize: 12, margin: "4px 0 0 4px", fontWeight: 500 }}>{urlError}</p>}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); }}
          style={{
            border: `2px dashed ${isDragging ? "#00AA13" : "#D1D5DB"}`,
            borderRadius: 12, padding: "22px 16px", textAlign: "center",
            background: isDragging ? "#E8F5E9" : "#FAFAFA",
            cursor: "pointer", transition: "all 0.2s",
            marginBottom: 20,
          }}
        >
          <Icon name="upload" size={24} color={isDragging ? "#00AA13" : "#9CA3AF"} />
          <p style={{ margin: "8px 0 2px", fontSize: 14, fontWeight: 500, color: isDragging ? "#00AA13" : "#6B7280" }}>{i18n.upload_text}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>{i18n.upload_sub}</p>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} />
        </div>

        {/* Style pills */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>{i18n.style_label}</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {styles.map(s => (
              <button key={s.key} onClick={() => setStyle(s.key)} style={{
                height: 36, padding: "0 14px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                border: `2px solid ${style === s.key ? "#00AA13" : "#E5E7EB"}`,
                background: style === s.key ? "#E8F5E9" : "white",
                color: style === s.key ? "#00AA13" : "#6B7280",
                cursor: "pointer", transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Clips count */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{i18n.clips_label}</label>
            <select value={clipCount} onChange={e => setClipCount(+e.target.value)} style={{
              height: 44, width: "100%", border: "2px solid #E5E7EB", borderRadius: 10, padding: "0 12px",
              fontSize: 14, color: "#1F2937", background: "white", cursor: "pointer",
              fontFamily: "inherit", outline: "none",
            }}>
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{i18n.lang_label}</label>
            <select style={{
              height: 44, width: "100%", border: "2px solid #E5E7EB", borderRadius: 10, padding: "0 12px",
              fontSize: 14, color: "#1F2937", background: "white", cursor: "pointer",
              fontFamily: "inherit", outline: "none",
            }}>
              <option>English</option>
              <option>Indonesian</option>
              <option>Auto</option>
            </select>
          </div>
        </div>

        {/* Generate button */}
        {processing ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#00AA13", fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
              {i18n.processing} {Math.round(progress)}%
            </div>
            <ProgressBar progress={progress} />
          </div>
        ) : (
          <button onClick={handleGenerate} style={{
            width: "100%", height: 52, borderRadius: 100,
            background: "linear-gradient(180deg, #00C416, #00AA13)",
            border: "none", color: "white", fontSize: 16, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 6px 20px rgba(0,170,19,0.35)", marginBottom: 12,
            letterSpacing: "0.01em",
          }}>
            {i18n.cta}
          </button>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "#9CA3AF", margin: 0 }}>
          💡{" "}
          <span
            onClick={() => setPage("learn")}
            style={{ color: "#00AA13", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
          >
            {i18n.learning}
          </span>
        </p>
      </div>

      {/* Recent Projects */}
      {clips.length > 0 && (
        <div style={{ padding: "24px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1F2937", margin: 0 }}>{i18n.recent}</h2>
            <span onClick={() => setPage("projects")} style={{ fontSize: 13, color: "#00AA13", fontWeight: 600, cursor: "pointer" }}>
              View all →
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {clips.slice(0, 4).map(c => <ClipCard key={c.id} clip={c} lang={lang} />)}
          </div>
        </div>
      )}

      {clips.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>{i18n.no_projects}</p>
        </div>
      )}
    </div>
  );
};

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
const ProjectsPage = ({ lang, clips }) => {
  const i18n = t[lang];
  const [search, setSearch] = useState("");
  const filtered = clips.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", margin: "0 0 16px" }}>
        <Icon name="folder" size={20} color="#00AA13" /> {i18n.nav_projects}
      </h1>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "white", border: "2px solid #E5E7EB", borderRadius: 12,
        padding: "0 14px", height: 48, marginBottom: 20,
      }}>
        <Icon name="search" size={16} color="#9CA3AF" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={i18n.search_placeholder}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1F2937", background: "transparent", fontFamily: "inherit" }}
          aria-label="Search projects"
        />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>{i18n.no_projects}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {filtered.map(c => <ClipCard key={c.id} clip={c} lang={lang} />)}
        </div>
      )}
    </div>
  );
};

// ─── LEARNING CENTER ──────────────────────────────────────────────────────────
const LearnPage = ({ lang }) => {
  const i18n = t[lang];
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: i18n.getting_started, icon: "📖" },
    { label: i18n.tutorials, icon: "🎬" },
    { label: i18n.tips, icon: "💡" },
    { label: i18n.faq, icon: "❓" },
  ];
  const articles = [i18n.art1, i18n.art2, i18n.art3, i18n.art4];

  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", margin: "0 0 16px" }}>
        🎓 {i18n.nav_learn}
      </h1>
      {/* Tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: "10px 4px", borderRadius: 12, border: `2px solid ${activeTab === i ? "#00AA13" : "#E5E7EB"}`,
            background: activeTab === i ? "#E8F5E9" : "white",
            color: activeTab === i ? "#00AA13" : "#6B7280",
            fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "white", border: "2px solid #E5E7EB", borderRadius: 12,
        padding: "0 14px", height: 48, marginBottom: 20,
      }}>
        <Icon name="search" size={16} color="#9CA3AF" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder={i18n.search_articles}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1F2937", background: "transparent", fontFamily: "inherit" }}
          aria-label="Search articles"
        />
      </div>
      {/* Articles */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", margin: "0 0 12px" }}>📚 {i18n.popular}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {articles.filter(a => a.toLowerCase().includes(search.toLowerCase())).map((art, i) => (
          <div key={i} onClick={() => {}} style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
            padding: "14px 16px", cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = ""; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{ARTICLES[i].icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1F2937", lineHeight: 1.3 }}>{art}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>📖 {ARTICLES[i].read} read</div>
            </div>
            <Icon name="chevron" size={16} color="#9CA3AF" />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────
const PricingPage = ({ lang }) => {
  const i18n = t[lang];
  const plans = [
    {
      name: i18n.free, price: i18n.free_price, badge: null,
      features: [i18n.free_f1, i18n.free_f2, i18n.free_f3, i18n.free_f4],
      btn: i18n.btn_start, primary: false,
    },
    {
      name: i18n.starter, price: i18n.starter_price, badge: i18n.popular_badge,
      features: [i18n.starter_f1, i18n.starter_f2, i18n.starter_f3, i18n.starter_f4],
      btn: i18n.btn_subscribe, primary: true,
    },
    {
      name: i18n.pro, price: i18n.pro_price, badge: null,
      features: [i18n.pro_f1, i18n.pro_f2, i18n.pro_f3, i18n.pro_f4],
      btn: i18n.btn_subscribe, primary: false,
    },
  ];
  const table = [
    [i18n.row1, "30", "50", "200"],
    [i18n.row2, "720p", "1080p", "1080p"],
    [i18n.row3, "✓", "✗", "✗"],
    [i18n.row4, "✗", "✓", "✓"],
    [i18n.row5, "✗", "✗", "✓"],
    [i18n.row6, "✗", "✗", "✓"],
  ];
  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", margin: "0 0 8px" }}>{i18n.pricing_title}</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>{i18n.pricing_sub}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {plans.map((plan, idx) => (
          <div key={idx} style={{
            background: "white", border: `2px solid ${plan.primary ? "#00AA13" : "#E5E7EB"}`,
            borderRadius: 18, padding: 20, position: "relative",
            boxShadow: plan.primary ? "0 8px 28px rgba(0,170,19,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            {plan.badge && (
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: "#00AA13", color: "white", borderRadius: 100, padding: "3px 14px",
                fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              }}>{plan.badge}</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1F2937" }}>{plan.name}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: plan.primary ? "#00AA13" : "#1F2937" }}>
                  {plan.price}<span style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF" }}>{i18n.per_month}</span>
                </div>
              </div>
              <button style={{
                height: 40, padding: "0 20px", borderRadius: 100,
                background: plan.primary ? "linear-gradient(180deg, #00C416, #00AA13)" : "white",
                border: `2px solid ${plan.primary ? "#00AA13" : "#E5E7EB"}`,
                color: plan.primary ? "white" : "#374151",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: plan.primary ? "0 4px 14px rgba(0,170,19,0.3)" : "none",
              }}>{plan.btn}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {plan.features.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 50, background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="check" size={10} color="#00AA13" />
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Comparison table */}
      <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ background: "#F5F7FA", padding: "12px 16px", borderBottom: "1px solid #E5E7EB" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>Feature Comparison</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {[i18n.feature, i18n.plan_free, i18n.plan_starter, i18n.plan_pro].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "center", color: "#374151", fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: "9px 12px", textAlign: ci === 0 ? "left" : "center",
                      color: cell === "✓" ? "#00AA13" : cell === "✗" ? "#EF4444" : "#374151",
                      fontWeight: cell === "✓" || cell === "✗" ? 700 : 400,
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SettingsPage = ({ lang }) => {
  const i18n = t[lang];
  const [showKey, setShowKey] = useState(false);
  const apiKey = "sk-klikclip-xxxxxxxxxxxxxxxxxxx";

  const Section = ({ icon, title, action, onAction, children }) => (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{title}</span>
        </div>
        {action && (
          <button onClick={onAction} style={{ fontSize: 13, color: "#00AA13", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>{action}</button>
        )}
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );

  const Row = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
      <span style={{ color: "#6B7280" }}>{label}</span>
      <span style={{ color: "#1F2937", fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", margin: "0 0 18px" }}>
        ⚙️ {i18n.settings_title}
      </h1>

      <Section icon="👤" title={i18n.account} action={i18n.edit} onAction={() => {}}>
        <Row label={i18n.email_label} value="thomas@example.com" />
        <Row label={i18n.name_label} value="Thomas" />
      </Section>

      <Section icon="💳" title={i18n.billing} action={i18n.manage} onAction={() => {}}>
        <Row label={i18n.plan_label} value={i18n.free_plan} />
      </Section>

      <Section icon="⚡" title={i18n.credits}>
        <Row label={i18n.used} value="5 / 50" />
        <Row label={i18n.reset} value={`12 ${i18n.hours}`} />
        <ProgressBar progress={10} />
      </Section>

      <Section icon="🎛️" title={i18n.preferences}>
        {[
          [i18n.def_lang, ["English", "Indonesian"]],
          [i18n.def_style, [i18n.auto, "Podcast", "Gaming", "Vlog"]],
          [i18n.def_clips, ["5", "10", "15", "20"]],
        ].map(([label, opts]) => (
          <div key={label} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
            <select style={{
              width: "100%", height: 44, border: "2px solid #E5E7EB", borderRadius: 10, padding: "0 12px",
              fontSize: 14, color: "#1F2937", background: "white", fontFamily: "inherit", outline: "none",
            }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </Section>

      <Section icon="🔑" title={i18n.api_key}>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 10px" }}>Generate an API key for programmatic access.</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1, height: 40, background: "#F5F7FA", border: "1px solid #E5E7EB",
            borderRadius: 10, display: "flex", alignItems: "center", padding: "0 12px",
            fontSize: 13, color: "#374151", fontFamily: "monospace", overflow: "hidden",
          }}>
            {showKey ? apiKey : "sk-••••••••••••••••"}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            <Icon name="eye" size={16} color="#6B7280" />
          </button>
          <button onClick={() => {}} style={{
            height: 40, padding: "0 14px", borderRadius: 10,
            background: "linear-gradient(180deg, #00C416, #00AA13)",
            border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{i18n.generate_key}</button>
        </div>
      </Section>
    </div>
  );
};

// ─── STATS PAGE ───────────────────────────────────────────────────────────────
const StatsPage = ({ lang, clips }) => {
  const totalClips = clips.length;
  const avgScore = totalClips ? Math.round(clips.reduce((s, c) => s + c.score, 0) / totalClips) : 0;
  const stats = [
    { label: "Total Clips", value: totalClips, icon: "🎬", color: "#00AA13" },
    { label: "Avg Viral Score", value: `${avgScore}%`, icon: "🔥", color: "#F59E0B" },
    { label: "Downloads", value: "0", icon: "📥", color: "#3B82F6" },
    { label: "This Month", value: totalClips, icon: "📅", color: "#8B5CF6" },
  ];
  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1F2937", margin: "0 0 18px" }}>
        📊 {lang === "id" ? "Statistik" : "Stats"}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
            padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {clips.length > 0 && (
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Clip Performance</span>
          </div>
          <div style={{ padding: "16px" }}>
            {clips.map((c, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#374151", fontWeight: 500 }}>{c.title}</span>
                  <span style={{ color: "#00AA13", fontWeight: 700 }}>{c.score}%</span>
                </div>
                <ProgressBar progress={c.score} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function KlikClip() {
  const [lang, setLang] = useState(() => localStorage.getItem("kc_lang") || "en");
  const [page, setPage] = useState("home");
  const [clips, setClips] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { localStorage.setItem("kc_lang", lang); }, [lang]);

  const i18n = t[lang];

  const navItems = [
    { key: "home", icon: "home", label: i18n.nav_home },
    { key: "projects", icon: "folder", label: i18n.nav_projects },
    { key: "new", icon: "plus", label: i18n.nav_new },
    { key: "stats", icon: "bar", label: i18n.nav_stats },
    { key: "account", icon: "user", label: i18n.nav_account },
  ];
  const sidebarExtra = [
    { key: "learn", icon: "book", label: i18n.nav_learn },
    { key: "pricing", icon: "pricing", label: "Pricing" },
    { key: "settings", icon: "settings", label: i18n.nav_settings },
  ];

  const renderPage = () => {
    if (page === "home" || page === "new") return <HomePage lang={lang} clips={clips} setClips={setClips} setPage={setPage} />;
    if (page === "projects") return <ProjectsPage lang={lang} clips={clips} />;
    if (page === "learn") return <LearnPage lang={lang} />;
    if (page === "pricing") return <PricingPage lang={lang} />;
    if (page === "settings" || page === "account") return <SettingsPage lang={lang} />;
    if (page === "stats") return <StatsPage lang={lang} clips={clips} />;
    return null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #F5F7FA; }
        @keyframes slideUp { from { opacity:0; transform: translateX(-50%) translateY(20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #00AA13; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "white", position: "relative" }}>

        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "white", borderBottom: "1px solid #F3F4F6",
          padding: "0 16px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}
            aria-label="Open menu"
          >
            <Icon name="menu" size={22} color="#374151" />
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => setPage("home")}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(145deg, #00C416, #00690C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,170,19,0.35)",
            }}>
              <Icon name="film" size={14} color="white" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#1F2937", letterSpacing: "-0.02em" }}>KlikClip</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Lang toggle */}
            <button
              onClick={() => setLang(l => l === "en" ? "id" : "en")}
              style={{
                height: 30, padding: "0 10px", borderRadius: 100,
                border: "1.5px solid #E5E7EB", background: "white",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                color: "#374151", display: "flex", alignItems: "center", gap: 4,
              }}
              aria-label="Toggle language"
            >
              <Icon name="globe" size={13} color="#374151" />
              {lang.toUpperCase()}
            </button>
            {/* Credits */}
            <div style={{
              height: 30, padding: "0 10px", borderRadius: 100,
              background: "#E8F5E9", display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 700, color: "#00AA13",
            }}>
              <Icon name="zap" size={12} color="#00AA13" />
              45/50
            </div>
          </div>
        </div>

        {/* Sidebar drawer */}
        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
                zIndex: 200, backdropFilter: "blur(2px)",
              }}
            />
            <div style={{
              position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
              background: "white", zIndex: 300, boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
              display: "flex", flexDirection: "column", padding: "20px 0",
              maxWidth: "80vw",
            }}>
              <div style={{ padding: "0 20px 20px", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(145deg, #00C416, #00690C)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(0,170,19,0.35)",
                  }}>
                    <Icon name="film" size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1F2937" }}>KlikClip</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>AI Video Clipper</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F5F7FA", borderRadius: 12, padding: "10px 12px" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 50, background: "linear-gradient(135deg, #00AA13, #00690C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="user" size={18} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Thomas</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>Free plan · 45/50 credits</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
                {[...navItems, ...sidebarExtra].map(item => (
                  <button key={item.key} onClick={() => { setPage(item.key); setSidebarOpen(false); }} style={{
                    width: "100%", height: 48, borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 12, padding: "0 12px",
                    background: page === item.key ? "#E8F5E9" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    borderLeft: page === item.key ? "3px solid #00AA13" : "3px solid transparent",
                    marginBottom: 2,
                  }}>
                    <Icon name={item.icon} size={20} color={page === item.key ? "#00AA13" : "#6B7280"} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: page === item.key ? "#00AA13" : "#374151" }}>{item.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #F3F4F6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Icon name="zap" size={14} color="#00AA13" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>45 / 50 {i18n.credits_badge}</span>
                </div>
                <ProgressBar progress={90} />
              </div>
            </div>
          </>
        )}

        {/* Page content */}
        <div style={{ minHeight: "calc(100vh - 56px - 64px)", overflowY: "auto" }}>
          {renderPage()}
        </div>

        {/* Bottom nav */}
        <div style={{
          position: "sticky", bottom: 0, zIndex: 100,
          background: "white", borderTop: "1px solid #F3F4F6",
          height: 64, display: "flex", alignItems: "center",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
        }}>
          {navItems.map(item => {
            const active = page === item.key || (item.key === "new" && page === "home");
            const isNew = item.key === "new";
            return (
              <button key={item.key} onClick={() => setPage(item.key)} aria-label={item.label} style={{
                flex: 1, height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 0",
              }}>
                {isNew ? (
                  <div style={{
                    width: 44, height: 44, borderRadius: 50, marginTop: -20,
                    background: "linear-gradient(145deg, #00C416, #00690C)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 6px 18px rgba(0,170,19,0.4)",
                  }}>
                    <Icon name="plus" size={22} color="white" />
                  </div>
                ) : (
                  <Icon name={item.icon} size={22} color={active ? "#00AA13" : "#9CA3AF"} />
                )}
                {!isNew && (
                  <span style={{
                    fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? "#00AA13" : "#9CA3AF",
                    lineHeight: 1,
                  }}>{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
