import Link from "next/link";
import { Compass } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="TravelLink — Trang chủ">
      <span className="brand-mark">
        <Compass size={23} />
      </span>
      TravelLink<span className="brand-ai">AI</span>
    </Link>
  );
}
