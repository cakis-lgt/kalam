import type { CEFRLevel } from "@/types";
import type { SessionStatus } from "@/types/database";
import type { CandidateProfileView } from "@/lib/profile/candidate-fields";

export type QueueFilter = "pending" | "claimed" | "completed";

export type ExaminerQueueItem = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  avatarBg: string;
  candidate: CandidateProfileView;
  targetLevel: CEFRLevel;
  testLanguage: "ar" | "en";
  dateLabel: string;
  taskCount: number;
  warningCount: number;
  status: SessionStatus;
  examinerId: string | null;
  action: "claim" | "review" | "view";
};

export type ExaminerHistoryItem = {
  id: string;
  candidateName: string;
  level: CEFRLevel;
  meta: string;
  bandLabel: string;
  bandColor: string;
  averageScore: number;
};

export type ExaminerRecordingView = {
  id: string;
  taskId: string;
  taskLabel: string;
  level: CEFRLevel;
  formatLabel: string;
  durationSec: number;
  fileSizeBytes: number | null;
  transcript: string | null;
  eyeContactAvg: number | null;
  warningCount: number;
  aiSuggestion: number | null;
  storagePath: string | null;
  eyeContactEvents: EyeContactEventView[];
};

export type EyeContactEventView = {
  timestampMs: number;
  eventType: "good" | "warning" | "danger";
  gazeScore: number;
};

export type ExaminerReviewSession = {
  id: string;
  candidateName: string;
  candidate: CandidateProfileView;
  dateLabel: string;
  testLanguage: "ar" | "en";
  targetLevel: CEFRLevel;
  taskCount: number;
  status: SessionStatus;
  recordings: ExaminerRecordingView[];
  draft: {
    overallLevel: CEFRLevel;
    dimensionScores: Record<string, number>;
    dimensionNotes: Record<string, string>;
    summary: string;
    publishedAt: string | null;
  } | null;
};

const MOCK_CANDIDATE_AHMAD: CandidateProfileView = {
  fullName: "Ahmad Fauzan",
  username: "ahmad.fauzan",
  gender: "male",
  nim: "2021001001",
  campus: "A",
  faculty: "Fakultas Tarbiyah",
  studyProgram: "Pendidikan Bahasa Arab (PBA)",
  semester: 5,
  preferredLanguage: "ar",
};

export const MOCK_EXAMINER_QUEUE: ExaminerQueueItem[] = [
  {
    id: "sess-001",
    candidateName: "Ahmad Fauzan",
    candidateInitials: "AF",
    avatarBg: "#156c84",
    candidate: MOCK_CANDIDATE_AHMAD,
    targetLevel: "B1",
    testLanguage: "ar",
    dateLabel: "15 Jun 2026",
    taskCount: 5,
    warningCount: 2,
    status: "awaiting_review",
    examinerId: null,
    action: "claim",
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
      preferredLanguage: "en",
    },
    targetLevel: "A2",
    testLanguage: "en",
    dateLabel: "15 Jun 2026",
    taskCount: 4,
    warningCount: 0,
    status: "awaiting_review",
    examinerId: null,
    action: "claim",
  },
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
      preferredLanguage: "ar",
    },
    targetLevel: "B2",
    testLanguage: "ar",
    dateLabel: "14 Jun 2026",
    taskCount: 6,
    warningCount: 5,
    status: "under_review",
    examinerId: "examiner-demo",
    action: "review",
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
    testLanguage: "ar",
    dateLabel: "13 Jun 2026",
    taskCount: 3,
    warningCount: 1,
    status: "completed",
    examinerId: "examiner-demo",
    action: "view",
  },
];

export const MOCK_EXAMINER_HISTORY: ExaminerHistoryItem[] = [
  {
    id: "sess-004",
    candidateName: "Fatimah Zahra",
    level: "A1",
    meta: "13 Jun 2026 · 3 tasks",
    bandLabel: "Memadai",
    bandColor: "#84cc16",
    averageScore: 3.2,
  },
  {
    id: "sess-005",
    candidateName: "Rizky Pratama",
    level: "B1",
    meta: "10 Jun 2026 · 5 tasks",
    bandLabel: "Baik",
    bandColor: "#22c55e",
    averageScore: 3.8,
  },
];

