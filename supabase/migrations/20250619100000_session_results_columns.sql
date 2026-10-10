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
