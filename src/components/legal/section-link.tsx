"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function SectionLink({
  href,
  className,
  children,
}: {
  href: `#${string}`;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onNavigate={() => {
        // Next preserves route history; explicitly move keyboard focus as well.
        document.getElementById(href.slice(1))?.focus({ preventScroll: true });
      }}
    >
      {children}
    </Link>
  );
}
