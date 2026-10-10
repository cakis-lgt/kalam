import type { Metadata } from "next";
import { AdminHistoryClient } from "@/components/admin/AdminHistoryClient";

export const metadata: Metadata = {
  title: "Distribution History — ALIKHTIBAR Admin",
};

export default function AdminHistoryPage() {
  return (
    <>
      <div className="mb-[22px]">
        <h1 className="font-heading text-[29px] font-semibold text-ink">
          Distribution History
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-subtle">
          Record of session assignments to examiners and their status.
        </p>
      </div>
      <AdminHistoryClient />
    </>
  );
}
