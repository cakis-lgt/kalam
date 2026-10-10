"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { getFaceLandmarker } from "@/lib/proctoring/face-landmarker";
import {
  classifyGazeFromLandmarks,
  type GazeBaseline,
  type GazeSample,
} from "@/lib/proctoring/gaze-from-landmarks";
import { installMediaPipeLogFilter } from "@/lib/proctoring/mediapipe-log-filter";

const SAMPLE_MS = 150;

type Options = {
  enabled: boolean;
  baseline?: GazeBaseline | null;
  onSample?: (sample: GazeSample) => void;
};

function isVideoFrameReady(video: HTMLVideoElement): boolean {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0 &&
    !video.ended
  );
}

export function useFaceGazeMonitor(
  videoRef: RefObject<HTMLVideoElement | null>,
  { enabled, onSample, baseline }: Options,
) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<Awaited<
    ReturnType<typeof getFaceLandmarker>
  > | null>(null);
  const onSampleRef = useRef(onSample);
  const baselineRef = useRef(baseline);
  const processingRef = useRef(false);

  useEffect(() => {
    onSampleRef.current = onSample;
  }, [onSample]);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  // Keep log filter active while monitoring (TFLite logs during detect())
  useEffect(() => {
    if (!enabled) return;
    return installMediaPipeLogFilter();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let cancelled = false;
    setError(null);

    getFaceLandmarker()
      .then((lm) => {
        if (cancelled) return;
        landmarkerRef.current = lm;
        setReady(true);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load MediaPipe face detection",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !ready) return;

    let frameId = 0;
    let lastSample = 0;

    const tick = (now: number) => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (
        video &&
        landmarker &&
        isVideoFrameReady(video) &&
        !processingRef.current &&
        now - lastSample >= SAMPLE_MS
      ) {
        lastSample = now;
        processingRef.current = true;

        try {
          const results = landmarker.detect(video);
          const sample = classifyGazeFromLandmarks(
            results.faceLandmarks?.[0],
            results.facialTransformationMatrixes?.[0]?.data,
            baselineRef.current,
          );
          onSampleRef.current?.(sample);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (
            msg.includes("TensorFlow Lite") ||
            msg.includes("XNNPACK") ||
            msg.includes("INFO:")
          ) {
            // Benign TFLite init noise — skip this frame
          } else {
            onSampleRef.current?.({
              status: "danger",
              score: 0.1,
              faceDetected: false,
            });
          }
        } finally {
          processingRef.current = false;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [enabled, ready, videoRef]);

  return { ready, error };
}
