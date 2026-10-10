"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { EXAMINER_DIMENSIONS } from "@/lib/examiner/rubric";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import type { ExaminerDimensionScores } from "@/lib/examiner/rubric";

export function ExaminerRadarChartClient({
  scores,
}: {
  scores: ExaminerDimensionScores;
}) {
  const data = EXAMINER_DIMENSIONS.map((d) => ({
    dimension: d.name_id,
    score: scores[d.key],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#334155", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, SCORE_SCALE.max]}
          tick={{ fill: "#64748b", fontSize: 10 }}
        />
        <Radar
          name="Skor"
          dataKey="score"
          stroke="#156c84"
          fill="#156c84"
          fillOpacity={0.45}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
