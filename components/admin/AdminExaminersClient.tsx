"use client";

import { useEffect, useState } from "react";
import type { ExaminerCard } from "@/lib/admin/mock-data";
import { ExaminerWorkloadCard } from "./ExaminerWorkloadCard";

export function AdminExaminersClient() {
  const [examiners, setExaminers] = useState<ExaminerCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/examiners")
      .then((r) => r.json())
      .then((data: { examiners: ExaminerCard[] }) => {
        setExaminers(data.examiners ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-subtle">
        Loading examiner list…
      </div>
    );
  }

  if (examiners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center">
        <p className="font-semibold text-ink">No examiners registered yet</p>
        <p className="mt-1 text-[13.5px] text-ink-subtle">
          Add accounts with the examiner role in the database.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {examiners.map((e) => (
        <ExaminerWorkloadCard key={e.id} examiner={e} />
      ))}
    </div>
  );
}
