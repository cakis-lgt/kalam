import type { Metadata } from "next";
import { ExaminerQueueClient } from "@/components/examiner/ExaminerQueueClient";

export const metadata: Metadata = {
  title: "Scoring Queue — ALIKHTIBAR Examiner",
  description: "Speaking test session queue for ALIKHTIBAR examiner scoring.",
};

export default function ExaminerDashboardPage() {
  return <ExaminerQueueClient />;
}
