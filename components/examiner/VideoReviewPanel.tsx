"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EyeContactEventView } from "@/lib/examiner/mock-data";
import { formatFileSize } from "@/lib/examiner/recording-meta";

type Props = {
  recordingId: string;
  storagePath: string | null;
  durationSec: number;
  fileSizeBytes?: number | null;
  formatLabel: string;
  level: string;
  eyeContactEvents: EyeContactEventView[];
  eyeContactAvg: number | null;
  warningCount: number;
};

const EVENT_COLOR: Record<string, string> = {
  good: "#22c55e",
  warning: "#eab308",
  danger: "#dc2626",
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoReviewPanel({
  recordingId,
  storagePath,
  durationSec,
  fileSizeBytes,
  formatLabel,
  level,
  eyeContactEvents,
  eyeContactAvg,
  warningCount,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [mediaDurationSec, setMediaDurationSec] = useState(durationSec);
  const [currentSec, setCurrentSec] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setMediaDurationSec(durationSec);
  }, [durationSec, recordingId]);

  useEffect(() => {
    let cancelled = false;
    setPlaybackUrl(null);
    setUrlError(null);
    setVideoError(null);

    if (!storagePath) {
      return;
    }

    setLoadingUrl(true);
    fetch(`/api/recordings/${recordingId}/playback-url`)
      .then(async (r) => {
        const data = (await r.json()) as {
          url?: string | null;
          error?: string;
          mock?: boolean;
        };
        if (cancelled) return;
        if (!r.ok || data.error) {
          setUrlError(data.error || "Failed to load video URL");
          return;
        }
        if (data.url) setPlaybackUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setUrlError("Failed to load video URL");
      })
      .finally(() => {
        if (!cancelled) setLoadingUrl(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordingId, storagePath]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [playbackUrl]);

  const seekTo = useCallback(
    (sec: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(Math.max(sec, 0), mediaDurationSec || durationSec);
      setCurrentSec(video.currentTime);
    },
    [durationSec, mediaDurationSec],
  );

  const progressPct =
    mediaDurationSec > 0 ? (currentSec / mediaDurationSec) * 100 : 0;

  const eyeAvgColor =
    eyeContactAvg == null
      ? "#64748b"
      : eyeContactAvg >= 0.6
        ? "#16a34a"
        : eyeContactAvg >= 0.4
          ? "#ca8a04"
          : "#dc2626";

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] bg-[#0a0f17]">
        {playbackUrl && !videoError ? (
          <video
            ref={videoRef}
            src={playbackUrl}
            className="absolute inset-0 h-full w-full object-cover"
            onTimeUpdate={(e) => setCurrentSec(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d) && d > 0) {
                setMediaDurationSec(Math.round(d));
              }
            }}
            onError={() => {
              setVideoError(
                "Video cannot be played (recording corrupted or empty). Ask the candidate to retake the test.",
              );
              setPlaybackUrl(null);
            }}
            onEnded={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            playsInline
            preload="metadata"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_40%,#36424f,#0a0f17)]" />
            <div className="absolute inset-0 flex items-center justify-center text-[90px] opacity-85">
              🧑‍💼
            </div>
            {loadingUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                Loading video…
              </div>
            )}
            {!storagePath && !loadingUrl && (
              <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-300">
                Recording not available yet (demo / not uploaded)
              </div>
            )}
            {(urlError || videoError) && (
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-3 py-2 text-xs text-red-200">
                {urlError ?? videoError}
              </div>
            )}
          </>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-[11px] py-[5px] text-xs font-semibold text-white">
          {formatLabel} · {level}
        </div>

        {playbackUrl && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-2xl text-ink"
          >
            {playing ? "⏸" : "▶"}
          </button>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-white px-4 py-3">
        <div className="relative mb-2 h-1.5 cursor-pointer rounded-full bg-surface-dim">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary"
            style={{ width: `${progressPct}%` }}
          />
          <input
            type="range"
            min={0}
            max={mediaDurationSec || durationSec || 1}
            step={0.1}
            value={currentSec}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Video position"
          />
        </div>
        <div className="mb-3 flex justify-between text-[11.5px] tabular-nums text-ink-faint">
          <span>{formatTime(currentSec)}</span>
          <span>{formatTime(mediaDurationSec || durationSec)}</span>
        </div>

        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-ink-muted">
            Eye contact timeline
          </span>
          <span className="text-[11px] text-ink-faint">
            green = good · yellow = caution · red = warning
          </span>
        </div>
        <div
          className="relative h-8 overflow-hidden rounded-lg bg-[#e4eaf1]"
          role="img"
          aria-label="Eye contact timeline"
        >
          {eyeContactEvents.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[11px] text-ink-faint">
              No proctoring data yet
            </div>
          ) : (
            eyeContactEvents.map((ev, i) => {
              const total = mediaDurationSec || durationSec;
              const left =
                total > 0 ? (ev.timestampMs / 1000 / total) * 100 : 0;
              const width = Math.max(
                2,
                total > 0 ? (3000 / 1000 / total) * 100 : 4,
              );
              return (
                <button
                  key={`${ev.timestampMs}-${i}`}
                  type="button"
                  title={`${ev.eventType} · ${formatTime(ev.timestampMs / 1000)}`}
                  onClick={() => seekTo(ev.timestampMs / 1000)}
                  className="absolute top-1 bottom-1 rounded-sm opacity-90 hover:opacity-100"
                  style={{
                    left: `${Math.min(left, 98)}%`,
                    width: `${width}%`,
                    backgroundColor: EVENT_COLOR[ev.eventType],
                  }}
                />
              );
            })
          )}
          {(mediaDurationSec || durationSec) > 0 && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-ink"
              style={{ left: `${progressPct}%` }}
            />
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        {[
          {
            label: "Average eye contact",
            value: eyeContactAvg != null ? `${Math.round(eyeContactAvg * 100)}%` : "—",
            color: eyeAvgColor,
          },
          {
            label: "Look-away warnings",
            value: `${warningCount}×`,
            color: warningCount >= 5 ? "#dc2626" : warningCount >= 2 ? "#ca8a04" : "#16a34a",
          },
          {
            label: "Response duration",
            value: formatTime(mediaDurationSec || durationSec),
            color: "#334155",
          },
          {
            label: "File size",
            value: formatFileSize(fileSizeBytes),
            color: "#334155",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="min-w-[120px] flex-1 rounded-xl border border-border bg-white px-[15px] py-[13px]"
          >
            <div className="mb-1 text-[11.5px] font-medium text-ink-faint">
              {stat.label}
            </div>
            <div className="text-lg font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
