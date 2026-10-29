"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/**
 * Media API mapping:
 * - id, title, thumbnailUrl, and styleTags map directly from MediaReferenceItem.
 * - API `duration` is seconds and maps to `durationSeconds` here.
 * - isSelected and onSelect are UI selection state and have no API fields.
 */
export interface MediaCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  styleTags?: string[];
  isSelected?: boolean;
  selectionBadge?: string;
  onSelect?: (id: string) => void;
}

function formatDuration(durationSeconds: number | null | undefined) {
  if (
    typeof durationSeconds !== "number" ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 0
  ) {
    return null;
  }

  const totalSeconds = Math.floor(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MediaCard({
  id,
  title,
  thumbnailUrl,
  durationSeconds,
  styleTags = [],
  isSelected = false,
  selectionBadge,
  onSelect,
}: MediaCardProps) {
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState<string | null>(null);
  const normalizedThumbnailUrl = thumbnailUrl?.trim();
  const imageSrc =
    normalizedThumbnailUrl && failedThumbnailUrl !== normalizedThumbnailUrl
      ? normalizedThumbnailUrl
      : null;
  const durationLabel = formatDuration(durationSeconds);
  const tags = styleTags.filter(
    (tag): tag is string => typeof tag === "string" && tag.trim().length > 0,
  );

  return (
    <article
      className={`min-w-0 w-full max-w-full rounded-xl border bg-white transition-all cursor-pointer ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
          : "border-border hover:border-muted-foreground/40"
      }`}
      aria-label={title}
      onClick={() => onSelect?.(id)}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-t-xl bg-muted">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 260px"
            className="object-cover transition-transform hover:scale-105"
            onError={() => setFailedThumbnailUrl(imageSrc)}
          />
        ) : (
          <div
            role="img"
            aria-label="Không có ảnh xem trước"
            className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground"
          >
            Không có ảnh xem trước
          </div>
        )}

        {/* Badge thứ tự và vai trò trong luồng Hybrid */}
        {isSelected && selectionBadge && (
          <span className="absolute top-2.5 right-2.5 z-10 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg flex items-center gap-1">
            {selectionBadge}
          </span>
        )}

        {durationLabel && (
          <span className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
            {durationLabel}
          </span>
        )}
      </div>

      <div className="grid min-w-0 gap-3 p-4">
        <div className="grid min-w-0 gap-2">
          <h3 className="min-w-0 break-words font-medium leading-snug text-foreground text-sm line-clamp-2">
            {title}
          </h3>
          {tags.length > 0 && (
            <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Phong cách video">
              {tags.slice(0, 3).map((tag, index) => (
                <li
                  key={`${tag}-${index}`}
                  className="max-w-full whitespace-normal break-all rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>

        {onSelect && (
          <button
            type="button"
            aria-pressed={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(id);
            }}
            className={`min-h-9 w-full min-w-0 whitespace-normal break-words rounded-md border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isSelected
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-border text-foreground hover:bg-secondary"
            }`}
          >
            {isSelected ? `✓ ${selectionBadge || "Đã chọn"}` : "+ Chọn vào Video"}
          </button>
        )}
      </div>
    </article>
  );
}

/** Use this wrapper for a grid whose columns shrink with the available width. */
export function MediaCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-w-0 w-full grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-4">
      {children}
    </div>
  );
}
