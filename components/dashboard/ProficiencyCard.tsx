import type { CEFRLevel } from "@/types";

type Props = {
  level: CEFRLevel;
};

export function ProficiencyCard({ level }: Props) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-primary p-6 text-white">
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="40" fill="white" />
        </svg>
      </div>
      <p className="relative mb-2 text-label-sm uppercase tracking-widest opacity-80">
        Current Proficiency
      </p>
      <div className="relative text-[64px] font-bold leading-none">{level}</div>
      <p className="relative mt-1 text-label-sm opacity-80">
        Speaking Level (ALIKHTIBAR)
      </p>
    </div>
  );
}
