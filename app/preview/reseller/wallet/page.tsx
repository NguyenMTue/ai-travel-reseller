import { notFound } from "next/navigation";
import { ResellerShell } from "@/src/components/reseller/shell";
export const metadata = {title: "Mô phỏng Ví hoa hồng", robots: {index:false, follow:false}};
export const viewport = {viewportFit:"cover"};
export default async function WalletPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { WalletPreview } = await import("./preview");
  return <ResellerShell preview><WalletPreview /></ResellerShell>;
}
