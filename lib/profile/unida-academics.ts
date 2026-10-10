/** UNIDA Gontor faculties and study programs (S1, S2, S3). */

export const GONTOR_FACULTIES = [
  "Fakultas Tarbiyah",
  "Fakultas Ushuluddin",
  "Fakultas Syariah",
  "Fakultas Ekonomi dan Manajemen",
  "Fakultas Humaniora",
  "Fakultas Sains dan Teknologi",
  "Fakultas Ilmu Kesehatan",
  "Fakultas Kedokteran",
  "Program Magister (S2)",
  "Program Doktor (S3)",
] as const;

export type UnidaFaculty = (typeof GONTOR_FACULTIES)[number];

export const UNIDA_FACULTY_PROGRAMS: Record<
  UnidaFaculty,
  readonly string[]
> = {
  "Fakultas Tarbiyah": [
    "Pendidikan Agama Islam (PAI)",
    "Pendidikan Bahasa Arab (PBA)",
    "Tadris Bahasa Inggris (TBI)",
  ],
  "Fakultas Ushuluddin": [
    "Aqidah dan Filsafat Islam (AFI)",
    "Studi Agama-Agama (SAA)",
    "Ilmu Al-Qur'an dan Tafsir (IAT)",
  ],
  "Fakultas Syariah": [
    "Hukum Ekonomi Syariah (HES)",
    "Perbandingan Madzhab (PM)",
  ],
  "Fakultas Ekonomi dan Manajemen": ["Ekonomi Islam", "Manajemen"],
  "Fakultas Humaniora": [
    "Hubungan Internasional (HI)",
    "Ilmu Komunikasi (IKOM)",
  ],
  "Fakultas Sains dan Teknologi": [
    "Agroteknologi",
    "Farmasi",
    "Informatika",
  ],
  "Fakultas Ilmu Kesehatan": ["Ilmu Gizi"],
  "Fakultas Kedokteran": ["Pendidikan Dokter"],
  "Program Magister (S2)": [
    "Pendidikan Bahasa Arab",
    "Aqidah dan Filsafat Islam",
    "Hukum Ekonomi Syariah",
    "Manajemen Pendidikan Islam",
  ],
  "Program Doktor (S3)": [
    "Aqidah dan Filsafat Islam",
    "Pendidikan Bahasa Arab",
  ],
};

export type UnidaStudyProgram =
  (typeof UNIDA_FACULTY_PROGRAMS)[UnidaFaculty][number];

export const ALL_UNIDA_STUDY_PROGRAMS = GONTOR_FACULTIES.flatMap(
  (faculty) => [...UNIDA_FACULTY_PROGRAMS[faculty]],
);

export function studyProgramsForFaculty(
  faculty: string,
): readonly string[] {
  return UNIDA_FACULTY_PROGRAMS[faculty as UnidaFaculty] ?? [];
}

export function isValidFacultyProgramPair(
  faculty: string,
  studyProgram: string,
): boolean {
  return studyProgramsForFaculty(faculty).includes(studyProgram);
}

export function facultySelectOptions() {
  return GONTOR_FACULTIES.map((f) => ({ value: f, label: f }));
}

export function studyProgramSelectOptions(faculty: string) {
  return studyProgramsForFaculty(faculty).map((p) => ({
    value: p,
    label: p,
  }));
}
