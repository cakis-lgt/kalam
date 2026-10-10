"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAZE_LABEL,
  requestCamera,
  stopMediaStream,
  type GazeStatus,
} from "@/lib/video/camera";
import { pickSupportedVideoMimeType } from "@/lib/video/recorder";
import {
  aggregateProctoring,
  type ProctoringEvent,
  type ProctoringSummary,
} from "@/lib/proctoring/types";
import {
  averageBaseline,
  formatGazePercent,
  smoothGazeScore,
  type GazeBaseline,
  type GazeMetrics,
  type GazeSample,
} from "@/lib/proctoring/gaze-from-landmarks";
import { useFaceGazeMonitor } from "@/hooks/useFaceGazeMonitor";

type CaptureStage = "prep" | "recording" | "uploading" | "uploaded" | "done";

type Props = {
  preparationSec: number;
  durationSec: number;
  submitting?: boolean;
  uploading?: boolean;
  onSubmit: (
    blob: Blob,
    durationSec: number,
    proctoring: ProctoringSummary,
  ) => void;
  onError?: (message: string) => void;
};

function formatCountdown(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const GAZE_COLOR: Record<GazeStatus, string> = {
  good: "#22c55e",
  warning: "#eab308",
  danger: "#dc2626",
};

const GAZE_BORDER: Record<GazeStatus, string> = {
  good: "#22c55e",
  warning: "#eab308",
  danger: "#dc2626",
};

export function ProctorPanel({
  preparationSec,
  durationSec,
  submitting = false,
  uploading = false,
  onSubmit,
  onError,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const submittedRef = useRef(false);
  const proctoringEventsRef = useRef<ProctoringEvent[]>([]);
  const warningTotalRef = useRef(0);
  const inViolationRef = useRef(false);
  const smoothedScoreRef = useRef(0.65);
  const warnHideTimerRef = useRef<number | null>(null);
  const calBufferRef = useRef<GazeMetrics[]>([]);
  const remainingRef = useRef(preparationSec);
  const onSubmitRef = useRef(onSubmit);
  const onErrorRef = useRef(onError);
  const preparationSecRef = useRef(preparationSec);
  const durationSecRef = useRef(durationSec);

  onSubmitRef.current = onSubmit;
  onErrorRef.current = onError;
  preparationSecRef.current = preparationSec;
  durationSecRef.current = durationSec;

  const reportError = useCallback((message: string) => {
    window.queueMicrotask(() => onErrorRef.current?.(message));
  }, []);
  const reportErrorRef = useRef(reportError);
  reportErrorRef.current = reportError;

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gazeBaseline, setGazeBaseline] = useState<GazeBaseline | null>(null);
  const [stage, setStage] = useState<CaptureStage>("prep");
  const stageRef = useRef<CaptureStage>("prep");
  const [remaining, setRemaining] = useState(preparationSec);
  remainingRef.current = remaining;
  const [gaze, setGaze] = useState<GazeStatus>("good");
  const [gazePct, setGazePct] = useState("65%");
  const [warningCount, setWarningCount] = useState(0);
  const [showWarn, setShowWarn] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const handleGazeSample = useCallback((sample: GazeSample) => {
    if (stageRef.current === "prep" && !gazeBaseline) {
      if (sample.faceDetected && sample.metrics) {
        calBufferRef.current.push(sample.metrics);
        if (calBufferRef.current.length >= 10) {
          const baseline = averageBaseline(calBufferRef.current);
          if (baseline) setGazeBaseline(baseline);
        }
        setGaze("warning");
        setGazePct(formatGazePercent(0.55));
      } else {
        setGaze("danger");
        setGazePct(formatGazePercent(0.12));
      }
      return;
    }

    if (!sample.faceDetected) {
      setGaze("danger");
      setGazePct(formatGazePercent(0.12));
      return;
    }

    const smoothed = smoothGazeScore(smoothedScoreRef.current, sample.score);
    smoothedScoreRef.current = smoothed;
    const displayScore = Math.max(smoothed, sample.score * 0.85);

    setGaze(sample.status);
    setGazePct(formatGazePercent(displayScore));

    if (stageRef.current !== "recording") return;

    const timestampMs = Math.max(0, Date.now() - startedAtRef.current);
    proctoringEventsRef.current.push({
      timestampMs,
      eventType: sample.status,
      gazeScore: displayScore,
    });

    if (sample.status === "danger") {
      if (!inViolationRef.current) {
        inViolationRef.current = true;
        warningTotalRef.current += 1;
        setWarningCount((c) => c + 1);
        setShowWarn(true);
        if (warnHideTimerRef.current) {
          window.clearTimeout(warnHideTimerRef.current);
        }
        warnHideTimerRef.current = window.setTimeout(() => {
          setShowWarn(false);
          warnHideTimerRef.current = null;
        }, 3000);
      }
    } else if (sample.status === "good") {
      inViolationRef.current = false;
    }
  }, [gazeBaseline]);

  const { ready: gazeReady, error: gazeError } = useFaceGazeMonitor(videoRef, {
    enabled: cameraReady && !cameraError,
    baseline: gazeBaseline,
    onSample: handleGazeSample,
  });

  const finalizeRecording = useCallback((mimeType: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    const duration = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000),
    );
    const blob = new Blob(chunksRef.current, { type: mimeType });

    if (blob.size < 2048) {
      submittedRef.current = false;
      stageRef.current = "prep";
      setStage("prep");
      remainingRef.current = preparationSecRef.current;
      setRemaining(preparationSecRef.current);
      reportError(
        "Video recording is empty or too short. Keep the camera active, then wait for the preparation countdown to finish.",
      );
      return;
    }

    const proctoring = aggregateProctoring(proctoringEventsRef.current);
    proctoring.warningCount = warningTotalRef.current;
    stageRef.current = "uploading";
    setStage("uploading");
    setUploadPct(30);
    onSubmitRef.current(blob, duration, proctoring);
  }, [reportError]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || stream.getVideoTracks().every((t) => t.readyState !== "live")) {
      reportError("Camera is not active. Reload the page and allow camera access.");
      return;
    }

    chunksRef.current = [];
    submittedRef.current = false;

    const mimeCandidates = [
      pickSupportedVideoMimeType(),
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];

    let recorder: MediaRecorder | null = null;
    let mimeType = "video/webm";

    for (const candidate of mimeCandidates) {
      try {
        recorder = new MediaRecorder(
          stream,
          candidate
            ? { mimeType: candidate, videoBitsPerSecond: 800_000 }
            : { videoBitsPerSecond: 800_000 },
        );
        mimeType = candidate || recorder.mimeType || "video/webm";
        break;
      } catch {
        recorder = null;
      }
    }

    if (!recorder) {
      reportError("Your browser does not support video recording. Use the latest Chrome or Edge.");
      return;
    }

    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      window.setTimeout(() => finalizeRecording(mimeType), 300);
    };

    startedAtRef.current = Date.now();
    proctoringEventsRef.current = [];
    try {
      recorder.start(1000);
    } catch {
      try {
        recorder.start();
      } catch (e) {
        reportError(
          e instanceof Error ? e.message : "Failed to start video recording.",
        );
        return;
      }
    }

    stageRef.current = "recording";
    setStage("recording");
  }, [finalizeRecording, reportError]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      try {
        recorder.requestData();
      } catch {
        /* ignore */
      }
      recorder.stop();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function setupCamera() {
      try {
        const stream = await requestCamera();
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraReady(true);
        setCameraError(null);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.name === "NotAllowedError"
              ? "Camera/microphone permission denied. Enable permissions, then reload the page."
              : e.name === "NotFoundError"
                ? "No camera found."
                : e.name === "NotReadableError"
                  ? "Camera is in use by another app."
                  : e.message
            : "Could not access camera.";
        setCameraError(msg);
        reportErrorRef.current(msg);
      }
    }

    setupCamera();

    return () => {
      cancelled = true;
      if (warnHideTimerRef.current) {
        window.clearTimeout(warnHideTimerRef.current);
      }
      if (
        !submittedRef.current &&
        recorderRef.current &&
        recorderRef.current.state === "recording"
      ) {
        try {
          recorderRef.current.requestData();
        } catch {
          /* ignore */
        }
        recorderRef.current.stop();
      }
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!cameraReady || submitting) return;

    const interval = window.setInterval(() => {
      const stage = stageRef.current;
      if (stage === "uploading" || stage === "uploaded" || stage === "done") return;

      const prev = remainingRef.current;
      if (prev > 1) {
        remainingRef.current = prev - 1;
        setRemaining(prev - 1);
        return;
      }

      if (prev !== 1) return;

      if (stage === "prep") {
        remainingRef.current = durationSecRef.current;
        setRemaining(durationSecRef.current);
        startRecording();
        return;
      }

      if (stage === "recording") {
        remainingRef.current = 0;
        setRemaining(0);
        stopRecording();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cameraReady, submitting, startRecording, stopRecording]);

  useEffect(() => {
    if (uploading) {
      stageRef.current = "uploading";
      setStage("uploading");
      const t = window.setInterval(() => {
        setUploadPct((p) => Math.min(p + 12, 95));
      }, 400);
      return () => window.clearInterval(t);
    }
    if (submitting && stage === "uploading") {
      setUploadPct(100);
      stageRef.current = "uploaded";
      setStage("uploaded");
    }
  }, [uploading, submitting, stage]);

  const isPrep = stage === "prep";
  const isRecording = stage === "recording";
  const isUploading = stage === "uploading";
  const isUploaded = stage === "uploaded";

  const phaseBg = isRecording
    ? "rgba(220,38,38,0.12)"
    : isUploading
      ? "rgba(59,130,246,0.12)"
      : isUploaded
        ? "rgba(34,197,94,0.12)"
        : "#0a0f17";

  return (
    <section className="flex flex-col justify-center gap-[18px] bg-test-panel px-7 py-9 md:px-10">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-[#0a0f17]"
        style={{ borderColor: GAZE_BORDER[gaze] }}
      >
        {cameraError ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-faint">
            {cameraError}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />

            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5">
              <span
                className="h-[9px] w-[9px] rounded-full"
                style={{ backgroundColor: GAZE_COLOR[gaze] }}
              />
              <span className="text-xs font-medium text-white">
                {!gazeReady
                  ? "Preparing face detection…"
                  : gazeError
                    ? "Face detection failed"
                    : !gazeBaseline && stage === "prep"
                      ? "Calibrating position…"
                      : GAZE_LABEL[gaze]}
              </span>
            </div>

            {gaze === "warning" && gazeReady && !gazeError && (
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center gap-2 rounded-[11px] bg-[rgba(234,179,8,0.92)] px-3.5 py-2.5 text-[#1a1a1a]">
                <span className="text-sm">👀</span>
                <span className="text-[12.5px] font-semibold">
                  Slight turn — face the camera
                </span>
              </div>
            )}

            {isRecording && (
              <div className="absolute right-3 top-3 flex items-center gap-[7px] rounded-full bg-[rgba(220,38,38,0.92)] px-3 py-1.5">
                <span className="h-2 w-2 animate-kpulse rounded-full bg-white" />
                <span className="text-xs font-bold text-white">REC</span>
              </div>
            )}

            {showWarn && (
              <div className="absolute bottom-3.5 left-3.5 right-3.5 flex animate-kfade items-center gap-2.5 rounded-[11px] bg-[rgba(220,38,38,0.95)] px-3.5 py-[11px] text-white">
                <span className="text-[17px]">⚠️</span>
                <div className="flex-1">
                  <div className="text-[13px] font-bold">Keep looking at the camera</div>
                  <div className="text-[11.5px] opacity-90">
                    Warning #{warningCount} · recorded for examiner review
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-[13px] bg-[#0a0f17] px-[17px] py-[15px]">
        <div className="mb-2 flex justify-between">
          <span className="text-xs font-medium text-ink-faint">Eye contact score</span>
          <span
            className="text-xs font-bold"
            style={{ color: GAZE_COLOR[gaze] }}
          >
            {gazePct}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-test-surface">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: gazePct, backgroundColor: GAZE_COLOR[gaze] }}
          />
        </div>
        <div className="mt-2.5 flex justify-between text-[11.5px] text-ink-subtle">
          <span>
            Warnings: <strong className="text-slate-200">{warningCount}</strong>
          </span>
          <span>
            {isPrep
              ? "Preparation starts automatically"
              : isRecording
                ? "Recording"
                : "Finishing task"}
          </span>
        </div>
      </div>

      <div
        className="rounded-[13px] px-[18px] py-[18px] text-center"
        style={{ backgroundColor: phaseBg }}
      >
        {isPrep && (
          <div>
            <div className="mb-1.5 text-[11.5px] font-semibold tracking-[0.05em] text-[#5cc6da]">
              PREPARATION — AUTO RECORDING
            </div>
            <div className="font-heading text-[46px] font-semibold leading-none text-white">
              {formatCountdown(remaining)}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-faint">
              Recording starts when the countdown ends
            </div>
          </div>
        )}

        {isRecording && (
          <div>
            <div className="mb-1.5 text-[11.5px] font-semibold tracking-[0.05em] text-[#f87171]">
              RECORDING
            </div>
            <div className="font-heading text-[46px] font-semibold leading-none text-white">
              {formatCountdown(remaining)}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-faint">
              Time left to answer
            </div>
          </div>
        )}

        {isUploading && (
          <div>
            <div className="mb-2.5 text-[11.5px] font-semibold tracking-[0.05em] text-[#60a5fa]">
              UPLOADING RECORDING
            </div>
            <div className="mb-2 h-[9px] overflow-hidden rounded-full bg-test-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] transition-all"
                style={{ width: `${uploadPct}%` }}
              />
            </div>
            <div className="text-[12.5px] text-ink-faint">{uploadPct}% uploaded</div>
          </div>
        )}

        {isUploaded && (
          <div className="flex items-center justify-center gap-2 text-[15px] font-semibold text-[#4ade80]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16a34a] text-sm text-white">
              ✓
            </span>
            Uploaded — continuing…
          </div>
        )}
      </div>
    </section>
  );
}
