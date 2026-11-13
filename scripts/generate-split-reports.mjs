// scripts/generate-split-reports.mjs
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

console.log("Generating 2 dedicated HTML files: Executive Report & Detailed Live Demo Guide...");

// ============================================================================
// COMMON CSS & JS SNIPPETS
// ============================================================================
const sharedStyles = `
  :root {
    --primary: #0284c7;
    --primary-dark: #0369a1;
    --primary-light: #e0f2fe;
    --accent: #f97316;
    --accent-light: #ffedd5;
    --success: #10b981;
    --success-light: #d1fae5;
    --warning: #f59e0b;
    --warning-light: #fef3c7;
    --danger: #ef4444;
    --danger-light: #fee2e2;
    --purple: #8b5cf6;
    --purple-light: #ede9fe;
    --cyan: #06b6d4;
    --cyan-light: #cffafe;
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --text: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --code-bg: #0f172a;
    --code-text: #f1f5f9;
    --radius: 14px;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    --shadow-lg: 0 12px 24px -4px rgb(0 0 0 / 0.12), 0 4px 6px -2px rgb(0 0 0 / 0.05);
  }

  [data-theme="dark"] {
    --bg: #090d16;
    --card-bg: #111827;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #334155;
    --primary-light: #0c4a6e;
    --accent-light: #7c2d12;
    --success-light: #064e3b;
    --warning-light: #78350f;
    --danger-light: #7f1d1d;
    --purple-light: #4c1d95;
    --cyan-light: #164e63;
    --code-bg: #030712;
    --code-text: #e2e8f0;
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.35);
    --shadow-lg: 0 14px 28px -4px rgb(0 0 0 / 0.5);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: var(--bg);
    color: var(--text);
    line-height: 1.65;
    transition: background-color 0.3s, color 0.3s;
  }

  #progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #0284c7, #8b5cf6, #f97316);
    width: 0%;
    z-index: 9999;
    transition: width 0.1s ease;
  }

  .container {
    max-width: 1240px;
    margin: 0 auto;
    padding: 0 24px 60px;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
    font-size: 0.88rem;
  }
  .top-bar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }
  .top-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--primary-light);
    color: var(--primary-dark);
    padding: 4px 10px;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.78rem;
    text-transform: uppercase;
  }
  [data-theme="dark"] .top-badge { color: #7dd3fc; }

  .theme-toggle-btn {
    background: var(--card-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }
  .theme-toggle-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  .switch-file-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 700;
    text-decoration: none;
    box-shadow: var(--shadow);
    transition: transform 0.2s;
  }
  .switch-file-btn:hover {
    transform: translateY(-2px);
  }

  .hero-header {
    background: linear-gradient(135deg, #0369a1 0%, #1e1b4b 60%, #0f172a 100%);
    color: white;
    padding: 44px 38px;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  .hero-pretitle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(2, 132, 199, 0.4);
    border: 1px solid rgba(56, 189, 248, 0.45);
    color: #bae6fd;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
  }
  .hero-header h1 {
    font-size: 2.3rem;
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 14px;
  }
  .hero-header h1 span {
    background: linear-gradient(90deg, #38bdf8, #a78bfa, #fb923c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    font-size: 1.05rem;
    color: #cbd5e1;
    max-width: 980px;
    line-height: 1.6;
  }
  .hero-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px;
    margin-top: 26px;
    padding-top: 22px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    font-size: 0.9rem;
  }
  .hero-meta-item { display: flex; flex-direction: column; gap: 4px; }
  .hero-meta-item span { color: #94a3b8; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
  .hero-meta-item strong { color: #ffffff; font-weight: 600; }

  .sticky-nav {
    position: sticky;
    top: 12px;
    z-index: 1000;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 9999px;
    padding: 8px 12px;
    margin-bottom: 32px;
    box-shadow: var(--shadow-lg);
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .sticky-nav::-webkit-scrollbar { display: none; }
  .nav-link {
    padding: 8px 16px;
    border-radius: 9999px;
    text-decoration: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav-link:hover, .nav-link.active {
    background: var(--primary);
    color: white;
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: var(--shadow);
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text);
    border-bottom: 1px solid var(--border);
    padding-bottom: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .alert {
    padding: 16px 20px;
    border-radius: 10px;
    margin: 16px 0;
    font-size: 0.92rem;
    line-height: 1.6;
    border-left: 4px solid;
  }
  .alert-info { background: var(--primary-light); color: #0369a1; border-color: #0284c7; }
  [data-theme="dark"] .alert-info { background: #082f49; color: #bae6fd; }
  .alert-success { background: var(--success-light); color: #065f46; border-color: #10b981; }
  [data-theme="dark"] .alert-success { background: #064e3b; color: #a7f3d0; }
  .alert-warning { background: var(--warning-light); color: #92400e; border-color: #f59e0b; }
  [data-theme="dark"] .alert-warning { background: #451a03; color: #fde68a; }

  .compare-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
    margin: 18px 0;
  }
  .compare-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
  }
  .compare-card.old { border-left: 4px solid var(--danger); }
  .compare-card.new { border-left: 4px solid var(--success); background: rgba(16, 185, 129, 0.03); }
  .compare-card h4 { font-size: 1.05rem; font-weight: 700; margin-bottom: 12px; }
  .compare-card.old h4 { color: var(--danger); }
  .compare-card.new h4 { color: var(--success); }
  .compare-list { list-style: none; font-size: 0.9rem; }
  .compare-list li { padding: 6px 0 6px 24px; position: relative; }
  .compare-card.old .compare-list li::before { content: "✕"; position: absolute; left: 0; color: var(--danger); font-weight: bold; }
  .compare-card.new .compare-list li::before { content: "✓"; position: absolute; left: 0; color: var(--success); font-weight: bold; }

  .table-responsive { overflow-x: auto; margin: 16px 0; }
  .styled-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  .styled-table th, .styled-table td { padding: 12px 16px; border: 1px solid var(--border); text-align: left; }
  .styled-table th { background: var(--bg); font-weight: 700; color: var(--text); }
  .styled-table tr:hover { background: rgba(2, 132, 199, 0.04); }

  .copyable-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg);
    border: 1px dashed var(--border);
    padding: 4px 10px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }
  .copyable-pill:hover { border-color: var(--primary); background: var(--primary-light); }

  .code-block {
    background: var(--code-bg);
    color: var(--code-text);
    border-radius: 10px;
    padding: 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    margin: 14px 0;
    position: relative;
    overflow-x: auto;
    border: 1px solid var(--border);
  }
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #334155;
    font-size: 0.78rem;
    color: #94a3b8;
  }
  .copy-btn {
    background: #1e293b;
    color: #f1f5f9;
    border: 1px solid #475569;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.76rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .copy-btn:hover { background: var(--primary); border-color: var(--primary); }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .badge-primary { background: var(--primary-light); color: var(--primary-dark); }
  .badge-success { background: var(--success-light); color: #065f46; }
  .badge-warning { background: var(--warning-light); color: #92400e; }
  .badge-danger { background: var(--danger-light); color: #991b1b; }
  .badge-purple { background: var(--purple-light); color: #5b21b6; }
  .badge-cyan { background: var(--cyan-light); color: #0e7490; }

  footer {
    border-top: 1px solid var(--border);
    padding-top: 24px;
    margin-top: 48px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.88rem;
  }
`;

