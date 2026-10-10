import type { Metadata } from "next";
import { ExaminerHistoryClient } from "@/components/examiner/ExaminerHistoryClient";

export const metadata: Metadata = {
  title: "Scoring History — ALIKHTIBAR Examiner",
};

export default function ExaminerHistoryPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-[29px] font-semibold text-ink">
          Scoring History
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-subtle">
          Sessions you have scored and published.
        </p>
      </div>
      <ExaminerHistoryClient />
    </>
  );
}
