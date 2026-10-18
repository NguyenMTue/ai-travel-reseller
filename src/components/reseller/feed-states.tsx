import type { ReactNode } from "react";
import { Layers3 } from "lucide-react";

export function FeedNotice({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="rounded-xl border border-border bg-white px-5 py-12 text-center sm:px-8"
    >
      <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
        <Layers3 size={22} aria-hidden="true" />
      </span>
      <h2 className="text-2xl font-medium text-foreground [font-family:var(--font-display)]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
        {description}
      </p>
      {children && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      )}
    </section>
  );
}

export function FeedLoading() {
  return (
    <section aria-busy="true" aria-label="Đang tải chiến dịch">
      <p role="status" className="mb-6 text-sm text-muted-foreground">
        Đang tải chiến dịch…
      </p>
      <div
        aria-hidden="true"
        className="mb-8 h-28 animate-pulse rounded-xl bg-muted"
      />
      <div
        aria-hidden="true"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-72 animate-pulse rounded-xl border border-border bg-muted"
          />
        ))}
      </div>
    </section>
  );
}
