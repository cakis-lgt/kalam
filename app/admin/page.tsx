import type { Metadata } from "next";
import { AdminDistributionClient } from "@/components/admin/AdminDistributionClient";

export const metadata: Metadata = {
  title: "Score Distribution — ALIKHTIBAR Admin",
  description: "Exam coordinator: distribute Speaking sessions to examiners.",
};

export default function AdminDashboardPage() {
  return <AdminDistributionClient />;
}
