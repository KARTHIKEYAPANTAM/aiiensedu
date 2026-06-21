-- Fix "permission denied for table subjects" and curriculum read failures.
-- Run in Supabase SQL Editor if student/creator content loads return 401/403.

grant usage on schema public to anon, authenticated;

grant select on table public.subjects to anon, authenticated;
grant select on table public.units to anon, authenticated;
grant select on table public.topics to anon, authenticated;
grant select on table public.topic_videos to anon, authenticated;
grant select on table public.content_items to anon, authenticated;

grant insert, update, delete on table public.subjects to authenticated;
grant insert, update, delete on table public.units to authenticated;
grant insert, update, delete on table public.topics to authenticated;
grant insert, update, delete on table public.topic_videos to authenticated;
grant insert, update, delete on table public.content_items to authenticated;

alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.topics enable row level security;
alter table public.topic_videos enable row level security;
alter table public.content_items enable row level security;

drop policy if exists "subjects_anon_select" on public.subjects;
drop policy if exists "authenticated_can_read_subjects" on public.subjects;
drop policy if exists "subjects_auth_write" on public.subjects;
create policy "subjects_anon_select" on public.subjects for select to anon using (true);
create policy "authenticated_can_read_subjects" on public.subjects for select to authenticated using (true);
create policy "subjects_auth_write" on public.subjects for all to authenticated using (true) with check (true);

drop policy if exists "units_anon_select" on public.units;
drop policy if exists "units_auth_select" on public.units;
drop policy if exists "units_auth_write" on public.units;
create policy "units_anon_select" on public.units for select to anon using (true);
create policy "units_auth_select" on public.units for select to authenticated using (true);
create policy "units_auth_write" on public.units for all to authenticated using (true) with check (true);

drop policy if exists "topics_anon_select" on public.topics;
drop policy if exists "topics_auth_select" on public.topics;
drop policy if exists "topics_auth_write" on public.topics;
create policy "topics_anon_select" on public.topics for select to anon using (true);
create policy "topics_auth_select" on public.topics for select to authenticated using (true);
create policy "topics_auth_write" on public.topics for all to authenticated using (true) with check (true);

drop policy if exists "topic_videos_anon_select" on public.topic_videos;
drop policy if exists "topic_videos_auth_select" on public.topic_videos;
drop policy if exists "topic_videos_auth_write" on public.topic_videos;
create policy "topic_videos_anon_select" on public.topic_videos for select to anon using (true);
create policy "topic_videos_auth_select" on public.topic_videos for select to authenticated using (true);
create policy "topic_videos_auth_write" on public.topic_videos for all to authenticated using (true) with check (true);

drop policy if exists "content_items_anon_select" on public.content_items;
drop policy if exists "content_items_auth_select" on public.content_items;
drop policy if exists "content_items_auth_write" on public.content_items;
create policy "content_items_anon_select" on public.content_items for select to anon using (true);
create policy "content_items_auth_select" on public.content_items for select to authenticated using (true);
create policy "content_items_auth_write" on public.content_items for all to authenticated using (true) with check (true);