export const MOCK_REVIEW_SESSION: ExaminerReviewSession = {
  id: "sess-003",
  candidateName: "Budi Santoso",
  candidate: {
    fullName: "Budi Santoso",
    username: "budi.s",
    gender: "male",
    nim: "2020003015",
    campus: "A",
    faculty: "Fakultas Humaniora",
    studyProgram: "Ilmu Komunikasi (IKOM)",
    semester: 7,
    preferredLanguage: "ar",
  },
  dateLabel: "14 Jun 2026",
  testLanguage: "ar",
  targetLevel: "B2",
  taskCount: 3,
  status: "under_review",
  recordings: [
    {
      id: "rec-1",
      taskId: "b2-hiwar-1",
      taskLabel: "Tugas 1",
      level: "B2",
      formatLabel: "Hiwar",
      durationSec: 87,
      fileSizeBytes: 980000,
      transcript:
        "أَرَى أَنَّ التِّجَارَةَ الإِلِكْتُرُونِيَّةَ لَهَا مَزَايَا كَثِيرَةٌ وَلَكِنَّ لَهَا أَيْضًا مَسَاوِئَ…",
      eyeContactAvg: 0.72,
      warningCount: 2,
      aiSuggestion: 3,
      storagePath: null,
      eyeContactEvents: [
        { timestampMs: 0, eventType: "good", gazeScore: 0.88 },
        { timestampMs: 12000, eventType: "warning", gazeScore: 0.52 },
        { timestampMs: 24000, eventType: "danger", gazeScore: 0.28 },
        { timestampMs: 45000, eventType: "good", gazeScore: 0.88 },
        { timestampMs: 60000, eventType: "good", gazeScore: 0.88 },
      ],
    },
    {
      id: "rec-2",
      taskId: "b2-munaqasyah-1",
      taskLabel: "Tugas 2",
      level: "B2",
      formatLabel: "Munaqasyah",
      durationSec: 92,
      fileSizeBytes: 1024000,
      transcript:
        "أَنَا مَعَ فِكْرَةِ أَنَّ التَّعْلِيمَ عَنْ بُعْدٍ فَعَّالٌ إِذَا وُجِدَتِ البُنْيَةُ…",
      eyeContactAvg: 0.65,
      warningCount: 3,
      aiSuggestion: 4,
      storagePath: null,
      eyeContactEvents: [
        { timestampMs: 5000, eventType: "good", gazeScore: 0.88 },
        { timestampMs: 18000, eventType: "danger", gazeScore: 0.28 },
        { timestampMs: 32000, eventType: "warning", gazeScore: 0.52 },
        { timestampMs: 50000, eventType: "danger", gazeScore: 0.28 },
      ],
    },
    {
      id: "rec-3",
      taskId: "b2-wasf-1",
      taskLabel: "Tugas 3",
      level: "B2",
      formatLabel: "Wasf",
      durationSec: 78,
      fileSizeBytes: 760000,
      transcript: "هَذِهِ صُورَةٌ لِسُوقٍ تَقْلِيدِيٍّ فِي مَدِينَةِ فَاسَ…",
      eyeContactAvg: 0.81,
      warningCount: 0,
      aiSuggestion: 4,
      storagePath: null,
      eyeContactEvents: [
        { timestampMs: 0, eventType: "good", gazeScore: 0.88 },
        { timestampMs: 20000, eventType: "good", gazeScore: 0.88 },
        { timestampMs: 45000, eventType: "good", gazeScore: 0.88 },
      ],
    },
  ],
  draft: {
    overallLevel: "B2",
    dimensionScores: {
      pronunciation: 3,
      fluency: 4,
      grammar: 3,
      vocabulary: 4,
      coherence: 3,
      interaction: 3,
    },
    dimensionNotes: {
      pronunciation: "Pelafalan jelas, sedikit kesalahan harakat.",
    },
    summary: "",
    publishedAt: null,
  },
};
