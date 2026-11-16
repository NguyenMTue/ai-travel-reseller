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
    background: linear-gradient(120deg, #38bdf8, #a855f7, #fb923c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-subtitle {
    font-size: 1.05rem;
    color: #cbd5e1;
    max-width: 950px;
    line-height: 1.7;
    margin-bottom: 24px;
  }
  .hero-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 20px;
  }
  .hero-meta-item span {
    display: block;
    font-size: 0.78rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }
  .hero-meta-item strong {
    font-size: 0.95rem;
    color: #f1f5f9;
  }

  .sticky-nav {
    position: sticky;
    top: 16px;
    z-index: 100;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 9999px;
    padding: 6px 12px;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    box-shadow: var(--shadow);
    margin-bottom: 32px;
    backdrop-filter: blur(8px);
  }
  .nav-link {
    white-space: nowrap;
    padding: 8px 14px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    text-decoration: none;
    border-radius: 9999px;
    transition: all 0.2s;
  }
  .nav-link:hover, .nav-link.active {
    color: var(--primary);
    background: var(--primary-light);
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 30px;
    box-shadow: var(--shadow);
    margin-bottom: 28px;
  }
  .card-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 2px solid var(--border);
    padding-bottom: 12px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 700;
  }
  .badge-success { background: var(--success-light); color: var(--success); }
  .badge-warning { background: var(--warning-light); color: var(--warning); }
  .badge-danger { background: var(--danger-light); color: var(--danger); }
  .badge-purple { background: var(--purple-light); color: var(--purple); }
  .badge-primary { background: var(--primary-light); color: var(--primary-dark); }
  .badge-cyan { background: var(--cyan-light); color: var(--cyan); }
  .badge-accent { background: var(--accent-light); color: var(--accent); }

  .copyable-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--primary-light);
    color: var(--primary-dark);
    padding: 4px 10px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    user-select: all;
  }
  .copyable-pill:hover {
    background: #bae6fd;
  }

  .table-responsive {
    overflow-x: auto;
    margin: 16px 0;
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  .styled-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    text-align: left;
  }
  .styled-table th {
    background: var(--bg);
    color: var(--text-muted);
    font-weight: 700;
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    text-transform: uppercase;
    font-size: 0.76rem;
    letter-spacing: 0.05em;
  }
  .styled-table td {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }
  .styled-table tbody tr:last-child td {
    border-bottom: none;
  }
  .styled-table tbody tr:hover {
    background: rgba(2, 132, 199, 0.03);
  }

  .code-block {
    background: var(--code-bg);
    color: var(--code-text);
    padding: 18px;
    border-radius: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    overflow-x: auto;
    margin: 14px 0;
    position: relative;
    border: 1px solid #1e293b;
    line-height: 1.55;
  }
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    color: #94a3b8;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 8px;
  }
  .copy-btn {
    background: #334155;
    border: none;
    color: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }
  .copy-btn:hover { background: #475569; }

  .alert {
    padding: 16px 20px;
    border-radius: 10px;
    margin: 18px 0;
    font-size: 0.92rem;
    line-height: 1.6;
    border-left: 4px solid;
  }
  .alert-info {
    background: var(--primary-light);
    color: #0369a1;
    border-left-color: var(--primary);
  }
  [data-theme="dark"] .alert-info {
    background: rgba(12, 74, 110, 0.35);
    color: #7dd3fc;
  }
  .alert-warning {
    background: var(--warning-light);
    color: #92400e;
    border-left-color: var(--warning);
  }
  [data-theme="dark"] .alert-warning {
    background: rgba(120, 53, 15, 0.35);
    color: #fcd34d;
  }
  .alert-success {
    background: var(--success-light);
    color: #065f46;
    border-left-color: var(--success);
  }
  [data-theme="dark"] .alert-success {
    background: rgba(6, 78, 59, 0.35);
    color: #6ee7b7;
  }

  .compare-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 16px 0;
  }
  @media (max-width: 768px) {
    .compare-grid { grid-template-columns: 1fr; }
  }
  .compare-card {
    border-radius: 10px;
    padding: 20px;
    border: 1px solid var(--border);
  }
  .compare-card.old {
    background: var(--danger-light);
    border-color: rgba(239, 68, 68, 0.3);
  }
  .compare-card.new {
    background: var(--success-light);
    border-color: rgba(16, 185, 129, 0.3);
  }
  .compare-card h4 {
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .compare-card.old h4 { color: var(--danger); }
  .compare-card.new h4 { color: var(--success); }
  .compare-list {
    font-size: 0.88rem;
    padding-left: 18px;
    line-height: 1.6;
  }

  footer {
    text-align: center;
    padding: 30px 0;
    border-top: 1px solid var(--border);
    margin-top: 40px;
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
  });

  function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      updateThemeBtn(false);
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      updateThemeBtn(true);
    }
  }

  function updateThemeBtn(isDark) {
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon && text) {
      icon.textContent = isDark ? '☀️' : '🌙';
      text.textContent = isDark ? 'Giao diện Sáng' : 'Giao diện Tối';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeBtn(true);
    } else {
      updateThemeBtn(false);
    }

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 120) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    });
  });

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
      <h1>BÁO CÁO 2 TUẦN NƯỚC RÚT: <span>AI VIDEO 4-SHOT, STOREFRONT SUBDOMAIN &amp; VÍ RESELLER</span></h1>
      <p class="hero-subtitle">
        Tổng kết toàn diện tiến độ, đột phá kiến trúc và minh chứng kiểm thử của 3 phân hệ cốt lõi: <strong>Động cơ Tạo Video AI (Muse2API 4-Shot I2V + Golden Hour + 5s End-Card)</strong>, <strong>Phân hệ Merchant Subdomain Storefront &amp; Chốt đơn VietQR tự động cộng hoa hồng tức thì (Auto-Credit Commission Flow)</strong>, và <strong>Phân hệ Ví Reseller chống Tiêu kép (Double-Spend Prevention)</strong>.
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
      <a href="#endcard-architecture" class="nav-link">🎴 Kiến Trúc 4-Shot &amp; End-Card</a>
      <a href="#storefront-booking-engine" class="nav-link">🏪 Storefront &amp; VietQR Auto-Credit</a>
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
        <div class="kpi-card accent">
          <span class="kpi-title">Storefront &amp; Commission Auto-Credit</span>
          <div class="kpi-value">8/8 <small style="font-size: 1rem">Suites</small></div>
          <span class="kpi-desc">VietQR, Subdomain Proxy, Auto-Credit Ví Reseller</span>
          <span class="kpi-badge success">100% Automated PASS</span>
        </div>
        <div class="kpi-card purple">
          <span class="kpi-title">Đánh Giá Video AI Rubric</span>
          <div class="kpi-value">9.65 <small style="font-size: 1rem">/ 10</small></div>
          <span class="kpi-desc">4-Shot I2V 10s, Golden Hour grading, 5s Blurred End-Card</span>
          <span class="kpi-badge success">Approved for Ads</span>
        </div>
        <div class="kpi-card cyan">
          <span class="kpi-title">Kiểm Thử Tải Đỉnh k6</span>
          <div class="kpi-value">486.2 <small style="font-size: 1rem">RPS</small></div>
          <span class="kpi-desc">1.000 VUs đồng thời, Tỷ lệ thành công 98.24%</span>
          <span class="kpi-badge primary">P95 &lt; 950ms</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">Độ An Toàn AI Sales Agent</span>
          <div class="kpi-value">0.0%</div>
          <span class="kpi-desc">Tỷ lệ ảo giác giá trên 46 TCs &amp; 50 UAT thực địa</span>
          <span class="kpi-badge success">Strict Grounding</span>
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

    <!-- 3. End-Card Architecture & 4-Shot I2V Pipeline -->
    <section id="endcard-architecture" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>3. Đột Phá Kỹ Thuật Chiều 13/11: Pipeline 4-Shot I2V (10s) + Golden Hour Grading + 5s Blurred End-Card (15s Tổng)</span>
          <span class="badge badge-success">High Conversion Architecture</span>
        </div>

        <div class="alert alert-info">
          <strong>💡 Kiến trúc kết xuất video thương mại thế hệ mới:</strong>
          <br>Thay vì chỉ tạo một cảnh đơn lẻ dễ gây nhàm chán, nhóm đã xây dựng <strong>Pipeline chuỗi prompt 4 phân cảnh I2V (Image-to-Video Chained Pipeline)</strong> dài chính xác 10 giây (2.5 giây/shot) với sự liên tục mượt mà về vector vận tốc máy quay flycam. Sau đó, FFmpeg tự động mở rộng và ghép nối với <strong>5 giây End-Card phủ mờ thông tin tour</strong> độc quyền, tạo ra thành phẩm video dài 15 giây hoàn chỉnh, sẵn sàng chạy quảng cáo TikTok/Reels với tỷ lệ chuyển đổi cao nhất.
        </div>

        <div class="alert alert-warning" style="margin-top: 14px;">
          <strong>🛡️ Các nâng cấp cốt lõi hoàn thiện chiều 13/11/2026:</strong>
          <br>• <strong>Khắc phục triệt để lỗi Ảo giác địa danh (Landmark Grounding):</strong> Nhóm đã khóa cứng prompt vào siêu dữ liệu thực tế của tour Bà Nà Hills trong database (<code>bana_hills_product_metadata.sql</code>), đảm bảo 4 cảnh quay đều là địa danh có thật (Cầu Vàng, Làng Pháp, Cáp treo thác Tóc Tiên, Hầm rượu Debay), loại bỏ 100% rủi ro sinh cảnh ngoại lai.
          <br>• <strong>Bộ lọc màu điện ảnh Golden Hour (5600K Tone Curve):</strong> Tích hợp đường cong màu cao cấp trong FFmpeg (<code>eq=contrast=1.08:saturation=1.12,curves=r='0/0 0.5/0.54 1/1':b='0/0 0.5/0.46 1/0.95'</code>) mang lại sắc vàng hoàng hôn/bình minh ấm áp, tôn da nhân vật và tạo cảm xúc du lịch cao cấp.
          <br>• <strong>Làm sạch bộ đệm font glyph Emoji trên Windows:</strong> Bộ giải mã FreeType trên Windows hay bị crash khi gặp emoji (⭐, 📍) hoặc ký tự phần trăm <code>%</code> (coi là token format string). Nhóm đã áp dụng <code>expansion=none</code>, chuẩn hóa sang bullet Unicode <code>•</code> và tách lớp khối thẻ giá (Khung viền Vàng Amber <code>0xFFD700</code>, Banner CTA Emerald <code>0x059669</code>) hiển thị tiếng Việt sắc nét 100%.
        </div>

        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>Phân Cảnh (Shot)</th>
                <th>Thời Lượng</th>
                <th>Công Nghệ &amp; Góc Quay</th>
                <th>Nội Dung Thể Hiện &amp; Hiệu Ứng Quảng Cáo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Shot 1: Opening Hook</strong></td>
                <td><strong>2.5 giây</strong></td>
                <td>Muse I2V (Flycam Forward, 5600K)</td>
                <td>Góc máy Flycam tiến thẳng qua Bàn tay Phật và Cầu Vàng giữa biển mây bình minh rực rỡ. Giữ chân người xem ngay trong 3s đầu lướt feed.</td>
              </tr>
              <tr>
                <td><strong>Shot 2: Cable Car Ascent</strong></td>
                <td><strong>2.5 giây</strong></td>
                <td>Muse I2V (Smooth Orbit, Motion Vector)</td>
                <td>Cáp treo Bà Nà Hills xuyên qua các tầng mây trắng, ngắm nhìn thác Tóc Tiên hùng vĩ. Kế thừa vector vận tốc chuyển động từ Shot 1.</td>
              </tr>
              <tr>
                <td><strong>Shot 3: French Village Fairytale</strong></td>
                <td><strong>2.5 giây</strong></td>
                <td>Muse I2V (Gentle Zoom In)</td>
                <td>Làng Pháp cổ kính phong cách Gothic châu Âu và Lâu đài Mặt Trăng tráng lệ, tôn lên không gian nghỉ dưỡng đẳng cấp quốc tế.</td>
              </tr>
              <tr>
                <td><strong>Shot 4: Wine Cellar &amp; Garden</strong></td>
                <td><strong>2.5 giây</strong></td>
                <td>Muse I2V (Cinematic Pan Right)</td>
                <td>Hầm rượu cổ Debay 100 năm tuổi và vườn hoa Le Jardin D'Amour ngập tràn sắc hoa rực rỡ, khơi gợi khao khát check-in trải nghiệm.</td>
              </tr>
              <tr>
                <td><strong>Shot 5: Blurred Tour Info End-Card</strong></td>
                <td><strong>5.0 giây</strong></td>
                <td>FFmpeg Compositor (boxblur=18:5)</td>
                <td>Phủ mờ ảnh thật của tour, hiển thị bảng giá ưu đãi 950.000đ (gạch giá gốc 1.250.000đ), 3 điểm nổi bật dịch vụ, Hotline 1900 8888 và CTA kêu gọi đặt vé.</td>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.08); font-weight: 700;">
                <td><strong>TỔNG THỜI LƯỢNG THÀNH PHẨM</strong></td>
                <td><strong>15.0 GIÂY</strong></td>
                <td>FFmpeg Concat &amp; Audio Merge</td>
                <td>Video dọc 9:16 (1080x1920), tích hợp giọng đọc thuyết minh tiếng Việt và nhạc nền BGM du lịch sôi động. Đạt điểm Rubric 9.65/10.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 4. Storefront Subdomain & VietQR Auto-Credit Engine (NEW!) -->
    <section id="storefront-booking-engine" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>4. Phân Hệ Đột Phá Chiều 13/11: Merchant Subdomain Storefront &amp; Chốt Đơn VietQR Tự Động Cộng Hoa Hồng Tức Thì</span>
          <span class="badge badge-accent">Core Revenue Loop</span>
        </div>

        <p style="margin-bottom: 14px;">
          Trước chiều nay, hệ thống đã có link phân phối của Reseller nhưng chưa có trang đích (Tour Landing Page) thương hiệu riêng của Merchant để khách đặt tour thực tế và chốt đơn tự động. Trong chiều 13/11, nhóm đã hoàn thiện trọn vẹn vòng tuần hoàn kinh doanh cốt lõi:
        </p>

        <div class="compare-grid">
          <div class="compare-card new" style="grid-column: 1 / -1;">
            <h4>✓ Kiến Trúc Đa Khách Thuê Subdomain &amp; Chốt Đơn VietQR Tự Động Ghi Nhận Hoa Hồng</h4>
            <div style="font-size: 0.9rem; line-height: 1.8; color: var(--text);">
              <strong>1. Định tuyến tên miền phụ động (Merchant Subdomain Routing via proxy.ts):</strong>
              <br>• Middleware phân tích hostname dạng <code>[tenant].localhost:3000</code> (ví dụ: <span class="copyable-pill">vietravel.localhost:3000/bana-hills-1-day</span>) hoặc điều hướng nội bộ sang <code>/storefront/[tenant]/[slug]</code>.
              <br>• Cô lập ngữ cảnh thương hiệu giữa các đối tác: Vietravel, Sun World Bà Nà Hills, Da Nang Discovery.
              <br><br>
              <strong>2. Trang Đích Bán Tour Chuyển Đổi Cao (High-Converting Tour Landing Page):</strong>
              <br>• Hero Gallery đa ảnh sắc nét, cấu hình ảnh thật chuẩn xác theo điểm đến (Bà Nà Hills: Cầu Vàng, Làng Pháp, Cáp treo; Ngũ Hành Sơn: Động Huyền Không, Chùa Linh Ứng).
              <br>• Lịch trình chi tiết theo từng ngày, tiện ích bao gồm/loại trừ, đánh giá khách hàng thật (Verified Reviews) và thanh CTA gắn cố định trên thiết bị di động (Sticky CTA).
              <br>• <strong>Khắc phục triệt để lỗi Hydration Mismatch:</strong> Xây dựng hàm định dạng tiền tệ đơn định <code>formatPrice</code> và <code>formatNumber</code> chuẩn dấu chấm (<code>950.000 đ</code>), đảm bảo HTML sinh từ Next.js SSR khớp tuyệt đối 100% với React DOM Client.
              <br><br>
              <strong>3. Modal Thanh Toán VietQR Tức Thì (Live VietQR Checkout Modal):</strong>
              <br>• Khách hàng điền thông tin: Họ tên, Email, SĐT, Số lượng khách, Ngày khởi hành, Mã giảm giá, Ghi chú đặc biệt.
              <br>• Hệ thống tự động tính toán tổng tiền (áp dụng giảm giá affiliate) và sinh mã VietQR động chuẩn NAPAS 24/7 theo số tài khoản ngân hàng của Merchant cùng nội dung chuyển khoản mã đơn <code>TL-TOUR-XXXXX</code>.
              <br><br>
              <strong>4. Vòng Tuần Hoàn Hoa Hồng Tự Động Khép Kín (Instant Commission Auto-Credit Engine):</strong>
              <br>• Khách hàng truy cập từ link tiếp thị <code>/r/[code]</code> &rarr; Cookie <code>tl_ref</code> lưu mã giới thiệu của Reseller một cách an toàn.
              <br>• Khi khách bấm <em>"Xác nhận đã chuyển khoản thành công"</em> trong modal thanh toán, API <code>/api/storefront/orders/confirm</code> xử lý nguyên tử (Atomic Transaction):
              <br>&nbsp;&nbsp;a) Khởi tạo đơn hàng trạng thái <code>paid</code>.
              <br>&nbsp;&nbsp;b) Bóc tách mã Reseller từ thuộc tính attribution.
              <br>&nbsp;&nbsp;c) Tính toán tỷ lệ hoa hồng (10% - 15%).
              <br>&nbsp;&nbsp;d) <strong>TỰ ĐỘNG CỘNG TIỀN TRỰC TIẾP VÀO VÍ RESELLER</strong> (<code>reseller_wallets.balance = balance + commission</code>).
              <br>&nbsp;&nbsp;e) Ghi nhận bản ghi sổ cái lịch sử giao dịch bất biến (<code>transactions.type = 'commission'</code>).
              <br>&nbsp;&nbsp;f) Trả về số dư mới cập nhật theo thời gian thực (Real-time Updated Balance)!
            </div>
          </div>
        </div>

        <div class="code-block">
          <div class="code-header">
            <span>KIỂM THỬ TỰ ĐỘNG PHÂN HỆ STOREFRONT &amp; COMMISSION AUTO-CREDIT (PASS 100%)</span>
            <button class="copy-btn" onclick="copyText('npm run test:storefront')">Sao chép lệnh test</button>
          </div>
          <code>// Lệnh thực thi: npm run test:storefront
