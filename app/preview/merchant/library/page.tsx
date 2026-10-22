import { notFound } from "next/navigation";
import { LibraryShell } from "@/src/components/merchant/library-shell";
export const metadata={title:"Mô phỏng Merchant Media Library",robots:{index:false,follow:false}};
export default async function MediaPreviewPage(){
  if(process.env.NODE_ENV!=="development")notFound();
  const {MediaLibraryPreview}=await import("./preview");
  return <LibraryShell preview><MediaLibraryPreview /></LibraryShell>;
}
