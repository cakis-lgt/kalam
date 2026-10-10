import type { Metadata } from "next";
import { ExaminerReviewPage } from "@/components/examiner/ExaminerReviewPage";

export const metadata: Metadata = {
  title: "Session Review — ALIKHTIBAR Examiner",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExaminerSessionPage({ params }: Props) {
  const { id } = await params;
  return <ExaminerReviewPage sessionId={id} />;
}