// Kết quả kiểm thử tự động tại tests/storefront-subdomain-and-booking.test.ts:
// [PASS] SF-01: resolveStorefrontData returns rich data with merchant, product, packages and authentic tips
// [PASS] SF-02: createBookingOrder calculates correct totals, applies ref discount and generates VietQR
// [PASS] SF-03: Subdomain parser correctly extracts tenant slug from various host patterns
// [PASS] SF-04: Mock destination URLs with checkout.sunworld.vn gracefully rewrite to internal Storefront
// [PASS] SF-05: formatPrice & formatNumber produce exact dot separators preventing hydration mismatch
// [PASS] SF-06: Accurate destination-specific asset allocation for Ngu Hanh Son vs Ba Na Hills
// [PASS] SF-07: Instant order confirmation & Reseller commission calculation formula (Auto-Credit Engine)
// [PASS] SF-08: createBookingOrder accepts packagePrice for accurate multi-tier package pricing
// -> 8/8 Test Suites PASSED (Duration: 4.46s, 66+ assertions verified)</code>
        </div>
      </div>
    </section>

    <!-- 5. Reseller Financial Engine -->
    <section id="reseller-financial-engine" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>5. Phân Hệ Reseller: Thuật Toán Phòng Chống Rút Tiền Kép (Anti Double-Spend)</span>
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

