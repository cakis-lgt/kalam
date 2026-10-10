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
