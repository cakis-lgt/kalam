"use client";

import { useEffect, useState } from "react";
import type { DistributionHistoryItem } from "@/lib/admin/mock-data";
import { CandidateMetaLine } from "@/components/shared/CandidateProfileDisplay";

export function AdminHistoryClient() {
  const [items, setItems] = useState<DistributionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/history")
      .then((r) => r.json())
      .then((data: { items: DistributionHistoryItem[] }) => {
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-subtle">
        Loading history…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center">
        <p className="font-semibold text-ink">No distribution history yet</p>
        <p className="mt-1 text-[13.5px] text-ink-subtle">
          Session assignments to examiners will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="hidden grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr_1fr] gap-3 border-b border-border bg-page-alt px-5 py-3.5 text-[11.5px] font-semibold tracking-[0.03em] text-ink-faint md:grid">
        <div>CANDIDATE</div>
        <div>NIM / CAMPUS</div>
        <div>ASSIGNED TO</div>
        <div>DATE</div>
        <div className="text-right">STATUS</div>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 border-b border-[#eef2f7] px-5 py-3.5 last:border-b-0 md:grid md:grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr_1fr] md:items-center md:gap-3"
        >
          <div className="flex items-center gap-[11px]">
            <div
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: item.avatarBg }}
            >
              {item.candidateInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">
                {item.candidateName}
              </div>
              <div className="text-xs text-ink-faint">
                Target {item.targetLevel}
              </div>
              <CandidateMetaLine candidate={item.candidate} />
            </div>
          </div>

          <div className="text-[13px] text-ink-muted">
            <div className="font-medium">{item.candidate.nim ?? "—"}</div>
            <div className="text-xs text-ink-faint">
              {item.candidate.campus ? `Campus ${item.candidate.campus}` : "—"}
              {item.candidate.preferredLanguage
                ? ` · ${item.candidate.preferredLanguage === "en" ? "EN" : "AR"}`
                : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{ backgroundColor: item.examinerColor }}
            >
              {item.examinerInitials}
            </div>
            <span className="text-[13.5px] font-medium text-ink-muted">
              {item.examinerName}
            </span>
          </div>

          <div className="text-[13px] text-ink-muted">{item.dateLabel}</div>

          <div className="md:text-right">
            <span
              className="inline-block rounded-full px-3 py-[5px] text-xs font-semibold"
              style={{
                color: item.statusColor,
                backgroundColor: item.statusBg,
              }}
            >
              {item.statusLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
