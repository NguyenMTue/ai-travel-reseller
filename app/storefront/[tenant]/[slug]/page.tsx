import type { Metadata } from "next";
import { resolveStorefrontData } from "@/src/lib/storefront/data";
import { StorefrontView } from "@/src/components/storefront/storefront-view";

type PageProps = {
  params: Promise<{
    tenant: string;
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { tenant, slug } = await params;
  const search = await searchParams;
  const data = await resolveStorefrontData({ tenant, slug, searchParams: search });

  const title = `${data.product.name} | ${data.merchant.name}`;
  const description = `${data.product.subtitle} Đặt vé chính hãng ưu đãi chỉ từ ${data.product.salePrice.toLocaleString()} ₫. Quét mã QR vào cổng không xếp hàng.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: data.product.galleryImages[0]?.url ? [data.product.galleryImages[0].url] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: data.product.galleryImages[0]?.url ? [data.product.galleryImages[0].url] : [],
    },
  };
}

export default async function StorefrontProductPage({ params, searchParams }: PageProps) {
  const { tenant, slug } = await params;
  const search = await searchParams;
  const data = await resolveStorefrontData({ tenant, slug, searchParams: search });

  return <StorefrontView data={data} />;
}
