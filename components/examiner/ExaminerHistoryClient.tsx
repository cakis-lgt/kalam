"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExaminerHistoryItem } from "@/lib/examiner/mock-data";
import { cefrSolidClass } from "@/lib/dashboard/cefr-badge";

export function ExaminerHistoryClient() {
  const [items, setItems] = useState<ExaminerHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/examiner/history")
      .then((r) => r.json())
      .then((data: { items: ExaminerHistoryItem[] }) => {
        setItems(data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-subtle">Loading history…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center">
        <p className="font-semibold text-ink">No published scores yet</p>
        <Link href="/examiner" className="mt-3 inline-block text-sm text-primary hover:underline">
          Go to scoring queue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/examiner/sessions/${item.id}`}
          className="flex flex-wrap items-center gap-[18px] rounded-[14px] border border-border bg-white px-5 py-4 transition-colors hover:bg-page-alt sm:flex-nowrap"
        >
          <div
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[11px] font-heading text-base font-bold text-white ${cefrSolidClass(item.level)}`}
          >
            {item.level}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14.5px] font-semibold text-ink">
              {item.candidateName}
            </div>
            <div className="text-[12.5px] text-ink-faint">{item.meta}</div>
          </div>
          <div className="text-right">
            <div
              className="text-[13px] font-bold"
              style={{ color: item.bandColor }}
            >
              {item.bandLabel}
            </div>
            <div className="text-xs text-ink-faint">
              average {item.averageScore}/5
            </div>
          </div>
          <span className="rounded-full bg-[#eef6ee] px-3 py-[5px] text-xs font-semibold text-[#16a34a]">
            Published
          </span>
        </Link>
      ))}
    </div>
  );
}
