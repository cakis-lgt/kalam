/**
 * Copy MediaPipe WASM assets to public/ for stable local loading (no CDN).
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const src = resolve(
  process.cwd(),
  "node_modules/@mediapipe/tasks-vision/wasm",
);
const dest = resolve(process.cwd(), "public/mediapipe/wasm");

if (!existsSync(src)) {
  console.warn("[postinstall] @mediapipe/tasks-vision/wasm not found, skip copy");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
for (const file of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) {
  const from = join(src, file);
  if (existsSync(from)) cpSync(from, join(dest, file), { force: true });
}
