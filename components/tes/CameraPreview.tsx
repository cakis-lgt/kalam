"use client";

import { useEffect, useRef, useState } from "react";
import { requestCamera, stopMediaStream } from "@/lib/video/camera";

type Props = {
  className?: string;
  onReady?: () => void;
  onError?: (message: string) => void;
};

function cameraErrorMessage(e: unknown): string {
  if (!(e instanceof Error)) return "Could not access camera.";
  if (e.name === "NotAllowedError") {
    return "Camera/microphone permission denied. Enable permissions in your browser settings, then reload the page.";
  }
  if (e.name === "NotFoundError") {
    return "No camera found. Make sure your webcam is connected.";
  }
  if (e.name === "NotReadableError") {
    return "Camera is in use by another app. Close that app and try again.";
  }
  return e.message || "Could not access camera.";
}

export function CameraPreview({ className = "", onReady, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const stream = await requestCamera();
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
        setError(null);
        onReadyRef.current?.();
      } catch (e) {
        const msg = cameraErrorMessage(e);
        if (!cancelled) {
          setError(msg);
          onErrorRef.current?.(msg);
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;
      const stream = videoRef.current?.srcObject;
      if (stream instanceof MediaStream) stopMediaStream(stream);
    };
  }, []);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center p-6 text-center text-sm text-red-200 ${className}`}
      >
        {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`h-full w-full -scale-x-100 object-cover ${ready ? "opacity-100" : "opacity-0"} ${className}`}
    />
  );
}
