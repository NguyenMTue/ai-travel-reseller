"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  campaignContractMessage, campaignFields, campaignLimits, campaignUncertainMessage, emptyCampaignValues, validateCampaignInput,
  type CampaignField, type CampaignFieldErrors, type CampaignFormValues, type CampaignSaveResult, type CampaignSubmitAction, type MerchantProduct,
} from "@/src/lib/merchant/campaign-form";
import styles from "./campaign-create.module.css";

export function CampaignReloadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Button variant="outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    {pending ? "Đang tải lại…" : "Tải lại sản phẩm"}
  </Button>;
}

export function CampaignForm({ products, canSave, submitAction, preview = false }: {
  products: MerchantProduct[]; canSave: boolean; submitAction: CampaignSubmitAction; preview?: boolean;
}) {
  const [values, setValues] = useState<CampaignFormValues>({ ...emptyCampaignValues });
  const [errors, setErrors] = useState<CampaignFieldErrors>({});
  const [result, setResult] = useState<CampaignSaveResult | null>(null);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const locked = result?.status === "success" || result?.status === "uncertain";
  const noProducts = products.length === 0;
  const dashboard = preview ? "/preview/merchant" : "/merchant";

  useEffect(() => {
    if (result && result.status !== "invalid") resultRef.current?.focus();
  }, [result]);

  function focusFirstError(fieldErrors: CampaignFieldErrors) {
    const first = campaignFields.find(field => fieldErrors[field]);
    if (first) document.getElementById(first)?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || locked || !canSave || noProducts) return;
    const validated = validateCampaignInput(values);
    if (!validated.success) {
      setErrors(validated.fieldErrors);
      setResult({ status: "invalid", message: validated.message, fieldErrors: validated.fieldErrors });
      focusFirstError(validated.fieldErrors);
      return;
    }
    inFlight.current = true;
    setPending(true);
    setErrors({});
    setResult(null);
    try {
      const saved = await submitAction({ ...values });
      setResult(saved);
      if (saved.status === "invalid") {
        setErrors(saved.fieldErrors);
        focusFirstError(saved.fieldErrors);
      }
    } catch {
      // The action may have committed before its response was lost. Never auto-resubmit.
      setResult({ status: "uncertain", message: campaignUncertainMessage });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  const inputProps = (field: CampaignField) => ({
    id: field, name: field, value: values[field], required: true,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": [errors[field] ? `${field}-error` : "", field === "commission_rate" ? "commission-help" : ""].filter(Boolean).join(" ") || undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues(current => ({ ...current, [field]: event.target.value }));
      setErrors(current => ({ ...current, [field]: undefined }));
    },
  });
  const fieldError = (field: CampaignField) => errors[field]
    ? <p id={`${field}-error`} className={styles.fieldError}>{errors[field]}</p> : null;

  return (
    <form onSubmit={submit} noValidate aria-label="Thông tin chiến dịch" aria-busy={pending} className={styles.form}>
      {!canSave && <p id="campaign-blocker" className="notice">{campaignContractMessage}</p>}
      {noProducts && <section className={styles.empty} aria-labelledby="no-products-title">
        <h2 id="no-products-title">Chưa có sản phẩm để tạo chiến dịch</h2>
        <p>Sản phẩm thuộc doanh nghiệp của bạn sẽ xuất hiện tại đây khi có dữ liệu phù hợp.</p>
        <CampaignReloadButton />
      </section>}
      {result && <div ref={resultRef} tabIndex={-1} className={`${styles.result} ${result.status === "success" ? styles.success : ""}`} role={result.status === "success" ? "status" : "alert"}>
        <p>{preview && result.status === "success" ? "Mô phỏng thành công — không tạo chiến dịch thật." : result.message}</p>
        {result.status === "success" && <p className={styles.receipt}>Mã chiến dịch{preview ? " mô phỏng" : ""}: <code>{result.campaignId}</code></p>}
        {result.status === "error" && result.reason === "session" && <Link href="/login?next=/merchant/campaigns/new">Đăng nhập lại ↗</Link>}
      </div>}
      <fieldset disabled={pending || locked || noProducts} className={styles.fieldset}>
        <legend>Sản phẩm và nội dung</legend>
        <div className={styles.field}>
          <label htmlFor="product_id">Sản phẩm của doanh nghiệp <span aria-hidden="true">*</span></label>
          <select {...inputProps("product_id")}>
            <option value="">Chọn một sản phẩm</option>
            {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          {fieldError("product_id")}
        </div>
        <div className={styles.field}>
          <label htmlFor="name">Tên chiến dịch <span aria-hidden="true">*</span></label>
          <Input {...inputProps("name")} maxLength={campaignLimits.name} placeholder="Ví dụ: Khám phá miền Trung cùng gia đình" />
          {fieldError("name")}
        </div>
        <div className={styles.field}>
          <label htmlFor="target_audience">Đối tượng mục tiêu <span aria-hidden="true">*</span></label>
          <textarea {...inputProps("target_audience")} rows={4} maxLength={campaignLimits.target_audience} placeholder="Mô tả nhóm khách hàng bạn muốn tiếp cận…" />
          {fieldError("target_audience")}
        </div>
        <div className={styles.field}>
          <label htmlFor="target_location">Địa điểm mục tiêu <span aria-hidden="true">*</span></label>
          <Input {...inputProps("target_location")} maxLength={campaignLimits.target_location} placeholder="Ví dụ: Đà Nẵng, Hội An" />
          {fieldError("target_location")}
        </div>
      </fieldset>
      <fieldset disabled={pending || locked || noProducts} className={styles.fieldset}>
        <legend>Hoa hồng và thời gian</legend>
        <div className={styles.field}>
          <label htmlFor="commission_rate">Hoa hồng (%) <span aria-hidden="true">*</span></label>
          <Input {...inputProps("commission_rate")} type="number" inputMode="decimal" min={5} max={30} step="any" placeholder="Ví dụ: 10.5" />
          <p id="commission-help" className={styles.help}>Từ 5% đến 30%. Dùng dấu chấm cho phần thập phân.</p>
          {fieldError("commission_rate")}
        </div>
        <div className={styles.dates}>
          <div className={styles.field}>
            <label htmlFor="start_date">Ngày bắt đầu <span aria-hidden="true">*</span></label>
            <Input {...inputProps("start_date")} type="date" min="0001-01-01" max="9999-12-31" />
            {fieldError("start_date")}
          </div>
          <div className={styles.field}>
            <label htmlFor="end_date">Ngày kết thúc <span aria-hidden="true">*</span></label>
            <Input {...inputProps("end_date")} type="date" min="0001-01-01" max="9999-12-31" />
            {fieldError("end_date")}
          </div>
        </div>
      </fieldset>
      <section className={styles.aiNotes} aria-labelledby="ai-notes-title">
        <h2 id="ai-notes-title">Ghi chú cho AI</h2>
        <p id="ai-notes-help">Chưa hỗ trợ lưu ghi chú riêng cho AI. Vị trí lưu và cách sử dụng thông tin này đang chờ xác nhận.</p>
        <textarea id="ai-notes" aria-label="Ghi chú cho AI — chưa hỗ trợ" aria-describedby="ai-notes-help" disabled rows={3} placeholder="Tính năng này chưa nhận dữ liệu." />
      </section>
      <div className={styles.actions}>
        <Link href={dashboard} className={styles.returnLink}>Quay lại Dashboard</Link>
        <Button type="submit" disabled={pending || locked || noProducts || !canSave} aria-describedby={!canSave ? "campaign-blocker" : undefined}>
          {pending ? <><LoaderCircle className="spin" aria-hidden="true" /> Đang lưu…</> : <>{preview ? "Lưu mô phỏng" : "Lưu chiến dịch"}<ArrowRight aria-hidden="true" /></>}
        </Button>
      </div>
      <p className={styles.help}>Các trường có dấu * là bắt buộc. Lưu chiến dịch và kết quả tạo nội dung AI là hai bước riêng.</p>
    </form>
  );
}
