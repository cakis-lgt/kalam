import type { CandidateProfileView } from "@/lib/profile/candidate-fields";
import { formatCandidateMeta } from "@/lib/profile/candidate-fields";

type Props = {
  candidate: Partial<CandidateProfileView>;
  className?: string;
};

/** Secondary line for candidate identity in admin/examiner tables. */
export function CandidateMetaLine({ candidate, className = "" }: Props) {
  const text = formatCandidateMeta(candidate);
  if (!text) return null;

  return (
    <div className={`text-xs text-ink-faint ${className}`}>{text}</div>
  );
}

type DetailsProps = {
  candidate: CandidateProfileView;
};

/** Full candidate profile grid for examiner review header. */
export function CandidateDetailsCard({ candidate }: DetailsProps) {
  const rows: { label: string; value: string }[] = [
    { label: "Username", value: candidate.username ? `@${candidate.username}` : "—" },
    { label: "NIM", value: candidate.nim ?? "—" },
    { label: "Gender", value: candidate.gender === "male" ? "Male" : candidate.gender === "female" ? "Female" : "—" },
    { label: "Campus", value: candidate.campus ? `Campus ${candidate.campus}` : "—" },
    { label: "Faculty", value: candidate.faculty ?? "—" },
    { label: "Study program", value: candidate.studyProgram ?? "—" },
    { label: "Semester", value: candidate.semester ? String(candidate.semester) : "—" },
    {
      label: "Test language",
      value:
        candidate.preferredLanguage === "en"
          ? "English"
          : candidate.preferredLanguage === "ar"
            ? "Arabic"
            : "—",
    },
  ];

  return (
    <div className="mb-5 rounded-xl border border-border bg-white px-5 py-4">
      <div className="mb-3 text-[12px] font-semibold tracking-wide text-ink-faint">
        CANDIDATE PROFILE
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="text-[11px] font-medium text-ink-faint">{row.label}</div>
            <div className="text-[13px] font-medium text-ink">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