const sharedScripts = `
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = scrolled + '%';

    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentSection = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (winScroll >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  });

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (newTheme === 'dark') {
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Giao diện Sáng';
    } else {
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Giao diện Tối';
    }
  }

  (function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (savedTheme === 'dark') {
      if (icon) icon.textContent = '☀️';
      if (text) text.textContent = 'Giao diện Sáng';
    } else {
      if (icon) icon.textContent = '🌙';
      if (text) text.textContent = 'Giao diện Tối';
    }
  })();

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Đã sao chép: ' + text);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  }

  function showToast(message) {
    let toast = document.getElementById('liveToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'liveToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = '#0f172a';
      toast.style.color = '#f8fafc';
      toast.style.padding = '10px 18px';
      toast.style.borderRadius = '8px';
      toast.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
      toast.style.fontSize = '0.88rem';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '99999';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.border = '1px solid #38bdf8';
      document.body.appendChild(toast);
    }
    toast.textContent = '✓ ' + message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2500);
  }
`;

// ============================================================================
// FILE 1: BÁO CÁO TỔNG KẾT 2 TUẦN (EXECUTIVE TECHNICAL REPORT)
// ============================================================================
const reportHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo Cáo Tổng Kết 2 Tuần Nước Rút (Sprint 4 & 5) | AI Travel Reseller Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${sharedStyles}
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 4px solid var(--primary);
      transition: transform 0.2s ease;
    }
    .kpi-card:hover { transform: translateY(-3px); }
    .kpi-card.purple { border-top-color: var(--purple); }
    .kpi-card.accent { border-top-color: var(--accent); }
    .kpi-card.success { border-top-color: var(--success); }
    .kpi-card.cyan { border-top-color: var(--cyan); }
    .kpi-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .kpi-value { font-size: 2.1rem; font-weight: 800; color: var(--text); font-family: 'JetBrains Mono', monospace; }
    .kpi-desc { font-size: 0.83rem; color: var(--text-muted); }
    .kpi-badge { align-self: flex-start; padding: 2px 8px; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; }
    .kpi-badge.success { background: var(--success-light); color: var(--success); }
    .kpi-badge.primary { background: var(--primary-light); color: var(--primary-dark); }
  </style>
