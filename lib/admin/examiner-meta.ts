/** Default focus/capacity when not stored in DB (v1). */
export const EXAMINER_FOCUS_PRESETS = [
  { focus: "A1 – B1", cap: 8 },
  { focus: "B1 – C2", cap: 8 },
  { focus: "A1 – A2", cap: 6 },
  { focus: "B2 – C2", cap: 6 },
] as const;

export function defaultExaminerMeta(index: number): {
  focus: string;
  cap: number;
} {
  return EXAMINER_FOCUS_PRESETS[index % EXAMINER_FOCUS_PRESETS.length];
}
