-- Kalam Phase 1 foundation: profiles, sessions, recordings, storage, RLS

-- ── Helper: role from JWT app_metadata ─────────────────────────────────────
create or replace function public.kalam_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'candidate'
  );
$$;

-- ── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'candidate'
    check (role in ('candidate', 'examiner', 'admin')),
  full_name text not null,
  institution text default 'Universitas Darussalam Gontor',
  username text,
  gender text check (gender is null or gender in ('male', 'female')),
  nim text,
  campus text check (campus is null or campus in ('A', 'C')),
  faculty text,
  study_program text,
  semester smallint check (semester is null or (semester >= 1 and semester <= 14)),
  preferred_language text check (
    preferred_language is null or preferred_language in ('ar', 'en')
  ),
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

create policy profiles_select_examiner
  on public.profiles for select
  using (kalam_user_role() in ('examiner', 'admin'));

-- ── test_sessions ───────────────────────────────────────────────────────────
create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  examiner_id uuid references public.profiles(id),
  status text not null default 'in_progress'
    check (status in (
      'in_progress', 'awaiting_review', 'under_review', 'completed', 'expired'
    )),
  language text not null default 'ar'
    check (language in ('ar', 'en')),
  current_level text not null default 'Pre-A1',
  final_level text,
  progress_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

create index if not exists test_sessions_candidate_id_idx
  on public.test_sessions(candidate_id);

create index if not exists test_sessions_examiner_id_idx
  on public.test_sessions(examiner_id);

create index if not exists test_sessions_status_idx
  on public.test_sessions(status);

alter table public.test_sessions enable row level security;

create policy test_sessions_candidate_all
  on public.test_sessions for all
  using (candidate_id = auth.uid())
  with check (candidate_id = auth.uid());

create policy test_sessions_examiner_select
  on public.test_sessions for select
  using (
    kalam_user_role() in ('examiner', 'admin')
    and (
      examiner_id = auth.uid()
      or (examiner_id is null and status = 'awaiting_review')
    )
  );

create policy test_sessions_examiner_update
  on public.test_sessions for update
  using (
    kalam_user_role() in ('examiner', 'admin')
    and (
      examiner_id = auth.uid()
      or (examiner_id is null and status = 'awaiting_review')
    )
  )
  with check (kalam_user_role() in ('examiner', 'admin'));

create policy test_sessions_admin_select
  on public.test_sessions for select
  using (kalam_user_role() = 'admin');

create policy test_sessions_admin_update
  on public.test_sessions for update
  using (kalam_user_role() = 'admin')
  with check (kalam_user_role() = 'admin');

-- ── recordings ───────────────────────────────────────────────────────────────
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.test_sessions(id) on delete cascade,
  task_id text not null,
  storage_path text,
  duration_sec integer,
  file_size_bytes bigint,
  eye_contact_avg real,
  warning_count integer not null default 0,
  transcript text,
  ai_suggestion jsonb,
  uploaded_at timestamptz,
  expires_at timestamptz,
  unique (session_id, task_id)
);

create index if not exists recordings_session_id_idx
  on public.recordings(session_id);

alter table public.recordings enable row level security;

create policy recordings_candidate_select
  on public.recordings for select
  using (
    exists (
      select 1 from public.test_sessions ts
      where ts.id = recordings.session_id
        and ts.candidate_id = auth.uid()
    )
  );

create policy recordings_candidate_insert
  on public.recordings for insert
  with check (
    exists (
      select 1 from public.test_sessions ts
      where ts.id = recordings.session_id
        and ts.candidate_id = auth.uid()
    )
  );

create policy recordings_candidate_update
  on public.recordings for update
  using (
    exists (
      select 1 from public.test_sessions ts
      where ts.id = recordings.session_id
        and ts.candidate_id = auth.uid()
    )
  );

create policy recordings_examiner_select
  on public.recordings for select
  using (
    kalam_user_role() in ('examiner', 'admin')
    and exists (
      select 1 from public.test_sessions ts
      where ts.id = recordings.session_id
        and (
          ts.examiner_id = auth.uid()
          or (ts.examiner_id is null and ts.status = 'awaiting_review')
        )
    )
  );

-- ── Storage bucket (private) ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('kalam-recordings', 'kalam-recordings', false)
on conflict (id) do nothing;

create policy kalam_recordings_insert
  on storage.objects for insert
  with check (
    bucket_id = 'kalam-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.test_sessions ts
      where ts.id::text = (storage.foldername(name))[1]
        and ts.candidate_id = auth.uid()
    )
  );

create policy kalam_recordings_select
  on storage.objects for select
  using (
    bucket_id = 'kalam-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.test_sessions ts
      where ts.id::text = (storage.foldername(name))[1]
        and (
          ts.candidate_id = auth.uid()
          or ts.examiner_id = auth.uid()
          or kalam_user_role() in ('examiner', 'admin')
        )
    )
  );

