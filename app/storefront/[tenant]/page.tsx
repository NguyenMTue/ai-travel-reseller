import type { Metadata } from "next";
import { resolveStorefrontData } from "@/src/lib/storefront/data";
import { StorefrontView } from "@/src/components/storefront/storefront-view";

type PageProps = {
  params: Promise<{
    tenant: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { tenant } = await params;
  const search = await searchParams;
  const data = await resolveStorefrontData({ tenant, slug: "default", searchParams: search });

  const title = `${data.merchant.name} - Trang Đích Tour & Vé Tham Quan Chính Hãng`;
  const description = `${data.merchant.tagline}. Đặt vé trực tuyến chính hãng, quét mã QR vào cổng không xếp hàng.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.product.galleryImages[0]?.url ? [data.product.galleryImages[0].url] : [],
      type: "website",
    },
  };
}

export default async function StorefrontTenantHomePage({ params, searchParams }: PageProps) {
  const { tenant } = await params;
  const search = await searchParams;
  const data = await resolveStorefrontData({ tenant, slug: "default", searchParams: search });

  return <StorefrontView data={data} />;
}
