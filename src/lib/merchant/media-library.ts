import { z } from "zod";
import { MEDIA_PLATFORMS } from "./media-schema.ts";

const uuid = z.string().regex(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
const webUrl = z.string().max(1000).refine(value => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
});
const itemSchema = z.object({
  id: uuid, merchantId: uuid, title: z.string().trim().min(1).max(255),
  videoUrl: webUrl, thumbnailUrl: webUrl.nullable(), platform: z.enum(MEDIA_PLATFORMS),
  duration: z.number().int().positive().max(3600).nullable(),
  styleTags: z.array(z.string().trim().min(1).max(50)).max(20),
  analysisMetadata: z.record(z.string(), z.unknown()), createdAt: z.string().min(1), updatedAt: z.string().min(1),
});
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const paginationSchema = z.object({total: count, page: count.positive(), limit: count.positive().max(100), totalPages: count.positive()});
export type LibraryItem = z.infer<typeof itemSchema>;
export type LibraryQuery = { page: number; limit: number; search: string; platform: "" | typeof MEDIA_PLATFORMS[number] };
export type LibraryPage = { items: LibraryItem[]; pagination: z.infer<typeof paginationSchema> };
export type LibraryResult = {status: "ready"; data: LibraryPage} | {status: "session" | "forbidden"} | {status: "error"; reason: "network" | "service" | "schema"};
export type LibraryRequest = (query: LibraryQuery, signal: AbortSignal) => Promise<LibraryResult>;
export const initialLibraryQuery: LibraryQuery = {page:1,limit:6,search:"",platform:""};

export function parseLibraryResponse(value: unknown, query: LibraryQuery): LibraryResult {
  const parsed = z.object({success:z.literal(true),data:z.array(itemSchema),pagination:paginationSchema}).safeParse(value);
  if (!parsed.success) return {status:"error",reason:"schema"};
  const {data:items,pagination:p} = parsed.data;
  if (p.page!==query.page || p.limit!==query.limit || p.totalPages!==Math.max(1,Math.ceil(p.total/p.limit))
    || items.length!==Math.min(p.limit,Math.max(0,p.total-(p.page-1)*p.limit)) || new Set(items.map(item=>item.id)).size!==items.length) return {status:"error",reason:"schema"};
  // Do not infer ownership from merchantId. Shared vs private scope needs BE/BA confirmation.
  return {status:"ready",data:{items,pagination:p}};
}

export function toMediaCardProps(item: LibraryItem) {
  return {id:item.id,title:item.title,thumbnailUrl:item.thumbnailUrl,durationSeconds:item.duration,styleTags:item.styleTags};
}

// Prepared transport only. The live page does not invoke it until scope/authorization is confirmed.
export async function readLibrary(query: LibraryQuery, signal: AbortSignal, send: typeof fetch): Promise<LibraryResult> {
  const params = new URLSearchParams({page:String(query.page),limit:String(query.limit)});
  if(query.search) params.set("search",query.search);
  if(query.platform) params.set("platform",query.platform);
  try {
    const response = await send(`/api/merchant/media?${params}`,{method:"GET",credentials:"same-origin",cache:"no-store",redirect:"error",signal});
    if(response.status===401) return {status:"session"};
    if(response.status===403) return {status:"forbidden"};
    if(!response.ok) return {status:"error",reason:"service"};
    let value:unknown;try {value=await response.json();} catch {return {status:"error",reason:"schema"};}
    return parseLibraryResponse(value,query);
  } catch {return {status:"error",reason:"network"};}
}
