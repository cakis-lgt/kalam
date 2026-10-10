# Kalam (ALIKHTIBAR) — Speaking Proficiency Test Platform

Web platform for remote, video-based CEFR (Pre-A1–C2) speaking assessment in **Arabic and English**. Candidates take a self-paced test with light gaze proctoring; human examiners review the recordings and score them against a 5-dimension rubric. AI (Whisper transcription + Claude pre-scoring) is an optional assist layer, not the final grader.

> Repo/package name is `kalam`; the product is branded **ALIKHTIBAR** in the UI.

## Features

- **Bilingual**: parallel Arabic and English task banks (`lib/cefr/tasks.ts`, `lib/cefr/tasks-en.ts`), selectable per session
- **Auth & roles**: candidate, examiner, admin (Supabase Auth, role in `app_metadata`)
- **Video test flow**: camera + mic recording per task, auto-start/stop, upload to Supabase Storage
- **Eye-contact proctoring**: browser-side MediaPipe Face Landmarker, gaze score + warnings, no frames sent to server
- **Examiner dashboard**: queue, claim, video review with rubric form, draft save, publish → realtime score push to candidate
- **Admin dashboard**: examiner workload distribution, history
- **5-dimension CEFR rubric**: Pronunciation, Fluency, Grammar, Vocabulary, Coherence (see `lib/cefr/rubric.ts`)
- **AI assist (optional, off by default)**: Whisper transcription + Claude pre-score suggestion — examiner always has final say
- 14-day recording retention (video only; scores/transcripts kept)

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in Supabase project + OpenAI key (Anthropic key only needed if enabling AI assist)
npm run bootstrap:supabase   # or paste scripts/kalam-bootstrap.sql in Supabase SQL Editor
npm run seed:demo            # creates demo candidate/examiner/admin accounts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo logins available on the `/login` page.

Useful scripts:
- `npm run check:setup` — verifies the Supabase schema is reachable and up to date
- `npm run e2e:smoke` — scripted smoke test of the core flow

## Architecture

```
Browser (camera/mic via MediaRecorder + MediaPipe gaze tracking)
    │
    ▼
Next.js API routes (app/api/*)
    ├─ /api/sessions, /api/sessions/[id]      → session CRUD
    ├─ /api/recordings/*                      → upload metadata, signed playback URLs
    ├─ /api/examiner/*                        → queue, claim, score, publish
    ├─ /api/admin/*                           → examiner assignment/distribution
    ├─ /api/transcribe                        → OpenAI Whisper (optional AI assist)
    ├─ /api/assess, /api/finalize             → Claude CEFR pre-score (optional AI assist)
    └─ /api/auth/*                            → register/login/logout/password reset
    │
    ▼
Supabase (Postgres + Auth + Storage + Realtime)
```

Session/test progress is persisted in Postgres (`test_sessions`, `recordings`, `session_results`), not just client state — refreshing the browser resumes an in-progress test.

## Structure

| Path | Purpose |
|---|---|
| `app/page.tsx` | Landing |
| `app/(auth)/*` | Login, register, forgot password |
| `app/dashboard/*` | Candidate portal (history, profile, practice) |
| `app/tes/[sessionId]` | Test orchestrator (active session) |
| `app/tes/[sessionId]/waiting` | Waiting room (realtime score push) |
| `app/hasil/[sessionId]` | Results + radar chart |
| `app/examiner/*` | Examiner queue, review, rubric scoring |
| `app/admin/*` | Admin: examiner distribution, history |
| `app/api/*` | API routes |
| `lib/cefr/tasks.ts` / `tasks-en.ts` | Task banks (Arabic / English) per CEFR level & format |
| `lib/cefr/rubric.ts` | Rubric dimensions + level descriptors |
| `lib/cefr/prompt.ts` | Claude system prompt (bilingual-aware) |
| `lib/proctoring/*` | MediaPipe gaze detection |
| `lib/video/*` | Camera + video recording |
| `lib/supabase/*` | Client/server/middleware Supabase clients |
| `supabase/migrations/*` | Schema (profiles, test_sessions, recordings, eye_contact_events, session_results) |
| `store/testStore.ts` | Client test-session state machine (Zustand) |

## Cost estimate (AI assist, if enabled)

Per test (~8 tasks): Whisper ~$0.05 + Claude (prompt caching) ~$0.03 → **~$0.08/test**. Off by default; manual examiner scoring is the primary path.

## Notes

- Requires `MediaRecorder` + `getUserMedia` + WASM support (Chrome/Edge/Firefox/Safari modern desktop). Mobile is not a supported test-taking device.
- Pronunciation is scored primarily from transcript + duration/fluency proxies when AI assist is used, not raw audio signal.
- Add rate limiting to API routes before production use.
