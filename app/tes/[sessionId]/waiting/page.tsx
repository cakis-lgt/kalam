import type { Metadata } from "next";
import { WaitingRoom } from "@/components/tes/WaitingRoom";

export const metadata: Metadata = {
  title: "Awaiting Review — ALIKHTIBAR",
  description:
    "Your examiner is reviewing your Speaking test responses. Your score will appear automatically.",
};

type Props = {
  params: Promise<{ sessionId: string }>;
};

export default async function WaitingPage({ params }: Props) {
  const { sessionId } = await params;

  return <WaitingRoom sessionId={sessionId} />;
}
