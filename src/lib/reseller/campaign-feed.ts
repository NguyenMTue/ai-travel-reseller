import { z } from "zod";
import { databaseUuidSchema } from "./database-uuid";

// Projection from 20261006162951_remote_schema.sql. This adapter is not a
// replacement for the generated public schema that BE1 still needs to supply.
const campaignRowSchema = z.object({
  id: databaseUuidSchema,
  product_id: databaseUuidSchema.nullable(),
  name: z.string(),
  target_location: z.string().nullable(),
  commission_rate: z.number().finite().nullable(),
  products: z.object({ category: z.string().nullable() }).nullable(),
});

export type CampaignFeedItem = {
  id: string;
  productId: string | null;
  name: string;
  location: string | null;
  category: string | null;
  commissionRate: number | null;
  approvedContentCount: number | null;
};

export function parseCampaignFeed(data: unknown): CampaignFeedItem[] {
  return z.array(campaignRowSchema).parse(data).map((row) => ({
    id: row.id,
    productId: row.product_id,
    name: row.name,
    location: row.target_location,
    category: row.products?.category ?? null,
    commissionRate: row.commission_rate,
    // Feed does not query counts per card. Publication is confirmed, but a
    // verified count still requires a scoped batch/aggregate read.
    approvedContentCount: null,
  }));
}

// Diagnostic comparison only: never merges or rewrites records by their name.
export function inspectCampaignIdentity(campaigns: readonly CampaignFeedItem[], title: string): {
  duplicateIds: boolean; sameTitleRecords: "none" | "distinct" | "repeated";
} {
  const matching = campaigns.filter((campaign) => normalizeSearch(campaign.name) === normalizeSearch(title));
  return {
    duplicateIds: new Set(campaigns.map((campaign) => campaign.id)).size !== campaigns.length,
    sameTitleRecords: matching.length < 2 ? "none"
      : new Set(matching.map((campaign) => campaign.id)).size === matching.length ? "distinct" : "repeated",
  };
}

export type CampaignFilters = {
  search: string;
  category: string;
  location: string;
  commission: "all" | "over-10" | "over-15" | "under-10" | "10-to-20" | "over-20";
};

export const defaultCampaignFilters: CampaignFilters = {
  search: "",
  category: "",
  location: "",
  commission: "all",
};

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi")
    .trim();
}

export function filterCampaigns(
  campaigns: CampaignFeedItem[],
  filters: CampaignFilters,
): CampaignFeedItem[] {
  const search = normalizeSearch(filters.search);
  return campaigns.filter((campaign) => {
    const matchesSearch = normalizeSearch(
      [campaign.name, campaign.location, campaign.category].filter(Boolean).join(" "),
    ).includes(search);
    const matchesCategory = !filters.category || campaign.category === filters.category;
    const matchesLocation = !filters.location || campaign.location === filters.location;
    const rate = campaign.commissionRate;
    const matchesCommission =
      filters.commission === "all" ||
      (rate !== null &&
        ((filters.commission === "over-10" && rate > 10) ||
          (filters.commission === "over-15" && rate > 15) ||
          (filters.commission === "under-10" && rate < 10) ||
          (filters.commission === "10-to-20" && rate >= 10 && rate <= 20) ||
          (filters.commission === "over-20" && rate > 20)));
    return matchesSearch && matchesCategory && matchesLocation && matchesCommission;
  });
}

export function getFilterOptions(campaigns: CampaignFeedItem[]) {
  const uniqueOptions = (values: (string | null)[]) =>
    [...new Set(values.filter((value): value is string => Boolean(value?.trim())))]
      .sort((a, b) => a.localeCompare(b, "vi"));
  return {
    categories: uniqueOptions(campaigns.map((campaign) => campaign.category)),
    locations: uniqueOptions(campaigns.map((campaign) => campaign.location)),
  };
}

export function formatCommission(rate: number | null): string {
  return rate === null
    ? "Chưa có hoa hồng"
    : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(rate)}%`;
}
