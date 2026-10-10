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
