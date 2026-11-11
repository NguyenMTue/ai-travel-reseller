"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ChevronDown, X } from "lucide-react";

import { useDialogViewport } from "../use-dialog-viewport";
import mobileStyles from "../mobile-dialog.module.css";

export interface ResellerFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqItems = [
  {
    question: "Khi nào tôi được nhận hoa hồng?",
    answer:
      "Hoa hồng được đối soát và ghi nhận vào ví ngay khi đơn hàng hoàn tất thanh toán.",
  },
  {
    question: "Hạn mức rút tiền tối thiểu là bao nhiêu?",
    answer:
      "Hạn mức rút tiền tối thiểu là 100.000 VNĐ về tài khoản ngân hàng liên kết.",
  },
  {
    question: "Thời hạn hiệu lực của link tiếp thị?",
    answer:
      "Link tiếp thị có hiệu lực vĩnh viễn cho đến khi Merchant đóng chiến dịch.",
  },
  {
    question: "Làm thế nào để đăng video TikTok lên xu hướng?",
    answer:
      "Sử dụng video tỷ lệ 9:16 do AI tạo ra và tham khảo cẩm nang mẹo đăng bài.",
  },
  {
    question: "Tôi có bị mất hoa hồng nếu khách đổi tour không?",
    answer:
      "Hệ thống tự động tính hoa hồng dựa trên giá trị đơn hàng thực tế của khách.",
  },
];

export function ResellerFaqModal({
  isOpen,
  onClose,
}: ResellerFaqModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useDialogViewport(dialogRef, isOpen);

  function handleTabKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;

    const firstButton = closeButtonRef.current;
    const lastButton = dismissButtonRef.current;
    if (!firstButton || !lastButton) return;

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      if (dialog.open) dialog.close();
      previousFocus?.focus();
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reseller-faq-title"
      aria-describedby="reseller-faq-description"
      onKeyDown={handleTabKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutsideDialog =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;

        if (clickedOutsideDialog) onClose();
      }}
      className={`${mobileStyles.surface} [--dialog-width:600px] rounded-2xl border border-border bg-background p-4 text-foreground shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-sm sm:p-6`}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Đóng câu hỏi thường gặp"
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-4 sm:top-4"
      >
        <X size={20} aria-hidden="true" />
      </button>

      <p className="mb-2 pr-12 text-xs font-medium uppercase tracking-[0.12em] text-primary">
        Hỗ trợ Cộng tác viên
      </p>
      <h2
        id="reseller-faq-title"
        className="pr-12 font-[var(--font-display)] text-2xl font-medium leading-snug text-foreground sm:text-3xl"
      >
        Câu hỏi thường gặp
      </h2>
      <p
        id="reseller-faq-description"
        className="mt-2 text-sm leading-relaxed text-muted-foreground"
      >
        Thông tin về hoa hồng, link tiếp thị và cách chia sẻ video.
      </p>

      <div className="mt-5 grid gap-2">
        {faqItems.map(({ question, answer }, index) => (
          <details
            key={question}
            open={index === 0}
            className="group rounded-xl border border-border bg-white px-4"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 font-medium text-foreground marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <span>{question}</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-4 pr-7 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          ref={dismissButtonRef}
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Đóng
        </button>
      </div>
    </dialog>
  );
}
