import { notFound } from "next/navigation";
export const metadata = { title: "Mô phỏng Chat Mobile", robots: { index: false, follow: false } };
export default async function ChatPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { ChatPreview } = await import("./preview");
  return <ChatPreview />;
}
