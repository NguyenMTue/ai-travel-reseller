"""Client for asking the local n8n workflow to create a review draft."""

from typing import Any

import httpx

import config


def _unwrap_response(payload: Any) -> dict:
    """Accept the common response shapes from n8n Webhook/Respond to Webhook."""
    if isinstance(payload, list):
        if not payload:
            raise RuntimeError("n8n trả về danh sách kết quả rỗng.")
        payload = payload[0]
    if isinstance(payload, dict) and isinstance(payload.get("json"), dict):
        payload = payload["json"]
    if isinstance(payload, dict) and isinstance(payload.get("body"), dict):
        payload = payload["body"]
    if not isinstance(payload, dict):
        raise RuntimeError("Phản hồi từ n8n không phải JSON object.")
    return payload


def generate_review_via_n8n(product: dict) -> dict:
    """Submit one selected Supabase product to n8n and return its review draft."""
    if not isinstance(product, dict):
        raise ValueError("Hãy chọn một sản phẩm trong danh sách Supabase.")
    product_id = str(product.get("product_id") or "").strip()
    if not product_id:
        raise ValueError("Sản phẩm được chọn chưa có product_id.")

    config.reload_config()
    webhook_url = config.N8N_REVIEW_WEBHOOK_URL
    if not webhook_url:
        raise RuntimeError(
            "Chưa cấu hình N8N_REVIEW_WEBHOOK_URL trong file .env. "
            "Hãy dán Production URL của Webhook n8n vào đó rồi khởi động lại ứng dụng."
        )

    headers = {}
    if config.N8N_WEBHOOK_TOKEN:
        headers["X-Webhook-Token"] = config.N8N_WEBHOOK_TOKEN

    try:
        response = httpx.post(
            webhook_url,
            # Send normalized product facts so n8n does not need to look up
            # the catalog in Google Sheets. Keep product_id at top level for
            # compatibility with the current workflow and review sheet.
            # Include flat fields for existing n8n expressions such as
            # $json.body.product_name, and the nested object for the newer
            # $json.body.product.product_name form.
            json={**product, "product_id": product_id, "product": product},
            headers=headers,
            timeout=240,
        )
    except httpx.HTTPError as exc:
        raise RuntimeError(f"Không gọi được Webhook n8n: {exc}") from exc

    if response.is_error:
        detail = response.text[:1000]
        raise RuntimeError(f"Webhook n8n trả lỗi HTTP {response.status_code}: {detail}")

    try:
        payload = response.json()
    except ValueError as exc:
        content_type = response.headers.get("content-type", "không có Content-Type")
        body_preview = " ".join(response.text.split())[:700] or "(phản hồi rỗng)"
        raise RuntimeError(
            "n8n đã trả phản hồi không phải JSON "
            f"(HTTP {response.status_code}, {content_type}). Nội dung nhận được: {body_preview}. "
            "Trong node Respond to Webhook, chọn Respond With = JSON và trả object có trường review_draft."
        ) from exc

    try:
        result = _unwrap_response(payload)
    except RuntimeError as exc:
        raise RuntimeError(
            f"n8n có trả JSON nhưng sai cấu trúc: {exc}. "
            f"JSON nhận được: {str(payload)[:700]}"
        ) from exc

    if result.get("status") in {"error", "failed", "FAILED"}:
        raise RuntimeError(str(result.get("message") or result.get("error") or "n8n báo xử lý thất bại."))
    if not isinstance(result.get("review_draft"), str) or not result["review_draft"].strip():
        raise RuntimeError(
            "n8n chưa trả trường review_draft. Hãy cấu hình Respond to Webhook trả JSON có review_draft."
        )
    result.setdefault("product_id", product_id)
    return result
