import type { TestLanguage } from "@/types";

export const GONTOR_INSTITUTION = "Universitas Darussalam Gontor";

export const CANDIDATE_GENDERS = ["male", "female"] as const;
export type CandidateGender = (typeof CANDIDATE_GENDERS)[number];

export const GONTOR_CAMPUSES = ["A", "C"] as const;
export type GontorCampus = (typeof GONTOR_CAMPUSES)[number];

export {
  ALL_UNIDA_STUDY_PROGRAMS,
  GONTOR_FACULTIES,
  UNIDA_FACULTY_PROGRAMS,
  facultySelectOptions,
  isValidFacultyProgramPair,
  studyProgramSelectOptions,
  studyProgramsForFaculty,
  type UnidaFaculty,
  type UnidaStudyProgram,
} from "@/lib/profile/unida-academics";

export const GENDER_LABELS: Record<CandidateGender, string> = {
  male: "Male",
  female: "Female",
};

export const CAMPUS_LABELS: Record<GontorCampus, string> = {
  A: "Campus A",
  C: "Campus C",
};

export const LANGUAGE_PREF_LABELS: Record<TestLanguage, string> = {
  ar: "Arabic",
  en: "English",
};

export type CandidateProfileView = {
  username: string | null;
  fullName: string;
  gender: CandidateGender | null;
  nim: string | null;
  campus: GontorCampus | null;
  faculty: string | null;
  studyProgram: string | null;
  semester: number | null;
  preferredLanguage: TestLanguage | null;
};

export function profileRowToCandidateView(row: {
  full_name: string;
  username?: string | null;
  gender?: string | null;
  nim?: string | null;
  campus?: string | null;
  faculty?: string | null;
  study_program?: string | null;
  semester?: number | null;
  preferred_language?: string | null;
}): CandidateProfileView {
  return {
    fullName: row.full_name,
    username: row.username ?? null,
    gender: (row.gender as CandidateGender | null) ?? null,
    nim: row.nim ?? null,
    campus: (row.campus as GontorCampus | null) ?? null,
    faculty: row.faculty ?? null,
    studyProgram: row.study_program ?? null,
    semester: row.semester ?? null,
    preferredLanguage: (row.preferred_language as TestLanguage | null) ?? null,
  };
}

export function formatCandidateMeta(
  c: Partial<CandidateProfileView>,
  opts?: { includeName?: boolean },
): string {
  const parts: string[] = [];
  if (opts?.includeName && c.fullName) parts.push(c.fullName);
  if (c.nim) parts.push(`NIM ${c.nim}`);
  if (c.username) parts.push(`@${c.username}`);
  if (c.campus) parts.push(CAMPUS_LABELS[c.campus]);
  if (c.faculty) parts.push(c.faculty.replace(/^Fakultas /, ""));
  if (c.studyProgram) parts.push(c.studyProgram);
  if (c.semester) parts.push(`Sem ${c.semester}`);
  if (c.gender) parts.push(GENDER_LABELS[c.gender]);
  if (c.preferredLanguage) parts.push(LANGUAGE_PREF_LABELS[c.preferredLanguage]);
  return parts.join(" · ");
}

export const CANDIDATE_PROFILE_COLUMNS =
  "full_name, username, gender, nim, campus, faculty, study_program, semester, preferred_language";
