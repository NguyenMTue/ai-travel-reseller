import { z } from "zod";
import { databaseUuidSchema } from "@/src/lib/reseller/database-uuid";
import {
  campaignContractMessage, campaignCreatedMessage, campaignFailureMessages, campaignUncertainMessage, validateCampaignInput,
  type CampaignFailure, type CampaignFormLoadResult, type CampaignInput, type CampaignSaveResult,
} from "./campaign-form";
import type { CampaignCreatePolicy } from "./campaign-policy";
import { vietnamCampaignDates } from "./campaign-dates";

export type SourceReply = { data: unknown; error: unknown; status?: number };
export type CampaignInsert = Omit<CampaignInput, "start_date" | "end_date"> & {
  merchant_id: string; start_date: string; end_date: string; status: string;
};
export interface MerchantCampaignSource {
  getUser(): Promise<SourceReply>;
  getMerchant(userId: string): Promise<SourceReply>;
  listProducts(merchantId: string, offset: number): Promise<SourceReply>;
  getProduct(merchantId: string, productId: string): Promise<SourceReply>;
  insertCampaign(values: CampaignInsert): Promise<SourceReply>;
}

export function classifyCampaignFailure(error: unknown, status?: number): CampaignFailure {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (status === 401 || ["PGRST301", "PGRST302", "PGRST303"].includes(code)) return "session";
  if (code === "42501" || status === 403) return "permission";
  if (["42703", "42P01", "PGRST200", "PGRST204", "PGRST205"].includes(code)) return "schema";
  if (error instanceof TypeError || status === 0 || (status && status >= 500)
    || code.startsWith("08") || code.startsWith("PGRST00")) return "network";
  return "query";
}

const identitySchema = z.object({ id: databaseUuidSchema });
const productSchema = identitySchema.extend({ merchant_id: databaseUuidSchema, name: z.string().min(1) });
type Access = { status: "allowed"; merchantId: string } | { status: "error"; reason: CampaignFailure };

async function authorizeMerchant(source: MerchantCampaignSource): Promise<Access> {
  try {
    const user = await source.getUser();
    if (user.error) return { status: "error", reason: [400, 401, 403].includes(user.status || 0) ? "session" : classifyCampaignFailure(user.error, user.status) };
    if (user.data === null) return { status: "error", reason: "session" };
    const identity = identitySchema.safeParse(user.data);
    if (!identity.success) return { status: "error", reason: "schema" };
    // Membership is authoritative. Never authorize using client input or user_metadata.role.
    const membership = await source.getMerchant(identity.data.id);
    if (membership.error) return { status: "error", reason: classifyCampaignFailure(membership.error, membership.status) };
    if (membership.data === null) return { status: "error", reason: "permission" };
    const merchant = identitySchema.safeParse(membership.data);
    if (!merchant.success || merchant.data.id !== identity.data.id) return { status: "error", reason: "schema" };
    return { status: "allowed", merchantId: merchant.data.id };
  } catch (error) {
    return { status: "error", reason: classifyCampaignFailure(error, error instanceof TypeError ? 0 : undefined) };
  }
}

export async function loadMerchantCampaignForm(
  source: MerchantCampaignSource,
  policy: CampaignCreatePolicy | null,
): Promise<CampaignFormLoadResult> {
  const access = await authorizeMerchant(source);
  if (access.status !== "allowed") return access;
  try {
    const products: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    for (let offset = 0; ; ) {
      const result = await source.listProducts(access.merchantId, offset);
      if (result.error) return { status: "error", reason: classifyCampaignFailure(result.error, result.status) };
      const parsed = z.array(productSchema).safeParse(result.data);
      if (!parsed.success) return { status: "error", reason: "schema" };
      if (parsed.data.length === 0) break;
      for (const product of parsed.data) {
        if (product.merchant_id !== access.merchantId) return { status: "error", reason: "permission" };
        if (seen.has(product.id)) return { status: "error", reason: "schema" };
        seen.add(product.id);
        products.push({ id: product.id, name: product.name });
      }
      offset += parsed.data.length;
    }
    return { status: "ready", products, canSave: policy !== null };
  } catch (error) {
    return { status: "error", reason: classifyCampaignFailure(error, error instanceof TypeError ? 0 : undefined) };
  }
}

export async function saveMerchantCampaign(
  source: MerchantCampaignSource,
  input: unknown,
  policy: CampaignCreatePolicy | null,
): Promise<CampaignSaveResult> {
  const access = await authorizeMerchant(source);
  if (access.status !== "allowed") return { ...access, message: campaignFailureMessages[access.reason] };
  const validated = validateCampaignInput(input);
  if (!validated.success) return { status: "invalid", fieldErrors: validated.fieldErrors, message: validated.message };
  // Recheck product ownership on EVERY submit, independent of the rendered list.
  try {
    const product = await source.getProduct(access.merchantId, validated.data.product_id);
    if (product.error) {
      const reason = classifyCampaignFailure(product.error, product.status);
      return { status: "error", reason, message: campaignFailureMessages[reason] };
    }
    if (product.data === null) return { status: "invalid", fieldErrors: { product_id: "Sản phẩm không còn khả dụng cho doanh nghiệp. Vui lòng chọn lại." }, message: "Không thể sử dụng sản phẩm đã chọn." };
    const owned = productSchema.safeParse(product.data);
    if (!owned.success) return { status: "error", reason: "schema", message: campaignFailureMessages.schema };
    if (owned.data.id !== validated.data.product_id || owned.data.merchant_id !== access.merchantId) {
      return { status: "error", reason: "permission", message: campaignFailureMessages.permission };
    }
  } catch (error) {
    const reason = classifyCampaignFailure(error, error instanceof TypeError ? 0 : undefined);
    return { status: "error", reason, message: campaignFailureMessages[reason] };
  }
  if (!policy || !policy.initialStatus.trim() || policy.calendarDates !== "inclusive-local-day" || policy.timeZone !== "Asia/Ho_Chi_Minh") {
    return { status: "blocked", message: campaignContractMessage };
  }
  const payload: CampaignInsert = {
    ...validated.data, merchant_id: access.merchantId, status: policy.initialStatus,
    ...vietnamCampaignDates(validated.data.start_date, validated.data.end_date),
  };
  try {
    // Exactly one insert. No retry/upsert or second webhook after a transport failure.
    const result = await source.insertCampaign(payload);
    if (result.error) {
      const reason = classifyCampaignFailure(result.error, result.status);
      // After dispatch, network/5xx or ambiguous gateway errors are NOT proof of rollback.
      if (reason === "network" || reason === "query") return { status: "uncertain", message: campaignUncertainMessage };
      return { status: "error", reason, message: campaignFailureMessages[reason] };
    }
    const saved = z.object({ id: databaseUuidSchema, merchant_id: databaseUuidSchema, product_id: databaseUuidSchema, name: z.string() }).safeParse(result.data);
    if (!saved.success || saved.data.merchant_id !== access.merchantId
      || saved.data.product_id !== payload.product_id || saved.data.name !== payload.name) {
      return { status: "uncertain", message: campaignUncertainMessage };
    }
    return { status: "success", campaignId: saved.data.id, message: campaignCreatedMessage };
  } catch {
    return { status: "uncertain", message: campaignUncertainMessage };
  }
}