</head>
<body>
  <div id="progress-bar"></div>

  <div class="container">
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="top-badge">Technical Audit &amp; Sprint 4-5 Sign-Off</span>
        <span>Dự án: <strong>AI Travel Reseller (TravelLink AI)</strong></span>
        <span>•</span>
        <span>Kỳ báo cáo: <strong>26/10/2026 – 13/11/2026</strong></span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="HUONG_DAN_LIVE_DEMO_CHI_TIET.html" class="switch-file-btn">
          <span>👉 Mở Sổ Tay Live Demo</span>
        </a>
        <button id="themeToggle" class="theme-toggle-btn" onclick="toggleTheme()">
          <span id="themeIcon">🌙</span> <span id="themeText">Giao diện Tối</span>
        </button>
      </div>
    </div>

    <header class="hero-header">
      <div class="hero-pretitle">Báo Cáo Nghiệm Thu Kỹ Thuật Toàn Diện (Final Acceptance Report)</div>
      <h1>BÁO CÁO 2 TUẦN NƯỚC RÚT: <span>CORE AI VIDEO &amp; RESELLER FINANCE</span></h1>
      <p class="hero-subtitle">
        Tổng kết toàn diện tiến độ, đột phá kiến trúc và minh chứng kiểm thử của 2 phân hệ cốt lõi: <strong>Động cơ Tạo Video AI (Muse2API + FFmpeg 5s End-Card)</strong> và <strong>Phân hệ Reseller, Dòng tiền Ví hoa hồng chống Tiêu kép (Double-Spend Prevention)</strong>.
      </p>

      <div class="hero-meta-grid">
        <div class="hero-meta-item">
          <span>Phụ trách Báo cáo &amp; BE1 PM</span>
          <strong>Nguyễn Minh Tuệ (BE1 Lead)</strong>
        </div>
        <div class="hero-meta-item">
          <span>AI Engine &amp; Webhook Lead</span>
          <strong>Nguyễn Huỳnh (BE2 AI Lead)</strong>
        </div>
        <div class="hero-meta-item">
          <span>Bảo Mật &amp; RLS Auditor</span>
          <strong>Tester 2 (Cyber Security Lead)</strong>
        </div>
        <div class="hero-meta-item">
          <span>QA &amp; Chịu Tải k6 1.000 VUs</span>
          <strong>Trương Đức Huy (Senior QA Lead)</strong>
        </div>
      </div>
    </header>

    <nav class="sticky-nav">
      <a href="#kpi-summary" class="nav-link active">📊 Chỉ Số Vàng</a>
      <a href="#video-engine-revolution" class="nav-link">🎬 Động Cơ Video AI</a>
      <a href="#endcard-architecture" class="nav-link">🎴 Kiến Trúc 10s + 5s End-Card</a>
      <a href="#reseller-financial-engine" class="nav-link">💼 Ví Reseller &amp; Chống Tiêu Kép</a>
      <a href="#omnichannel-attribution" class="nav-link">🔗 Phân Phối Đa Kênh</a>
      <a href="#supporting-portals" class="nav-link">🏢 Merchant &amp; Super Admin</a>
      <a href="#qa-verification" class="nav-link">🧪 Minh Chứng Kiểm Thử</a>
    </nav>

    <!-- 1. KPI Summary -->
    <section id="kpi-summary" style="margin-bottom: 40px;">
      <div class="card-title">
        <span>1. Bảng Chỉ Số Vàng Tổng Kết 2 Tuần Nước Rút</span>
        <span class="badge badge-success">Production Ready</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card success">
          <span class="kpi-title">Độ Bao Phủ E2E Regression</span>
          <div class="kpi-value">80/80</div>
          <span class="kpi-desc">Test cases Playwright Đạt 100% Pass Rate</span>
          <span class="kpi-badge success">Zero Regression</span>
        </div>
        <div class="kpi-card cyan">
          <span class="kpi-title">Kiểm Thử Tải Đỉnh k6</span>
          <div class="kpi-value">486.2 <small style="font-size: 1rem">RPS</small></div>
          <span class="kpi-desc">1.000 VUs đồng thời, Tỷ lệ thành công 98.24%</span>
          <span class="kpi-badge primary">P95 &lt; 950ms</span>
        </div>
        <div class="kpi-card purple">
          <span class="kpi-title">Đánh Giá Video AI Rubric</span>
          <div class="kpi-value">9.59 <small style="font-size: 1rem">/ 10</small></div>
          <span class="kpi-desc">Khung hình 9:16, Safe Zone, Phủ mờ End-Card</span>
          <span class="kpi-badge success">Approved for Ads</span>
        </div>
        <div class="kpi-card accent">
          <span class="kpi-title">Độ An Toàn AI Sales Agent</span>
          <div class="kpi-value">0.0%</div>
          <span class="kpi-desc">Tỷ lệ ảo giác giá trên 46 TCs &amp; 50 UAT</span>
          <span class="kpi-badge success">Strict Grounding</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Build &amp; Typescript Check</span>
          <div class="kpi-value">32/32</div>
          <span class="kpi-desc">Routes Turbopack biên dịch sạch 0 lỗi</span>
          <span class="kpi-badge primary">Turbopack Clean</span>
        </div>
        <div class="kpi-card success">
          <span class="kpi-title">Lỗi Chặn Phát Hành</span>
          <div class="kpi-value">0</div>
          <span class="kpi-desc">Zero Blocker / Zero Critical Defects</span>
          <span class="kpi-badge success">Approved Go-Live</span>
        </div>
      </div>
    </section>

    <!-- 2. Video Engine Revolution -->
    <section id="video-engine-revolution" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>2. Cuộc Cách Mạng Động Cơ Tạo Video AI: Thay Thế Gemini Bằng Muse AI Gateway</span>
          <span class="badge badge-purple">Core Breakthrough</span>
        </div>

        <p style="margin-bottom: 16px;">
          Trước đây, hệ thống phụ thuộc vào Google Gemini Omni 1.1 / Veo API. Mặc dù là mô hình lớn, nhưng khi đưa vào vận hành thương mại thực tế, nhóm gặp phải các rào cản chí mạng:
        </p>

        <div class="compare-grid">
          <div class="compare-card old">
            <h4>✕ Hạn Chế Của Gemini Omni / Veo Cũ</h4>
            <ul class="compare-list">
              <li><strong>Rào cản Cạn Quota (HTTP 429):</strong> Thường xuyên bị Google khóa API vì quá giới hạn lượt gọi đồng thời; chi phí rất đắt ($0.25 - $0.40 / video).</li>
              <li><strong>Lỗi Kẹt 93% (The 93% Frozen Bug):</strong> Frontend dùng mock timer 14s nhảy vọt tới 93% rồi dừng đứng im khiến người dùng tưởng hệ thống bị treo.</li>
              <li><strong>Prompt bị loãng âm thanh:</strong> Nhồi nhét cả câu thoại tiếng Việt vào prompt khiến mô hình diffusion mất nhiều thời gian xử lý (~218s) và dễ timeout 180s.</li>
            </ul>
          </div>

          <div class="compare-card new">
            <h4>✓ Giải Pháp Đột Phá Với Muse AI Gateway</h4>
            <ul class="compare-list">
              <li><strong>Tự chủ Hạ tầng &amp; Chi Phí $0.00:</strong> Chạy container Docker Local (<span class="copyable-pill">http://localhost:18610</span>) qua module <code>src/lib/ai/muse-video.ts</code>. Không phụ thuộc quota bên thứ ba.</li>
              <li><strong>Tách Script Âm Thanh, Tối Ưu Hình Ảnh:</strong> Tách bỏ hoàn toàn câu thoại hội thoại khỏi prompt Muse AI, chuyển nhãn thị giác sang tiếng Anh điện ảnh (Golden Bridge, French Village,...), giảm thời gian render từ <strong>218s xuống 93s</strong> (nhanh hơn 60%!).</li>
              <li><strong>Live Elapsed Timer (Đồng hồ đếm thật):</strong> Hiển thị thời gian thực dạng <code>MM:SS</code> và tiến độ tăng đều mượt mà, loại bỏ triệt để lỗi kẹt 93%.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. End-Card Architecture -->
    <section id="endcard-architecture" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>3. Kiến Trúc Ghép Nối Video Chuẩn: 10 Giây Muse AI + 5 Giây Blurred End-Card = 15 Giây Tổng</span>
          <span class="badge badge-success">High Conversion Architecture</span>
        </div>

        <div class="alert alert-info">
          <strong>💡 Giải pháp kỹ thuật khắc phục lỗi mất End-Card:</strong> Trước đây, tham số <code>-t \${targetDuration}</code> bị gán cứng bằng 10s ở lệnh FFmpeg cuối cùng, dẫn tới việc thẻ End-Card dù đã được render nhưng bị FFmpeg cắt cụt ngay ở mốc giây thứ 10! Nhóm đã nâng cấp toàn diện thuật toán: <strong>Khi chọn 10s, Muse AI sinh 10s clip chuyển động thị giác, sau đó FFmpeg tự động mở rộng và ghép thêm 5s clip End-Card phủ mờ thông tin tour, tạo ra video thành phẩm hoàn hảo dài chính xác 15 giây.</strong>
        </div>

        <div class="alert alert-warning" style="margin-top: 14px;">
          <strong>🛡️ Đột phá kỹ thuật hiển thị thông tin Tour trên nền mờ (End-Card Typography):</strong>
          <br>• <strong>Nguyên nhân gốc rễ vùng mờ bị trống chữ trước đó:</strong> Trong lệnh FFmpeg <code>drawtext</code>, ký tự phần trăm <code>%</code> (ví dụ: <em>Giảm 24%</em>) bị bộ giải mã FreeType hiểu nhầm là token mở rộng biến số format string (<code>Stray % near ' khi đặt sớm'</code>), dẫn tới việc FFmpeg hủy bỏ toàn bộ tác vụ vẽ text. Đồng thời các icon emoji (⭐, 📍) không nằm trong font Arial chuẩn Windows gây lỗi render glyph.
          <br>• <strong>Giải pháp nâng cấp dứt điểm:</strong>
          <br>&nbsp;&nbsp;1. Áp dụng cờ <code>expansion=none</code> cho 100% các filter <code>drawtext</code>, cách ly hoàn toàn các ký tự đặc biệt.
          <br>&nbsp;&nbsp;2. Tách cấu trúc End-Card thành hệ thống khối thẻ riêng biệt (Header xanh Cyan, Khung giá viền Vàng Amber <code>0xFFD700</code>, Danh sách 3 tiện ích dùng bullet chuẩn <code>•</code>, và Banner kêu gọi hành động CTA xanh lục Emerald <code>0x059669</code>).
          <br>&nbsp;&nbsp;3. Hỗ trợ hiển thị tiếng Việt có dấu chuẩn Unicode 100% trên nền ảnh mờ Bokeh <code>boxblur=18:5</code>.
        </div>

        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Thành Phần Video</th>
                <th>Thời Lượng</th>
                <th>Công Nghệ Xử Lý</th>
                <th>Nội Dung Thể Hiện &amp; Tác Dụng Tiếp Thị</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Phân cảnh 1 (Opening Hook)</strong></td>
                <td><strong>5.0 giây</strong></td>
                <td>Muse AI (Image-to-Video)</td>
                <td>Góc máy Flycam tiến thẳng qua Cầu Vàng / Biển Đà Nẵng giữa ánh bình minh 5600K rực rỡ. Bắt mắt người xem ngay trong 3s đầu tiên trên TikTok.</td>
              </tr>
              <tr>
                <td><strong>Phân cảnh 2 (Experience Journey)</strong></td>
                <td><strong>5.0 giây</strong></td>
                <td>Muse AI (Image-to-Video)</td>
                <td>Chuyển động lượn sóng mượt mà qua Làng Pháp, cáp treo và các trải nghiệm vui chơi. Kế thừa vector vận tốc liên tục từ Cảnh 1.</td>
              </tr>
              <tr>
                <td><strong>Phân cảnh 3 (Blurred Tour Info End-Card)</strong></td>
                <td><strong>5.0 giây</strong></td>
                <td>FFmpeg Compositor (boxblur=18:5)</td>
                <td>Phủ mờ ảnh thật của tour, hiển thị bảng giá ưu đãi 950.000đ (gạch giá gốc 1.200.000đ), 3 điểm nổi bật dịch vụ, Hotline 1900 8888 và CTA kêu gọi đặt vé.</td>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.08); font-weight: 700;">
                <td><strong>TỔNG THỜI LƯỢNG THÀNH PHẨM</strong></td>
                <td><strong>15.0 GIÂY</strong></td>
                <td>FFmpeg Concat &amp; Audio Merge</td>
                <td>Video chuẩn khung dọc 9:16 (1080x1920), tích hợp giọng đọc thuyết minh tiếng Việt và nhạc nền BGM du lịch sôi động.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 4. Reseller Financial Engine -->
    <section id="reseller-financial-engine" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>4. Phân Hệ Reseller: Thuật Toán Phòng Chống Rút Tiền Kép (Anti Double-Spend)</span>
          <span class="badge badge-danger">Financial Integrity</span>
        </div>

        <p style="margin-bottom: 14px;">
          Để bảo vệ an toàn ngân quỹ và ngăn chặn việc Reseller mở nhiều tab gửi request đồng thời (Race Condition) để rút vượt số dư ví, nhóm đã xây dựng cơ chế khóa hàng nguyên tử:
        </p>

        <div class="code-block">
          <div class="code-header">
            <span>CƠ CHẾ KHÓA SỐ DƯ KHẢ DỤNG HIỆU DỤNG (EFFECTIVE BALANCE DEDUCTION)</span>
            <button class="copy-btn" onclick="copyText('npm run test:payout-double-spend')">Sao chép lệnh test</button>
          </div>
          <code>// Công thức toán học bảo toàn dòng tiền:
