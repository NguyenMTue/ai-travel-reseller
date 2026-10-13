"use client";

import Link from "next/link";
import { AlertCircle, RotateCw } from "lucide-react";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main-content" className="system-state-page">
      <section className="system-state-content" aria-labelledby="error-title">
        <span className="system-state-icon error" aria-hidden="true">
          <AlertCircle size={27} />
        </span>
        <p className="eyebrow">TẠM THỜI GIÁN ĐOẠN</p>
        <h1 id="error-title">Trang chưa thể tải lúc này</h1>
        <p className="system-state-description">
          Đã có lỗi khi hiển thị nội dung. Bạn có thể thử tải lại trang hoặc quay
          về trang chủ.
        </p>
        <div className="system-state-actions">
          <button type="button" className="button button-primary" onClick={retry}>
            <RotateCw aria-hidden="true" /> Thử tải lại
          </button>
          <Link href="/" className="button button-outline">
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}
