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
