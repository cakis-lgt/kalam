export type UserRole = "candidate" | "examiner" | "admin";

export type SessionStatus =
  | "in_progress"
  | "awaiting_review"
  | "under_review"
  | "completed"
  | "expired";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  institution: string | null;
  avatar_url: string | null;
  username: string | null;
  gender: "male" | "female" | null;
  nim: string | null;
  campus: "A" | "C" | null;
  faculty: string | null;
  study_program: string | null;
  semester: number | null;
  preferred_language: "ar" | "en" | null;
  created_at: string;
};

export type TestSession = {
  id: string;
  candidate_id: string;
  examiner_id: string | null;
  status: SessionStatus;
  language: "ar" | "en";
  current_level: string;
  final_level: string | null;
  progress_json: SessionProgress;
  started_at: string;
  completed_at: string | null;
  expires_at: string | null;
};

export type SessionProgress = {
  currentLevelIdx?: number;
  testLanguage?: "ar" | "en";
  attempts?: Array<{
    taskId: string;
    taskLevel: string;
    overall: number;
    passed: boolean;
  }>;
  lastPhase?: string;
};

export type Recording = {
  id: string;
  session_id: string;
  task_id: string;
  storage_path: string | null;
  duration_sec: number | null;
  file_size_bytes: number | null;
  uploaded_at: string | null;
  expires_at: string | null;
  transcript: string | null;
  ai_suggestion: Record<string, unknown> | null;
  eye_contact_avg?: number | null;
  warning_count?: number | null;
};

export type EyeContactEvent = {
  id: string;
  recording_id: string;
  timestamp_ms: number;
  event_type: "good" | "warning" | "danger";
  gaze_score: number;
  duration_ms: number;
  created_at?: string;
};

export type SessionResult = {
  session_id: string;
  examiner_id: string;
  overall_level: string;
  dimension_scores: Record<string, number>;
  dimension_notes?: Record<string, string> | null;
  summary: string | null;
  examiner_notes?: string | null;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};
