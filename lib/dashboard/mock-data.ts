import type { CEFRLevel, TestLanguage } from "@/types";

export type SessionStatus =
  | "completed"
  | "awaiting_review"
  | "under_review"
  | "in_progress"
  | "expired";

export type TestSessionRow = {
  id: string;
  /** Raw UUID for links/API when loaded from Supabase */
  sessionUuid?: string;
  dateLabel: string;
  language?: TestLanguage;
  level: CEFRLevel;
  status: SessionStatus;
  scoreLabel?: string;
  progressPercent?: number;
  taskCount?: number;
  recordingCount?: number;
};

export type CandidateProfile = {
  fullName: string;
  institution: string;
  avatarUrl: string;
  currentLevel: CEFRLevel;
  levelLabel: string;
  tags: string[];
};

export const MOCK_CANDIDATE: CandidateProfile = {
  fullName: "Ahmed Al-Farsi",
  institution: "Emirates Institute of Technology",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC7bslS44elZrH02RE6FotxOjlEYh3oUjX9_NKipIzhvh7qDHbxIO1oyX8HEhgsGnRkTF1pBGx7biG-HK2gebK35biT8N2Ij2lLQBoRqo6s6Gi3r3Wu6-a0Yh_LRy5L7tcVncEpH7SDvnue5LWOBlFOjZubHcyxopziKFn0u-61FRnZILCWUHRw2j61ZAFaQx91skrPMAJ9YkJFY7yZItndgDYYUrxq6NJbFIHOPEBEceADwEUxRyPXQveG49ezMq4UhKLHeKRF58Q",
  currentLevel: "B1",
  levelLabel: "Upper Intermediate",
  tags: ["Upper Intermediate", "Verified Candidate"],
};

export const MOCK_SESSIONS: TestSessionRow[] = [
  {
    id: "KAL-99210",
    dateLabel: "24 Okt 2023",
    language: "ar",
    level: "B1",
    status: "completed",
    scoreLabel: "B1 · 4.10/5",
    recordingCount: 2,
    taskCount: 2,
  },
  {
    id: "KAL-99455",
    dateLabel: "12 Nov 2023",
    language: "en",
    level: "A2",
    status: "completed",
    scoreLabel: "A2 · 4.00/5",
    recordingCount: 2,
    taskCount: 2,
  },
  {
    id: "KAL-10022",
    dateLabel: "Today",
    language: "ar",
    level: "C1",
    status: "in_progress",
    progressPercent: 50,
    taskCount: 1,
    recordingCount: 1,
  },
];
