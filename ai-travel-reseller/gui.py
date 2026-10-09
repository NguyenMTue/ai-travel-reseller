import sys
import threading
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, simpledialog
import config
from db import test_supabase_connection, list_products, CREATE_CONTENTS_TABLE_SQL
from content_generator import test_groq_connection, generate_content, get_available_groq_model, get_groq_client
from save_content import save_generated_content
from rag_engine import get_rag, CREATE_KNOWLEDGE_TABLE_SQL
from n8n_client import generate_review_via_n8n

# Cấu hình UTF-8 cho Windows console nếu chạy từ terminal
if sys.stdout and hasattr(sys.stdout, "reconfigure") and getattr(sys.stdout, "encoding", "").lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class APIDebugApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("AI Travel Reseller - Studio Đăng Bài Chuẩn Xác & Debug API (RAG Engine)")
        self.root.geometry("960x860")
        self.root.minsize(860, 720)

        # Trạng thái ẩn/hiện mật khẩu
        self.show_supabase_key = tk.BooleanVar(value=False)
        self.show_groq_key = tk.BooleanVar(value=False)

        # Dữ liệu bài đăng gần nhất
        self.last_published_data = {}
        self.last_review_data = None
        self.products = []

        # Style chung
        self.setup_styles()

        # Xây dựng giao diện
        self.create_widgets()

        # Nạp dữ liệu ban đầu từ config / .env
        self.load_from_env()

        self.log_info("Studio sẵn sàng. Chọn sản phẩm từ Supabase để tạo bản nháp qua n8n; nội dung luôn cần được bạn duyệt trước khi đăng.")
        self.root.after(150, self.run_async_load_products)

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")

        self.root.configure(bg="#f1f5f9")
        style.configure("TFrame", background="#f1f5f9")
        style.configure("Card.TFrame", background="#ffffff", relief="flat")
        style.configure("Header.TLabel", font=("Segoe UI", 16, "bold"), background="#f1f5f9", foreground="#0f172a")
        style.configure("SubHeader.TLabel", font=("Segoe UI", 9), background="#f1f5f9", foreground="#64748b")
        style.configure("CardTitle.TLabel", font=("Segoe UI", 11, "bold"), background="#ffffff", foreground="#1e293b")
        style.configure("FieldLabel.TLabel", font=("Segoe UI", 9, "bold"), background="#ffffff", foreground="#334155")
        
        style.configure("Action.TButton", font=("Segoe UI", 9, "bold"), padding=5)
        style.configure("Primary.TButton", font=("Segoe UI", 10, "bold"), padding=6, background="#2563eb", foreground="#ffffff")
        style.configure("Publish.TButton", font=("Segoe UI", 10, "bold"), padding=6)

    def create_widgets(self):
        main_container = ttk.Frame(self.root, padding="14 12 14 12")
        main_container.pack(fill=tk.BOTH, expand=True)

        # 1. Header
        header_frame = ttk.Frame(main_container)
        header_frame.pack(fill=tk.X, pady=(0, 8))

        title_lbl = ttk.Label(header_frame, text="AI Travel Reseller — Studio Đăng Bài RAG Chuẩn Xác", style="Header.TLabel")
        title_lbl.pack(anchor="w")

        sub_lbl = ttk.Label(
            header_frame,
            text="Gửi yêu cầu qua n8n, tạo bản nháp và ghi vào Google Sheets để bạn kiểm tra.",
            style="SubHeader.TLabel"
        )
        sub_lbl.pack(anchor="w", pady=(1, 0))

        # 2. Chạy n8n để tạo bản nháp; chỉ đăng TikTok sau khi người dùng duyệt.
        publish_card = tk.LabelFrame(
            main_container,
            text="  TẠO BẢN NHÁP QUA N8N — DUYỆT TRƯỚC KHI ĐĂNG  ",
            font=("Segoe UI", 10, "bold"),
            bg="#ffffff",
            fg="#1d4ed8",
            padx=12,
            pady=8,
            relief="groove"
        )
        publish_card.pack(fill=tk.X, pady=(0, 10))

        # Product catalog is loaded from Supabase; the selected row is sent to n8n.
        p_row1 = ttk.Frame(publish_card, style="Card.TFrame")
        p_row1.pack(fill=tk.X, pady=(0, 6))
        ttk.Label(p_row1, text="Sản phẩm:", style="FieldLabel.TLabel").pack(side=tk.LEFT, padx=(0, 6))
        self.product_selector = ttk.Combobox(p_row1, width=48, state="readonly", font=("Segoe UI", 9))
        self.product_selector.pack(side=tk.LEFT, padx=(0, 8))
        self.btn_refresh_products = ttk.Button(p_row1, text="↻ Tải sản phẩm", command=self.run_async_load_products)
        self.btn_refresh_products.pack(side=tk.LEFT, padx=(0, 10))
        ttk.Label(p_row1, text="Danh sách lấy từ Supabase → products.", style="SubHeader.TLabel").pack(side=tk.LEFT)

        p_row2 = ttk.Frame(publish_card, style="Card.TFrame")
        p_row2.pack(fill=tk.X)
        self.btn_publish = ttk.Button(
            p_row2,
            text="1. TẠO BẢN NHÁP QUA N8N",
            style="Action.TButton",
            command=self.run_async_generate_review
        )
        self.btn_publish.pack(side=tk.LEFT, padx=(0, 8))
        self.btn_open_sheet = ttk.Button(
            p_row2,
            text="2. MỞ GOOGLE SHEETS ĐỂ DUYỆT",
            style="Publish.TButton",
            command=self.open_review_sheet,
            state=tk.DISABLED,
        )
        self.btn_open_sheet.pack(side=tk.LEFT)
        ttk.Label(p_row2, text="Tạo nháp chỉ ghi vào hàng chờ; không đăng mạng xã hội.", style="SubHeader.TLabel").pack(side=tk.LEFT, padx=10)

        # 3. Notebook: 2 Tab (Tab 1: Bản xem trước bài đăng, Tab 2: Quản trị & Debug)
        self.notebook = ttk.Notebook(main_container)
        self.notebook.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

        # --- TAB 1: BẢN XEM TRƯỚC BÀI ĐĂNG (PREVIEW) ---
        tab_preview = ttk.Frame(self.notebook, padding=8)
        self.notebook.add(tab_preview, text="  📱 Bài Đăng Hoàn Chỉnh (Preview)  ")

        self.preview_text = scrolledtext.ScrolledText(
            tab_preview,
            wrap=tk.WORD,
            font=("Segoe UI", 10),
            bg="#ffffff",
            fg="#0f172a",
            padx=10,
            pady=10
        )
        self.preview_text.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

        # Đặt thẻ màu định dạng preview
        self.preview_text.tag_config("TITLE", font=("Segoe UI", 12, "bold"), foreground="#1e3a8a")
        self.preview_text.tag_config("SECTION", font=("Segoe UI", 10, "bold"), foreground="#0369a1")
        self.preview_text.tag_config("FACTS", font=("Segoe UI", 9, "italic"), foreground="#059669")
        self.preview_text.tag_config("META", font=("Segoe UI", 9), foreground="#64748b")

        self.preview_text.insert(
            tk.END,
            "Chọn sản phẩm từ Supabase rồi bấm [1. TẠO BẢN NHÁP QUA N8N].\n"
            "Đọc và sửa bản nháp ở đây. Sau đó bấm [2. MỞ GOOGLE SHEETS ĐỂ DUYỆT] để kiểm tra hàng đã ghi."
        )

        preview_bar = ttk.Frame(tab_preview)
        preview_bar.pack(fill=tk.X)

        btn_copy_all = ttk.Button(preview_bar, text="📋 Sao chép toàn bộ bài đăng", command=self.copy_all_post)
        btn_copy_all.pack(side=tk.LEFT, padx=4)

        btn_copy_caption = ttk.Button(preview_bar, text="📱 Sao chép riêng Caption", command=self.copy_caption_only)
        btn_copy_caption.pack(side=tk.LEFT, padx=4)

        btn_copy_script = ttk.Button(preview_bar, text="🎬 Sao chép Kịch bản Video", command=self.copy_script_only)
        btn_copy_script.pack(side=tk.LEFT, padx=4)

        # --- TAB 2: QUẢN TRỊ, DEBUG & LOG ---
        tab_debug = ttk.Frame(self.notebook, padding=8)
        self.notebook.add(tab_debug, text="  🛠️ Quản Trị Cấu Hình & Debug  ")

        # Config row trong tab debug
        cfg_frame = ttk.Frame(tab_debug)
        cfg_frame.pack(fill=tk.X, pady=(0, 6))

        ttk.Label(cfg_frame, text="SUPABASE_URL:").grid(row=0, column=0, sticky="w", pady=2)
        self.entry_supabase_url = ttk.Entry(cfg_frame, width=50, font=("Consolas", 8))
        self.entry_supabase_url.grid(row=0, column=1, sticky="ew", padx=4, pady=2)

        ttk.Label(cfg_frame, text="SUPABASE_KEY:").grid(row=0, column=2, sticky="w", pady=2, padx=(8, 0))
        self.entry_supabase_key = ttk.Entry(cfg_frame, width=30, show="*", font=("Consolas", 8))
        self.entry_supabase_key.grid(row=0, column=3, sticky="ew", padx=4, pady=2)

        ttk.Label(cfg_frame, text="GROQ_API_KEY:").grid(row=1, column=0, sticky="w", pady=2)
        self.entry_groq_key = ttk.Entry(cfg_frame, width=50, show="*", font=("Consolas", 8))
        self.entry_groq_key.grid(row=1, column=1, sticky="ew", padx=4, pady=2)

        btn_save_env = ttk.Button(cfg_frame, text="💾 Lưu .env", command=self.save_to_env)
        btn_save_env.grid(row=1, column=2, padx=4, pady=2)

        btn_load_env = ttk.Button(cfg_frame, text="🔄 Tải lại", command=self.load_from_env)
        btn_load_env.grid(row=1, column=3, padx=4, pady=2)

        cfg_frame.columnconfigure(1, weight=1)

        # Thanh nút thao tác kiểm tra
        debug_btn_bar = ttk.Frame(tab_debug)
        debug_btn_bar.pack(fill=tk.X, pady=(4, 6))

        self.btn_check_env = ttk.Button(debug_btn_bar, text="Kiểm tra Cấu hình", command=self.run_async_check_env)
        self.btn_check_env.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_test_sb = ttk.Button(debug_btn_bar, text="Test Supabase", command=self.run_async_test_supabase)
        self.btn_test_sb.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_test_groq = ttk.Button(debug_btn_bar, text="Test Groq", command=self.run_async_test_groq)
        self.btn_test_groq.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_test_rag = ttk.Button(debug_btn_bar, text="Tra cứu RAG", command=self.test_rag_dialog)
        self.btn_test_rag.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_sync_rag = ttk.Button(debug_btn_bar, text="Đồng bộ Supabase", command=self.run_async_sync_rag)
        self.btn_sync_rag.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_view_sql = ttk.Button(debug_btn_bar, text="SQL contents", command=self.show_sql_dialog)
        self.btn_view_sql.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        self.btn_view_rag_sql = ttk.Button(debug_btn_bar, text="SQL knowledge", command=self.show_rag_sql_dialog)
        self.btn_view_rag_sql.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)

        # Console Text Box
        self.log_text = scrolledtext.ScrolledText(
            tab_debug,
            wrap=tk.WORD,
            font=("Consolas", 9),
            bg="#0f172a",
            fg="#f8fafc",
            insertbackground="white"
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

        self.log_text.tag_config("INFO", foreground="#38bdf8")
        self.log_text.tag_config("SUCCESS", foreground="#4ade80")
        self.log_text.tag_config("WARNING", foreground="#facc15")
        self.log_text.tag_config("ERROR", foreground="#f87171")
        self.log_text.tag_config("RAG", foreground="#c084fc")

        log_bar = ttk.Frame(tab_debug)
        log_bar.pack(fill=tk.X)

        self.status_label = ttk.Label(log_bar, text="Trạng thái: Rảnh", font=("Segoe UI", 9))
        self.status_label.pack(side=tk.LEFT, padx=4)

        btn_copy_log = ttk.Button(log_bar, text="Sao chép Log", command=self.copy_log)
        btn_copy_log.pack(side=tk.RIGHT, padx=4)

        btn_clear_log = ttk.Button(log_bar, text="Xóa Log", command=self.clear_log)
        btn_clear_log.pack(side=tk.RIGHT, padx=4)

    # --- TIỆN ÍCH GIAO DIỆN & LOG ---
    def log(self, tag: str, message: str):
        self.log_text.insert(tk.END, f"[{tag}] ", tag)
        self.log_text.insert(tk.END, f"{message}\n")
        self.log_text.see(tk.END)

    def log_info(self, msg: str):
        self.log("INFO", msg)

    def log_success(self, msg: str):
        self.log("SUCCESS", msg)

    def log_warning(self, msg: str):
        self.log("WARNING", msg)

    def log_error(self, msg: str):
        self.log("ERROR", msg)

    def log_rag(self, msg: str):
        self.log("RAG", msg)

    def clear_log(self):
        self.log_text.delete("1.0", tk.END)

    def copy_log(self):
        text = self.log_text.get("1.0", tk.END)
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        messagebox.showinfo("Thành công", "Đã sao chép toàn bộ nhật ký vào Clipboard!")

    def set_busy(self, is_busy: bool, status_msg: str = ""):
        self.status_label.config(text=f"Trạng thái: {status_msg}" if status_msg else ("Trạng thái: Đang xử lý..." if is_busy else "Trạng thái: Rảnh"))
        state = tk.DISABLED if is_busy else tk.NORMAL
        self.btn_publish.config(state=state)
        if hasattr(self, "btn_refresh_products"):
            self.btn_refresh_products.config(state=state)
        if hasattr(self, "btn_open_sheet"):
            can_approve = bool(self.last_review_data and self.last_review_data.get("review_draft"))
            self.btn_open_sheet.config(state=(tk.DISABLED if is_busy or not can_approve else tk.NORMAL))
        self.btn_check_env.config(state=state)
        self.btn_test_sb.config(state=state)
        self.btn_test_groq.config(state=state)
        self.btn_test_rag.config(state=state)
        self.btn_sync_rag.config(state=state)

    def run_async(self, target):
        thread = threading.Thread(target=target, daemon=True)
        thread.start()

    def run_async_load_products(self):
        if not hasattr(self, "product_selector"):
            return
        self.btn_refresh_products.config(state=tk.DISABLED)
        self.log_info("Đang tải danh sách sản phẩm từ Supabase...")
        self.run_async(self._worker_load_products)

    def _worker_load_products(self):
        try:
            products = list_products()
        except Exception as exc:
            self.root.after(0, lambda error=str(exc): self._products_failed(error))
            return
        self.root.after(0, lambda rows=products: self._products_loaded(rows))

    def _products_failed(self, error):
        self.btn_refresh_products.config(state=tk.NORMAL)
        self.log_error(f"Không tải được products từ Supabase: {error}")
        messagebox.showerror(
            "Không tải được sản phẩm",
            "Kiểm tra SUPABASE_URL/SUPABASE_KEY, quyền đọc bảng products và dữ liệu trong bảng.\n\n" + error,
        )

    def _products_loaded(self, products):
        self.products = products
        self.btn_refresh_products.config(state=tk.NORMAL)
        labels = [f"{p['product_id']} — {p['product_name']}" for p in products]
        self.product_selector["values"] = labels
        if labels:
            current = self.product_selector.get()
            self.product_selector.current(labels.index(current) if current in labels else 0)
            self.log_success(f"Đã tải {len(products)} sản phẩm từ Supabase.")
        else:
            self.product_selector.set("")
            self.log_warning("Bảng products chưa có sản phẩm hợp lệ (cần có id/product_id và name/product_name).")

    # --- TƯƠNG TÁC .ENV ---
    def load_from_env(self):
        config.reload_config()
        self.entry_supabase_url.delete(0, tk.END)
        self.entry_supabase_url.insert(0, config.SUPABASE_URL or "")

        self.entry_supabase_key.delete(0, tk.END)
        self.entry_supabase_key.insert(0, config.SUPABASE_KEY or "")

        self.entry_groq_key.delete(0, tk.END)
        self.entry_groq_key.insert(0, config.GROQ_API_KEY or "")

        self.log_info(f"Đã nạp thông số từ .env (Đường dẫn: {config.ENV_PATH})")

    def save_to_env(self):
        sb_url = self.entry_supabase_url.get().strip()
        sb_key = self.entry_supabase_key.get().strip()
        groq_key = self.entry_groq_key.get().strip()

        success = config.update_env_file(
            supabase_url=sb_url,
            supabase_key=sb_key,
            groq_api_key=groq_key
        )
        if success:
            self.log_success("Đã lưu thành công vào file .env!")
            messagebox.showinfo("Thành công", "Đã cập nhật file .env!")
        else:
            self.log_error("Không thể ghi vào file .env.")
            messagebox.showerror("Thất bại", "Lỗi khi ghi file .env!")

    # --- TẠO NHÁP QUA N8N ---
    def run_async_generate_review(self):
        selected_index = self.product_selector.current()
        if selected_index < 0 or selected_index >= len(self.products):
            messagebox.showwarning("Chưa chọn sản phẩm", "Chọn sản phẩm trong danh sách Supabase hoặc bấm Tải sản phẩm.")
            return
        product = self.products[selected_index]
        product_id = product["product_id"]
        self.last_review_data = None
        self.btn_open_sheet.config(state=tk.DISABLED)
        self.set_busy(True, f"Đang gửi {product_id} sang n8n để tạo bản nháp...")
        self.run_async(lambda selected=product: self._worker_generate_review(selected))

    def _worker_generate_review(self, product):
        try:
            result = generate_review_via_n8n(product)
        except Exception as exc:
            self.root.after(0, lambda error=str(exc): self._review_failed(error))
            return
        self.root.after(0, lambda data=result: self._review_ready(data))

    def _review_failed(self, error):
        self.set_busy(False, "Tạo bản nháp thất bại")
        self.log_error(f"n8n: {error}")
        messagebox.showerror("Không tạo được bản nháp", error)

    def _review_ready(self, result):
        self.last_review_data = result
        self.set_busy(False, "Đã tạo nháp — chờ bạn duyệt")
        self.preview_text.delete("1.0", tk.END)
        self.preview_text.insert(tk.END, "TRẠNG THÁI: BẢN NHÁP — CHƯA ĐĂNG\n", "META")
        self.preview_text.insert(tk.END, f"Mã sản phẩm: {result.get('product_id', '')}\n")
        if result.get("product_name"):
            self.preview_text.insert(tk.END, f"Sản phẩm: {result['product_name']}\n")
        if result.get("status"):
            self.preview_text.insert(tk.END, f"Trạng thái n8n: {result['status']}\n")
        self.preview_text.insert(tk.END, "\n")
        # Nội dung trong vùng xem trước có thể được sửa trước khi người dùng duyệt.
        self.preview_text.insert(tk.END, result["review_draft"])
        self.notebook.select(0)
        self.btn_open_sheet.config(state=tk.NORMAL)
        self.log_success(f"Đã nhận bản nháp cho {result.get('product_id', '')}; chưa đăng lên mạng xã hội.")

    def open_review_sheet(self):
        if not self.last_review_data:
            messagebox.showwarning("Chưa có bản nháp", "Hãy tạo bản nháp qua n8n trước.")
            return
        config.reload_config()
        if not config.REVIEW_SHEET_URL:
            messagebox.showinfo(
                "Mở Google Sheets để duyệt",
                "Hãy thêm REVIEW_SHEET_URL vào file .env (đường dẫn Google Sheet review_queue), "
                "hoặc mở Google Sheet thủ công và đổi status của bản nháp sang APPROVED sau khi kiểm tra.",
            )
            return
        webbrowser.open(config.REVIEW_SHEET_URL)
        messagebox.showinfo(
            "Duyệt bản nháp trong Google Sheets",
            "Kiểm tra nội dung và đổi status của đúng hàng sang APPROVED. "
            "Workflow Facebook trong n8n sẽ chỉ đăng khi nhận trạng thái này.",
        )

    # --- LUỒNG CŨ (giữ lại để tương thích; nút chính hiện dùng n8n ở trên) ---
    def run_async_publish_post(self):
        # Alias giữ tương thích với các nút/gọi cũ nếu còn, nhưng không đăng bài.
        self.run_async_generate_review()

    def copy_all_post(self):
        if self.last_review_data:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.preview_text.get("1.0", "end-1c").strip())
            messagebox.showinfo("Đã sao chép", "Đã sao chép nội dung bản nháp đang hiển thị.")
            return
        if not self.last_published_data:
            messagebox.showinfo("Thông báo", "Chưa có bản nháp. Hãy tạo bản nháp qua n8n trước.")
            return

        p = self.last_published_data
        full_text = (
            f"=== {p.get('headline')} ===\n\n"
            f"[CAPTION]\n{p.get('social_caption')}\n\n"
            f"[KỊCH BẢN / NỘI DUNG]\n{p.get('body')}\n\n"
            f"{' '.join(p.get('hashtags', []))}"
        )
        self.root.clipboard_clear()
        self.root.clipboard_append(full_text)
        messagebox.showinfo("Thành công", "Đã sao chép toàn bộ bài đăng vào Clipboard!")

    def copy_caption_only(self):
        if self.last_review_data:
            text = self.preview_text.get("1.0", "end-1c").strip()
            self.root.clipboard_clear()
            self.root.clipboard_append(text)
            messagebox.showinfo("Đã sao chép", "Đã sao chép nội dung bản nháp hiện tại.")
            return
        if not self.last_published_data:
            return
        caption = self.last_published_data.get("social_caption", "")
        self.root.clipboard_clear()
        self.root.clipboard_append(caption)
        messagebox.showinfo("Thành công", "Đã sao chép riêng Caption vào Clipboard!")

    def copy_script_only(self):
        if self.last_review_data:
            self.copy_caption_only()
            return
        if not self.last_published_data:
            return
        script = self.last_published_data.get("body", "")
        self.root.clipboard_clear()
        self.root.clipboard_append(script)
        messagebox.showinfo("Thành công", "Đã sao chép Kịch bản Video vào Clipboard!")

    # --- CÁC HÀM DEBUG TRONG TAB 2 ---
    def run_async_check_env(self):
        self.run_async(self._worker_check_env)

    def _worker_check_env(self):
        self.set_busy(True, "Đang kiểm tra biến môi trường...")
        self.log_info("=========================================")
        self.log_info("🔍 KIỂM TRA FILE .ENV & CẤU HÌNH")
        try:
            val_res = config.validate_config()
            for info in val_res["info"]:
                self.log_info(f"✓ {info}")
            if val_res["missing"]:
                for m in val_res["missing"]:
                    self.log_error(f"❌ THIẾU HOẶC SAI: {m}")
            else:
                self.log_success("✅ Tất cả các biến môi trường bắt buộc đều đã được cung cấp!")
            if val_res["warnings"]:
                for w in val_res["warnings"]:
                    self.log_warning(f"⚠️ CẢNH BÁO: {w}")
        except Exception as e:
            self.log_error(f"Lỗi: {e}")
        finally:
            self.set_busy(False)

    def run_async_test_supabase(self):
        self.run_async(self._worker_test_supabase)

    def _worker_test_supabase(self):
        self.set_busy(True, "Đang test kết nối Supabase...")
        self.log_info("=========================================")
        self.log_info("🗄️ TEST KẾT NỐI SUPABASE")
        try:
            sb_url = self.entry_supabase_url.get().strip()
            sb_key = self.entry_supabase_key.get().strip()
            result = test_supabase_connection(url=sb_url, key=sb_key)
            if result["success"]:
                self.log_success(f"✅ {result['message']}")
            else:
                self.log_error(f"❌ {result['message']}")
        except Exception as e:
            self.log_error(f"Lỗi: {e}")
        finally:
            self.set_busy(False)

    def run_async_test_groq(self):
        self.run_async(self._worker_test_groq)

    def _worker_test_groq(self):
        self.set_busy(True, "Đang test kết nối Groq...")
        self.log_info("=========================================")
        self.log_info("🤖 TEST KẾT NỐI GROQ CLOUD API")
        try:
            groq_key = self.entry_groq_key.get().strip()
            result = test_groq_connection(api_key=groq_key)
            if result["success"]:
                self.log_success(f"✅ {result['message']}")
            else:
                self.log_error(f"❌ {result['message']}")
        except Exception as e:
            self.log_error(f"Lỗi: {e}")
        finally:
            self.set_busy(False)

    def test_rag_dialog(self):
        query = simpledialog.askstring("Tra cứu RAG", "Nhập tên tour hoặc từ khóa cần tra cứu:")
        if not query:
            return
        self.run_async(lambda: self._worker_test_rag(query))

    def _worker_test_rag(self, query: str):
        self.set_busy(True, f"Đang tra cứu RAG: {query}...")
        self.log_info("=========================================")
        self.log_rag(f"📚 TRA CỨU TRI THỨC RAG: '{query}'")
        try:
            rag = get_rag()
            results = rag.retrieve(query, top_k=3)
            if not results:
                self.log_warning("Không tìm thấy đoạn tri thức phù hợp.")
            else:
                self.log_success(f"Tìm thấy {len(results)} đoạn tri thức phù hợp nhất:")
                for idx, r in enumerate(results, 1):
                    self.log_rag(f"\n[Kết quả #{idx}] {r['title']} -> {r['section']} (Nguồn: {r['source']})")
                    snippet = r['content'][:250].replace('\n', ' ') + ('...' if len(r['content']) > 250 else '')
                    self.log_info(f"  Nội dung: {snippet}")
        except Exception as e:
            self.log_error(f"Lỗi tra cứu: {e}")
        finally:
            self.set_busy(False)

    def run_async_sync_rag(self):
        self.run_async(self._worker_sync_rag)

    def _worker_sync_rag(self):
        self.set_busy(True, "Đang đồng bộ RAG lên Supabase...")
        self.log_info("=========================================")
        self.log_rag("☁️ ĐỒNG BỘ KHO TRI THỨC LÊN SUPABASE")
        try:
            rag = get_rag()
            res = rag.sync_to_supabase()
            if res["success"]:
                self.log_success(f"✅ {res['message']}")
            else:
                self.log_error(f"❌ {res['message']}")
        except Exception as e:
            self.log_error(f"Lỗi đồng bộ: {e}")
        finally:
            self.set_busy(False)

    def show_sql_dialog(self):
        self._show_sql_viewer("SQL Bảng 'contents' Cho Supabase", CREATE_CONTENTS_TABLE_SQL)

    def show_rag_sql_dialog(self):
        self._show_sql_viewer("SQL Bảng 'knowledge_base' Cho Supabase RAG", CREATE_KNOWLEDGE_TABLE_SQL)

    def _show_sql_viewer(self, title: str, sql_code: str):
        win = tk.Toplevel(self.root)
        win.title(title)
        win.geometry("660x500")
        win.transient(self.root)

        frame = ttk.Frame(win, padding=12)
        frame.pack(fill=tk.BOTH, expand=True)

        lbl = ttk.Label(frame, text="Sao chép đoạn SQL dưới đây và dán vào Supabase SQL Editor -> Run:", font=("Segoe UI", 9, "bold"), wraplength=620)
        lbl.pack(anchor="w", pady=(0, 8))

        sql_box = scrolledtext.ScrolledText(frame, wrap=tk.NONE, font=("Consolas", 9), bg="#1e293b", fg="#e2e8f0")
        sql_box.insert(tk.END, sql_code)
        sql_box.configure(state=tk.DISABLED)
        sql_box.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        def copy_sql():
            self.root.clipboard_clear()
            self.root.clipboard_append(sql_code)
            messagebox.showinfo("Đã sao chép", "Đã sao chép mã SQL vào bộ nhớ tạm!")

        btn_box = ttk.Frame(frame)
        btn_box.pack(fill=tk.X)
        ttk.Button(btn_box, text="📋 Sao chép toàn bộ SQL", command=copy_sql).pack(side=tk.LEFT)
        ttk.Button(btn_box, text="Đóng", command=win.destroy).pack(side=tk.RIGHT)


def main():
    root = tk.Tk()
    app = APIDebugApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
