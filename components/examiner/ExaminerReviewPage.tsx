"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ExaminerReviewSession } from "@/lib/examiner/mock-data";
import {
  sessionStatusLabel,
  sessionStatusStyle,
} from "@/lib/examiner/session-status";
import { SessionReviewClient } from "./SessionReviewClient";
import { CandidateDetailsCard } from "@/components/shared/CandidateProfileDisplay";

type Props = {
  sessionId: string;
};

export function ExaminerReviewPage({ sessionId }: Props) {
  const [session, setSession] = useState<ExaminerReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/examiner/sessions/${sessionId}`);
      const data = (await res.json()) as {
        session?: ExaminerReviewSession;
        error?: string;
      };
      if (data.session) setSession(data.session);
      else setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/examiner/sessions/${sessionId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setToast(data.error ?? "Failed to claim session");
        return;
      }
      await loadSession();
      setToast("Session claimed successfully");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-ink-subtle">
        Loading review session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="font-semibold text-ink">Session not found</p>
        <Link href="/examiner" className="mt-2 inline-block text-sm text-primary">
          ← Back to queue
        </Link>
      </div>
    );
  }

  const statusStyle = sessionStatusStyle(session.status);
  const canEdit =
    session.status === "under_review" && !session.draft?.publishedAt;
  const needsClaim = session.status === "awaiting_review";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3.5">
          <Link
            href="/examiner"
            className="rounded-[9px] border border-border-light bg-white px-[13px] py-2 text-[13px] font-medium text-ink-muted hover:bg-surface-container"
          >
            ← Queue
          </Link>
          <div>
            <div className="font-heading text-[17px] font-semibold text-ink">
              {session.candidateName}
            </div>
            <div className="text-[12.5px] text-ink-faint">
              Test {session.dateLabel} · {session.recordings.length || session.taskCount}{" "}
              tasks · {session.testLanguage === "en" ? "English" : "Arabic"} · Target{" "}
              {session.targetLevel}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex items-center gap-2 rounded-full px-[13px] py-[7px] text-[12.5px] font-semibold"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: statusStyle.dot }}
            />
            {sessionStatusLabel(session.status)}
          </div>

          {needsClaim && (
            <button
              type="button"
              disabled={claiming}
              onClick={() => void handleClaim()}
              className="rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary hover:bg-kalam-600 disabled:opacity-60"
            >
              {claiming ? "Claiming…" : "Claim this session"}
            </button>
          )}
        </div>
      </div>

      {needsClaim && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This session is still awaiting claim. You can watch recordings, but
          the rubric and publish actions unlock after you click{" "}
          <strong>Claim this session</strong>.
        </div>
      )}

      <CandidateDetailsCard candidate={session.candidate} />

      <SessionReviewClient
        session={session}
        canEdit={canEdit}
        onDraftSaved={(msg) => setToast(msg)}
        onPublished={(msg) => {
          setToast(msg);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  status: "completed",
                  draft: {
                    overallLevel: prev.draft?.overallLevel ?? prev.targetLevel,
                    dimensionScores: prev.draft?.dimensionScores ?? {},
                    dimensionNotes: prev.draft?.dimensionNotes ?? {},
                    summary: prev.draft?.summary ?? "",
                    publishedAt: new Date().toISOString(),
                  },
                }
              : prev,
          );
        }}
      />

      {toast && (
        <div className="fixed bottom-[26px] left-1/2 z-50 flex -translate-x-1/2 animate-kfade items-center gap-2.5 rounded-xl bg-[#16a34a] px-[22px] py-[13px] text-sm font-semibold text-white shadow-[0_16px_30px_-12px_rgba(0,0,0,0.4)]">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
