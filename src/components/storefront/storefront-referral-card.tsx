"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, Quote } from "lucide-react";
import type { StorefrontData } from "@/src/lib/storefront/types";
import { getReferralIdentity } from "@/src/lib/storefront/referral";

export function StorefrontReferralCard({ tracking }: { tracking: StorefrontData["tracking"] }) {
  const identity = getReferralIdentity(tracking);
  const [failedAvatar, setFailedAvatar] = useState<string>();
  if (!identity) return null;
  const initials = identity.name.split(/\s+/).filter(Boolean).slice(-2)
    .map((word) => Array.from(word)[0]).join("").toLocaleUpperCase("vi");

  return (
    <aside aria-label="Người giới thiệu tour" className="flex gap-3 rounded-2xl border border-[#cce0db] bg-[#f0f7f4] p-4 sm:p-5">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#204e4c] text-base font-semibold text-white">
        {identity.avatarUrl && failedAvatar !== identity.avatarUrl ? (
          <Image src={identity.avatarUrl} alt={"Ảnh đại diện " + identity.name} width={48} height={48}
            unoptimized referrerPolicy="no-referrer" className="size-12 object-cover"
            onError={() => setFailedAvatar(identity.avatarUrl)} />
        ) : <span aria-hidden="true">{initials}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#436560]">Được giới thiệu bởi</p>
        <p className="break-words text-base font-bold text-[#204e4c]">{identity.name}</p>
        {identity.verified && <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#204e4c]">
          <BadgeCheck aria-hidden="true" className="size-4 shrink-0" /> Đối tác đã xác minh
        </span>}
        {identity.tip && <blockquote className="mt-3 flex gap-2 text-sm leading-relaxed text-slate-700">
          <Quote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#64837c]" /><p>{identity.tip}</p>
        </blockquote>}
      </div>
    </aside>
  );
}
