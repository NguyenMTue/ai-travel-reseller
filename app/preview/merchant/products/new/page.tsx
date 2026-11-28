import { notFound } from "next/navigation";
import { ProductCreateScreen } from "@/src/components/merchant/product-create";
export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <><p className="notice mx-6 mt-5">BẢN XEM TRƯỚC · Dữ liệu mô phỏng, không ghi vào hệ thống thật.</p><ProductCreateScreen preview /></>;
}
