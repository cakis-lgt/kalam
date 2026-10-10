import type { GazeStatus } from "@/lib/video/camera";

/** MediaPipe face mesh landmark indices */
const NOSE_TIP = 1;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export type NormalizedLandmark = { x: number; y: number; z?: number };

export type GazeBaseline = {
  yaw: number;
  pitch: number;
  roll: number;
};

export type GazeMetrics = GazeBaseline;

export type GazeSample = {
  status: GazeStatus;
  score: number;
  faceDetected: boolean;
  metrics?: GazeMetrics;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Extract head-pose proxies from landmarks (yaw/pitch/roll ≈ 0 when facing camera). */
export function extractGazeMetrics(
  landmarks: NormalizedLandmark[],
): GazeMetrics | null {
  const nose = landmarks[NOSE_TIP];
  const leftEye = landmarks[LEFT_EYE_OUTER];
  const rightEye = landmarks[RIGHT_EYE_OUTER];

  const eyeSpan = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  if (eyeSpan < 0.012) return null;

  // Yaw: nose closer to one eye than the other when turning head
  const leftGap = nose.x - leftEye.x;
  const rightGap = rightEye.x - nose.x;
  const yaw = (leftGap - rightGap) / eyeSpan;

  // Pitch: depth of nose vs eyes (not nose.y — nose is always below eyes when frontal)
  const eyeZ = ((leftEye.z ?? 0) + (rightEye.z ?? 0)) / 2;
  const pitch = ((nose.z ?? 0) - eyeZ) / eyeSpan;

  // Roll: tilt of eye line
  const roll = (rightEye.y - leftEye.y) / eyeSpan;

  return { yaw, pitch, roll };
}

/** Optional 4×4 row-major face transform from MediaPipe (more stable pitch/yaw). */
export function eulerFromFaceMatrix(data: number[] | undefined): GazeMetrics | null {
  if (!data || data.length < 16) return null;

  const r00 = data[0];
  const r10 = data[4];
  const r20 = data[8];
  const r21 = data[9];
  const r22 = data[10];

  const pitch = Math.asin(clamp(-r21, -1, 1));
  const yaw = Math.atan2(r20, r22);
  const roll = Math.atan2(r10, r00);

  // Normalize to similar scale as landmark metrics (radians → compact range)
  const scale = 2 / Math.PI;
  return {
    yaw: yaw * scale,
    pitch: pitch * scale,
    roll: roll * scale,
  };
}

function mergeMetrics(
  landmark: GazeMetrics | null,
  matrix: GazeMetrics | null,
): GazeMetrics | null {
  if (landmark && matrix) {
    return {
      yaw: landmark.yaw * 0.35 + matrix.yaw * 0.65,
      pitch: landmark.pitch * 0.35 + matrix.pitch * 0.65,
      roll: landmark.roll * 0.35 + matrix.roll * 0.65,
    };
  }
  return matrix ?? landmark;
}

export function averageBaseline(
  samples: GazeMetrics[],
): GazeBaseline | null {
  if (samples.length === 0) return null;
  const n = samples.length;
  return {
    yaw: samples.reduce((s, m) => s + m.yaw, 0) / n,
    pitch: samples.reduce((s, m) => s + m.pitch, 0) / n,
    roll: samples.reduce((s, m) => s + m.roll, 0) / n,
  };
}

/** Classify head pose; pass baseline from prep calibration for per-user centering. */
export function classifyGazeFromLandmarks(
  landmarks: NormalizedLandmark[] | undefined,
  matrixData?: number[],
  baseline?: GazeBaseline | null,
): GazeSample {
  if (!landmarks?.length) {
    return { status: "danger", score: 0.12, faceDetected: false };
  }

  const xs = landmarks.map((l) => l.x);
  const ys = landmarks.map((l) => l.y);
  const faceArea =
    (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));

  if (faceArea < 0.025) {
    return { status: "danger", score: 0.2, faceDetected: true };
  }

  const metrics = mergeMetrics(
    extractGazeMetrics(landmarks),
    eulerFromFaceMatrix(matrixData),
  );

  if (!metrics) {
    return { status: "danger", score: 0.15, faceDetected: true };
  }

  const yaw = metrics.yaw - (baseline?.yaw ?? 0);
  const pitch = metrics.pitch - (baseline?.pitch ?? 0);
  const roll = metrics.roll - (baseline?.roll ?? 0);

  const absYaw = Math.abs(yaw);
  const absPitch = Math.abs(pitch);
  const absRoll = Math.abs(roll);

  const score = clamp(
    1 - (absYaw * 1.1 + absPitch * 1.1 + absRoll * 0.7),
    0,
    1,
  );

  let status: GazeStatus = "good";
  if (absYaw > 0.32 || absPitch > 0.32 || absRoll > 0.18 || score < 0.38) {
    status = "danger";
  } else if (absYaw > 0.16 || absPitch > 0.16 || absRoll > 0.09 || score < 0.62) {
    status = "warning";
  }

  return { status, score, faceDetected: true, metrics };
}

/** Exponential moving average — faster recovery toward green. */
export function smoothGazeScore(prev: number, next: number, alpha = 0.45): number {
  return prev * (1 - alpha) + next * alpha;
}

export function statusFromScore(score: number): GazeStatus {
  if (score >= 0.62) return "good";
  if (score >= 0.38) return "warning";
  return "danger";
}

export function formatGazePercent(score: number): string {
  return `${Math.round(clamp(score, 0, 1) * 100)}%`;
}
