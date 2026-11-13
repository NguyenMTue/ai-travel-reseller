import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    tenant: string;
    slug: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { tenant, slug } = await context.params;
  const requestUrl = new URL(request.url);

  const destination = new URL(
    `/storefront/${encodeURIComponent(tenant)}/${encodeURIComponent(slug)}`,
    requestUrl.origin,
  );

  requestUrl.searchParams.forEach((val, key) => {
    destination.searchParams.set(key, val);
  });

  return NextResponse.redirect(destination.toString(), 302);
}
