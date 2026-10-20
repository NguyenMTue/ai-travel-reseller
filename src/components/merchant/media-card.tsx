"use client";

import Image from "next/image";

export interface MediaCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  styleTag: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function formatDuration(durationSeconds: number) {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MediaCard({
  id,
  title,
  thumbnailUrl,
  durationSeconds,
  styleTag,
  isSelected = false,
  onSelect,
}: MediaCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white transition-colors ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
      aria-label={title}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-muted">
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 260px"
          className="object-cover"
        />
        <span className="absolute bottom-3 right-3 rounded bg-black/75 px-2 py-1 text-xs font-medium text-white">
          {formatDuration(durationSeconds)}
        </span>
      </div>

      <div className="grid gap-3 p-4">
        <div className="grid gap-2">
          <h3 className="line-clamp-2 font-medium leading-snug text-foreground">
            {title}
          </h3>
          <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
            {styleTag}
          </span>
        </div>

        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect?.(id)}
          className={`min-h-10 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-foreground hover:bg-secondary"
          }`}
        >
          {isSelected ? "Đã chọn" : "Chọn mẫu"}
        </button>
      </div>
    </article>
  );
}
