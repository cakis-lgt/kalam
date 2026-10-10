function MiniRadarChart() {
  return (
    <svg
      className="shrink-0"
      width={40}
      height={40}
      viewBox="0 0 40 40"
      aria-hidden
    >
      <polygon
        points="20,5 35,15 35,30 20,35 5,30 5,15"
        fill="none"
        stroke="#bec9c2"
        strokeWidth={0.5}
      />
      <polygon
        points="20,8 30,16 32,28 20,32 8,28 12,18"
        fill="rgba(0, 69, 50, 0.2)"
        stroke="#004532"
        strokeWidth={2}
      />
    </svg>
  );
}

export function ScoreOverview({
  scoreLabel,
}: {
  scoreLabel?: string;
}) {
  if (!scoreLabel) return null;
  return (
    <div className="flex items-center gap-4">
      <MiniRadarChart />
      <span className="text-label-sm">{scoreLabel}</span>
    </div>
  );
}
