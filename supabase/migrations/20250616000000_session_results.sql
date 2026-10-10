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
