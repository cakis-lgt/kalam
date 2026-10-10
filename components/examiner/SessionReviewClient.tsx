"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExaminerReviewSession } from "@/lib/examiner/mock-data";
import {
  EXAMINER_DIMENSIONS,
  SCORE_BAND_DESCRIPTORS,
  emptyDimensionScores,
  isScoresComplete,
  type ExaminerDimensionKey,
  type ExaminerDimensionScores,
} from "@/lib/examiner/rubric";
import { isRecordingLikelyValid } from "@/lib/examiner/recording-meta";
import { isAiScoringEnabled } from "@/lib/ai/config";
import { CEFR_LEVELS, type CEFRLevel } from "@/types";
import { VideoReviewPanel } from "./VideoReviewPanel";

type Props = {
  session: ExaminerReviewSession;
  canEdit: boolean;
  onDraftSaved: (message: string) => void;
  onPublished: (message: string) => void;
};

function TranscriptSection({
  transcript,
  manualReview,
  testLanguage,
}: {
  transcript: string | null;
  manualReview: boolean;
  testLanguage: "ar" | "en";
}) {
  if (manualReview) {
    return (
      <div className="mt-3 rounded-xl border border-border bg-white px-[18px] py-4">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="rounded-md bg-surface-dim px-2 py-0.5 text-xs font-bold text-ink-muted">
            SCORING NOTES
          </span>
          <span className="text-[11.5px] text-ink-faint">
            Manual mode · listen to the video recording
          </span>
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          Automatic transcription is disabled. Score based on the video recording and
          the ALIKHTIBAR rubric in the right panel.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-white px-[18px] py-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="rounded-md bg-primary-container px-2 py-0.5 text-xs font-bold text-primary">
          AI TRANSCRIPT
        </span>
        <span className="text-[11.5px] text-ink-faint">
          Whisper · reference only, not the final score
        </span>
      </div>
      <div
        dir={testLanguage === "ar" ? "rtl" : "ltr"}
        lang={testLanguage}
        className={
          testLanguage === "ar"
            ? "font-arabic text-[21px] leading-[1.9] text-ink"
            : "text-[17px] leading-relaxed text-ink"
        }
      >
        {transcript ?? "Transcript not available yet."}
      </div>
    </div>
  );
}

export function SessionReviewClient({
  session,
  canEdit,
  onDraftSaved,
  onPublished,
}: Props) {
  const router = useRouter();
  const manualReview = !isAiScoringEnabled();
  const [activeTaskIdx, setActiveTaskIdx] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [blockMsg, setBlockMsg] = useState<string | null>(null);
  const [publishedLocal, setPublishedLocal] = useState(false);

  const initialScores = {
    ...emptyDimensionScores(),
    ...(session.draft?.dimensionScores ?? {}),
  } as ExaminerDimensionScores;

  const [scores, setScores] = useState<ExaminerDimensionScores>(initialScores);
  const [notes, setNotes] = useState<Record<string, string>>(
    session.draft?.dimensionNotes ?? {},
  );
  const [overallLevel, setOverallLevel] = useState<CEFRLevel>(
    session.draft?.overallLevel ?? session.targetLevel,
  );
  const [summary, setSummary] = useState(session.draft?.summary ?? "");

  const activeTask = session.recordings[activeTaskIdx] ?? session.recordings[0];
  const isPublished =
    publishedLocal || Boolean(session.draft?.publishedAt);
  const hasRecordings = session.recordings.length > 0;
  const invalidRecordings = session.recordings.filter(
    (r) => !isRecordingLikelyValid(r.durationSec, r.fileSizeBytes),
  );

  function toggleExpanded(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setScore(key: ExaminerDimensionKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
    setBlockMsg(null);
  }

  async function saveDraft() {
    setSaving(true);
    setBlockMsg(null);
    try {
      const res = await fetch(`/api/examiner/scores/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallLevel,
          dimensionScores: scores,
          dimensionNotes: notes,
          summary,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setBlockMsg(data.error ?? "Failed to save draft");
        return;
      }
      onDraftSaved("Draft saved");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!hasRecordings) {
      setBlockMsg("No recordings to score.");
      return;
    }
    if (invalidRecordings.length > 0) {
      setBlockMsg(
        `${invalidRecordings.length} recording(s) appear empty or corrupted. Ask the candidate to retake the test if needed.`,
      );
      return;
    }
    if (!isScoresComplete(scores)) {
      setBlockMsg("Complete all 6 dimensions (0–5) before publishing.");
      return;
    }
    if (!summary.trim()) {
      setBlockMsg("Summary & recommendations are required.");
      return;
    }

    setPublishing(true);
    setBlockMsg(null);
    try {
      const res = await fetch(
        `/api/examiner/scores/${session.id}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overallLevel,
            dimensionScores: scores,
            dimensionNotes: notes,
            summary,
          }),
        },
      );
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setBlockMsg(data.error ?? "Failed to publish score");
        return;
      }
      setPublishedLocal(true);
      onPublished(`Score published to ${session.candidateName}`);
      window.setTimeout(() => router.push("/examiner"), 2200);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div>
        {!hasRecordings && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No recordings saved for this session yet. The candidate may not have
            finished the test or the upload failed.
          </div>
        )}

        {invalidRecordings.length > 0 && hasRecordings && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {invalidRecordings.length} recording(s) are very small or have 0-second
            duration — video may not play.
          </div>
        )}

        {hasRecordings && (
          <>
            <div className="mb-3 flex flex-wrap gap-[7px]">
              {session.recordings.map((rec, i) => {
                const valid = isRecordingLikelyValid(
                  rec.durationSec,
                  rec.fileSizeBytes,
                );
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setActiveTaskIdx(i)}
                    className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                      i === activeTaskIdx
                        ? "bg-primary text-on-primary"
                        : "border border-border-light bg-white text-ink-muted hover:bg-surface-container"
                    }`}
                  >
                    {rec.taskLabel}
                    {!valid ? " ⚠" : null}
                  </button>
                );
              })}
            </div>

            {activeTask && (
              <VideoReviewPanel
                recordingId={activeTask.id}
                storagePath={activeTask.storagePath}
                durationSec={activeTask.durationSec}
                fileSizeBytes={activeTask.fileSizeBytes}
                formatLabel={activeTask.formatLabel}
                level={activeTask.level}
                eyeContactEvents={activeTask.eyeContactEvents}
                eyeContactAvg={activeTask.eyeContactAvg}
                warningCount={activeTask.warningCount}
              />
            )}

            {activeTask && (
              <TranscriptSection
                transcript={activeTask.transcript}
                manualReview={manualReview}
                testLanguage={session.testLanguage}
              />
            )}
          </>
        )}
      </div>

      <div className="xl:sticky xl:top-[78px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-[#e6ecf3] px-[18px] py-4">
            <div className="font-heading text-[15px] font-semibold text-ink">
              ALIKHTIBAR Rubric · 6 Dimensions
            </div>
            <div className="text-[11.5px] text-ink-faint">Scale 0–5</div>
          </div>

          {!canEdit && !isPublished && (
            <div className="border-b border-[#eef2f7] bg-amber-50 px-[18px] py-3 text-xs text-amber-900">
              Claim the session first to fill in the rubric and publish the score.
            </div>
          )}

          {EXAMINER_DIMENSIONS.map((dim) => {
            const ai =
              !manualReview && activeTask?.aiSuggestion != null
                ? activeTask.aiSuggestion
                : null;
            const isExpanded = expanded[dim.key];

            return (
              <div
                key={dim.key}
                className="border-b border-[#eef2f7] px-[18px] py-[13px]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {dim.name_id}
                    </span>
                    <span
                      dir="rtl"
                      lang="ar"
                      className="font-arabic text-base text-ink-faint"
                    >
                      {dim.name_ar}
                    </span>
                  </div>
                  {ai != null && (
                    <span className="rounded-md bg-primary-container px-2 py-0.5 text-[11px] font-semibold text-primary">
                      AI: {ai}
                    </span>
                  )}
                </div>

                <div className="mb-1.5 flex flex-wrap gap-[5px]">
                  {[0, 1, 2, 3, 4, 5].map((n) => {
                    const selected = scores[dim.key] === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={isPublished || !canEdit}
                        onClick={() => setScore(dim.key, n)}
                        className={`h-8 min-w-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
                          selected
                            ? "bg-primary text-on-primary"
                            : "border border-border-light bg-white text-ink-muted hover:border-primary"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpanded(dim.key)}
                  className="text-xs font-medium text-ink-faint hover:text-ink-subtle"
                >
                  {isExpanded ? "Hide descriptors ▲" : "Show descriptors ▼"}
                </button>

                {isExpanded && (
                  <div className="mt-2 rounded-lg bg-page-alt px-3 py-2.5">
                    {SCORE_BAND_DESCRIPTORS.map((bd) => (
                      <div
                        key={bd.n}
                        className="flex gap-2 py-0.5 text-xs leading-snug"
                      >
                        <span className="w-3.5 shrink-0 font-bold text-primary">
                          {bd.n}
                        </span>
                        <span className="text-ink-muted">
                          <strong>{bd.label}</strong> — {bd.d}
                        </span>
                      </div>
                    ))}
                    <textarea
                      value={notes[dim.key] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [dim.key]: e.target.value,
                        }))
                      }
                      disabled={isPublished || !canEdit}
                      placeholder="Notes for this dimension…"
                      className="mt-2 min-h-[48px] w-full resize-y rounded-lg border border-border-light px-2.5 py-2 text-[13px] disabled:bg-surface-container"
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t border-[#e6ecf3] bg-page-alt px-[18px] py-[15px]">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-secondary">
              Overall ALIKHTIBAR level (holistic decision)
            </label>
            <select
              value={overallLevel}
              disabled={isPublished || !canEdit}
              onChange={(e) => setOverallLevel(e.target.value as CEFRLevel)}
              className="mb-3.5 w-full rounded-lg border border-border-light bg-white px-3 py-2.5 text-sm disabled:bg-surface-container"
            >
              {CEFR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>

            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-secondary">
              Summary &amp; recommendations
            </label>
            <textarea
              value={summary}
              disabled={isPublished || !canEdit}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Overall feedback for the candidate…"
              className="mb-3.5 min-h-16 w-full resize-y rounded-lg border border-border-light bg-white px-2.5 py-2 text-[13.5px] disabled:bg-surface-container"
            />

            {blockMsg && (
              <div className="mb-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                ⚠ {blockMsg}
              </div>
            )}

            {!isPublished && canEdit && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={saving}
                  className="flex-1 rounded-[10px] border border-border-light bg-white py-[11px] text-[13.5px] font-semibold text-ink-muted hover:bg-surface-container disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={() => void publish()}
                  disabled={publishing}
                  className="flex-[1.2] rounded-[10px] bg-primary py-[11px] text-[13.5px] font-semibold text-on-primary hover:bg-kalam-600 disabled:opacity-60"
                >
                  {publishing ? "Publishing…" : "Publish score"}
                </button>
              </div>
            )}

            {isPublished && (
              <div className="rounded-lg bg-[#eef6ee] px-3 py-2 text-center text-sm font-semibold text-[#16a34a]">
                Score published · returning to queue…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