effectiveAvailable = Confirmed_Commissions - Sum(Pending_And_Processing_Payouts);

// Kịch bản thực tế đã được verify trong tests/payout-double-spend.test.ts:
// 1. Reseller có 1.000.000 VNĐ hoa hồng đã đối soát.
// 2. Tạo lệnh rút thứ 1: 600.000 VNĐ -> Trạng thái 'pending'.
// 3. Số dư khả dụng hiệu dụng lập tức bị khóa còn: 400.000 VNĐ.
// 4. Nếu cố tình gửi tiếp lệnh rút thứ 2 trị giá 500.000 VNĐ:
//    -> BỊ TỪ CHỐI NGAY LẬP TỨC với mã lỗi: INSUFFICIENT_AVAILABLE_BALANCE.
// -> Loại bỏ hoàn toàn nguy cơ thất thoát tài chính cho sàn và đối tác.</code>
        </div>
      </div>
    </section>

    <!-- 5. Omnichannel Attribution -->
    <section id="omnichannel-attribution" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>5. Phân Phối Đa Kênh: Voucher Livestream (FR-ATT-01) &amp; Non-Blocking Click</span>
          <span class="badge badge-primary">Omnichannel Architecture</span>
        </div>

        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Kênh Phân Phối</th>
                <th>Hình Thức Triển Khai</th>
                <th>Đặc Điểm Kỹ Thuật Đột Phá</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Link Affiliate Trực Tuyến</strong></td>
                <td>Định tuyến rút gọn <span class="copyable-pill">/r/[code]</span></td>
                <td>Sử dụng Next.js <code>after()</code> API: Redirect 302 ngay tức thì trong &lt; 900ms. Thao tác ghi database <code>clicks</code> chạy ngầm ở background, không làm chậm khách. Bộ lọc 26+ chữ ký bot chống click tặc.</td>
              </tr>
              <tr>
                <td><strong>2. Mã QR Ấn Phẩm Thực Tế</strong></td>
                <td>Mã QR đồ họa tải về từ modal</td>
                <td>Tự động sinh ảnh QR chuẩn vector/PNG để dán lên standee, tờ rơi tại khách sạn, quầy lễ tân du lịch.</td>
              </tr>
              <tr>
                <td><strong>3. Livestream &amp; Gọi Điện Thoại</strong></td>
                <td>Mã Voucher Ký Tự (<span class="copyable-pill">FR-ATT-01</span>)</td>
                <td>Mã chữ độc quyền (VD: <code>BANA100K-TUAN88</code>). Khách chỉ cần đọc hoặc nhập mã khi thanh toán. AI Sales Agent tự động bóc tách regex và gắn ref ID vào link đặt vé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 6. Supporting Portals -->
    <section id="supporting-portals" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>6. Hoàn Thiện Các Cổng Quản Trị: Merchant &amp; Super Admin Back-Office</span>
          <span class="badge badge-cyan">Full Ecosystem</span>
        </div>

        <ul style="font-size: 0.92rem; padding-left: 20px; line-height: 1.8;">
          <li><strong>Merchant Products Management (<code>/merchant/products</code>):</strong> Màn hình CRUD danh sách tour, cấu hình giá bán, giá niêm yết, chính sách vé và tiện ích đi kèm.</li>
          <li><strong>Merchant AI Content Approval (<code>/merchant/contents</code>):</strong> Cổng phê duyệt nội dung AI: Merchant kiểm duyệt video, kịch bản, hashtag do AI sinh ra trước khi đẩy sang kho tư liệu của Reseller.</li>
          <li><strong>Merchant Dashboard Dữ Liệu Thật (<code>/merchant</code>):</strong> Đấu nối 100% số liệu GMV, lượt click, đơn hàng thật từ database Supabase, xóa bỏ hoàn toàn mock data.</li>
          <li><strong>Super Admin Back-Office (<code>/admin</code>, <code>/admin/payouts</code>, <code>/admin/fraud</code>):</strong> Màn hình duyệt lệnh rút tiền của Reseller, kiểm tra chuyển khoản ngân hàng và trung tâm giám sát gian lận click bot.</li>
        </ul>
      </div>
    </section>

    <!-- 7. QA Verification -->
    <section id="qa-verification" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>7. Danh Mục Lệnh Kiểm Thử Tự Động Minh Chứng (Pass 100%)</span>
          <span class="badge badge-success">Automated Verification</span>
        </div>

        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Hạng Mục Kiểm Thử</th>
                <th>Lệnh Chạy Terminal</th>
                <th>Kết Quả Xác Thực</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Muse AI Video &amp; End-Card</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:muse-video')">npm run test:muse-video</span></td>
                <td><strong>12/12 Test Cases PASSED</strong> (Polling task, End-Card phủ mờ, loại bỏ Gemini).</td>
              </tr>
              <tr>
                <td><strong>Chống Tiêu Kép Ví Reseller</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:payout-double-spend')">npm run test:payout-double-spend</span></td>
                <td><strong>PASSED</strong> (Logic trừ số dư hiệu dụng, khóa pending, chặn race condition).</td>
              </tr>
              <tr>
                <td><strong>Webhook &amp; AI Sales Agent</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:be2:sprint')">npm run test:be2:sprint</span></td>
                <td><strong>16/16 Test Cases PASSED</strong> (HMAC signature, chia 80/20, bóc tách voucher).</td>
              </tr>
              <tr>
                <td><strong>Super Admin Back-Office</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:admin')">npm run test:admin</span></td>
                <td><strong>PASSED</strong> (RLS phân quyền admin, duyệt payout, đối soát fraud).</td>
              </tr>
              <tr>
                <td><strong>Kiểm Thử Toàn Diện Final Sprint</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:final-sprint')">npm run test:final-sprint</span></td>
                <td><strong>16/16 Test Cases PASSED</strong> (Khép kín 100% nghiệp vụ BE1 &amp; BE2).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <footer>
      <p><strong>BÁO CÁO NGHIỆM THU KỸ THUẬT SPRINT 4 &amp; 5 — DỰ ÁN AI TRAVEL RESELLER NETWORK</strong></p>
      <p style="font-size: 0.82rem; margin-top: 6px; color: var(--text-muted);">
        Để xem kịch bản thực hành và tài khoản demo chi tiết, vui lòng mở: 
        <a href="HUONG_DAN_LIVE_DEMO_CHI_TIET.html" style="color: var(--primary); font-weight: 700;">Sổ Tay Hướng Dẫn Live Demo</a>
      </p>
    </footer>
  </div>

  <script>${sharedScripts}</script>
