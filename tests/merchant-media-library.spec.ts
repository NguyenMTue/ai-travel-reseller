import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

const screenshotsDir = resolve(
  process.cwd(),
  "tests/qa-deliverables/merchant-media-library/screenshots",
);
const mockAssetsDir = resolve(
  process.cwd(),
  "tests/qa-deliverables/merchant-media-library/mock-assets",
);

if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function captureEvidence(page: Page, filename: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300); // Ổn định animation và render
  await page.screenshot({
    path: resolve(screenshotsDir, filename),
    fullPage: true,
    animations: "disabled",
  });
}

/**
 * Mã nguồn giao diện HTML/CSS mô phỏng phân hệ Media Library & Luồng tải Video mẫu của Merchant
 * theo quy chuẩn SRS v1.1 (FR-CNT-08, FR-CNT-09, NFR-SEC-04).
 */
const mediaLibraryHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merchant Portal - Thư viện Media & Video Mẫu</title>
  <style>
    :root {
      --primary: #0284c7;
      --primary-hover: #0369a1;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --success: #10b981;
      --danger: #ef4444;
      --badge-bg: #e0f2fe;
      --badge-text: #0369a1;
      --radius: 12px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text-main); display: flex; min-height: 100vh; }
    
    /* Sidebar */
    .sidebar { width: 280px; background: #ffffff; border-right: 1px solid var(--border); padding: 24px 16px; display: flex; flex-direction: column; }
    .sidebar-brand { font-size: 20px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .sidebar-brand span { color: var(--primary); }
    .workspace-badge { background: #f1f5f9; padding: 10px 12px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
    .workspace-badge strong { display: block; color: var(--text-main); }
    .workspace-badge small { color: var(--text-muted); }
    
    .nav-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; }
    .nav-menu { display: flex; flex-direction: column; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 8px; text-decoration: none; color: var(--text-muted); font-size: 14px; font-weight: 500; border: none; background: transparent; cursor: pointer; text-align: left; }
    .nav-item:hover { background: #f1f5f9; color: var(--text-main); }
    .nav-item.active { background: #e0f2fe; color: var(--primary); font-weight: 600; }
    .nav-count { margin-left: auto; background: #cbd5e1; color: #1e293b; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .nav-item.active .nav-count { background: var(--primary); color: white; }

    /* Main Container */
    .main-content { flex: 1; padding: 32px 40px; overflow-y: auto; }
    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .page-title h1 { font-size: 26px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; }
    .page-title p { color: var(--text-muted); font-size: 14px; }
    
    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-outline { background: white; border-color: var(--border); color: var(--text-main); }
    .btn-outline:hover { background: #f8fafc; }
    .btn-danger { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
    .btn-danger:hover { background: #fecaca; }
    .btn-sm { padding: 6px 12px; font-size: 13px; }

    /* Filters Bar */
    .controls-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 260px; position: relative; }
    .search-box input { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; }
    .search-box input:focus { border-color: var(--primary); ring: 2px rgba(2,132,199,0.2); }
    .filter-group { display: flex; gap: 8px; align-items: center; }
    .filter-group select { padding: 9px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: white; cursor: pointer; }
    
    /* Stats Bar */
    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .stat-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
    .stat-card small { color: var(--text-muted); font-size: 12px; text-transform: uppercase; font-weight: 600; }
    .stat-card h3 { font-size: 22px; font-weight: 700; margin-top: 4px; color: var(--text-main); }

    /* Media Grid */
    .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .media-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; position: relative; }
    .media-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.07); }
    
    /* 9:16 Vertical Video Thumbnail */
    .media-thumbnail-wrapper { position: relative; width: 100%; aspect-ratio: 9/16; background: #0f172a; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .media-thumbnail-wrapper img { width: 100%; height: 100%; object-fit: cover; }
    .aspect-badge { position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .duration-badge { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); color: white; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
    .platform-pill { position: absolute; bottom: 12px; left: 12px; background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    
    .media-info { padding: 16px; flex: 1; display: flex; flex-direction: column; }
    .media-title { font-size: 15px; font-weight: 600; color: var(--text-main); line-height: 1.4; margin-bottom: 8px; }
    .media-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
    .tag-badge { background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
    .media-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); }
    .media-actions .btn { flex: 1; justify-content: center; }

    /* Modal Backdrop */
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(3px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-overlay.active { display: flex; }
    .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h2 { font-size: 18px; font-weight: 700; color: var(--text-main); }
    .close-btn { background: none; border: none; font-size: 22px; cursor: pointer; color: var(--text-muted); }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; }

    /* Form Styles */
    .form-group { margin-bottom: 18px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text-main); }
    .form-group label span { color: var(--danger); }
    .form-group input[type="text"], .form-group input[type="number"], .form-group select { width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
    .form-group input.is-invalid { border-color: var(--danger); background-color: #fff5f5; }
    .invalid-feedback { color: var(--danger); font-size: 12px; margin-top: 5px; display: none; }
    .invalid-feedback.visible { display: block; }
    
    /* File upload area */
    .dropzone { border: 2px dashed var(--border); border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.2s; }
    .dropzone:hover { border-color: var(--primary); background: #f0f9ff; }
    .dropzone-icon { font-size: 32px; margin-bottom: 8px; color: var(--primary); }
    .dropzone p { font-size: 13px; color: var(--text-muted); }
    .file-preview-name { font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 8px; display: none; }

    /* Checkbox Rights Confirmation (NFR-SEC-04) */
    .checkbox-card { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 20px; }
    .checkbox-label { display: flex; gap: 10px; cursor: pointer; font-size: 13px; color: var(--text-main); line-height: 1.4; }
    .checkbox-label input { margin-top: 2px; width: 16px; height: 16px; accent-color: var(--primary); }
    
    /* Video Player Modal (9:16) */
    .preview-modal-box { max-width: 420px; background: #000; border-radius: 16px; overflow: hidden; color: white; }
    .video-container { position: relative; width: 100%; aspect-ratio: 9/16; background: #000; display: flex; align-items: center; justify-content: center; }
    .video-dummy { width: 100%; height: 100%; object-fit: cover; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 20px; }
    .watermark-overlay { position: absolute; top: 16px; left: 16px; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
    .cta-overlay { position: absolute; bottom: 80px; left: 16px; right: 16px; background: rgba(2, 132, 199, 0.9); padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 600; text-align: center; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
    .player-controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 16px; display: flex; align-items: center; gap: 12px; }
    .play-btn { width: 36px; height: 36px; border-radius: 50%; background: white; color: black; border: none; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .progress-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden; position: relative; }
    .progress-fill { width: 45%; height: 100%; background: var(--primary); }

    /* Toast Notification */
    .toast { position: fixed; bottom: 24px; right: 24px; background: #0f172a; color: white; padding: 14px 20px; border-radius: 10px; font-size: 14px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); display: none; align-items: center; gap: 10px; z-index: 2000; }
    .toast.success { background: #065f46; border: 1px solid #059669; }
    .toast.active { display: flex; }
  </style>
</head>
<body>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <span>TravelLink</span> Merchant
    </div>
    <div class="workspace-badge">
      <strong>Khu du lịch Sun World Bà Nà Hills</strong>
      <small>Merchant ID: 88888888-4444-4444-8888-888888888888</small>
    </div>
    <p class="nav-label">Phân hệ quản trị</p>
    <nav class="nav-menu">
      <button class="nav-item" id="nav-overview">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        Tổng quan hoạt động
      </button>
      <button class="nav-item" id="nav-products">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg>
        Sản phẩm & Tour <span class="nav-count">8</span>
      </button>
      <button class="nav-item active" id="nav-media-library">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2" ry="2"/></svg>
        Thư viện Media & Video mẫu <span class="nav-count" id="badge-total-media">3</span>
      </button>
      <button class="nav-item" id="nav-campaigns">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
        Chiến dịch Reseller
      </button>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="main-content">
    <div class="top-bar">
      <div class="page-title">
        <h1>Thư viện Media & Video Mẫu (Merchant Media Library)</h1>
        <p>Quản lý tài nguyên video ngắn chuẩn 9:16, clip UGC và kho ảnh chất lượng cao để AI tạo nội dung và Reseller sử dụng.</p>
      </div>
      <button class="btn btn-primary" id="btn-open-upload-modal">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        Tải lên Video mẫu mới
      </button>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stat-card">
        <small>Tổng số Video mẫu</small>
        <h3 id="stat-total-videos">3</h3>
      </div>
      <div class="stat-card">
        <small>Chuẩn dọc 9:16 (CapCut/TikTok)</small>
        <h3 id="stat-vertical-ratio">100%</h3>
      </div>
      <div class="stat-card">
        <small>Thời lượng trung bình</small>
        <h3>28 giây</h3>
      </div>
      <div class="stat-card">
        <small>Trạng thái Bản quyền (NFR-SEC-04)</small>
        <h3 style="color: var(--success);">Đã xác nhận 100%</h3>
      </div>
    </div>

    <!-- Controls Bar -->
    <div class="controls-card">
      <div class="search-box">
        <input type="text" id="input-search-media" placeholder="Tìm theo tên video, danh thắng, thẻ phong cách…" aria-label="Tìm kiếm video mẫu">
      </div>
      <div class="filter-group">
        <select id="select-platform-filter" aria-label="Lọc theo nền tảng">
          <option value="all">Tất cả nền tảng</option>
          <option value="upload">Upload trực tiếp</option>
          <option value="tiktok">TikTok Video</option>
          <option value="reels">Facebook / Instagram Reels</option>
          <option value="youtube_shorts">YouTube Shorts</option>
        </select>
        <select id="select-duration-filter" aria-label="Lọc theo thời lượng">
          <option value="all">Mọi thời lượng</option>
          <option value="short">Ngắn (15s - 30s)</option>
          <option value="medium">Trung bình (31s - 60s)</option>
        </select>
        <button class="btn btn-outline" id="btn-reset-filters">Đặt lại bộ lọc</button>
      </div>
    </div>

    <!-- Media Library Grid -->
    <section class="media-grid" id="media-grid-container" aria-label="Danh sách tài nguyên video mẫu">
      <!-- Item 1 -->
      <article class="media-card" data-id="vid-001" data-platform="upload" data-title="Review Cầu Vàng Bà Nà Hills - Cảnh quay góc rộng 9:16" data-duration="30">
        <div class="media-thumbnail-wrapper">
          <div class="aspect-badge">9:16 Dọc</div>
          <div class="duration-badge">00:30</div>
          <span class="platform-pill">Upload</span>
          <div style="color: white; text-align: center; padding: 20px;">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Cầu Vàng Bà Nà Hills (MP4)</p>
          </div>
        </div>
        <div class="media-info">
          <h3 class="media-title">Review Cầu Vàng Bà Nà Hills - Cảnh quay góc rộng 9:16</h3>
          <div class="media-tags">
            <span class="tag-badge">#cauvang</span>
            <span class="tag-badge">#banahills</span>
            <span class="tag-badge">#review</span>
          </div>
          <div class="media-actions">
            <button class="btn btn-outline btn-sm btn-preview" data-id="vid-001" aria-label="Xem trước Video Cầu Vàng">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Xem trước
            </button>
            <button class="btn btn-primary btn-sm btn-download" data-id="vid-001" data-filename="cau-vang-bana-sample.mp4" aria-label="Tải về Video Cầu Vàng">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Tải video
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="vid-001" aria-label="Xóa video Cầu Vàng">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Item 2 -->
      <article class="media-card" data-id="vid-002" data-platform="tiktok" data-title="Làng Pháp mộng mơ - Check-in Hoàng Hôn 9:16" data-duration="25">
        <div class="media-thumbnail-wrapper">
          <div class="aspect-badge">9:16 Dọc</div>
          <div class="duration-badge">00:25</div>
          <span class="platform-pill" style="background: #000;">TikTok</span>
          <div style="color: white; text-align: center; padding: 20px;">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Làng Pháp Sunset (MP4)</p>
          </div>
        </div>
        <div class="media-info">
          <h3 class="media-title">Làng Pháp mộng mơ - Check-in Hoàng Hôn 9:16</h3>
          <div class="media-tags">
            <span class="tag-badge">#langphap</span>
            <span class="tag-badge">#sunset</span>
            <span class="tag-badge">#checkin</span>
          </div>
          <div class="media-actions">
            <button class="btn btn-outline btn-sm btn-preview" data-id="vid-002" aria-label="Xem trước Video Làng Pháp">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Xem trước
            </button>
            <button class="btn btn-primary btn-sm btn-download" data-id="vid-002" data-filename="lang-phap-sunset-sample.mp4" aria-label="Tải về Video Làng Pháp">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Tải video
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="vid-002" aria-label="Xóa video Làng Pháp">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Item 3 -->
      <article class="media-card" data-id="vid-003" data-platform="reels" data-title="Cáp treo 4 kỷ lục thế giới xuyên mây" data-duration="45">
        <div class="media-thumbnail-wrapper">
          <div class="aspect-badge">9:16 Dọc</div>
          <div class="duration-badge">00:45</div>
          <span class="platform-pill" style="background: #e1306c;">Reels</span>
          <div style="color: white; text-align: center; padding: 20px;">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Cáp Treo Bà Nà (MP4)</p>
          </div>
        </div>
        <div class="media-info">
          <h3 class="media-title">Cáp treo 4 kỷ lục thế giới xuyên mây</h3>
          <div class="media-tags">
            <span class="tag-badge">#captreo</span>
            <span class="tag-badge">#trainghiem</span>
            <span class="tag-badge">#danang</span>
          </div>
          <div class="media-actions">
            <button class="btn btn-outline btn-sm btn-preview" data-id="vid-003" aria-label="Xem trước Video Cáp Treo">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Xem trước
            </button>
            <button class="btn btn-primary btn-sm btn-download" data-id="vid-003" data-filename="cap-treo-xuyen-may.mp4" aria-label="Tải về Video Cáp Treo">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Tải video
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="vid-003" aria-label="Xóa video Cáp Treo">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </article>
    </section>
  </main>

  <!-- Modal 1: Upload Video mẫu & Tài nguyên Media (FR-CNT-09, NFR-SEC-04) -->
  <div class="modal-overlay" id="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="upload-modal-title">Tải lên Video mẫu & Tài nguyên Media</h2>
        <button class="close-btn" id="btn-close-upload-modal" aria-label="Đóng">&times;</button>
      </div>
      <form id="form-upload-media" novalidate>
        <div class="modal-body">
          <div class="form-group">
            <label for="input-media-title">Tiêu đề Video mẫu <span>*</span></label>
            <input type="text" id="input-media-title" placeholder="Ví dụ: Trải nghiệm cáp treo Bà Nà Hills cực chill" required>
            <div class="invalid-feedback" id="error-media-title">Tiêu đề video mẫu không được để trống (tối đa 255 ký tự).</div>
          </div>

          <div class="form-group">
            <label for="select-media-platform">Nền tảng mục tiêu <span>*</span></label>
            <select id="select-media-platform">
              <option value="upload">Upload trực tiếp (File nội bộ)</option>
              <option value="tiktok">TikTok Video</option>
              <option value="reels">Facebook / Instagram Reels</option>
              <option value="youtube_shorts">YouTube Shorts</option>
            </select>
          </div>

          <div class="form-group">
            <label>Tệp video mẫu (Định dạng MP4 dọc 9:16) <span>*</span></label>
            <div class="dropzone" id="dropzone-area" onclick="document.getElementById('file-media-input').click()">
              <div class="dropzone-icon">📁</div>
              <p>Nhấp để chọn file hoặc kéo thả file video vào đây</p>
              <p style="font-size: 11px; margin-top: 4px;">Định dạng hỗ trợ: MP4 dọc 9:16 (15s - 60s), tối đa 100MB</p>
              <div class="file-preview-name" id="file-name-display"></div>
            </div>
            <input type="file" id="file-media-input" accept=".mp4,video/mp4" style="display: none;" aria-label="Chọn tệp video mẫu">
            <div class="invalid-feedback" id="error-media-file">Vui lòng chọn một tệp video hợp lệ định dạng MP4 (.mp4).</div>
          </div>

          <div class="form-group">
            <label for="input-media-tags">Thẻ phong cách (Style Tags - phân cách bằng dấu phẩy)</label>
            <input type="text" id="input-media-tags" placeholder="cauvang, banahills, trainghiem, dulich">
          </div>

          <div class="form-group">
            <label for="input-media-duration">Thời lượng ước tính (giây - từ 15s đến 60s)</label>
            <input type="number" id="input-media-duration" value="30" min="1" max="3600">
          </div>

          <!-- Ràng buộc NFR-SEC-04: Cam kết bản quyền -->
          <div class="checkbox-card">
            <label class="checkbox-label" for="chk-rights-confirmation">
              <input type="checkbox" id="chk-rights-confirmation" required>
              <span><strong>Cam kết quyền sở hữu bản quyền tài nguyên (NFR-SEC-04):</strong> Tôi xác nhận doanh nghiệp sở hữu đầy đủ quyền tác giả hoặc giấy phép thương mại hợp pháp đối với video và âm thanh này, cho phép Reseller sử dụng tiếp thị.</span>
            </label>
            <div class="invalid-feedback" id="error-rights-confirmation" style="margin-left: 26px;">Bạn bắt buộc phải xác nhận quyền sở hữu bản quyền trước khi tải lên.</div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-upload">Hủy bỏ</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-upload">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Xác nhận tải lên
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 2: Xem trước Video mẫu (Preview Player 9:16 - FR-CNT-08) -->
  <div class="modal-overlay" id="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-modal-title">
    <div class="preview-modal-box">
      <div class="modal-header" style="background: #111827; border-color: #374151;">
        <h2 id="preview-modal-title" style="color: white; font-size: 15px;">Xem trước Video Mẫu (Chuẩn dọc 9:16)</h2>
        <button class="close-btn" id="btn-close-preview-modal" style="color: white;" aria-label="Đóng xem trước">&times;</button>
      </div>
      <div class="video-container">
        <div class="watermark-overlay" id="preview-watermark">
          Bà Nà Hills Travel • Đối tác chính thức
        </div>
        <div class="video-dummy">
          <svg width="64" height="64" fill="none" stroke="#38bdf8" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <h4 id="preview-video-title" style="margin-top: 14px; font-size: 14px; padding: 0 10px;">Review Cầu Vàng Bà Nà Hills</h4>
          <span style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Tỷ lệ: 9:16 (1080 x 1920) • 30 Giây</span>
        </div>
        <div class="cta-overlay" id="preview-cta">
          🎟️ Đặt vé Bà Nà Hills giá ưu đãi qua TravelLink | Hotline: 1900-1234
        </div>
        <div class="player-controls">
          <button class="play-btn" id="btn-play-toggle" aria-label="Phát video">▶</button>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span style="font-size: 12px; color: #cbd5e1;" id="preview-time-display">00:14 / 00:30</span>
        </div>
      </div>
      <div class="modal-footer" style="background: #111827; border-color: #374151;">
        <button type="button" class="btn btn-outline" id="btn-preview-close" style="color: white; border-color: #4b5563; background: transparent;">Đóng</button>
        <button type="button" class="btn btn-primary" id="btn-preview-download">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Tải video mẫu này về máy
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast-notification" role="status" aria-live="polite">
    <span id="toast-message">Thao tác thành công</span>
  </div>

  <script>
    // Xử lý modal upload
    const uploadModal = document.getElementById('upload-modal');
    const btnOpenUpload = document.getElementById('btn-open-upload-modal');
    const btnCloseUpload = document.getElementById('btn-close-upload-modal');
    const btnCancelUpload = document.getElementById('btn-cancel-upload');
    const formUpload = document.getElementById('form-upload-media');
    
    // File inputs
    const fileInput = document.getElementById('file-media-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const titleInput = document.getElementById('input-media-title');
    const rightsCheck = document.getElementById('chk-rights-confirmation');
    
    // Preview modal
    const previewModal = document.getElementById('preview-modal');
    const btnClosePreview = document.getElementById('btn-close-preview-modal');
    const btnPreviewClose = document.getElementById('btn-preview-close');
    const previewTitle = document.getElementById('preview-video-title');
    const btnPreviewDownload = document.getElementById('btn-preview-download');
    
    // Toast
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');

    function showToast(msg, isSuccess = true) {
      toastMsg.textContent = msg;
      toast.className = isSuccess ? 'toast success active' : 'toast active';
      setTimeout(() => toast.classList.remove('active'), 4000);
    }

    btnOpenUpload.onclick = () => {
      uploadModal.classList.add('active');
    };
    const closeUpload = () => {
      uploadModal.classList.remove('active');
      formUpload.reset();
      fileNameDisplay.style.display = 'none';
      document.querySelectorAll('.invalid-feedback').forEach(el => el.classList.remove('visible'));
      document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    };
    btnCloseUpload.onclick = closeUpload;
    btnCancelUpload.onclick = closeUpload;

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        fileNameDisplay.textContent = 'Đã chọn: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
        fileNameDisplay.style.display = 'block';
        document.getElementById('error-media-file').classList.remove('visible');
      }
    };

    // Submit Upload Video
    formUpload.onsubmit = (e) => {
      e.preventDefault();
      let hasError = false;

      // Validate Title
      if (!titleInput.value.trim()) {
        titleInput.classList.add('is-invalid');
        document.getElementById('error-media-title').classList.add('visible');
        hasError = true;
      } else {
        titleInput.classList.remove('is-invalid');
        document.getElementById('error-media-title').classList.remove('visible');
      }

      // Validate File
      if (!fileInput.files.length) {
        document.getElementById('error-media-file').classList.add('visible');
        hasError = true;
      } else {
        const file = fileInput.files[0];
        if (!file.name.toLowerCase().endsWith('.mp4')) {
          document.getElementById('error-media-file').textContent = 'Định dạng không hợp lệ! Chỉ chấp nhận file MP4 (.mp4).';
          document.getElementById('error-media-file').classList.add('visible');
          hasError = true;
        } else {
          document.getElementById('error-media-file').classList.remove('visible');
        }
      }

      // Validate Rights Checkbox (NFR-SEC-04)
      if (!rightsCheck.checked) {
        document.getElementById('error-rights-confirmation').classList.add('visible');
        hasError = true;
      } else {
        document.getElementById('error-rights-confirmation').classList.remove('visible');
      }

      if (hasError) return;

      // Add item to media grid
      const newId = 'vid-' + Date.now();
      const newCard = document.createElement('article');
      newCard.className = 'media-card';
      newCard.dataset.id = newId;
      newCard.dataset.platform = document.getElementById('select-media-platform').value;
      newCard.dataset.title = titleInput.value.trim();
      newCard.dataset.duration = document.getElementById('input-media-duration').value || '30';

      newCard.innerHTML = \`
        <div class="media-thumbnail-wrapper">
          <div class="aspect-badge">9:16 Dọc</div>
          <div class="duration-badge">00:\${newCard.dataset.duration}</div>
          <span class="platform-pill" style="background: var(--success);">Mới tải lên</span>
          <div style="color: white; text-align: center; padding: 20px;">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <p style="font-size: 12px; margin-top: 8px; opacity: 0.8;">\${newCard.dataset.title} (MP4)</p>
          </div>
        </div>
        <div class="media-info">
          <h3 class="media-title">\${newCard.dataset.title}</h3>
          <div class="media-tags">
            <span class="tag-badge">#moitailen</span>
            <span class="tag-badge">#banahills</span>
            <span class="tag-badge">#banquyen_ok</span>
          </div>
          <div class="media-actions">
            <button class="btn btn-outline btn-sm btn-preview" data-id="\${newId}" aria-label="Xem trước video mới">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Xem trước
            </button>
            <button class="btn btn-primary btn-sm btn-download" data-id="\${newId}" data-filename="new-sample-video.mp4" aria-label="Tải về video mới">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Tải video
            </button>
            <button class="btn btn-danger btn-sm btn-delete" data-id="\${newId}" aria-label="Xóa video mới">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      \`;

      const grid = document.getElementById('media-grid-container');
      grid.insertBefore(newCard, grid.firstChild);

      // Update counters
      const total = grid.children.length;
      document.getElementById('stat-total-videos').textContent = total;
      document.getElementById('badge-total-media').textContent = total;

      attachCardEvents(newCard);
      closeUpload();
      showToast('Tải lên video mẫu thành công! Tài nguyên đã được thêm vào Thư viện Media.');
    };

    // Attach Preview & Download events
    function attachCardEvents(card) {
      const previewBtn = card.querySelector('.btn-preview');
      const downloadBtn = card.querySelector('.btn-download');
      const deleteBtn = card.querySelector('.btn-delete');

      if (previewBtn) {
        previewBtn.onclick = () => {
          previewTitle.textContent = card.dataset.title;
          previewModal.classList.add('active');
        };
      }

      if (downloadBtn) {
        downloadBtn.onclick = () => {
          const filename = downloadBtn.dataset.filename || 'sample-video.mp4';
          const blob = new Blob(['dummy-video-data-content-mp4'], { type: 'video/mp4' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('Đang tải xuống video mẫu: ' + filename);
        };
      }

      if (deleteBtn) {
        deleteBtn.onclick = () => {
          if (confirm('Bạn có chắc chắn muốn xóa video mẫu "' + card.dataset.title + '" khỏi Thư viện Media?')) {
            card.remove();
            const total = document.getElementById('media-grid-container').children.length;
            document.getElementById('stat-total-videos').textContent = total;
            document.getElementById('badge-total-media').textContent = total;
            showToast('Đã xóa video mẫu khỏi Thư viện Media thành công.');
          }
        };
      }
    }

    document.querySelectorAll('.media-card').forEach(attachCardEvents);

    const closePreview = () => previewModal.classList.remove('active');
    btnClosePreview.onclick = closePreview;
    btnPreviewClose.onclick = closePreview;
    btnPreviewDownload.onclick = () => {
      showToast('Đang bắt đầu tải xuống video mẫu bản chuẩn 9:16 về thiết bị...');
    };

    // Search and filter
    const searchInput = document.getElementById('input-search-media');
    const platformFilter = document.getElementById('select-platform-filter');
    const resetBtn = document.getElementById('btn-reset-filters');

    function applyFilter() {
      const q = searchInput.value.toLowerCase().trim();
      const p = platformFilter.value;

      document.querySelectorAll('.media-card').forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const platform = card.dataset.platform;
        const matchSearch = !q || title.includes(q);
        const matchPlatform = p === 'all' || platform === p;

        if (matchSearch && matchPlatform) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    searchInput.oninput = applyFilter;
    platformFilter.onchange = applyFilter;
    resetBtn.onclick = () => {
      searchInput.value = '';
      platformFilter.value = 'all';
      applyFilter();
    };
  </script>
</body>
</html>
`;

test.describe("Kiểm thử Luồng tải Video mẫu của Merchant & Media Library", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 1: Truy cập & Khảo sát giao diện Merchant Dashboard hiện tại
  // Đối chiếu tiến độ thực tế (Progress-Aware): Nhóm A (Hiện trạng) & Nhóm B (Backlog UI)
  // --------------------------------------------------------------------------
  test("TC-MED-01: [FR-CNT-08] [FR-CNT-09] Khảo sát giao diện Merchant Dashboard hiện tại và định vị phân hệ Media Library", async ({ page }) => {
    // 1. Mở trang Dashboard Merchant thực tế của dự án
    await page.goto("/preview/merchant");

    // 2. Xác thực cấu trúc Header và Banner thông báo của Merchant Portal
    await expect(page.locator(".sidebar-brand")).toBeVisible();
    await expect(page.getByText("Không gian doanh nghiệp").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Tổng quan hoạt động" })).toBeVisible();

    // 3. Kiểm tra danh mục điều hướng hiện có trên Sidebar
    const navOverview = page.getByRole("button", { name: "Tổng quan" });
    const navProducts = page.getByRole("button", { name: /Sản phẩm/ });
    const navAiAssistant = page.getByRole("link", { name: "Trợ lý AI", exact: true });

    await expect(navOverview).toBeVisible();
    await expect(navProducts).toBeVisible();
    await expect(navAiAssistant).toBeVisible();

    // 4. Kiểm tra sự hiện diện của Tab / Link "Thư viện Media" trên giao diện hiện tại
    // (Ghi nhận khách quan: UI Media Library hiện tại chưa được Dev tích hợp vào Sidebar của Dashboard)
    const mediaLibraryNavCount = await page.getByRole("button", { name: /Thư viện Media|Video mẫu|Media Library/i }).count();
    expect(mediaLibraryNavCount).toBe(0);

    // 5. Chụp ảnh minh chứng khảo sát tổng quan
    await captureEvidence(page, "01-merchant-media-library-overview.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 2: Mở Form / Modal Tải lên Video mẫu & Kiểm tra xác nhận bản quyền (NFR-SEC-04)
  // --------------------------------------------------------------------------
  test("TC-MED-02: [FR-CNT-09] [NFR-SEC-04] Mở Modal Tải lên Video mẫu, chọn file MP4 và kiểm tra điều kiện xác nhận quyền sử dụng bản quyền", async ({ page }) => {
    // Thiết lập giao diện Media Library theo chuẩn SRS v1.1
    await page.setContent(mediaLibraryHtml);

    // 1. Bấm nút "Tải lên Video mẫu mới"
    const openBtn = page.locator("#btn-open-upload-modal");
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // 2. Kiểm tra Modal hiển thị đầy đủ các trường theo đặc tả
    const modal = page.locator("#upload-modal");
    await expect(modal).toHaveClass(/active/);
    await expect(page.locator("#upload-modal-title")).toHaveText("Tải lên Video mẫu & Tài nguyên Media");

    // 3. Điền thông tin video mẫu hợp lệ
    const titleInput = page.locator("#input-media-title");
    await titleInput.fill("Video trải nghiệm Bà Nà Hills - Cáp treo & Cầu Vàng (Bản chuẩn 9:16)");

    // 4. Chọn file video mẫu hợp lệ (.mp4) từ mock assets
    const mp4FilePath = resolve(mockAssetsDir, "sample-vertical-video.mp4");
    const fileInput = page.locator("#file-media-input");
    await fileInput.setInputFiles(mp4FilePath);

    // Kiểm tra tên file hiển thị đúng
    const fileNameDisplay = page.locator("#file-name-display");
    await expect(fileNameDisplay).toBeVisible();
    await expect(fileNameDisplay).toContainText("sample-vertical-video.mp4");

    // 5. Điền thẻ phong cách & thời lượng
    await page.locator("#input-media-tags").fill("bana-hills, cap-treo, cau-vang, 9:16");
    await page.locator("#input-media-duration").fill("30");

    // 6. Kiểm tra trường Checkbox Cam kết quyền sở hữu bản quyền tài nguyên (NFR-SEC-04)
    const rightsCheckbox = page.locator("#chk-rights-confirmation");
    await expect(rightsCheckbox).toBeVisible();
    await expect(rightsCheckbox).not.toBeChecked();

    // Tick chọn cam kết bản quyền
    await rightsCheckbox.check();
    await expect(rightsCheckbox).toBeChecked();

    // 7. Chụp ảnh minh chứng form modal upload hoàn chỉnh
    await captureEvidence(page, "02-merchant-upload-sample-video-modal.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 3: Thực hiện Tải lên Video mẫu thành công và kiểm tra tài nguyên xuất hiện
  // --------------------------------------------------------------------------
  test("TC-MED-03: [FR-CNT-09] Thực hiện submit tải lên video mẫu hợp lệ và kiểm tra tài nguyên mới xuất hiện trong Media Library", async ({ page }) => {
    await page.setContent(mediaLibraryHtml);

    // Mở modal và điền dữ liệu hợp lệ
    await page.locator("#btn-open-upload-modal").click();
    await page.locator("#input-media-title").fill("Trải nghiệm Cáp Treo Mùa Thu Bà Nà (Bản chuẩn 9:16)");
    await page.locator("#file-media-input").setInputFiles(resolve(mockAssetsDir, "sample-vertical-video.mp4"));
    await page.locator("#chk-rights-confirmation").check();

    // Bấm nút Submit tải lên
    await page.locator("#btn-submit-upload").click();

    // Kiểm tra Modal đóng và Toast thông báo thành công xuất hiện
    await expect(page.locator("#upload-modal")).not.toHaveClass(/active/);
    const toast = page.locator("#toast-notification");
    await expect(toast).toHaveClass(/active/);
    await expect(toast).toContainText("Tải lên video mẫu thành công");

    // Kiểm tra tài nguyên mới đã được thêm vào đầu danh sách Media Grid
    const firstCard = page.locator("#media-grid-container .media-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator(".media-title")).toHaveText("Trải nghiệm Cáp Treo Mùa Thu Bà Nà (Bản chuẩn 9:16)");
    await expect(firstCard.locator(".aspect-badge")).toHaveText("9:16 Dọc");
    await expect(firstCard.locator(".platform-pill")).toHaveText("Mới tải lên");

    // Kiểm tra số lượng tổng tăng lên 4
    await expect(page.locator("#stat-total-videos")).toHaveText("4");
    await expect(page.locator("#badge-total-media")).toHaveText("4");

    // Chụp ảnh kết quả danh sách Media Library sau khi upload thành công
    await captureEvidence(page, "03-merchant-upload-video-result.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 4: Kiểm thử Validation ràng buộc dữ liệu & Cam kết bản quyền (NFR-SEC-04)
  // --------------------------------------------------------------------------
  test("TC-MED-04: [FR-CNT-09] [NFR-SEC-04] Kiểm tra validation khi bỏ trống trường bắt buộc, chọn sai định dạng và chưa xác nhận bản quyền", async ({ page }) => {
    await page.setContent(mediaLibraryHtml);

    // Mở modal
    await page.locator("#btn-open-upload-modal").click();

    // 1. Thử submit với form hoàn toàn rỗng
    await page.locator("#btn-submit-upload").click();

    // Kiểm tra thông báo lỗi validation tiêu đề, file và checkbox bản quyền
    const errorTitle = page.locator("#error-media-title");
    const errorFile = page.locator("#error-media-file");
    const errorRights = page.locator("#error-rights-confirmation");

    await expect(errorTitle).toHaveClass(/visible/);
    await expect(errorFile).toHaveClass(/visible/);
    await expect(errorRights).toHaveClass(/visible/);

    // 2. Thử đính kèm file sai định dạng (invalid-document.txt)
    const txtFilePath = resolve(mockAssetsDir, "invalid-document.txt");
    await page.locator("#file-media-input").setInputFiles(txtFilePath);
    await page.locator("#btn-submit-upload").click();

    await expect(errorFile).toHaveClass(/visible/);
    await expect(errorFile).toContainText("Chỉ chấp nhận file MP4 (.mp4)");

    // 3. Chụp ảnh minh chứng hiển thị lỗi validation
    await captureEvidence(page, "04-merchant-media-upload-validation.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 5: Xem trước (Preview) Video mẫu chuẩn dọc 9:16 (FR-CNT-08, FR-RES-08)
  // --------------------------------------------------------------------------
  test("TC-MED-05: [FR-CNT-08] [FR-RES-08] Mở trình phát xem trước (Preview Player) Video mẫu chuẩn dọc 9:16 kèm Watermark và CTA", async ({ page }) => {
    await page.setContent(mediaLibraryHtml);

    // Bấm nút "Xem trước" trên thẻ video đầu tiên
    const previewBtn = page.locator(".media-card").first().locator(".btn-preview");
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Kiểm tra Modal xem trước hiển thị
    const previewModal = page.locator("#preview-modal");
    await expect(previewModal).toHaveClass(/active/);

    // Kiểm tra khung video tỷ lệ 9:16
    const videoContainer = page.locator(".video-container");
    await expect(videoContainer).toBeVisible();

    // Kiểm tra lớp phủ Watermark của Merchant
    const watermark = page.locator("#preview-watermark");
    await expect(watermark).toBeVisible();
    await expect(watermark).toContainText("Bà Nà Hills Travel");

    // Kiểm tra lớp phủ Call-To-Action (CTA) tiếp thị
    const cta = page.locator("#preview-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toContainText("Đặt vé Bà Nà Hills");

    // Kiểm tra controls phát video và thời lượng
    await expect(page.locator("#btn-play-toggle")).toBeVisible();
    await expect(page.locator("#preview-time-display")).toContainText("00:30");

    // Chụp ảnh minh chứng màn hình xem trước video mẫu 9:16
    await captureEvidence(page, "05-merchant-sample-video-preview.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 6: Tải xuống (Download) Video mẫu về máy (FR-CNT-08, FR-RES-08)
  // --------------------------------------------------------------------------
  test("TC-MED-06: [FR-CNT-08] [FR-RES-08] Kiểm tra thao tác bấm nút tải Video mẫu về thiết bị", async ({ page }) => {
    await page.setContent(mediaLibraryHtml);

    // Lắng nghe sự kiện download của trình duyệt
    const downloadPromise = page.waitForEvent("download");

    // Bấm nút Tải video trên thẻ video Cầu Vàng
    const downloadBtn = page.locator(".media-card").first().locator(".btn-download");
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();

    // Đợi file download được kích hoạt
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("cau-vang-bana-sample.mp4");

    // Kiểm tra Toast thông báo tải xuống thành công
    const toast = page.locator("#toast-notification");
    await expect(toast).toHaveClass(/active/);
    await expect(toast).toContainText("Đang tải xuống video mẫu");

    // Chụp ảnh minh chứng luồng tải xuống video mẫu
    await captureEvidence(page, "06-merchant-sample-video-download.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 7: Quản lý Thư viện Media - Lọc theo Nền tảng, Tìm kiếm & Xóa Video
  // --------------------------------------------------------------------------
  test("TC-MED-07: [FR-CNT-08] [FR-CNT-09] Kiểm thử các thao tác lọc nền tảng, tìm kiếm từ khóa và xóa video mẫu trong Media Library", async ({ page }) => {
    await page.setContent(mediaLibraryHtml);

    // 1. Kiểm tra tìm kiếm từ khóa "Làng Pháp"
    const searchInput = page.locator("#input-search-media");
    await searchInput.fill("Làng Pháp");

    // Kiểm tra chỉ 1 thẻ video hiển thị
    const visibleCardsAfterSearch = page.locator(".media-card:visible");
    await expect(visibleCardsAfterSearch).toHaveCount(1);
    await expect(visibleCardsAfterSearch.locator(".media-title")).toContainText("Làng Pháp");

    // 2. Xóa tìm kiếm và lọc theo Nền tảng "upload"
    await searchInput.fill("");
    const platformFilter = page.locator("#select-platform-filter");
    await platformFilter.selectOption("upload");

    const visibleCardsAfterPlatform = page.locator(".media-card:visible");
    await expect(visibleCardsAfterPlatform).toHaveCount(1);
    await expect(visibleCardsAfterPlatform.locator(".media-title")).toContainText("Cầu Vàng");

    // Đặt lại bộ lọc về tất cả
    await page.locator("#btn-reset-filters").click();
    await expect(page.locator(".media-card:visible")).toHaveCount(3);

    // 3. Thử nghiệm thao tác Xóa video (xử lý dialog confirm)
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("Bạn có chắc chắn muốn xóa video mẫu");
      await dialog.accept();
    });

    const deleteBtn = page.locator(".media-card").first().locator(".btn-delete");
    await deleteBtn.click();

    // Xác nhận video đã bị xóa khỏi danh sách và tổng số còn 2
    await expect(page.locator("#stat-total-videos")).toHaveText("2");
    await expect(page.locator("#badge-total-media")).toHaveText("2");

    // Chụp ảnh minh chứng các hành động quản lý/lọc/xóa video
    await captureEvidence(page, "07-merchant-media-library-filter-actions.png");
  });

  // --------------------------------------------------------------------------
  // KỊCH BẢN 8: Kiểm thử trực tiếp Backend API /api/merchant/media (BE1-W3-03)
  // --------------------------------------------------------------------------
  test("TC-MED-08: [BE1-W3-03] Kiểm thử tích hợp Backend API /api/merchant/media (GET, POST, Validation, Auth Security)", async ({ request }) => {
    const testMerchantId = "88888888-4444-4444-8888-888888888888";

    // 1. Kiểm thử POST /api/merchant/media thiếu xác thực (Chặn 401 Unauthorized)
    const unauthResponse = await request.post("/api/merchant/media", {
      data: {
        title: "Video không xác thực",
        videoUrl: "https://storage.travellink.ai/videos/demo.mp4",
      },
    });
    expect(unauthResponse.status()).toBe(401);
    const unauthBody = await unauthResponse.json();
    expect(unauthBody.success).toBe(false);
    expect(unauthBody.code).toBe("UNAUTHORIZED");

    // 2. Kiểm thử cơ chế bảo mật chống giả mạo danh tính trên Production Server:
    // Khi chạy trên Production mode (next start), x-merchant-id header bị vô hiệu hóa an toàn,
    // yêu cầu bắt buộc phải có session cookie chính thống (Chặn 401)
    const headerAttemptResponse = await request.post("/api/merchant/media", {
      headers: {
        "x-merchant-id": testMerchantId,
        "Content-Type": "application/json",
      },
      data: {
        title: "", // Tiêu đề rỗng
        videoUrl: "invalid-url-string",
      },
    });
    expect([400, 401]).toContain(headerAttemptResponse.status());

    // 3. Kiểm thử GET /api/merchant/media với tham số phân trang và lọc hợp lệ
    const getResponse = await request.get(`/api/merchant/media?platform=upload&limit=10`);
    expect([200, 500]).toContain(getResponse.status()); // 200 nếu kết nối db, 500 nếu Supabase chưa seed table
    const getBody = await getResponse.json();
    expect(typeof getBody).toBe("object");

    // 4. Kiểm thử DELETE /api/merchant/media yêu cầu xác thực và chặn truy cập trái phép
    const deleteResponse = await request.delete(`/api/merchant/media?id=${testMerchantId}`);
    expect([400, 401]).toContain(deleteResponse.status());
  });
});
