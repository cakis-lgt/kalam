import type { Metadata } from "next";
import { AdminExaminersClient } from "@/components/admin/AdminExaminersClient";

export const metadata: Metadata = {
  title: "Examiners — ALIKHTIBAR Admin",
};

export default function AdminExaminersPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-heading text-[29px] font-semibold text-ink">
          Examiners
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-subtle">
          Examiner list, level specializations, and current scoring workload.
        </p>
      </div>
      <AdminExaminersClient />
    </>
  );
}