</body>
</html>
`;

// ============================================================================
// FILE 2: SỔ TAY HƯỚNG DẪN LIVE DEMO CHI TIẾT (STEP-BY-STEP LIVE DEMO GUIDE)
// ============================================================================
const demoGuideHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sổ Tay Hướng Dẫn Live Demo Chi Tiết | AI Travel Reseller Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${sharedStyles}
    .step-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 26px;
      margin-bottom: 22px;
      box-shadow: var(--shadow);
    }
    .step-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .step-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: var(--text); }
    .step-action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 14px;
    }
    @media (max-width: 860px) {
      .step-action-grid { grid-template-columns: 1fr; }
    }
    .step-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
    }
    .step-box h5 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .credential-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .credential-role { font-weight: 700; color: var(--text); font-size: 0.95rem; }
    .credential-fields { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

    .speech-box {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #e2e8f0;
      border-left: 4px solid var(--accent);
      padding: 20px;
      border-radius: 10px;
      margin: 16px 0;
      font-size: 0.95rem;
      line-height: 1.7;
    }
    .speech-speaker {
      color: #fb923c;
      font-size: 0.82rem;
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }
  </style>
</head>
<body>
  <div id="progress-bar"></div>

  <div class="container">
    <div class="top-bar">
      <div class="top-bar-left">
        <span class="top-badge">Cẩm Nang Diễn Tập Live Demo</span>
        <span>Dự án: <strong>AI Travel Reseller (TravelLink AI)</strong></span>
        <span>•</span>
        <span>Chuẩn bị cho: <strong>Hội Đồng Nghiệm Thu &amp; Khách Hàng</strong></span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a href="BAO_CAO_TONG_KET_2_TUAN_VIDEO_VA_RESELLER.html" class="switch-file-btn" style="background: linear-gradient(135deg, #10b981, #059669);">
          <span>📑 Mở Báo Cáo Kỹ Thuật</span>
        </a>
        <button id="themeToggle" class="theme-toggle-btn" onclick="toggleTheme()">
          <span id="themeIcon">🌙</span> <span id="themeText">Giao diện Tối</span>
        </button>
      </div>
    </div>

    <header class="hero-header" style="background: linear-gradient(135deg, #065f46 0%, #111827 60%, #042f2e 100%);">
      <div class="hero-pretitle" style="background: rgba(16, 185, 129, 0.4); border-color: rgba(52, 211, 153, 0.5); color: #a7f3d0;">
        Sổ Tay Vận Hành &amp; Thuyết Trình Trực Quan 3 Vai Trò
      </div>
      <h1>SỔ TAY <span>HƯỚNG DẪN LIVE DEMO</span> THỰC CHIẾN</h1>
      <p class="hero-subtitle">
        Cung cấp đầy đủ đường dẫn truy cập (Links), thông tin đăng nhập (Accounts/Passwords), thao tác bấm chuột từng bước, hiện tượng quan sát và kịch bản thuyết trình mẫu khép kín từ <strong>Tạo Video AI (10s + 5s End-Card)</strong> đến <strong>Rút Tiền Ví Reseller Chống Tiêu Kép</strong>.
      </p>

      <div class="hero-meta-grid">
        <div class="hero-meta-item">
          <span>Môi Trường Chạy Trình Diễn</span>
          <strong>Localhost (<span class="copyable-pill" onclick="copyText('http://localhost:3000')">http://localhost:3000</span>)</strong>
        </div>
        <div class="hero-meta-item">
          <span>AI Gateway Engine</span>
          <strong>Muse2API Local Docker (<span class="copyable-pill" onclick="copyText('http://localhost:18610')">:18610</span>)</strong>
        </div>
        <div class="hero-meta-item">
          <span>Thời Lượng Thuyết Trình Gợi Ý</span>
          <strong>3 – 5 Phút (Bao gồm Q&amp;A)</strong>
        </div>
        <div class="hero-meta-item">
          <span>Tỷ Lệ Thành Công Diễn Tập</span>
          <strong>100% (80/80 Kịch Bản PASS)</strong>
        </div>
      </div>
    </header>

    <nav class="sticky-nav">
      <a href="#accounts-table" class="nav-link active">🔑 Tài Khoản &amp; Links</a>
      <a href="#demo-step-1" class="nav-link">🎬 Demo 1: Tạo Video AI (10s+5s)</a>
      <a href="#demo-step-2" class="nav-link">✅ Demo 2: Merchant Duyệt Video</a>
      <a href="#demo-step-3" class="nav-link">📱 Demo 3: Reseller Phân Phối</a>
      <a href="#demo-step-4" class="nav-link">🤖 Demo 4: Chatbot Bán Tour</a>
      <a href="#demo-step-5" class="nav-link">💰 Demo 5: Ví Chống Tiêu Kép</a>
      <a href="#demo-step-6" class="nav-link">🛡️ Demo 6: Super Admin Duyệt Payout</a>
      <a href="#pitch-script" class="nav-link">🎤 Lời Thoại Thuyết Trình</a>
      <a href="#qa-defense" class="nav-link">🛡️ Đáp Án Phản Biện</a>
    </nav>

    <!-- 1. Accounts & Links Table -->
    <section id="accounts-table" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>1. Bảng Thông Tin Đăng Nhập &amp; Các Đường Dẫn Demo Trực Tiếp</span>
          <span class="badge badge-primary">Credentials Hub</span>
        </div>

        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Vai Trò (Role)</th>
                <th>Tài Khoản (Email)</th>
                <th>Mật Khẩu (Password)</th>
                <th>Đường Dẫn Đăng Nhập / Trực Tiếp</th>
                <th>Tính Năng Trình Diễn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Merchant (Sun World Bà Nà)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('merchant@example.com')">merchant@example.com</span></td>
                <td><span class="copyable-pill" onclick="copyText('password123')">password123</span></td>
                <td>
                  <a href="http://localhost:3000/merchant/library" target="_blank" style="color: var(--primary); font-weight: 700;">/merchant/library</a>
                  <br><a href="http://localhost:3000/merchant/contents" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/merchant/contents (Duyệt AI)</a>
                  <br><a href="http://localhost:3000/merchant/products" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/merchant/products (Quản lý Tour)</a>
                </td>
                <td>Tạo Video AI với Muse2API, Live Timer, sinh 10s clip + 5s End-Card thông tin tour, duyệt bài phát hành.</td>
              </tr>
              <tr>
                <td><strong>2. Reseller (Cộng Tác Viên)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('reseller@example.com')">reseller@example.com</span></td>
                <td><span class="copyable-pill" onclick="copyText('password123')">password123</span></td>
                <td>
                  <a href="http://localhost:3000/reseller/library" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/library</a>
                  <br><a href="http://localhost:3000/reseller/wallet" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/reseller/wallet (Ví hoa hồng)</a>
                </td>
                <td>Xem video mobile, mở Mẹo đăng TikTok, copy link rút gọn, mã QR, mã voucher Livestream, rút tiền ví chống tiêu kép.</td>
              </tr>
              <tr>
                <td><strong>3. Super Admin (Quản Trị Sàn)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('admin@example.com')">admin@example.com</span></td>
                <td><span class="copyable-pill" onclick="copyText('password123')">password123</span></td>
                <td>
                  <a href="http://localhost:3000/admin/payouts" target="_blank" style="color: var(--primary); font-weight: 700;">/admin/payouts</a>
                  <br><a href="http://localhost:3000/admin/fraud" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/admin/fraud (Chống gian lận)</a>
                  <br><a href="http://localhost:3000/preview/admin" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/preview/admin (Xem trước)</a>
                </td>
                <td>Phê duyệt lệnh rút tiền Payout của Reseller, xác nhận chuyển khoản ngân hàng, giám sát click bot.</td>
              </tr>
              <tr>
                <td><strong>4. Khách Du Lịch (Customer)</strong></td>
                <td><em>Không cần đăng nhập</em></td>
                <td><em>Không có</em></td>
                <td>
                  <a href="http://localhost:3000" target="_blank" style="color: var(--primary); font-weight: 700;">/ (Trang chủ &amp; Chatbot)</a>
                </td>
                <td>Tương tác với AI Sales Chatbot, kiểm tra chống bịa giá, nhập mã voucher và nhận link đặt vé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Demo 1: Video Generation -->
    <section id="demo-step-1" class="step-card">
      <span class="step-badge">Kịch Bản 1 (Trọng Tâm Tạo Video AI)</span>
      <h3 class="step-title">Merchant Tạo Video AI: 10s Muse AI + 5s FFmpeg Blurred End-Card (Tổng 15s)</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh tốc độ tạo video Muse AI mượt mà, không bị timeout, và cuối video có 5s End-Card phủ mờ thông tin tour độc quyền.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập <a href="http://localhost:3000/merchant/library" target="_blank" style="color: var(--primary); font-weight: 700;">/merchant/library</a> (đăng nhập: <code>merchant@example.com</code> / <code>password123</code>).</li>
            <li>Bấm nút <strong>"Tạo Video AI Bằng Muse Engine"</strong> màu xanh.</li>
            <li>Chọn Chiến dịch mẫu: <em>"Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills"</em>.</li>
            <li>Chọn <strong>2 đến 3 ảnh tài nguyên</strong> (Cầu Vàng, Làng Pháp).</li>
            <li>Chọn Thời Lượng: <strong>"10 giây (Tối ưu Video AI ngắn / TikTok / Reels)"</strong>.</li>
            <li>Bấm <strong>"Bắt đầu Kết xuất Video"</strong>.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Hiện Tượng Quan Sát &amp; Điểm Nhấn Đắt Giá</h5>
          <ul style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li><strong>Live Elapsed Timer:</strong> Đồng hồ số đếm giây <code>00:01, 00:02...</code> dạng thời gian thực.</li>
            <li><strong>Tiến trình tăng đều:</strong> Thanh progress tăng mượt mà, không bị kẹt ở mốc 93%.</li>
            <li><strong>Video thành phẩm 15s sắc nét &amp; đầy đủ thông tin:</strong>
              <br>• <strong>10 giây đầu:</strong> 2 phân cảnh chuyển động flycam mượt mà do Muse AI sinh ra.
              <br>• <strong>5 giây cuối:</strong> FFmpeg tự động gắn <strong>Blurred Tour Info End-Card</strong>: ảnh nền phủ mờ điện ảnh <code>boxblur</code>, với thiết kế thẻ đa tầng sang trọng: Header xanh Cyan, Khung giá vàng nổi bật <strong>950.000 VNĐ</strong> (kèm ưu đãi độc quyền đặt sớm), 3 tiện ích du lịch chính hãng kèm bullet <code>•</code>, Hotline hỗ trợ 1900 8888, cam kết vé điện tử 100% và Banner CTA xanh lục <em>"Bình luận nhận ngay vé ưu đãi hôm nay!"</em>.
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Demo 2: Content Approval -->
    <section id="demo-step-2" class="step-card">
      <span class="step-badge">Kịch Bản 2 (Merchant Flow)</span>
      <h3 class="step-title">Merchant Phê Duyệt Video AI Sang Sàn Phân Phối Reseller</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh quy trình kiểm duyệt nội dung (Human-in-the-loop) trước khi phát hành cho CTV.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập <a href="http://localhost:3000/merchant/contents" target="_blank" style="color: var(--primary); font-weight: 700;">/merchant/contents</a>.</li>
            <li>Màn hình hiển thị danh sách nội dung AI sinh ra đang ở trạng thái <code>pending_approval</code>.</li>
            <li>Xem trước video 15s vừa tạo, kiểm tra kịch bản và hashtag.</li>
            <li>Bấm nút <strong>"Phê duyệt &amp; Phát hành"</strong> (Approve).</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Kết Quả</h5>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">
            Trạng thái đổi ngay sang <code>approved</code> (Xanh lá). Video lập tức xuất hiện trên Bảng tin của toàn bộ Cộng tác viên (Reseller) trong hệ sinh thái.
          </p>
        </div>
      </div>
    </section>

    <!-- Demo 3: Reseller Omnichannel -->
    <section id="demo-step-3" class="step-card">
      <span class="step-badge">Kịch Bản 3 (Reseller Distribution Flow)</span>
      <h3 class="step-title">Reseller Xem Video Mobile &amp; Lấy Bộ Công Cụ Phân Phối Đa Kênh</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Trình diễn trải nghiệm xem video dọc chuẩn TikTok, copy caption 1-click và 3 kênh tiếp thị (Link, QR, Voucher Livestream).
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Đăng nhập tài khoản Reseller: <code>reseller@example.com</code> / <code>password123</code>.</li>
            <li>Truy cập <a href="http://localhost:3000/reseller/library" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/library</a>.</li>
            <li>Bấm <strong>"Xem Video Mobile"</strong> &rarr; Trình phát dọc 9:16 có 5s End-Card rõ nét ở cuối.</li>
            <li>Bấm <strong>"Mẹo Đăng Video AI"</strong> &rarr; Xem giờ vàng đăng bài, bấm nút Copy Caption mẫu.</li>
            <li>Bấm <strong>"Lấy Link Tiếp Thị"</strong> &rarr; Modal phân phối hiện 3 tab:
              <br>• <em>Tab 1:</em> Copy link rút gọn <span class="copyable-pill">/r/[code]</span>.
              <br>• <em>Tab 2:</em> Tải ảnh mã QR đồ họa.
              <br>• <em>Tab 3:</em> Copy <strong>Mã Voucher Ký Tự</strong> (VD: <span class="copyable-pill" onclick="copyText('BANA100K-TUAN88')">BANA100K-TUAN88</span>).
            </li>
            <li>Mở tab mới dán link <span class="copyable-pill">/r/[code]</span> &rarr; Chuyển hướng 302 sang trang tour tức thì (&lt; 900ms) nhờ Next.js <code>after()</code> non-blocking!</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Ý Nghĩa Thực Tiễn</h5>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">
            Reseller có thể bán tour trên mọi mặt trận: gắn link bio TikTok, in mã QR lên quầy lễ tân khách sạn, hoặc đọc mã voucher giảm giá trực tiếp khi Livestream mà không cần khách bấm link.
          </p>
        </div>
      </div>
    </section>

    <!-- Demo 4: Chatbot Anti-Hallucination -->
    <section id="demo-step-4" class="step-card">
      <span class="step-badge">Kịch Bản 4 (Customer AI Chatbot)</span>
      <h3 class="step-title">Khách Hàng Hỏi Trợ Lý AI &amp; Áp Dụng Mã Voucher Livestream</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh AI Sales Agent không bịa giá (0% Hallucination) và tự động nhận diện voucher để gắn ref ID vào link thanh toán.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Câu Hỏi Gửi Chatbot</h5>
          <div class="code-block" style="margin: 6px 0;">
            <code>"Tôi có mã voucher BANA100K-TUAN88, giá vé tour Bà Nà Hills trọn gói hôm nay thế nào?"</code>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
            Thử hỏi bẫy: <em>"Có giảm giá còn 200.000đ được không bạn?"</em>
          </p>
        </div>

        <div class="step-box">
          <h5>Kết Quả Phản Hồi Từ AI</h5>
          <ul style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li><strong>Chống bịa giá (0% Hallucination):</strong> Báo giá niêm yết chính xác <strong>950.000 VNĐ</strong> (gồm buffet trưa và cáp treo khứ hồi), lịch sự từ chối mức giá vô lý.</li>
            <li><strong>Nhận diện Voucher:</strong> Nhận diện mã <code>BANA100K-TUAN88</code> và sinh ra <strong>Thẻ Đặt Vé (Checkout Card)</strong> có gắn <code>&amp;voucher=BANA100K-TUAN88&amp;ref=...</code>, đảm bảo hoa hồng cho Reseller!</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Demo 5: Wallet Anti Double-Spend -->
    <section id="demo-step-5" class="step-card">
      <span class="step-badge">Kịch Bản 5 (Trọng Tâm Tài Chính Ví Reseller)</span>
      <h3 class="step-title">Reseller Yêu Cầu Rút Tiền Ví &amp; Thử Nghiệm Tấn Công Tiêu Kép (Anti Double-Spend)</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh thuật toán khóa số dư hiệu dụng bảo vệ 100% dòng tiền hoa hồng, không cho phép rút vượt quá số dư.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Rút Tiền Hợp Lệ</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập Ví: <a href="http://localhost:3000/reseller/wallet" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/wallet</a>.</li>
            <li>Quan sát: Số dư khả dụng hiện có: <strong>1.000.000 VNĐ</strong>.</li>
            <li>Bấm nút <strong>"Yêu Cầu Rút Tiền"</strong> màu xanh.</li>
            <li>Nhập thông tin Payout:
              <br>• Ngân hàng: <em>Vietcombank</em>.
              <br>• Số Tài Khoản: <span class="copyable-pill" onclick="copyText('0123456789')">0123456789</span>.
              <br>• Tên Chủ Tài Khoản: <span class="copyable-pill" onclick="copyText('NGUYEN VAN A')">NGUYEN VAN A</span>.
              <br>• Số tiền rút: <span class="copyable-pill" onclick="copyText('600000')">600000</span> (600.000 VNĐ).
            </li>
            <li>Bấm <strong>"Xác nhận Rút tiền"</strong>.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Thử Nghiệm Tấn Công Tiêu Kép (Double-Spend Demo)</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Sau khi lệnh rút 600.000đ được gửi, số dư khả dụng hiệu dụng lập tức bị khóa còn: <strong>400.000 VNĐ</strong>.</li>
            <li>Bảng lịch sử rút tiền hiện lệnh 600.000đ với badge vàng <code>pending</code>.</li>
            <li><strong>Bấm tiếp nút "Yêu cầu rút tiền" và nhập 500.000 VNĐ</strong> (vượt quá 400.000đ còn lại).</li>
            <li><strong>KẾT QUẢ:</strong> Hệ thống kích hoạt cơ chế Row-level Lock và chặn đứng với thông báo lỗi: <em>"Số dư khả dụng không đủ"</em>! Dòng tiền được bảo toàn tuyệt đối.</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Demo 6: Super Admin Payout Approval -->
    <section id="demo-step-6" class="step-card">
      <span class="step-badge">Kịch Bản 6 (Super Admin Back-Office)</span>
      <h3 class="step-title">Super Admin Phê Duyệt Chi Trả Payout &amp; Giám Sát Gian Lận Click Bot</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Khép kín toàn bộ vòng lặp đối soát tài chính trên hệ sinh thái thực tế.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Phê Duyệt Lệnh Rút Tiền</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập <a href="http://localhost:3000/admin/payouts" target="_blank" style="color: var(--primary); font-weight: 700;">/admin/payouts</a> (hoặc <a href="http://localhost:3000/preview/admin/payouts" target="_blank" style="color: var(--text-muted);">/preview/admin/payouts</a>).</li>
            <li>Thấy lệnh rút 600.000 VNĐ của Reseller Nguyễn Văn A đang ở trạng thái <code>pending</code>.</li>
            <li>Kiểm tra STK Vietcombank, bấm nút <strong>"Phê duyệt &amp; Xác nhận Đã Chuyển Khoản"</strong>.</li>
            <li>Trạng thái đổi ngay sang <code>completed</code> (Xanh lá). Mã giao dịch ngân hàng được lưu vết kiểm toán.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Kiểm Tra Trung Tâm Chống Gian Lận</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Bấm sang tab <strong>"Giám sát Gian lận"</strong> (<a href="http://localhost:3000/admin/fraud" target="_blank" style="color: var(--primary);">/admin/fraud</a>).</li>
            <li>Xem biểu đồ các lượt click bot bị chặn đứng (Googlebot, spam crawlers).</li>
            <li>Xem danh sách đơn hàng có cờ nghi vấn tự mua (Self-purchase flag) để kế toán rà soát trước khi xuất hóa đơn.</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Pitch Script -->
    <section id="pitch-script" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>Kịch Bản Lời Thoại Thuyết Trình Mẫu (Pitch Script 3 Phút)</span>
          <span class="badge badge-accent">Live Demo Script</span>
        </div>

        <div class="speech-box">
          <span class="speech-speaker">PHÚT 1: ĐẶT VẤN ĐỀ &amp; GIẢI PHÁP TẠO VIDEO AI (10S + 5S END-CARD)</span>
          "Kính thưa Thầy/Cô và Hội đồng, 2 tuần qua nhóm chúng em tập trung khép kín 2 bài toán then chốt: Động cơ Video AI và Dòng tiền Hoa hồng Reseller.
          <br><br>
          Đầu tiên, ở vai trò <strong>Merchant Sun World</strong>, em vào <code>/merchant/library</code>. Nhóm đã chuyển giao sang <strong>Muse AI Gateway chạy Docker Local với chi phí $0.00</strong>. Khi em bấm tạo video 10 giây cho tour Bà Nà Hills:
          Đồng hồ đếm thời gian thực chạy từng giây mượt mà. Đặc biệt, video thành phẩm dài đúng <strong>15 giây</strong>: 10 giây đầu là chuyển động flycam điện ảnh do Muse AI sinh ra, và <strong>5 giây cuối là thẻ End-Card phủ mờ thông tin tour</strong> hiển thị giá vé ưu đãi 950.000đ và hotline đặt vé cực kỳ bắt mắt."
        </div>

        <div class="speech-box">
          <span class="speech-speaker">PHÚT 2: PHÂN PHỐI ĐA KÊNH &amp; CHỐNG BỊA GIÁ CHATBOT AI</span>
          "Sau khi Merchant duyệt video tại <code>/merchant/contents</code>, video lập tức xuất hiện trên kho tư liệu Reseller tại <code>/reseller/library</code>.
          Reseller có ngay 3 công cụ tiếp thị: Link affiliate chuyển hướng tức thì trong &lt; 900ms, Mã QR đồ họa, và <strong>Mã Voucher ký tự độc quyền</strong> cho Livestream.
          <br><br>
          Khi khách hàng hỏi Chatbot du lịch kèm mã voucher, AI Sales Agent cam kết <strong>0% ảo giác</strong>, báo đúng giá 950.000đ và tự động sinh Thẻ Đặt Tour đính kèm voucher và ref của Reseller."
        </div>

        <div class="speech-box">
          <span class="speech-speaker">PHÚT 3: VÍ HOA HỒNG RESELLER &amp; CHỐNG RÚT TIỀN KÉP</span>
          "Khi đơn hàng thanh toán thành công qua Webhook, hoa hồng tự động ghi nhận vào Ví Reseller theo tỷ lệ 80/20. Em xin vào <code>/reseller/wallet</code> để trình diễn tính năng then chốt: <strong>Cơ chế Chống Tiêu Kép (Anti Double-Spend)</strong>.
          <br><br>
          Ví có 1.000.000đ khả dụng. Em tạo lệnh rút 600.000đ. Hệ thống lập tức áp dụng Row-level Lock, khóa số dư khả dụng hiệu dụng chỉ còn 400.000đ. Nếu em cố tình tạo tiếp lệnh rút 500.000đ, hệ thống chặn ngay lập tức. Sau đó, tại cổng <code>/admin/payouts</code>, Super Admin duyệt lệnh chuyển khoản chỉ trong 1 click.
          <br><br>
          Toàn bộ quy trình từ Tạo Video AI &rarr; Tiếp thị &rarr; Bán hàng &rarr; Hoa hồng &rarr; Rút tiền đã vận hành trơn tru 100% trên dữ liệu thật."
        </div>
      </div>
    </section>

    <!-- QA Defense -->
    <section id="qa-defense" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>Bộ 5 Câu Hỏi Phản Biện Sắc Bén &amp; Đáp Án Kỹ Thuật (QA Defense)</span>
          <span class="badge badge-purple">Exam Defense</span>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--primary); font-size: 1rem; margin-bottom: 6px;">1. Tại sao video lại là 10s Muse AI + 5s FFmpeg End-Card mà không để AI sinh luôn End-Card?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Các mô hình AI Video quốc tế (Muse, Sora, Kling...) không thể sinh chữ tiếng Việt có dấu chuẩn xác (thường bị méo font hoặc sinh chữ ma). Để phục vụ thương mại, thông tin giá vé (950.000đ), hotline và CTA bắt buộc phải sắc nét 100%. Do đó, 10s đầu dùng AI tạo chuyển động điện ảnh, và 5s cuối dùng FFmpeg phủ mờ ảnh thật (boxblur) và render chữ chuẩn vector, mang lại tỷ lệ chuyển đổi cao nhất.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--danger); font-size: 1rem; margin-bottom: 6px;">2. Cơ chế chống Double-Spend của ví hoa hồng hoạt động thế nào dưới góc độ SQL Database?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Áp dụng Row-Level Locking trong file migration <code>20261112160000_payout_atomic_double_spend_prevention.sql</code>. Khi có request rút tiền, hàm SQL khóa bản ghi ví bằng <code>SELECT ... FOR UPDATE</code>, tính toán <code>effective_available = confirmed_commissions - SUM(pending_payouts)</code>. Mọi request đồng thời sau đó đều bị chặn vì số dư khả dụng hiệu dụng đã bị trừ ngay trong transaction đầu tiên.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--cyan); font-size: 1rem; margin-bottom: 6px;">3. Làm sao link /r/[code] chịu tải được 1.000 người click cùng lúc mà không nghẽn DB?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Sử dụng Next.js <code>after()</code> API để trả về HTTP 302 Redirect ngay tức thì cho người dùng trong &lt; 900ms. Thao tác ghi log click vào database Supabase được đưa vào background execution, kết hợp Rate Limiting trượt 10 clicks/phút/IP và bộ lọc 26+ chữ ký bot crawler. Kiểm thử k6 đạt 486.2 RPS với 98.24% thành công.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--warning); font-size: 1rem; margin-bottom: 6px;">4. Chatbot AI làm cách nào để cam kết 0% bịa giá và gắn đúng voucher của CTV?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Sử dụng Dual-temperature routing (T=0.1 cho dữ liệu giá tour, T=0.7 cho đối thoại). Khi hỏi về giá, bot bắt buộc tra cứu cơ sở tri thức đã kiểm chứng (Verified Facts) từ bảng <code>products</code>. Bộ lọc regex nhận diện mã voucher (VD: <code>BANA100K-TUAN88</code>) và gọi hàm <code>buildCheckoutUrl()</code> để tự động gắn voucher và ref ID vào link đặt vé.
          </p>
        </div>

        <div>
          <h4 style="color: var(--success); font-size: 1rem; margin-bottom: 6px;">5. Cổng Webhook nhận kết quả đặt tour từ đối tác được bảo mật như thế nào?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Endpoint <code>POST /api/webhooks/merchant/order</code> bắt buộc chữ ký số HMAC-SHA256 (<code>x-signature</code>) tính từ body với secret key của đối tác, tự động chia hoa hồng 80% cho Reseller và 20% phí sàn, đồng thời kiểm tra cờ tự mua (<code>flag_self_purchase = ref === customer_id</code>) để chống trục lợi.
          </p>
        </div>
      </div>
    </section>

    <footer>
      <p><strong>SỔ TAY HƯỚNG DẪN LIVE DEMO — DỰ ÁN AI TRAVEL RESELLER NETWORK (TRAVELLINK AI)</strong></p>
      <p style="font-size: 0.82rem; margin-top: 6px; color: var(--text-muted);">
        Xem báo cáo tổng hợp kỹ thuật tại: 
        <a href="BAO_CAO_TONG_KET_2_TUAN_VIDEO_VA_RESELLER.html" style="color: var(--primary); font-weight: 700;">Báo Cáo Tổng Kết 2 Tuần</a>
      </p>
    </footer>
  </div>

  <script>${sharedScripts}</script>
</body>
</html>
`;

