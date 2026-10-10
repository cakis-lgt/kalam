"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buildWaitSteps } from "@/lib/tes/waiting-steps";
import { useWaitingSession } from "@/hooks/useWaitingSession";
import { useTestStore } from "@/store/testStore";
import { isAuthConfigured } from "@/lib/auth/config";

type Props = {
  sessionId: string;
};

export function WaitingRoom({ sessionId }: Props) {
  const router = useRouter();
  const authReady = isAuthConfigured();
  const session = useWaitingSession(sessionId);
  const { status, connected, loading, error, refresh, isComplete } = session;
  const finalResult = useTestStore((s) => s.finalResult);

  const [demoStep, setDemoStep] = useState(1);

  useEffect(() => {
    if (authReady) return;
    const timer = window.setInterval(() => {
      setDemoStep((s) => Math.min(s + 1, 2));
    }, 2800);
    return () => window.clearInterval(timer);
  }, [authReady]);

  const activeThrough = authReady
    ? isComplete
      ? 3
      : Math.max(1, session.waitStepIndex)
    : demoStep;

  const waitSteps = buildWaitSteps(activeThrough);
  const rtConnected = authReady ? connected : true;
  const rtLabel = rtConnected
    ? "Connected · score will appear automatically"
    : "Disconnected — refresh manually";

  useEffect(() => {
    if (authReady && isComplete) {
      router.replace(`/hasil?session=${sessionId}`);
    }
  }, [authReady, isComplete, sessionId, router]);

  async function handleSimulatePublish() {
    if (authReady && process.env.NODE_ENV === "development") {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
      } catch {
        // fall through to navigation
      }
    }
    router.push(finalResult ? `/hasil?session=${sessionId}` : `/hasil`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-10 py-10">
      <div className="w-full max-w-[480px] text-center">
        <div className="relative mx-auto mb-[30px] h-[120px] w-[120px]">
          <span className="absolute inset-0 animate-kping rounded-full bg-primary-container" />
          <span
            className="absolute inset-[14px] animate-kping rounded-full bg-primary-container"
            style={{ animationDelay: "0.5s" }}
          />
          <div className="absolute inset-6 flex items-center justify-center rounded-full bg-primary text-[34px]">
            🧑‍🏫
          </div>
        </div>

        <h1 className="font-heading text-[27px] font-semibold text-ink">
          Your examiner is reviewing your responses
        </h1>
        <p className="mt-2 text-[15px] leading-[1.6] text-ink-subtle">
          Your test recording is in the review queue. Your score will appear here
          automatically — usually within{" "}
          <strong className="text-ink-muted">5–15 minutes</strong>.
        </p>

        <div className="mt-[26px] rounded-[14px] border border-border bg-white p-2 text-left">
          {waitSteps.map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-3 px-[13px] py-[11px]"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: step.bg, color: step.color }}
              >
                {step.icon}
              </div>
              <span
                className="text-[13.5px] font-medium"
                style={{ color: step.txtColor }}
              >
                {step.label}
              </span>
              {step.spin && (
                <span className="ml-auto h-[13px] w-[13px] animate-spin rounded-full border-2 border-border border-t-primary" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-[12.5px] text-ink-subtle">
          <span
            className="h-2 w-2 animate-kpulse rounded-full"
            style={{ backgroundColor: rtConnected ? "#22c55e" : "#eab308" }}
          />
          {rtLabel}
        </div>

        {error && authReady && (
          <p className="mt-3 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          {!rtConnected && authReady && (
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="rounded-[10px] border border-border-light bg-white px-[18px] py-[11px] text-[13.5px] font-medium text-ink-muted transition-colors hover:bg-surface-container disabled:opacity-60"
            >
              {loading ? "Loading…" : "Refresh status"}
            </button>
          )}

          {(!authReady || process.env.NODE_ENV === "development") && !authReady && (
            <button
              type="button"
              onClick={() => void handleSimulatePublish()}
              className="rounded-[10px] bg-primary px-5 py-[11px] text-[13.5px] font-semibold text-on-primary hover:bg-kalam-600"
            >
              Simulate examiner publish →
            </button>
          )}

          <Link
            href="/dashboard"
            className="rounded-[10px] border border-border-light bg-white px-[18px] py-[11px] text-[13.5px] font-medium text-ink-muted transition-colors hover:bg-surface-container"
          >
            Wait on dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-ink-faint">
          Session{" "}
          <span className="font-mono">
            {sessionId.slice(0, 8).toUpperCase()}
          </span>
          {authReady && status === "under_review" ? " · under examiner review" : null}
          {!authReady ? " · demo mode (no Supabase)" : null}
        </p>
      </div>
    </div>
  );
}
