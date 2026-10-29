"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { AudioLines, Clock3, Link2, MessageCircleQuestion, X } from "lucide-react";

export interface VideoPostingTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const postingTips = [
  {
    icon: Clock3,
    title: "Khung giờ vàng",
    description:
      "Thử đăng vào 11:30–13:00 hoặc 19:30–21:30 để tiếp cận khán giả vào giờ nghỉ trưa và buổi tối.",
  },
  {
    icon: AudioLines,
    title: "Giữ âm thanh AI gốc",
    description:
      "Giữ voiceover và nhạc nền (BGM) của video để duy trì phần âm thanh đã được hòa âm tối ưu.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Viết caption khơi gợi tò mò",
    description:
      "Dùng caption gợi mở trải nghiệm và thêm hashtag địa danh phù hợp như #DuLichDaNang, #BaNaHills.",
  },
  {
    icon: Link2,
    title: "Hướng khách đến link tiếp thị",
    description:
      "Mời khách nhấn vào link tiếp thị trên bio hoặc xem tin nhắn tự động để tìm hiểu và đặt dịch vụ.",
  },
];

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function VideoPostingTipsModal({
  isOpen,
  onClose,
}: VideoPostingTipsModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    return () => previousFocus?.focus();
  }, [isOpen]);

  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
    ).filter((element) => element.getClientRects().length > 0);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && (activeElement === firstElement || !dialogRef.current?.contains(activeElement))) {
      event.preventDefault();
      lastElement.focus();
    } else if (
      !event.shiftKey &&
      (activeElement === lastElement || !dialogRef.current?.contains(activeElement))
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-posting-tips-title"
        aria-describedby="video-posting-tips-description"
        onKeyDown={trapFocus}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground shadow-xl sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Đóng mẹo đăng video"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-6 sm:top-6"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <p className="mb-2 pr-10 text-xs font-medium uppercase tracking-[0.12em] text-primary">
          Cẩm nang dành cho Reseller
        </p>
        <h2
          id="video-posting-tips-title"
          className="pr-10 font-[var(--font-display)] text-2xl font-medium leading-snug text-foreground sm:text-3xl"
        >
          Mẹo Đăng Video AI Triệu View Dành Cho Reseller
        </h2>
        <p
          id="video-posting-tips-description"
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          Một vài gợi ý giúp bạn chia sẻ video và dẫn khách đến đúng link tiếp thị.
        </p>

        <ul className="mt-6 grid gap-4">
          {postingTips.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3 rounded-xl bg-secondary p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-background text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-medium text-secondary-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Đã hiểu
          </button>
        </div>
      </section>
    </div>
  );
}
