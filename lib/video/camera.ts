export function requestCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Your browser does not support the camera. Use the latest Chrome, Edge, or Firefox on a laptop or desktop.",
    );
  }
  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

export type GazeStatus = "good" | "warning" | "danger";

export const GAZE_LABEL: Record<GazeStatus, string> = {
  good: "Eye contact: Good",
  warning: "Slight turn",
  danger: "Look at camera",
};
