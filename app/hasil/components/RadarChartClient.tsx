"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { ScoreDimensions } from "@/types";
import { DIMENSIONS, SCORE_SCALE } from "@/lib/cefr/rubric";

export function RadarChartClient({ scores }: { scores: ScoreDimensions }) {
  const data = DIMENSIONS.map((d) => ({
    dimension: d.name_id,
    score: scores[d.key],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#334155", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, SCORE_SCALE.max]}
          tick={{ fill: "#64748b", fontSize: 10 }}
        />
        <Radar
          name="Skor"
          dataKey="score"
          stroke="#0284c7"
          fill="#0ea5e9"
          fillOpacity={0.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
