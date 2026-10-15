"use client";

import { useId, useRef, useState } from "react";
import { Copy, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { FeedNotice } from "./feed-states";
import { personas, type Persona, type ContentVariant } from "@/src/lib/reseller/content-kit";
import { dataFailureDescriptions, type DataFailureKind } from "@/src/lib/reseller/data-failure";
import { FeedRetry } from "./campaign-feed";
import { useTrackingScope } from "./tracking-scope";
import { prepareCtaWithLink, trackingScopeKey, trackingUrlAudience } from "@/src/lib/reseller/tracking-cta";

function CopyField({ label, value }: { label: string; value: string | null }) {
  const id = useId();
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle");
  const manual = useRef<HTMLTextAreaElement>(null);
  const writing = useRef(false);
  const hasText = Boolean(value?.trim());
  async function copy() {
    if (!hasText || value === null || writing.current) return;
    writing.current = true;
    setState("pending");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setState("success");
    } catch { setState("error"); }
    finally { writing.current = false; }
  }
  return (
    <section aria-labelledby={id} className="min-w-0 rounded-xl border border-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 id={id} className="text-base font-medium">{label}</h3>
        <Button type="button" size="sm" variant="outline" onClick={copy} disabled={!hasText || state === "pending"}>
          {state === "pending" ? <LoaderCircle className="animate-spin" aria-hidden /> : state === "success" ? <Check aria-hidden /> : <Copy aria-hidden />}
          Copy {label}
        </Button>
      </div>
      <div data-testid={`content-${label.toLowerCase()}`} className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
        {hasText ? value : `Chưa có ${label}.`}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-xs text-primary">
        {state === "pending" ? `Đang sao chép ${label}…` : state === "success" ? `Đã sao chép ${label}.` : ""}
      </div>
      {state === "error" && (
        <div className="mt-3">
          <p role="alert" className="text-sm text-[var(--danger)]">Không thể sao chép {label}. Bạn có thể sao chép thủ công bên dưới.</p>
          <label htmlFor={`${id}-manual`} className="mb-2 mt-3 block text-xs">Sao chép thủ công {label}</label>
          <textarea id={`${id}-manual`} ref={manual} value={value ?? ""} readOnly rows={5}
            className="w-full min-w-0 rounded-lg border border-border bg-background p-3 text-sm"
            aria-describedby={`${id}-help`} onFocus={(event) => event.currentTarget.select()} />
          <div id={`${id}-help`} className="my-3 text-xs text-muted-foreground">Chọn nội dung rồi nhấn Ctrl+C hoặc dùng lệnh Sao chép của thiết bị.</div>
          <Button type="button" size="sm" variant="secondary" onClick={() => { manual.current?.focus(); manual.current?.select(); }}>Chọn nội dung {label}</Button>
        </div>
      )}
    </section>
  );
}

function CopyCtaWithLink({ cta }: { cta: string | null }) {
  const { scope, link } = useTrackingScope();
  const prepared = prepareCtaWithLink(cta, link, scope);
  if (prepared.status !== "ready") return <section className="rounded-xl border border-border bg-secondary p-4 sm:p-5" aria-label="CTA kèm link">
    <h3 className="mb-3 font-medium">CTA kèm link</h3><p className="mb-4 text-sm">{prepared.message}</p>
    <Button type="button" size="sm" variant="outline" disabled>Copy CTA kèm link</Button>
  </section>;
  return <div>
    {link && trackingUrlAudience(link.shortUrl) === "local" && <p role="note" className="mb-3 text-sm">Link localhost/mạng nội bộ chỉ dùng kiểm thử local, chưa dùng để chia sẻ công khai.</p>}
    <CopyField key={`${scope ? trackingScopeKey(scope) : ""}:${prepared.value}`} label="CTA kèm link" value={prepared.value} />
    <p className="mt-2 text-xs text-muted-foreground">Chỉ thay [LINK_MUA_VE] trong bản sao. CTA gốc được giữ nguyên.</p>
  </div>;
}

export function ContentKit({ variants, contentStatus, contentReason }: {
  variants: ContentVariant[]; contentStatus: "blocked" | "ready" | "error"; contentReason?: DataFailureKind;
}) {
  const [persona, setPersona] = useState<Persona>("local-guide");
  const [variantId, setVariantId] = useState("");
  const selectId = useId();
  const available = contentStatus === "ready" ? variants.filter((variant) => variant.persona === persona) : [];
  const selected = available.find((variant) => variant.id === variantId) ?? available[0];
  return (
    <section aria-labelledby="content-kit-heading" className="mt-8 min-w-0">
      <h2 id="content-kit-heading" className="text-2xl [font-family:var(--font-display)]">Content Kit</h2>
      <div role="group" aria-label="Chọn persona" className="my-5 flex flex-wrap gap-2">
        {personas.map((option) => <Button key={option.id} type="button" aria-pressed={persona === option.id}
          variant={persona === option.id ? "default" : "outline"}
          onClick={() => { setPersona(option.id); setVariantId(""); }}>{option.label}</Button>)}
      </div>
      {contentStatus === "blocked" ? (
        <FeedNotice title="Nội dung đang chờ xác nhận quyền hiển thị"
          description="Chưa xác nhận status duyệt, giá trị persona và quyền xem nội dung chung/riêng. Content Kit và Copy sẽ khả dụng khi BE1/BE3 chốt contract; chưa đọc hoặc công bố contents." />
      ) : contentStatus === "error" ? (
        <FeedNotice title="Chưa thể tải Content Kit" description={dataFailureDescriptions[contentReason ?? "query"]}><FeedRetry /></FeedNotice>
      ) : variants.length === 0 ? (
        <FeedNotice title="Chưa có nội dung đủ điều kiện"
          description="Chưa có nội dung đã công bố phù hợp với chiến dịch và quyền truy cập của bạn trong bốn persona này." />
      ) : !selected ? (
        <FeedNotice title="Persona này chưa có nội dung" description="Chưa có biến thể nội dung được phép hiển thị cho persona đã chọn." />
      ) : (
        <>
          {(["hook", "script", "caption", "cta"] as const).some((field) => selected[field]?.includes("[LINK_MUA_VE]")) && (
            <p role="note" className="mb-4 rounded-lg border border-border bg-secondary p-3 text-sm">
              Nội dung còn [LINK_MUA_VE]. Bạn cần bổ sung link tiếp thị trước khi đăng.
            </p>
          )}
          <div className="mb-5 max-w-sm">
            <label htmlFor={selectId} className="mb-2 block text-sm">Biến thể</label>
            <select id={selectId} className="w-full" value={selected.id} onChange={(event) => setVariantId(event.target.value)}>
              {available.map((variant, index) => <option key={variant.id} value={variant.id}>Biến thể {index + 1}</option>)}
            </select>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            {(["hook", "script", "caption", "cta"] as const).map((field) => <CopyField key={`${selected.id}-${field}`}
              label={field === "cta" ? "CTA" : field.charAt(0).toUpperCase() + field.slice(1)} value={selected[field]} />)}
            <CopyCtaWithLink key={selected.id} cta={selected.cta} />
          </div>
        </>
      )}
    </section>
  );
}