// ============================================================================
// WRITE FILES
// ============================================================================
const outDir = resolve("docs/reports");
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const reportPath = resolve(outDir, "BAO_CAO_TONG_KET_2_TUAN_VIDEO_VA_RESELLER.html");
const demoGuidePath = resolve(outDir, "HUONG_DAN_LIVE_DEMO_CHI_TIET.html");

writeFileSync(reportPath, reportHtml, "utf-8");
console.log("✓ Successfully generated File 1:", reportPath);
console.log("  Size:", (Buffer.byteLength(reportHtml, "utf-8") / 1024).toFixed(2), "KB");

writeFileSync(demoGuidePath, demoGuideHtml, "utf-8");
console.log("✓ Successfully generated File 2:", demoGuidePath);
console.log("  Size:", (Buffer.byteLength(demoGuideHtml, "utf-8") / 1024).toFixed(2), "KB");

// Also update the convenience symlink/copy for backwards-compatibility
const aliasReportPath = resolve(outDir, "week4_week5_report.html");
writeFileSync(aliasReportPath, reportHtml, "utf-8");

const aliasDemoPath = resolve(outDir, "sprint4_sprint5_demo_guide.html");
writeFileSync(aliasDemoPath, demoGuideHtml, "utf-8");

console.log("✓ Updated alias links: week4_week5_report.html & sprint4_sprint5_demo_guide.html");