create policy kalam_recordings_update
  on storage.objects for update
  using (
    bucket_id = 'kalam-recordings'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from public.test_sessions ts
      where ts.id::text = (storage.foldername(name))[1]
        and ts.candidate_id = auth.uid()
    )
  );


-- Session results for examiner-published scores

create table if not exists public.session_results (
  session_id uuid primary key references public.test_sessions(id) on delete cascade,
  examiner_id uuid not null references public.profiles(id),
  overall_level text not null,
  dimension_scores jsonb not null default '{}',
  dimension_notes jsonb default '{}',
  summary text,
  examiner_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_results_examiner_id_idx
  on public.session_results(examiner_id);

create index if not exists session_results_published_at_idx
  on public.session_results(published_at);

alter table public.session_results enable row level security;

create policy session_results_candidate_select
  on public.session_results for select
  using (
    published_at is not null
    and exists (
      select 1 from public.test_sessions ts
      where ts.id = session_results.session_id
        and ts.candidate_id = auth.uid()
    )
  );

create policy session_results_examiner_select
  on public.session_results for select
  using (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );

create policy session_results_examiner_insert
  on public.session_results for insert
  with check (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );

create policy session_results_examiner_update
  on public.session_results for update
  using (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  )
  with check (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );


-- Session target language (Arabic or English speaking test)
alter table public.test_sessions
  add column if not exists language text not null default 'ar'
  check (language in ('ar', 'en'));

create index if not exists test_sessions_language_idx
  on public.test_sessions (language);


-- Eye contact timeline events per recording (proctoring)

create table if not exists public.eye_contact_events (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings(id) on delete cascade,
  timestamp_ms integer not null check (timestamp_ms >= 0),
  event_type text not null check (event_type in ('good', 'warning', 'danger')),
  gaze_score numeric(4, 3) not null check (gaze_score >= 0 and gaze_score <= 1),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists eye_contact_events_recording_id_idx
  on public.eye_contact_events(recording_id, timestamp_ms);

alter table public.eye_contact_events enable row level security;

create policy eye_contact_events_candidate_all
  on public.eye_contact_events for all
  using (
    exists (
      select 1
      from public.recordings r
      join public.test_sessions ts on ts.id = r.session_id
      where r.id = eye_contact_events.recording_id
        and ts.candidate_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.recordings r
      join public.test_sessions ts on ts.id = r.session_id
      where r.id = eye_contact_events.recording_id
        and ts.candidate_id = auth.uid()
    )
  );

create policy eye_contact_events_examiner_select
  on public.eye_contact_events for select
  using (
    kalam_user_role() in ('examiner', 'admin')
    and exists (
      select 1
      from public.recordings r
      join public.test_sessions ts on ts.id = r.session_id
      where r.id = eye_contact_events.recording_id
        and (
          ts.examiner_id = auth.uid()
          or (ts.examiner_id is null and ts.status = 'awaiting_review')
        )
    )
  );


-- Realtime for waiting room + published results

alter publication supabase_realtime add table public.test_sessions;
alter publication supabase_realtime add table public.session_results;


-- Fix examiner claim + admin distribution RLS

drop policy if exists test_sessions_examiner_update on public.test_sessions;

create policy test_sessions_examiner_update
  on public.test_sessions for update
  using (
    kalam_user_role() in ('examiner', 'admin')
    and (
      examiner_id = auth.uid()
      or (examiner_id is null and status = 'awaiting_review')
    )
  )
  with check (kalam_user_role() in ('examiner', 'admin'));

drop policy if exists test_sessions_admin_select on public.test_sessions;
create policy test_sessions_admin_select
  on public.test_sessions for select
  using (kalam_user_role() = 'admin');

drop policy if exists test_sessions_admin_update on public.test_sessions;
create policy test_sessions_admin_update
  on public.test_sessions for update
  using (kalam_user_role() = 'admin')
  with check (kalam_user_role() = 'admin');


-- Align session_results with app types + examiner RLS for publish

alter table public.session_results
  add column if not exists dimension_notes jsonb default '{}',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

drop policy if exists session_results_examiner_select on public.session_results;
create policy session_results_examiner_select
  on public.session_results for select
  using (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );

drop policy if exists session_results_examiner_insert on public.session_results;
create policy session_results_examiner_insert
  on public.session_results for insert
  with check (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );

drop policy if exists session_results_examiner_update on public.session_results;
create policy session_results_examiner_update
  on public.session_results for update
  using (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  )
  with check (
    kalam_user_role() in ('examiner', 'admin')
    and examiner_id = auth.uid()
  );


-- Allow authenticated users to create their own profile row (signup / ensure-profile)

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);


-- UNIDA Gontor candidate profile fields on profiles

alter table public.profiles
  add column if not exists username text,
  add column if not exists gender text check (gender is null or gender in ('male', 'female')),
  add column if not exists nim text,
  add column if not exists campus text check (campus is null or campus in ('A', 'C')),
  add column if not exists faculty text,
  add column if not exists study_program text,
  add column if not exists semester smallint check (semester is null or (semester >= 1 and semester <= 14)),
  add column if not exists preferred_language text check (
    preferred_language is null or preferred_language in ('ar', 'en')
  );

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

create unique index if not exists profiles_nim_unique_idx
  on public.profiles (nim)
  where nim is not null;


-- RPC fallback for candidate profile upsert (works even when PostgREST cache lags)
create or replace function public.kalam_upsert_candidate_profile(
  p_id uuid,
  p_full_name text,
  p_username text,
  p_nim text,
  p_faculty text,
  p_study_program text,
  p_semester smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, role, full_name, institution, username, nim, faculty, study_program, semester
  )
  values (
    p_id,
    'candidate',
    p_full_name,
    'Universitas Darussalam Gontor',
    p_username,
    p_nim,
    p_faculty,
    p_study_program,
    p_semester
  )
  on conflict (id) do update set
    role = excluded.role,
    full_name = excluded.full_name,
    institution = excluded.institution,
    username = excluded.username,
    nim = excluded.nim,
    faculty = excluded.faculty,
    study_program = excluded.study_program,
    semester = excluded.semester;
end;
$$;

grant execute on function public.kalam_upsert_candidate_profile(uuid, text, text, text, text, text, smallint)
  to service_role;


-- Recording retention: daily auto-delete of expired video + audit log (PRD FR-STORE-02)
-- Enforces the 14-day retention promised in the PRD. `expires_at` is set at upload
-- time; this migration adds the job that actually removes expired media.

-- ── deletion audit log ───────────────────────────────────────────────────────
create table if not exists public.deletion_audit_log (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null,
  session_id uuid not null,
  storage_path text,
  file_size_bytes bigint,
  uploaded_at timestamptz,
  expired_at timestamptz not null,
  deleted_at timestamptz not null default now()
);

create index if not exists deletion_audit_log_deleted_at_idx
  on public.deletion_audit_log(deleted_at);

alter table public.deletion_audit_log enable row level security;

-- Admins may read the audit log; the log is written only by the SECURITY DEFINER
-- job below, so no client insert/update/delete policies are granted.
drop policy if exists deletion_audit_log_admin_select on public.deletion_audit_log;
create policy deletion_audit_log_admin_select
  on public.deletion_audit_log for select
  using (kalam_user_role() = 'admin');

-- ── cleanup function ─────────────────────────────────────────────────────────
create or replace function public.kalam_delete_expired_recordings()
returns integer
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  deleted_count integer := 0;
begin
  -- 1. Snapshot expiring recordings into the audit log before deletion.
  insert into public.deletion_audit_log
    (recording_id, session_id, storage_path, file_size_bytes, uploaded_at, expired_at)
  select r.id, r.session_id, r.storage_path, r.file_size_bytes, r.uploaded_at, r.expires_at
  from public.recordings r
  where r.expires_at is not null
    and r.expires_at < now();

  -- 2. Remove the physical objects from the private Storage bucket.
  delete from storage.objects o
  using public.recordings r
  where r.expires_at is not null
    and r.expires_at < now()
    and o.bucket_id = 'kalam-recordings'
    and o.name = r.storage_path;

  -- 3. Delete recording rows; eye_contact_events cascade via FK on delete cascade.
  with removed as (
    delete from public.recordings r
    where r.expires_at is not null
      and r.expires_at < now()
    returning r.id
  )
  select count(*) into deleted_count from removed;

  -- 4. Flag never-scored sessions as expired once their video is gone.
  --    Scored/completed sessions keep their status so candidates still see results
  --    (PRD FR-STORE-03/04: score metadata persists after the video is deleted).
  update public.test_sessions ts
  set status = 'expired'
  where ts.status in ('in_progress', 'awaiting_review', 'under_review')
    and not exists (
      select 1 from public.recordings r where r.session_id = ts.id
    )
    and not exists (
      select 1 from public.session_results sr where sr.session_id = ts.id
    );

  -- 5. Prune audit rows older than 90 days (PRD §15 retention table).
  delete from public.deletion_audit_log
  where deleted_at < now() - interval '90 days';

  return deleted_count;
end;
$$;

comment on function public.kalam_delete_expired_recordings() is
  'Deletes expired recordings (video file + metadata), logs to deletion_audit_log, and expires unscored sessions. Runs daily via pg_cron.';

-- ── schedule daily at 02:00 UTC (guarded — pg_cron may be unavailable) ────────
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- Idempotent: drop any previous schedule of the same name before re-adding.
    if exists (select 1 from cron.job where jobname = 'kalam-delete-expired-recordings') then
      perform cron.unschedule('kalam-delete-expired-recordings');
    end if;

    perform cron.schedule(
      'kalam-delete-expired-recordings',
      '0 2 * * *',
      $cron$ select public.kalam_delete_expired_recordings(); $cron$
    );
  else
    raise notice 'pg_cron not available; run public.kalam_delete_expired_recordings() via an external daily scheduler.';
  end if;
end;
$$;
