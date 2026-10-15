import Link from "next/link";

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Tài liệu chính sách">
      <Link href="/terms">Điều khoản sử dụng</Link>
      <Link href="/privacy">Chính sách quyền riêng tư</Link>
    </nav>
  );
}
