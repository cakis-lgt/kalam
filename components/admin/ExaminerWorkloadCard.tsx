import type { ExaminerCard } from "@/lib/admin/mock-data";

type Props = {
  examiner: ExaminerCard;
  compact?: boolean;
};

export function ExaminerWorkloadCard({ examiner, compact = false }: Props) {
  if (compact) {
    return (
      <div className="border-b border-[#eef2f7] px-4 py-3.5 last:border-b-0">
        <div className="mb-2.5 flex items-center gap-[11px]">
          <div
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: examiner.color }}
          >
            {examiner.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-ink">
              {examiner.name}
            </div>
            <div className="text-[11.5px] text-ink-faint">
              Focus {examiner.focus}
            </div>
          </div>
          <span
            className="rounded-full px-2 py-[3px] text-[11px] font-semibold"
            style={{
              color: examiner.statusColor,
              backgroundColor: examiner.statusBg,
            }}
          >
            {examiner.statusLabel}
          </span>
        </div>
        <div className="mb-[5px] flex justify-between text-[11.5px] text-ink-muted">
          <span>
            {examiner.activeLoad} active · {examiner.completedCount} complete
          </span>
          <span className="font-semibold">
            {examiner.activeLoad}/{examiner.cap}
          </span>
        </div>
        <div className="h-[7px] overflow-hidden rounded-full bg-[#e4eaf1]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${examiner.loadPct}%`,
              backgroundColor: examiner.barColor,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-[22px]">
      <div className="mb-[18px] flex items-center gap-3.5">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[17px] font-semibold text-white"
          style={{ backgroundColor: examiner.color }}
        >
          {examiner.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-ink">{examiner.name}</div>
          <div className="text-[12.5px] text-ink-faint">
            UNIDA Gontor · Focus {examiner.focus}
          </div>
        </div>
        <span
          className="rounded-full px-[11px] py-[5px] text-[11.5px] font-semibold"
          style={{
            color: examiner.statusColor,
            backgroundColor: examiner.statusBg,
          }}
        >
          {examiner.statusLabel}
        </span>
      </div>

      <div className="mb-4 flex gap-2.5">
        {[
          { label: "Active sessions", value: examiner.activeLoad, color: "#7c3aed" },
          {
            label: "Scoring complete",
            value: examiner.completedCount,
            color: "#16a34a",
          },
          { label: "Capacity", value: examiner.cap, color: "#334155" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex-1 rounded-[10px] bg-page-alt px-[13px] py-[11px]"
          >
            <div className="mb-[3px] text-[11.5px] text-ink-faint">
              {stat.label}
            </div>
            <div
              className="text-[19px] font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-[5px] flex justify-between text-[11.5px] text-ink-muted">
        <span>Current workload</span>
        <span className="font-semibold">
          {examiner.activeLoad}/{examiner.cap}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e4eaf1]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${examiner.loadPct}%`,
            backgroundColor: examiner.barColor,
          }}
        />
      </div>
    </div>
  );
}
