import type { CEFRLevel } from "@/types";
import type { SessionStatus } from "@/types/database";
import type { CandidateProfileView } from "@/lib/profile/candidate-fields";

export type AdminStats = {
  unassigned: number;
  underReview: number;
  completed: number;
  activeExaminers: number;
};

export type UnassignedSession = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarBg: string;
  candidate: CandidateProfileView;
  targetLevel: CEFRLevel;
  dateLabel: string;
  taskCount: number;
  warningCount: number;
  recommendedExaminerId: string | null;
  recommendedExaminerName: string | null;
};

export type ExaminerCard = {
  id: string;
  name: string;
  initials: string;
  color: string;
  focus: string;
  cap: number;
  activeLoad: number;
  completedCount: number;
  loadPct: number;
  barColor: string;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
};

export type DistributionHistoryItem = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarBg: string;
  candidate: CandidateProfileView;
  targetLevel: CEFRLevel;
  dateLabel: string;
  examinerName: string;
  examinerInitials: string;
  examinerColor: string;
  status: SessionStatus;
  statusLabel: string;
  statusBg: string;
  statusColor: string;
};

export type ExaminerOption = {
  id: string;
  label: string;
  focusMatch: boolean;
};

export const MOCK_ADMIN_EXAMINERS: ExaminerCard[] = [
  {
    id: "e1",
    name: "Ustadz Fadhil",
    initials: "UF",
    color: "#0e7c66",
    focus: "A1 – B1",
    cap: 8,
    activeLoad: 2,
    completedCount: 12,
    loadPct: 25,
    barColor: "#16a34a",
    statusLabel: "Available",
    statusBg: "#eef6ee",
    statusColor: "#16a34a",
  },
  {
    id: "e2",
    name: "Ustadzah Mona",
    initials: "UM",
    color: "#7c3aed",
    focus: "B1 – C2",
    cap: 8,
    activeLoad: 1,
    completedCount: 9,
    loadPct: 13,
    barColor: "#16a34a",
    statusLabel: "Available",
    statusBg: "#eef6ee",
    statusColor: "#16a34a",
  },
  {
    id: "e3",
    name: "Ustadz Rasyid",
    initials: "UR",
    color: "#1d4ed8",
    focus: "A1 – A2",
    cap: 6,
    activeLoad: 6,
    completedCount: 7,
    loadPct: 100,
    barColor: "#dc2626",
    statusLabel: "At capacity",
    statusBg: "#fdecec",
    statusColor: "#dc2626",
  },
  {
    id: "e4",
    name: "Ustadzah Laila",
    initials: "UL",
    color: "#be185d",
    focus: "B2 – C2",
    cap: 6,
    activeLoad: 0,
    completedCount: 5,
    loadPct: 0,
    barColor: "#16a34a",
    statusLabel: "Available",
    statusBg: "#eef6ee",
    statusColor: "#16a34a",
  },
];

export const MOCK_UNASSIGNED: UnassignedSession[] = [
  {
    id: "sess-001",
    candidateName: "Ahmad Fauzan",
    candidateInitials: "AF",
    avatarBg: "#156c84",
    candidate: {
      fullName: "Ahmad Fauzan",
      username: "ahmad.fauzan",
      gender: "male",
      nim: "2021001001",
      campus: "A",
      faculty: "Fakultas Tarbiyah",
      studyProgram: "Pendidikan Bahasa Arab (PBA)",
      semester: 5,
      preferredLanguage: "ar",
    },
    targetLevel: "B1",
    dateLabel: "15 Jun 2026",
    taskCount: 5,
    warningCount: 2,
    recommendedExaminerId: "e1",
    recommendedExaminerName: "Ustadz Fadhil",
  },
  {
    id: "sess-002",
    candidateName: "Siti Nurhaliza",
    candidateInitials: "SN",
    avatarBg: "#7c3aed",
    candidate: {
      fullName: "Siti Nurhaliza",
      username: "siti.n",
      gender: "female",
      nim: "2021002042",
      campus: "C",
      faculty: "Fakultas Syariah",
      studyProgram: "Hukum Ekonomi Syariah",
      semester: 3,
      preferredLanguage: "ar",
    },
    targetLevel: "A2",
    dateLabel: "15 Jun 2026",
    taskCount: 4,
    warningCount: 0,
    recommendedExaminerId: "e3",
    recommendedExaminerName: "Ustadz Rasyid",
  },
];

export const MOCK_DISTRIBUTION_HISTORY: DistributionHistoryItem[] = [
  {
    id: "sess-003",
    candidateName: "Budi Santoso",
    candidateInitials: "BS",
    avatarBg: "#0e7c66",
    candidate: {
      fullName: "Budi Santoso",
      username: "budi.s",
      gender: "male",
      nim: "2020003015",
      campus: "A",
      faculty: "Fakultas Humaniora",
      studyProgram: "Ilmu Komunikasi (IKOM)",
      semester: 7,
      preferredLanguage: "en",
    },
    targetLevel: "B2",
    dateLabel: "14 Jun 2026",
    examinerName: "Ustadzah Mona",
    examinerInitials: "UM",
    examinerColor: "#7c3aed",
    status: "under_review",
    statusLabel: "Under review",
    statusBg: "#f3e8ff",
    statusColor: "#7c3aed",
  },
  {
    id: "sess-004",
    candidateName: "Fatimah Zahra",
    candidateInitials: "FZ",
    avatarBg: "#0369a1",
    candidate: {
      fullName: "Fatimah Zahra",
      username: "fatimah.z",
      gender: "female",
      nim: "2021004018",
      campus: "C",
      faculty: "Fakultas Ilmu Kesehatan",
      studyProgram: "Ilmu Gizi",
      semester: 2,
      preferredLanguage: "ar",
    },
    targetLevel: "A1",
    dateLabel: "13 Jun 2026",
    examinerName: "Ustadz Fadhil",
    examinerInitials: "UF",
    examinerColor: "#0e7c66",
    status: "completed",
    statusLabel: "Complete",
    statusBg: "#eef6ee",
    statusColor: "#16a34a",
  },
  {
    id: "sess-005",
    candidateName: "Rizky Pratama",
    candidateInitials: "RP",
    avatarBg: "#b45309",
    candidate: {
      fullName: "Rizky Pratama",
      username: "rizky.p",
      gender: "male",
      nim: "2019005120",
      campus: "A",
      faculty: "Fakultas Sains dan Teknologi",
      studyProgram: "Informatika",
      semester: 8,
      preferredLanguage: "en",
    },
    targetLevel: "B1",
    dateLabel: "10 Jun 2026",
    examinerName: "Ustadz Fadhil",
    examinerInitials: "UF",
    examinerColor: "#0e7c66",
    status: "completed",
    statusLabel: "Complete",
    statusBg: "#eef6ee",
    statusColor: "#16a34a",
  },
];
