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
