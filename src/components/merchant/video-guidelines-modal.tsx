"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface VideoGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoGuidelinesModal({
  isOpen,
  onClose,
}: VideoGuidelinesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }

    restoreFocusRef.current =
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
      restoreFocusRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="video-guidelines-title"
      aria-describedby="video-guidelines-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="relative p-6 sm:p-8">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Đóng hướng dẫn quy chuẩn video"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:right-6 sm:top-6"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <p className="mb-2 pr-10 text-xs font-medium uppercase tracking-[0.12em] text-primary">
          Thư viện video mẫu
        </p>
        <h2
          id="video-guidelines-title"
          className="pr-10 font-[var(--font-display)] text-2xl font-medium leading-snug text-foreground sm:text-3xl"
        >
          Quy chuẩn video du lịch
        </h2>
        <p
          id="video-guidelines-description"
          className="mt-3 text-sm leading-relaxed text-muted-foreground"
        >
          Video rõ nét, ngắn gọn giúp khách dễ hình dung trải nghiệm và phù hợp
          hơn với các nền tảng video ngắn.
        </p>

        <ul className="mt-6 grid gap-4">
          <li className="rounded-xl bg-secondary p-4">
            <h3 className="font-medium text-secondary-foreground">Khung hình</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              Ưu tiên video dọc tỷ lệ 9:16, tối ưu cho TikTok, Reels và Shorts.
            </p>
          </li>
          <li className="rounded-xl bg-secondary p-4">
            <h3 className="font-medium text-secondary-foreground">Thời lượng</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              Khuyến nghị từ 15 đến 45 giây để nội dung cô đọng và dễ theo dõi.
            </p>
          </li>
          <li className="rounded-xl bg-secondary p-4">
            <h3 className="font-medium text-secondary-foreground">Chất lượng</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              Tối thiểu Full HD 1080p, âm thanh rõ ràng và không có logo mờ đục
              che nội dung.
            </p>
          </li>
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
      </div>
    </dialog>
  );
}
