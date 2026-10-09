import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Brand } from "@/src/components/brand";
export default function AuthLayout({ children }: { children: React.ReactNode }) { return <div className="auth-shell"><aside className="auth-art"><Image src="/coast.svg" fill priority alt="Phong cảnh biển miền Trung được minh họa" sizes="45vw" /><div className="auth-art-content"><Brand /><div><span className="eyebrow">TRAVELLINK AI · VIETNAM</span><h2>Những kết nối nhỏ.<br /><em>Hành trình lớn.</em></h2><p>Cùng đưa những trải nghiệm địa phương<br />đến với nhiều người hơn.</p></div><span className="auth-trust"><ShieldCheck size={18} /> Đồng hành cùng doanh nghiệp du lịch Việt.</span></div></aside><div className="auth-main"><Link href="/" className="back-link">← Trở về trang chủ</Link><main id="main-content" className="auth-card">{children}</main><p className="auth-bottom">TravelLink AI · Kết nối trải nghiệm Việt</p></div></div>; }
