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
