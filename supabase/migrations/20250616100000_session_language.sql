-- Session target language (Arabic or English speaking test)
alter table public.test_sessions
  add column if not exists language text not null default 'ar'
  check (language in ('ar', 'en'));

create index if not exists test_sessions_language_idx
  on public.test_sessions (language);
