"use client";

import { useEffect, type RefObject } from "react";

/** Keep an open dialog within the visible area when the keyboard/URL bar moves. */
export function useDialogViewport(ref: RefObject<HTMLDialogElement | null>, open: boolean) {
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      frame = 0;
      dialog.style.setProperty("--dialog-viewport-height", `${viewport?.height ?? innerHeight}px`);
      dialog.style.setProperty("--dialog-viewport-top", `${viewport?.offsetTop ?? 0}px`);
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && dialog.contains(focused) && focused.matches("input,select,textarea")) {
        focused.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      dialog.style.removeProperty("--dialog-viewport-height");
      dialog.style.removeProperty("--dialog-viewport-top");
    };
  }, [ref, open]);
}
