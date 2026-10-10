-- Realtime for waiting room + published results

alter publication supabase_realtime add table public.test_sessions;
alter publication supabase_realtime add table public.session_results;
