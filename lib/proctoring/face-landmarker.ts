import { installMediaPipeLogFilter } from "@/lib/proctoring/mediapipe-log-filter";

const WASM_LOCAL = "/mediapipe/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type FaceDetectResult = {
  faceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>>;
  facialTransformationMatrixes?: Array<{ data: number[] }>;
};

export type FaceLandmarkerInstance = {
  detect: (video: HTMLVideoElement) => FaceDetectResult;
  close?: () => void;
};

let landmarkerPromise: Promise<FaceLandmarkerInstance> | null = null;
let landmarkerInstance: FaceLandmarkerInstance | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarkerInstance> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const restoreLogs = installMediaPipeLogFilter();
    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );

      const vision = await FilesetResolver.forVisionTasks(WASM_LOCAL);
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      });

      landmarkerInstance = landmarker;
      return landmarker;
    } finally {
      restoreLogs();
    }
  })();

  return landmarkerPromise;
}

export function resetFaceLandmarker() {
  landmarkerInstance?.close?.();
  landmarkerInstance = null;
  landmarkerPromise = null;
}
