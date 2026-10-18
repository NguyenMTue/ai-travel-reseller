import os
import re
import sys
from pathlib import Path
import httpx
from bs4 import BeautifulSoup

if sys.stdout and hasattr(sys.stdout, "reconfigure") and getattr(sys.stdout, "encoding", "").lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"
KNOWLEDGE_DIR.mkdir(parents=True, exist_ok=True)

ARTICLES = [
    {
        "url": "https://vietworldtravel.vn/tokyo-mua-thu-8-dia-diem-chup-hinh-dep-nhat-tokyo/",
        "filename": "review_tokyo_mua_thu.md",
        "title": "Tokyo Mùa Thu – 8 Địa Điểm Chụp Hình Đẹp Nhất"
    },
    {
        "url": "https://vietworldtravel.vn/8-diem-tham-quan-khong-the-bo-lo-khi-di-tour-du-lich-hokkaido/",
        "filename": "review_hokkaido_nhat_ban.md",
        "title": "Hokkaido – 8 Điểm Tham Quan Không Thể Bỏ Lỡ"
    },
    {
        "url": "https://vietworldtravel.vn/6-goc-check-in-dep-nhat-khi-du-lich-tokyo/",
        "filename": "review_tokyo_goc_checkin.md",
        "title": "Tokyo – 6 Góc Check-In Đẹp Nhất Sống Ảo"
    },
    {
        "url": "https://vietworldtravel.vn/7-diem-den-khong-the-bo-lo-khi-di-du-lich-kyushu-nhat-ban/",
        "filename": "review_kyushu_nhat_ban.md",
        "title": "Kyushu Nhật Bản – 7 Điểm Đến Hấp Dẫn Không Thể Bỏ Lỡ"
    },
    {
        "url": "https://vietworldtravel.vn/top-5-diem-du-lich-hap-dan-nhat-myannar/",
        "filename": "review_myanmar.md",
        "title": "Myanmar – Top 5 Điểm Du Lịch Hấp Dẫn Nhất"
    },
    {
        "url": "https://vietworldtravel.vn/top-5-diem-khong-the-bo-qua-khi-di-du-lich-jordan/",
        "filename": "review_jordan.md",
        "title": "Jordan – Top 5 Điểm Đến Không Thể Bỏ Qua (Petra, Wadi Rum, Biển Chết)"
    },
    {
        "url": "https://vietworldtravel.vn/05-ly-do-nen-du-lich-brazil-argentina-vao-thang-2/",
        "filename": "review_brazil_argentina.md",
        "title": "Brazil & Argentina Tháng 2 – 5 Lý Do Nhất Định Phải Trải Nghiệm"
    },
    {
        "url": "https://vietworldtravel.vn/08-luu-y-quan-trong-khi-di-du-lich-ai-cap/",
        "filename": "review_ai_cap.md",
        "title": "Ai Cập – 8 Lưu Ý Quan Trọng Khi Đi Du Lịch (Kim Tự Tháp, Sông Nile)"
    },
    {
        "url": "https://vietworldtravel.vn/08-luu-y-quan-trong-khi-di-du-lich-ma-roc/",
        "filename": "review_ma_roc.md",
        "title": "Ma Rốc – 8 Lưu Ý Quan Trọng Khi Đi Du Lịch Bắc Phi"
    },
    {
        "url": "https://vietworldtravel.vn/08-luu-y-quan-trong-khi-di-du-lich-argentina/",
        "filename": "review_argentina.md",
        "title": "Argentina – 8 Lưu Ý Quan Trọng Khi Khám Phá Xứ Sở Tango"
    }
]


def html_to_markdown_sections(soup, base_title, source_url):
    content_div = soup.find("div", class_="post-content") or soup.find("div", class_="entry-content")
    if not content_div:
        return f"# Kho Tri Thức: {base_title}\n\nNguồn: {source_url}\n\nKhông tìm thấy nội dung chi tiết."

    md_lines = [
        f"# Kho Tri Thức: {base_title}",
        f"\n- **Nguồn bài viết**: Vietworld Travel ({source_url})",
        f"- **Danh mục**: Review Du Lịch & Cẩm Nang Thực Tế\n",
        "## 1. Tổng Quan Điểm Đến\n"
    ]

    elements = content_div.find_all(["h2", "h3", "h4", "p", "ul", "ol"])
    section_counter = 2

    for el in elements:
        tag = el.name.lower()
        text = el.get_text().strip()
        if not text:
            continue

        if tag in ["h2", "h3"]:
            # Tạo đề mục cấp 2 cho RAG chunking
            clean_heading = re.sub(r"^\d+[\.\-\s]+", "", text).strip()
            md_lines.append(f"\n## {section_counter}. {clean_heading}\n")
            section_counter += 1
        elif tag == "p":
            # Bỏ qua các đoạn quảng cáo liên hệ cuối bài
            if "hotline" in text.lower() or "vietworld travel" in text.lower() and len(text) < 80:
                continue
            md_lines.append(f"{text}\n")
        elif tag in ["ul", "ol"]:
            for li in el.find_all("li"):
                li_text = li.get_text().strip()
                if li_text:
                    md_lines.append(f"- {li_text}")
            md_lines.append("")

    return "\n".join(md_lines)


def scrape_all():
    print(f"🚀 Bắt đầu crawl {len(ARTICLES)} bài viết review từ vietworldtravel.vn vào thư mục knowledge/...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    client = httpx.Client(headers=headers, follow_redirects=True, timeout=20.0)
    success_count = 0

    for idx, item in enumerate(ARTICLES, 1):
        url = item["url"]
        fname = item["filename"]
        target_path = KNOWLEDGE_DIR / fname

        print(f"[{idx}/{len(ARTICLES)}] Đang tải: {item['title']} ...")
        try:
            resp = client.get(url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                page_title = soup.find("h1", class_="entry-title") or soup.find("h1", class_="post-title") or soup.title
                title_text = page_title.get_text().split("|")[0].strip() if page_title else item["title"]

                md_content = html_to_markdown_sections(soup, title_text, url)
                with open(target_path, "w", encoding="utf-8") as f:
                    f.write(md_content)
                print(f"  ✅ Đã lưu file: knowledge/{fname} ({len(md_content)} ký tự)")
                success_count += 1
            else:
                print(f"  ❌ Lỗi HTTP {resp.status_code} khi tải {url}")
        except Exception as e:
            print(f"  ❌ Lỗi ngoại lệ: {e}")

    print(f"\n🎉 Hoàn thành! Đã tạo thành công {success_count}/{len(ARTICLES)} file markdown tri thức trong knowledge/.")


if __name__ == "__main__":
    scrape_all()