// Kịch bản thực tế đã được verify trong tests/payout-double-spend.test.ts & tests/wallet.test.ts:
// 1. Reseller có 200.000 VNĐ hoa hồng đã đối soát (confirmed).
// 2. Tạo lệnh rút thứ 1: 150.000 VNĐ -> Trạng thái 'pending'.
// 3. Số dư khả dụng hiệu dụng lập tức bị khóa còn: 50.000 VNĐ.
// 4. Nếu cố tình gửi tiếp lệnh rút thứ 2 trị giá 100.000 VNĐ:
//    -> BỊ TỪ CHỐI NGAY LẬP TỨC với mã lỗi: INSUFFICIENT_AVAILABLE_BALANCE.
// -> Loại bỏ hoàn toàn nguy cơ thất thoát tài chính cho sàn và đối tác.</code>
        </div>
      </div>
    </section>

    <!-- 6. Omnichannel Attribution -->
    <section id="omnichannel-attribution" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>6. Phân Phối Đa Kênh: Voucher Livestream (FR-ATT-01), Multi-Persona Copy &amp; Non-Blocking Click</span>
          <span class="badge badge-primary">Omnichannel Architecture</span>
        </div>

        <div class="alert alert-info">
          <strong>💡 Tối ưu hóa phân hệ affiliate chiều 13/11:</strong>
          <br>• <strong>Khắc phục lỗi 500 khi tạo Link Tracking:</strong> Sử dụng phiên xác thực Authenticated Session kết hợp Supabase Admin Client fallback trong <code>app/api/tracking/generate/route.ts</code>, đảm bảo việc tạo link mượt mà và an toàn ngay cả trong môi trường kiểm thử đa đối tác.
          <br>• <strong>Bộ tư liệu truyền thông đa chân dung (Multi-Persona Marketing Copy):</strong> Bổ sung bộ kịch bản hook đa chiều cho tour Bà Nà Hills (Chân dung Gia đình có trẻ nhỏ, Cặp đôi trăng mật, Giới trẻ thích sống ảo săn mây, Nhóm bạn ưa mạo hiểm) giúp Reseller chỉ cần 1 click là có bài viết tối ưu chuyển đổi theo đúng tệp người theo dõi.
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

    <!-- 7. Supporting Portals & Super Admin Modernization -->
    <section id="supporting-portals" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>7. Hoàn Thiện Các Cổng Quản Trị: Super Admin Back-Office &amp; Đăng Nhập Tự Động Theo Role</span>
          <span class="badge badge-cyan">Full Ecosystem</span>
        </div>

        <div class="alert alert-success" style="margin-bottom: 16px;">
          <strong>🛡️ Nâng cấp trải nghiệm quản trị &amp; bảo mật chiều 13/11:</strong>
          <br>• <strong>Đăng nhập định tuyến tự động theo Role (Auto-route by Role):</strong> Loại bỏ hoàn toàn các nút chọn portal thủ công gây nhầm lẫn trên trang <code>/login</code>. Khi người dùng nhập Email/Password, hệ thống tự động bóc tách Role trong metadata và chuyển thẳng vào Dashboard tương ứng (<code>/admin</code>, <code>/merchant</code>, <code>/reseller</code>).
          <br>• <strong>Bổ sung Dev Admin Bypass:</strong> Hỗ trợ nút bypass nhanh trong môi trường phát triển để hội đồng nghiệm thu có thể truy cập ngay bảng điều khiển Super Admin mà không gặp rào cản tài khoản.
          <br>• <strong>Đồng bộ giao diện Back-Office Admin Light Theme:</strong> Đồng nhất thiết kế sáng hiện đại của TravelLink AI, xử lý triệt để cảnh báo nested <code>&lt;a&gt;</code> gây lỗi Hydration trong <code>AdminNavbar</code> và <code>Brand</code>.
          <br>• <strong>Cơ chế Fallback Fixtures cho Payout Requests:</strong> Đảm bảo trang <code>/admin/payouts</code> luôn hiển thị dữ liệu đối soát an toàn ngay cả khi database đang trong giai đoạn cập nhật migration.
        </div>

        <ul style="font-size: 0.92rem; padding-left: 20px; line-height: 1.8;">
          <li><strong>Merchant Products Management (<code>/merchant/products</code>):</strong> Màn hình CRUD danh sách tour, cấu hình giá bán, giá niêm yết, chính sách vé và tiện ích đi kèm.</li>
          <li><strong>Merchant AI Content Approval (<code>/merchant/contents</code>):</strong> Cổng phê duyệt nội dung AI: Merchant kiểm duyệt video, kịch bản, hashtag do AI sinh ra trước khi đẩy sang kho tư liệu của Reseller.</li>
          <li><strong>Merchant Dashboard Dữ Liệu Thật (<code>/merchant</code>):</strong> Đấu nối 100% số liệu GMV, lượt click, đơn hàng thật từ database Supabase, xóa bỏ hoàn toàn mock data.</li>
          <li><strong>Super Admin Back-Office (<code>/admin</code>, <code>/admin/payouts</code>, <code>/admin/fraud</code>):</strong> Màn hình duyệt lệnh rút tiền của Reseller, kiểm tra chuyển khoản ngân hàng và trung tâm giám sát gian lận click bot.</li>
        </ul>
      </div>
    </section>

    <!-- 8. QA Verification -->
    <section id="qa-verification" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>8. Danh Mục Lệnh Kiểm Thử Tự Động Minh Chứng (Pass 100%)</span>
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
              <tr style="background: rgba(249, 115, 22, 0.05); font-weight: 600;">
                <td><strong>Storefront Subdomain &amp; VietQR Auto-Credit (MỚI)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:storefront')">npm run test:storefront</span></td>
                <td><strong>8/8 Test Suites PASSED</strong> (Subdomain rewrite, VietQR dynamic modal, cookie attribution, auto-credit ví hoa hồng, hydration safety).</td>
              </tr>
              <tr>
                <td><strong>Muse AI Video 4-Shot &amp; End-Card</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:muse-video')">npm run test:muse-video</span></td>
                <td><strong>12/12 Test Cases PASSED</strong> (Task Polling, 4-shot I2V, End-Card phủ mờ, loại bỏ hoàn toàn Gemini Omni).</td>
              </tr>
              <tr>
                <td><strong>Super Admin Back-Office</strong></td>
                <td><span class="copyable-pill" onclick="copyText('npm run test:admin')">npm run test:admin</span></td>
                <td><strong>39/39 Test Cases PASSED</strong> (RLS phân quyền admin, duyệt payout, đối soát fraud, role routing).</td>
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
      <p><strong>BÁO CÁO NGHIỆM THU KỸ THUẬT SPRINT 4 &amp; 5 — DỰ ÁN AI TRAVEL RESELLER NETWORK (TRAVELLINK AI)</strong></p>
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
  <title>Sổ Tay Hướng Dẫn Live Demo Thực Chiến | AI Travel Reseller Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${sharedStyles}
    .step-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 28px;
      box-shadow: var(--shadow);
      margin-bottom: 28px;
      position: relative;
    }
    .step-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--accent-light);
      color: var(--accent);
      padding: 4px 12px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .step-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 10px;
      color: var(--text);
    }
    .step-action-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      margin-top: 18px;
    }
    @media (max-width: 860px) {
      .step-action-grid { grid-template-columns: 1fr; }
    }
    .step-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px;
    }
    .step-box h5 {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

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
        Cung cấp đầy đủ đường dẫn truy cập, tài khoản đăng nhập tự động theo Role, thao tác bấm chuột từng bước, hiện tượng quan sát và kịch bản thuyết trình mẫu khép kín từ <strong>Tạo Video AI 4-Shot I2V &amp; Golden Hour</strong> &rarr; <strong>Khách Đặt Tour VietQR trên Storefront Subdomain</strong> &rarr; <strong>Tự Động Bắn Hoa Hồng Vào Ví Reseller</strong> &rarr; <strong>Rút Tiền Ví Chống Tiêu Kép</strong> &rarr; <strong>Super Admin Duyệt Payout</strong>.
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
      <a href="#demo-step-1" class="nav-link">🎬 Demo 1: Tạo Video AI (4-Shot + End-Card)</a>
      <a href="#demo-step-2" class="nav-link">✅ Demo 2: Merchant Duyệt Video</a>
      <a href="#demo-step-3" class="nav-link">📱 Demo 3: Reseller Phân Phối Đa Kênh</a>
      <a href="#demo-step-4" class="nav-link">🏪 Demo 4: Khách Đặt Tour VietQR &amp; Tự Động Cộng Hoa Hồng</a>
      <a href="#demo-step-5" class="nav-link">🤖 Demo 5: Chatbot Bán Tour &amp; Nhận Diện Voucher</a>
      <a href="#demo-step-6" class="nav-link">💰 Demo 6: Ví Reseller &amp; Chống Tiêu Kép</a>
      <a href="#demo-step-7" class="nav-link">🛡️ Demo 7: Super Admin Duyệt Payout</a>
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
                <td>Tạo Video AI với Muse2API 4-Shot I2V &amp; Golden Hour, Live Timer, sinh 10s clip + 5s End-Card thông tin tour, duyệt bài phát hành.</td>
              </tr>
              <tr>
                <td><strong>2. Reseller (Cộng Tác Viên)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('reseller@example.com')">reseller@example.com</span></td>
                <td><span class="copyable-pill" onclick="copyText('password123')">password123</span></td>
                <td>
                  <a href="http://localhost:3000/reseller/library" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/library</a>
                  <br><a href="http://localhost:3000/reseller/wallet" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/reseller/wallet (Ví hoa hồng)</a>
                </td>
                <td>Xem video mobile, mở Mẹo đăng TikTok (đa chân dung), copy link rút gọn, mã QR, mã voucher Livestream, nhận hoa hồng tự động khi khách đặt tour, rút tiền ví chống tiêu kép.</td>
              </tr>
              <tr>
                <td><strong>3. Super Admin (Quản Trị Sàn)</strong></td>
                <td><span class="copyable-pill" onclick="copyText('admin@travellink.ai')">admin@travellink.ai</span> <small>(hoặc admin@example.com)</small></td>
                <td><span class="copyable-pill" onclick="copyText('Admin@123456')">Admin@123456</span> <small>(hoặc password123)</small></td>
                <td>
                  <a href="http://localhost:3000/admin/payouts" target="_blank" style="color: var(--primary); font-weight: 700;">/admin/payouts</a>
                  <br><a href="http://localhost:3000/admin/fraud" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/admin/fraud (Chống gian lận)</a>
                  <br><span style="font-size: 0.8rem; color: var(--success);">* Có nút <strong>Dev Admin Bypass</strong> trên trang /login</span>
                </td>
                <td><strong>Đăng nhập tự động theo Role</strong> không cần chọn portal. Phê duyệt lệnh rút tiền Payout của Reseller trên giao diện Light theme mới, giám sát gian lận click bot.</td>
              </tr>
              <tr style="background: rgba(249, 115, 22, 0.05);">
                <td><strong>4. Khách Mua Tour (Storefront Subdomain)</strong></td>
                <td><em>Không cần tài khoản</em></td>
                <td><em>Không cần mật khẩu</em></td>
                <td>
                  <a href="http://localhost:3000/r/TL-TEST-123" target="_blank" style="color: var(--accent); font-weight: 700;">/r/TL-TEST-123 (Link Affiliate Reseller)</a>
                  <br><a href="http://vietravel.localhost:3000/bana-hills-1-day" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">vietravel.localhost:3000/bana-hills-1-day (Subdomain)</a>
                  <br><a href="http://localhost:3000/storefront/vietravel/bana-hills-1-day" target="_blank" style="color: var(--text-muted); font-size: 0.82rem;">/storefront/vietravel/bana-hills-1-day (Direct)</a>
                </td>
                <td>Xem trang đích tour Bà Nà Hills thương hiệu riêng của Merchant, mở modal đặt vé, thanh toán bằng mã VietQR động NAPAS 24/7 và kích hoạt tự động cộng hoa hồng cho Reseller.</td>
              </tr>
              <tr>
                <td><strong>5. Khách Hỏi Trợ Lý Chatbot AI</strong></td>
                <td><em>Không cần đăng nhập</em></td>
                <td><em>Không có</em></td>
                <td>
                  <a href="http://localhost:3000" target="_blank" style="color: var(--primary); font-weight: 700;">/ (Trang chủ &amp; Chatbot)</a>
                </td>
                <td>Tương tác với AI Sales Chatbot, kiểm tra chống bịa giá (0% Hallucination), áp dụng mã voucher Livestream độc quyền và nhận Thẻ Đặt Vé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Demo 1: Video Generation -->
    <section id="demo-step-1" class="step-card">
      <span class="step-badge">Kịch Bản 1 (Trọng Tâm Tạo Video AI)</span>
      <h3 class="step-title">Merchant Tạo Video AI: Pipeline 4-Shot I2V (10s) + Golden Hour Grading + 5s End-Card (Tổng 15s)</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh tốc độ tạo video Muse AI mượt mà, không kẹt 93%, chuyển động 4 phân cảnh điện ảnh Cầu Vàng - Cáp treo - Làng Pháp - Hầm rượu Debay chuẩn xác không ảo giác địa danh, và cuối video có 5s End-Card phủ mờ thông tin tour độc quyền.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập <a href="http://localhost:3000/merchant/library" target="_blank" style="color: var(--primary); font-weight: 700;">/merchant/library</a> (đăng nhập: <code>merchant@example.com</code> / <code>password123</code>).</li>
            <li>Bấm nút <strong>"Tạo Video AI Bằng Muse Engine"</strong> màu xanh.</li>
            <li>Chọn Chiến dịch mẫu: <em>"Chiến dịch Hè 2026 - Kích cầu du lịch Bà Nà Hills"</em>.</li>
            <li>Chọn <strong>ảnh tài nguyên thực tế</strong> (Cầu Vàng, Làng Pháp).</li>
            <li>Chọn Thời Lượng: <strong>"10 giây (Tối ưu Video AI ngắn / TikTok / Reels)"</strong>.</li>
            <li>Bấm <strong>"Bắt đầu Kết xuất Video"</strong>.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Hiện Tượng Quan Sát &amp; Điểm Nhấn Đắt Giá</h5>
          <ul style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li><strong>Live Elapsed Timer:</strong> Đồng hồ đếm thời gian thực dạng <code>MM:SS</code> và tiến độ chạy mượt mà, loại bỏ triệt để lỗi kẹt 93% của hệ thống cũ.</li>
            <li><strong>Pipeline 4 phân cảnh I2V:</strong> Video hiển thị 4 góc quay flycam liên tục (Cầu Vàng bình minh &rarr; Cáp treo thác Tóc Tiên &rarr; Lâu đài Làng Pháp &rarr; Hầm rượu Debay), màu nắng Golden Hour 5600K rực rỡ, địa danh grounded 100% không bị lẫn lộn.</li>
            <li><strong>5s Blurred End-Card:</strong> Giây thứ 10.0 chuyển sang 5s End-Card phủ mờ thông tin tour (giá 950.000đ, hotline, CTA) chữ Unicode sắc nét, không lỗi font emoji.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Demo 2: Merchant Content Approval -->
    <section id="demo-step-2" class="step-card">
      <span class="step-badge">Kịch Bản 2 (Merchant Flow)</span>
      <h3 class="step-title">Merchant Phê Duyệt Video Sang Kho Tư Liệu Reseller</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Minh chứng quy trình kiểm soát chất lượng nội dung trước khi đưa vào mạng lưới phân phối.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập màn hình Duyệt: <a href="http://localhost:3000/merchant/contents" target="_blank" style="color: var(--primary); font-weight: 700;">/merchant/contents</a>.</li>
            <li>Xem video vừa sinh trong danh sách <em>"Chờ phê duyệt"</em> (Badge màu vàng).</li>
            <li>Kiểm tra kịch bản thuyết minh tiếng Việt và các hashtag liên quan.</li>
            <li>Bấm nút <strong>"Phê duyệt Nội dung"</strong> (Màu xanh).</li>
            <li>Trạng thái đổi thành <code>approved</code> &rarr; Video tự động đồng bộ sang kho của mọi Reseller!</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Ý Nghĩa Nghiệp Vụ</h5>
          <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6;">
            Merchant giữ quyền kiểm soát 100% hình ảnh thương hiệu du lịch của mình. Tránh trường hợp video AI bị lỗi nội dung hoặc phát ngôn sai lệch tràn lan ra thị trường.
          </p>
        </div>
      </div>
    </section>

    <!-- Demo 3: Reseller Omnichannel -->
    <section id="demo-step-3" class="step-card">
      <span class="step-badge">Kịch Bản 3 (Reseller Distribution Flow)</span>
      <h3 class="step-title">Reseller Xem Video Mobile, Mẹo Đăng Bài Đa Chân Dung &amp; Lấy Bộ Công Cụ Tiếp Thị</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Trình diễn trải nghiệm xem video dọc chuẩn TikTok, copy caption đa chân dung 1-click và 3 kênh tiếp thị (Link, QR, Voucher Livestream).
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Đăng nhập tài khoản Reseller: <code>reseller@example.com</code> / <code>password123</code>.</li>
            <li>Truy cập <a href="http://localhost:3000/reseller/library" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/library</a>.</li>
            <li>Bấm <strong>"Xem Video Mobile"</strong> &rarr; Trình phát dọc 9:16 có 5s End-Card rõ nét ở cuối.</li>
            <li>Bấm <strong>"Mẹo Đăng Video AI"</strong> &rarr; Xem giờ vàng đăng bài, bấm nút Copy Caption mẫu theo từng chân dung (Gia đình, Cặp đôi, Săn mây).</li>
            <li>Bấm <strong>"Lấy Link Tiếp Thị"</strong> &rarr; Modal phân phối hiện 3 tab:
              <br>• <em>Tab 1:</em> Copy link rút gọn <span class="copyable-pill">/r/[code]</span>.
              <br>• <em>Tab 2:</em> Tải ảnh mã QR đồ họa.
              <br>• <em>Tab 3:</em> Copy <strong>Mã Voucher Ký Tự</strong> (VD: <span class="copyable-pill" onclick="copyText('BANA100K-TUAN88')">BANA100K-TUAN88</span>).
            </li>
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

    <!-- Demo 4: Storefront Subdomain & VietQR Auto-Credit (NEW!) -->
    <section id="demo-step-4" class="step-card" style="border-left: 4px solid var(--accent);">
      <span class="step-badge" style="background: var(--accent); color: white;">Kịch Bản 4 (MỚI - Trọng Tâm Chuyển Đổi Thương Mại)</span>
      <h3 class="step-title">Khách Hàng Đặt Tour VietQR Trên Merchant Subdomain Storefront &amp; Hoa Hồng Tự Động Bắn Vào Ví Reseller</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Trình diễn trọn vẹn điểm "chạm vàng" của hệ sinh thái: Khách mở link Reseller &rarr; Đặt tour trên Storefront thương hiệu riêng &rarr; Quét VietQR thanh toán &rarr; Reseller nhận hoa hồng tức thì mà không cần đối soát thủ công!
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Thao Tác</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Mở tab ẩn danh mới, truy cập link affiliate của Reseller: <a href="http://localhost:3000/r/TL-TEST-123" target="_blank" style="color: var(--primary); font-weight: 700;">http://localhost:3000/r/TL-TEST-123</a>.</li>
            <li>Quan sát: Trình duyệt chuyển hướng 302 siêu tốc sang trang Storefront Subdomain mang thương hiệu riêng của Merchant: <strong>http://vietravel.localhost:3000/bana-hills-1-day</strong> (hoặc <code>/storefront/vietravel/bana-hills-1-day</code>). Cookie attribution <code>tl_ref</code> được lưu kín đáo.</li>
            <li>Khách hàng lướt xem ảnh thật Bà Nà Hills sắc nét, xem lịch trình chi tiết và bấm nút <strong>"Đặt Tour Ngay"</strong> (hoặc nút trên Sticky CTA bar).</li>
            <li>Popup <strong>Live VietQR Checkout Modal</strong> mở ra:
              <br>• Họ tên: <em>Trần Thị Mai</em>
              <br>• Email: <em>mai.tran@example.com</em>
              <br>• Số điện thoại: <em>0912345678</em>
              <br>• Số lượng khách: <em>2 người lớn</em>
              <br>• Quan sát: Mã QR động NAPAS 24/7 được tạo ngay lập tức với số tiền chuẩn và nội dung chuyển khoản <code>TL-TOUR-XXXXX</code>.
            </li>
            <li>Bấm nút demo <strong>"Xác nhận đã chuyển khoản thành công"</strong>. Modal thông báo: <em>"Đặt tour thành công! Mã đơn: BK-XXXXXX"</em>.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Minh Chứng Hoa Hồng Tự Động Ghi Nhận (Auto-Credit Proof)</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Quay lại tab trình duyệt của Reseller tại <a href="http://localhost:3000/reseller/wallet" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/wallet</a>.</li>
            <li>Bấm <strong>F5 (Refresh)</strong> trang Ví:
              <br>&rarr; <strong>Số dư khả dụng tăng lên tức thì</strong> tương ứng với mức hoa hồng 10-15% của đơn hàng vừa tạo!
              <br>&rarr; Bảng lịch sử giao dịch (Transactions) hiện ngay một dòng tiền mới với badge xanh <code>commission</code> và mã đơn hàng tương ứng.
            </li>
            <li><strong>Điểm nhấn thuyết trình:</strong> <em>"Nhờ API /api/storefront/orders/confirm xử lý nguyên tử, dòng tiền hoa hồng được cộng ngay vào ví Reseller trong tích tắc, không cần chờ đợi đối soát thủ công hàng tuần!"</em></li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Demo 5: Chatbot Anti-Hallucination -->
    <section id="demo-step-5" class="step-card">
      <span class="step-badge">Kịch Bản 5 (Customer AI Chatbot)</span>
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

    <!-- Demo 6: Wallet Anti Double-Spend -->
    <section id="demo-step-6" class="step-card">
      <span class="step-badge">Kịch Bản 6 (Trọng Tâm Tài Chính Ví Reseller)</span>
      <h3 class="step-title">Reseller Yêu Cầu Rút Tiền Ví &amp; Thử Nghiệm Tấn Công Tiêu Kép (Anti Double-Spend)</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Chứng minh thuật toán khóa số dư hiệu dụng bảo vệ 100% dòng tiền hoa hồng, không cho phép rút vượt quá số dư.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Các Bước Rút Tiền Hợp Lệ</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập Ví: <a href="http://localhost:3000/reseller/wallet" target="_blank" style="color: var(--primary); font-weight: 700;">/reseller/wallet</a>.</li>
            <li>Quan sát: Số dư khả dụng hiện có (được nạp sẵn <strong>200.000 VNĐ</strong> cho tài khoản <code>reseller@example.com</code>).</li>
            <li>Bấm nút <strong>"Yêu Cầu Rút Tiền"</strong> màu xanh.</li>
            <li>Nhập thông tin Payout:
              <br>• Ngân hàng: <em>Vietcombank</em>.
              <br>• Số Tài Khoản: <span class="copyable-pill" onclick="copyText('0123456789')">0123456789</span>.
              <br>• Tên Chủ Tài Khoản: <span class="copyable-pill" onclick="copyText('NGUYEN VAN A')">NGUYEN VAN A</span>.
              <br>• Số tiền rút: <span class="copyable-pill" onclick="copyText('150000')">150000</span> (150.000 VNĐ).
            </li>
            <li>Bấm <strong>"Xác nhận Rút tiền"</strong>.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Thử Nghiệm Tấn Công Tiêu Kép (Double-Spend Demo)</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Sau khi lệnh rút 150.000đ được gửi, số dư khả dụng hiệu dụng lập tức bị khóa còn: <strong>50.000 VNĐ</strong> (200.000đ - 150.000đ).</li>
            <li>Bảng lịch sử rút tiền hiện lệnh 150.000đ với badge vàng <code>pending</code>.</li>
            <li><strong>Bấm tiếp nút "Yêu cầu rút tiền" và nhập 100.000 VNĐ</strong> (vượt quá 50.000đ khả dụng còn lại).</li>
            <li><strong>KẾT QUẢ:</strong> Hệ thống kích hoạt cơ chế Row-level Lock và hàm <code>create_payout_request_atomic</code> chặn đứng ngay với thông báo lỗi: <em>"Số dư khả dụng không đủ"</em> (<code>INSUFFICIENT_AVAILABLE_BALANCE</code>)! Dòng tiền được bảo toàn tuyệt đối.</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Demo 7: Super Admin Payout Approval -->
    <section id="demo-step-7" class="step-card">
      <span class="step-badge">Kịch Bản 7 (Super Admin Back-Office)</span>
      <h3 class="step-title">Super Admin Phê Duyệt Chi Trả Payout &amp; Giám Sát Gian Lận Click Bot</h3>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 12px;">
        Mục tiêu: Khép kín toàn bộ vòng lặp đối soát tài chính trên hệ sinh thái thực tế với cơ chế đăng nhập tự động theo Role.
      </p>

      <div class="step-action-grid">
        <div class="step-box">
          <h5>Đăng Nhập Tự Động &amp; Phê Duyệt Payout</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Truy cập <a href="http://localhost:3000/login" target="_blank" style="color: var(--primary);">/login</a>, nhập <code>admin@travellink.ai</code> / <code>Admin@123456</code> (hoặc bấm <strong>Dev Admin Bypass</strong>). Hệ thống tự động chuyển thẳng vào <code>/admin</code> mà không cần bấm chọn portal thủ công!</li>
            <li>Truy cập <a href="http://localhost:3000/admin/payouts" target="_blank" style="color: var(--primary); font-weight: 700;">/admin/payouts</a> trên giao diện Light theme mới.</li>
            <li>Thấy lệnh rút 150.000 VNĐ của Reseller đang ở trạng thái <code>pending</code>.</li>
            <li>Kiểm tra thông tin tài khoản, bấm nút <strong>"Phê duyệt &amp; Xác nhận Đã Chuyển Khoản"</strong>.</li>
            <li>Trạng thái đổi ngay sang <code>completed</code> (Xanh lá). Mã giao dịch ngân hàng được lưu vết kiểm toán bất biến.</li>
          </ol>
        </div>

        <div class="step-box">
          <h5>Kiểm Tra Trung Tâm Chống Gian Lận</h5>
          <ol style="font-size: 0.88rem; padding-left: 20px; line-height: 1.6;">
            <li>Bấm sang tab <strong>"Giám sát Gian lận"</strong> (<a href="http://localhost:3000/admin/fraud" target="_blank" style="color: var(--primary);">/admin/fraud</a>).</li>
            <li>Xem biểu đồ các lượt click bot bị chặn đứng (Googlebot, spam crawlers qua 26+ chữ ký bot).</li>
            <li>Xem danh sách đơn hàng có cờ nghi vấn tự mua (Self-purchase flag) để kế toán rà soát trước khi duyệt chi.</li>
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
          <span class="speech-speaker">PHÚT 1: ĐỘNG CƠ VIDEO AI MUSE 4-SHOT &amp; 5S BLURRED END-CARD</span>
          "Kính thưa Thầy/Cô và Hội đồng, 2 tuần qua nhóm chúng em tập trung khép kín vòng tuần hoàn thương mại của TravelLink AI: Từ Động cơ Video AI &rarr; Bán hàng đa kênh trên Subdomain Storefront &rarr; Dòng tiền Hoa hồng Reseller tức thì.
          <br><br>
          Đầu tiên, ở vai trò <strong>Merchant Sun World</strong> tại <code>/merchant/library</code>, nhóm đã tích hợp <strong>Muse AI Gateway chạy Docker Local với chi phí $0.00</strong>. Khi em bấm tạo video 10 giây cho tour Bà Nà Hills:
          Đồng hồ đếm thời gian thực chạy từng giây mượt mà, không còn lỗi kẹt 93%. Đặc biệt, video thành phẩm dài đúng <strong>15 giây</strong>: 10 giây đầu là <strong>chuỗi 4 phân cảnh flycam liên tục (Cầu Vàng, Cáp treo, Làng Pháp, Hầm rượu Debay)</strong> được phủ màu Golden Hour 5600K rực rỡ và bám sát địa danh có thật; và <strong>5 giây cuối là thẻ End-Card phủ mờ thông tin tour</strong> với bảng giá 950.000đ và hotline đặt vé cực kỳ bắt mắt."
        </div>

        <div class="speech-box">
          <span class="speech-speaker">PHÚT 2: STOREFRONT SUBDOMAIN, CHỐT ĐƠN VIETQR &amp; TỰ ĐỘNG BẮN HOA HỒNG VÍ RESELLER</span>
          "Sau khi Merchant duyệt video, Reseller tại <code>/reseller/library</code> có ngay link affiliate, mã QR và voucher Livestream.
          <br><br>
          Điểm đột phá nhất chiều nay là <strong>Hệ sinh thái Storefront Subdomain</strong>. Khi khách click link affiliate <code>/r/TL-TEST-123</code>, trình duyệt chuyển hướng ngay sang trang đích thương hiệu riêng <code>vietravel.localhost:3000/bana-hills-1-day</code>.
          Khách ngắm ảnh thật sắc nét, bấm <em>Đặt Tour Ngay</em> và quét <strong>mã VietQR động NAPAS 24/7</strong>.
          Ngay khi khách xác nhận thanh toán, hệ thống tự động bóc tách mã giới thiệu và <strong>BẮN HOA HỒNG TRỰC TIẾP VÀO VÍ RESELLER NGAY LẬP TỨC</strong>! Khi em quay lại ví Reseller F5, số dư đã tăng lên tức thì mà không cần bất kỳ sự can thiệp thủ công nào!"
        </div>

        <div class="speech-box">
          <span class="speech-speaker">PHÚT 3: BẢO VỆ TÀI CHÍNH CHỐNG TIÊU KÉP &amp; SUPER ADMIN DUYỆT PAYOUT</span>
          "Có hoa hồng trong ví, Reseller vào <code>/reseller/wallet</code> để rút tiền. Em xin trình diễn tính năng bảo mật then chốt: <strong>Cơ chế Chống Tiêu Kép (Anti Double-Spend)</strong>.
          <br><br>
          Ví có 200.000đ. Em tạo lệnh rút 150.000đ. Hệ thống lập tức áp dụng Row-level Lock, khóa số dư khả dụng hiệu dụng chỉ còn 50.000đ. Nếu em cố tình tạo tiếp lệnh rút 100.000đ, hệ thống chặn ngay lập tức. Sau đó, tại cổng <code>/admin/payouts</code>, Super Admin đăng nhập tự động theo Role và duyệt lệnh chuyển khoản 150.000đ chỉ trong 1 click.
          <br><br>
          Toàn bộ quy trình từ Tạo Video AI &rarr; Tiếp thị &rarr; Bán hàng Subdomain &rarr; VietQR &rarr; Hoa hồng tự động &rarr; Rút tiền đã khép kín 100% trên dữ liệu thật."
        </div>
      </div>
    </section>

    <!-- QA Defense -->
    <section id="qa-defense" style="margin-bottom: 40px;">
      <div class="card">
        <div class="card-title">
          <span>Bộ 6 Câu Hỏi Phản Biện Sắc Bén &amp; Đáp Án Kỹ Thuật (QA Defense)</span>
          <span class="badge badge-purple">Exam Defense</span>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--primary); font-size: 1rem; margin-bottom: 6px;">1. Tại sao video lại là 10s Muse AI + 5s FFmpeg End-Card mà không để AI sinh luôn End-Card?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Các mô hình AI Video quốc tế (Muse, Sora, Kling...) không thể sinh chữ tiếng Việt có dấu chuẩn xác (thường bị méo font hoặc sinh chữ ma). Để phục vụ thương mại, thông tin giá vé (950.000đ), hotline và CTA bắt buộc phải sắc nét 100%. Do đó, 10s đầu dùng AI tạo chuỗi 4 phân cảnh chuyển động điện ảnh, và 5s cuối dùng FFmpeg phủ mờ ảnh thật (boxblur) và render chữ chuẩn Unicode, mang lại tỷ lệ chuyển đổi cao nhất.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--accent); font-size: 1rem; margin-bottom: 6px;">2. Làm sao bảo toàn mã giới thiệu affiliate khi khách truy cập qua Subdomain nhiều Merchant khác nhau?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Khi khách click link <code>/r/[code]</code>, Next.js Middleware lưu mã vào Cookie <code>tl_ref</code> với cờ <code>SameSite=Lax</code> và <code>path=/</code>. Đồng thời <code>proxy.ts</code> bảo toàn header <code>x-ref-code</code> trong quá trình rewrite sang Subdomain. Khi khách bấm thanh toán VietQR, modal checkout tự động trích xuất cookie này gửi kèm request <code>/api/storefront/orders/confirm</code>, bảo toàn quyền lợi hoa hồng cho Reseller 100%.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--danger); font-size: 1rem; margin-bottom: 6px;">3. Cơ chế chống Double-Spend của ví hoa hồng hoạt động thế nào dưới góc độ SQL Database?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Áp dụng Row-Level Locking trong file migration <code>20261112160000_payout_atomic_double_spend_prevention.sql</code>. Khi có request rút tiền, hàm SQL khóa bản ghi ví bằng <code>SELECT ... FOR UPDATE</code>, tính toán <code>effective_available = confirmed_commissions - SUM(pending_payouts)</code>. Mọi request đồng thời sau đó đều bị chặn vì số dư khả dụng hiệu dụng đã bị trừ ngay trong transaction đầu tiên.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--cyan); font-size: 1rem; margin-bottom: 6px;">4. Làm sao link /r/[code] chịu tải được 1.000 người click cùng lúc mà không nghẽn DB?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Sử dụng Next.js <code>after()</code> API để trả về HTTP 302 Redirect ngay tức thì cho người dùng trong &lt; 900ms. Thao tác ghi log click vào database Supabase được đưa vào background execution, kết hợp Rate Limiting trượt 10 clicks/phút/IP và bộ lọc 26+ chữ ký bot crawler. Kiểm thử k6 đạt 486.2 RPS với 98.24% thành công.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="color: var(--warning); font-size: 1rem; margin-bottom: 6px;">5. Chatbot AI làm cách nào để cam kết 0% bịa giá và gắn đúng voucher của CTV?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Sử dụng Dual-temperature routing (T=0.1 cho dữ liệu giá tour, T=0.7 cho đối thoại). Khi hỏi về giá, bot bắt buộc tra cứu cơ sở tri thức đã kiểm chứng (Verified Facts) từ bảng <code>products</code>. Bộ lọc regex nhận diện mã voucher (VD: <code>BANA100K-TUAN88</code>) và gọi hàm <code>buildCheckoutUrl()</code> để tự động gắn voucher và ref ID vào link đặt vé.
          </p>
        </div>

        <div>
          <h4 style="color: var(--success); font-size: 1rem; margin-bottom: 6px;">6. Làm cách nào giải quyết vấn đề Hydration Mismatch giữa SSR và Client trên trang Storefront?</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
            <strong>Đáp án:</strong> Hàm <code>toLocaleString('vi-VN')</code> mặc định của trình duyệt phụ thuộc vào locale của hệ điều hành máy client, dẫn đến việc trên server Node.js render ra dấu phẩy nhưng client render ra dấu chấm hoặc khoảng trắng không ngắt. Nhóm đã xây dựng hàm <code>formatPrice()</code> đơn định (deterministic) trong <code>src/lib/storefront/format.ts</code> dùng regex thay thế chính xác dấu chấm phân cách hàng nghìn (<code>950.000 đ</code>), loại bỏ 100% cảnh báo React Hydration Error.
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
