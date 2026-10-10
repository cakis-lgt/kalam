"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { KalamLogo } from "@/components/ui/KalamLogo";
import { CameraPreview } from "@/components/tes/CameraPreview";
import { isAuthConfigured } from "@/lib/auth/config";
import type { TestLanguage } from "@/types";
import { LANGUAGE_LABELS } from "@/lib/tes/task-prompt";

type Props = {
  onStart: (language: TestLanguage) => void;
  candidateName?: string;
  error?: string | null;
  onClearError?: () => void;
  initialLanguage?: TestLanguage | null;
};

const CHECK_ITEMS = [
  {
    icon: "✓",
    label: "Camera",
    sub: "Webcam active & face visible",
    ok: true,
  },
  {
    icon: "✓",
    label: "Microphone",
    sub: "Audio input detected",
    ok: true,
  },
  {
    icon: "◌",
    label: "Face detection",
    sub: "MediaPipe active during test (eye contact)",
    ok: false,
  },
] as const;

export function TestIntroScreen({
  onStart,
  error,
  onClearError,
  initialLanguage,
}: Props) {
  const [consent, setConsent] = useState(false);
  const [testLanguage, setTestLanguage] = useState<TestLanguage>(
    initialLanguage ?? "ar",
  );
  const [cameraOk, setCameraOk] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);

  useEffect(() => {
    // An explicit language passed in (e.g. from ?lang=en) always wins over the
    // candidate's stored preference — it reflects what the user just clicked.
    if (initialLanguage || !isAuthConfigured()) return;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: { preferred_language?: string } } | null) => {
        const lang = data?.profile?.preferred_language;
        if (lang === "ar" || lang === "en") {
          setTestLanguage(lang);
        }
      })
      .catch(() => undefined);

    fetch("/api/setup/status")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { ready?: boolean; message?: string } | null) => {
          if (data && !data.ready && data.message) {
            setSetupMessage(data.message);
          }
        },
      )
      .catch(() => undefined);
  }, []);

  const blockingError = setupMessage ?? error ?? cameraError;

  return (
    <div className="mx-auto max-w-[920px] px-margin-mobile py-9 md:px-gutter md:pb-16">
      <Link
        href="/dashboard"
        className="mb-[18px] inline-block text-[13.5px] font-medium text-ink-subtle hover:text-ink"
      >
        ← Back to dashboard
      </Link>

      <h1 className="font-heading text-[28px] font-semibold text-ink">
        Device check
      </h1>
      <p className="mt-1.5 text-[14.5px] text-ink-subtle">
        Choose your test language, then make sure your camera, microphone, and face
        detector are ready before the test starts.
      </p>

      <div className="mt-6">
        <div className="mb-2 text-[12.5px] font-semibold text-ink-muted">
          Test language
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["ar", "en"] as const).map((lang) => {
            const selected = testLanguage === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setTestLanguage(lang)}
                className={`rounded-[14px] border px-4 py-4 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary-container"
                    : "border-border-light bg-white hover:bg-surface-container"
                }`}
              >
                <div className="text-[15px] font-semibold text-ink">
                  {LANGUAGE_LABELS[lang]}
                </div>
                <div className="mt-1 text-[12.5px] text-ink-subtle">
                  {lang === "ar"
                    ? "Answer in Modern Standard Arabic"
                    : "Answer in English"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {blockingError && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Cannot start the test</div>
            <div className="mt-0.5">{blockingError}</div>
          </div>
          {error && onClearError && (
            <button
              type="button"
              onClick={onClearError}
              className="text-xs underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      <div className="mt-[26px] grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[#0a0f17]">
          <CameraPreview
            onReady={() => {
              setCameraOk(true);
              setCameraError(null);
            }}
            onError={setCameraError}
          />
          <div className="absolute left-3 top-3 flex items-center gap-[7px] rounded-full bg-black/50 px-[11px] py-[5px]">
            <span
              className={`h-2 w-2 rounded-full ${cameraOk ? "bg-[#22c55e]" : cameraError ? "bg-red-500" : "bg-ink-subtle"}`}
            />
            <span className="text-[11.5px] font-medium text-white">
              {cameraOk
                ? "Camera active"
                : cameraError
                  ? "Camera failed"
                  : "Waiting for camera"}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-[18px] rounded-[14px] border border-border bg-white px-1 py-1.5">
            {CHECK_ITEMS.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-[13px] px-3.5 py-3 ${
                  i < CHECK_ITEMS.length - 1 ? "border-b border-[#e6ecf3]" : ""
                }`}
              >
                <div
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[15px] font-bold ${
                    item.ok
                      ? "bg-[#eef6ee] text-[#16a34a]"
                      : "bg-surface-container text-ink-faint"
                  }`}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-ink">
                    {item.label}
                  </div>
                  <div className="text-xs text-ink-faint">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <label
            className={`mb-4 flex cursor-pointer items-start gap-[11px] rounded-xl border bg-page-alt p-3.5 ${
              consent ? "border-primary" : "border-border-light"
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-[17px] w-[17px] accent-primary"
            />
            <span className="text-[13px] leading-[1.5] text-ink-muted">
              I agree that my video recording will be stored temporarily (
              <strong>14 days</strong>) for examiner review, and deleted
              automatically afterward.
            </span>
          </label>

          <button
            type="button"
            onClick={() => onStart(testLanguage)}
            disabled={!consent || !cameraOk || Boolean(setupMessage)}
            className="w-full rounded-[10px] bg-primary py-3 text-[14.5px] font-semibold text-on-primary transition-colors hover:bg-kalam-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Start test
          </button>
          <p className="mt-[11px] text-center text-xs text-ink-faint">
            Eye-contact detection runs entirely on your device.
          </p>
        </div>
      </div>

      <div className="mt-10 lg:hidden">
        <KalamLogo href="/dashboard" />
      </div>
    </div>
  );
}
