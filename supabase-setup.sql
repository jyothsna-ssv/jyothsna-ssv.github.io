create table if not exists public.portfolio_profile (
  id text primary key default 'main',
  full_name text not null,
  short_name text not null,
  title_role text not null,
  hero_roles text not null,
  tagline text not null,
  email text not null,
  github_url text,
  linkedin_url text,
  location text,
  resume_url text,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_profile enable row level security;

drop policy if exists "Public can read portfolio profile" on public.portfolio_profile;
create policy "Public can read portfolio profile"
on public.portfolio_profile
for select
using (true);

drop policy if exists "Owner can insert portfolio profile" on public.portfolio_profile;
create policy "Owner can insert portfolio profile"
on public.portfolio_profile
for insert
with check ((auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com');

drop policy if exists "Owner can update portfolio profile" on public.portfolio_profile;
create policy "Owner can update portfolio profile"
on public.portfolio_profile
for update
using ((auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com')
with check ((auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com');

insert into public.portfolio_profile (
  id,
  full_name,
  short_name,
  title_role,
  hero_roles,
  tagline,
  email,
  github_url,
  linkedin_url,
  location
) values (
  'main',
  'Jyothsna Karuparthi',
  'Jyothsna',
  'Software Engineer',
  'Software Engineer · Project Manager · Full-Stack Developer',
  'Building reliable software that turns ideas into usable, scalable products.',
  'karuparthi.jyothsna@gmail.com',
  'https://github.com/jyothsna-ssv',
  'https://www.linkedin.com/in/karuparthi-jyothsna/',
  'Harrison, NJ, USA'
) on conflict (id) do nothing;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'portfolio-files',
  'portfolio-files',
  true,
  10485760,
  array['application/pdf']
) on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read portfolio files" on storage.objects;
create policy "Public can read portfolio files"
on storage.objects
for select
using (bucket_id = 'portfolio-files');

drop policy if exists "Owner can upload portfolio files" on storage.objects;
create policy "Owner can upload portfolio files"
on storage.objects
for insert
with check (
  bucket_id = 'portfolio-files'
  and (auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com'
);

drop policy if exists "Owner can update portfolio files" on storage.objects;
create policy "Owner can update portfolio files"
on storage.objects
for update
using (
  bucket_id = 'portfolio-files'
  and (auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com'
)
with check (
  bucket_id = 'portfolio-files'
  and (auth.jwt() ->> 'email') = 'karuparthi.jyothsna@gmail.com'
);
