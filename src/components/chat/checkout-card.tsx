"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./checkout-card.module.css";
import { captureChatFunnelEvent } from "@/src/lib/analytics";
import { checkoutDestination } from "@/src/lib/chat/checkout";
import type { Attribution } from "@/src/lib/chat/transport";

export function CheckoutCard({ url, attribution, pending, expired, preview }: {
  url: unknown; attribution: Attribution | null; pending: boolean;
  expired: boolean; preview: boolean;
}) {
  const destination = checkoutDestination(url, attribution);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const unavailable = expired || !destination;
  return <section className="checkout-link" aria-label="Đặt vé với doanh nghiệp">
    <strong>Đặt dịch vụ trực tiếp với doanh nghiệp</strong>
    {unavailable ? <p role="status">{expired
      ? "Phiên hoặc liên kết không còn hợp lệ. Vui lòng mở lại liên kết sản phẩm từ cộng tác viên."
      : "Chưa có liên kết đặt vé hợp lệ cho sản phẩm này. Vui lòng xác nhận lại với doanh nghiệp."}</p>
      : <>
        <p>Bạn sẽ mở trang của {destination.hostname} trong thẻ mới. Việc mở trang chưa xác nhận đặt vé hoặc thanh toán.</p>
        <a href={destination.href} target="_blank" rel="noopener noreferrer"
          aria-disabled={pending || opening} className={styles.action}
          onClick={event => {
            if (pending || busy.current) { event.preventDefault(); return; }
            if (!navigator.onLine) {
              event.preventDefault();
              setNotice("Bạn đang ngoại tuyến. Hãy kết nối lại rồi tự mở trang đặt vé.");
              return;
            }
            busy.current = true;
            setOpening(true);
            if (preview) {
              event.preventDefault();
              setNotice("Mô phỏng mở checkout. Không truy cập doanh nghiệp, tạo đơn hoặc thanh toán.");
            } else {
              setNotice("Đã yêu cầu mở trang. Nếu không thấy thẻ mới, hãy kiểm tra trình duyệt rồi tự mở lại.");
              captureChatFunnelEvent("checkout_clicked", attribution, { checkout_domain: destination.hostname });
            }
            // Re-enable the user's action; never automatically retry navigation.
            timer.current = setTimeout(() => { busy.current = false; setOpening(false); }, 1500);
          }}>
          {opening ? "Đang mở trang đặt vé…" : "Đặt vé ngay ↗"}
        </a>
      </>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}