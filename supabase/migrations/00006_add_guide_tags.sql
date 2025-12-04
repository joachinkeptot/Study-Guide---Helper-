-- Create guide_tags table
create table if not exists public.guide_tags (
  id bigint generated always as identity primary key,
  study_guide_id bigint not null references public.study_guides(id) on delete cascade,
  tag text not null,
  created_at timestamp with time zone default now(),
  unique (study_guide_id, tag)
);

-- Ensure extension for case-insensitive ops if needed
-- create extension if not exists citext;
-- alter table public.guide_tags alter column tag type citext;

-- RLS
alter table public.guide_tags enable row level security;

-- Policy: users can select their own guide tags
drop policy if exists "guide_tags_select_own" on public.guide_tags;
create policy "guide_tags_select_own"
  on public.guide_tags for select
  using (
    exists (
      select 1 from public.study_guides sg
      where sg.id = guide_tags.study_guide_id
        and sg.user_id = auth.uid()
    )
  );

-- Policy: users can insert tags for their own guides
drop policy if exists "guide_tags_insert_own" on public.guide_tags;
create policy "guide_tags_insert_own"
  on public.guide_tags for insert
  with check (
    exists (
      select 1 from public.study_guides sg
      where sg.id = guide_tags.study_guide_id
        and sg.user_id = auth.uid()
    )
  );

-- Policy: users can delete tags for their own guides
drop policy if exists "guide_tags_delete_own" on public.guide_tags;
create policy "guide_tags_delete_own"
  on public.guide_tags for delete
  using (
    exists (
      select 1 from public.study_guides sg
      where sg.id = guide_tags.study_guide_id
        and sg.user_id = auth.uid()
    )
  );
