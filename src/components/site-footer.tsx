import Link from "next/link";
import { Brand } from "./brand";
import { LegalLinks } from "./legal/legal-links";

export function SiteFooter() {
  return (
    <footer className="container footer">
      <Brand />
      <p>Được xây dựng cho những trải nghiệm Việt Nam.</p>
      <div className="footer-navigation">
        <Link href="/chat" className="footer-chat">Trò chuyện cùng AI ↗</Link>
        <LegalLinks />
      </div>
    </footer>
  );
}
