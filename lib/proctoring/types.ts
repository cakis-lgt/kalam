import type { GazeStatus } from "@/lib/video/camera";

export type EyeContactEventType = GazeStatus;

export type ProctoringEvent = {
  timestampMs: number;
  eventType: EyeContactEventType;
  gazeScore: number;
};

export type ProctoringSummary = {
  events: ProctoringEvent[];
  warningCount: number;
  eyeContactAvg: number;
};

export const GAZE_SCORE: Record<EyeContactEventType, number> = {
  good: 0.88,
  warning: 0.52,
  danger: 0.28,
};

export function aggregateProctoring(events: ProctoringEvent[]): ProctoringSummary {
  if (events.length === 0) {
    return { events: [], warningCount: 0, eyeContactAvg: 0 };
  }
  const warningCount = events.filter((e) => e.eventType === "danger").length;
  const eyeContactAvg =
    events.reduce((sum, e) => sum + e.gazeScore, 0) / events.length;
  return {
    events,
    warningCount,
    eyeContactAvg: Math.round(eyeContactAvg * 1000) / 1000,
  };
}
