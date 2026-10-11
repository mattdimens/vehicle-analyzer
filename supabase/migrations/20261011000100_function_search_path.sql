-- Pin search_path on trigger functions (Supabase security advisor:
-- function_search_path_mutable). Bodies already use fully qualified names.
-- Run once in the Supabase SQL Editor.
alter function public.handle_new_user() set search_path = '';
alter function public.set_current_timestamp_updated_at() set search_path = '';
