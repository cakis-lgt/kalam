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
