import type { Viewport } from "next";
export const viewport: Viewport = { viewportFit: "cover" };
export default function ChatLayout({ children }: { children: React.ReactNode }) { return children; }
