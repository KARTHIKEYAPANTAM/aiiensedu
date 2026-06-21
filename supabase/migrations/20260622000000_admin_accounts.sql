-- Admin and Sub-Admin credential tables used by legacy portal login (username/password).
-- Required for Admin Login and Sub Admin Login flows in adminDashboard.js.

create table if not exists public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sub_admin_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  branch text,
  department text,
  regulation text,
  university text,
  permissions jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_accounts_username_status
  on public.admin_accounts (username, status);

create index if not exists idx_sub_admin_accounts_username_status
  on public.sub_admin_accounts (username, status);

create index if not exists idx_sub_admin_accounts_branch
  on public.sub_admin_accounts (branch);

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.admin_accounts to anon, authenticated;
grant select, insert, update, delete on table public.sub_admin_accounts to anon, authenticated;

alter table public.admin_accounts enable row level security;
alter table public.sub_admin_accounts enable row level security;

drop policy if exists "admin_accounts_anon_all" on public.admin_accounts;
drop policy if exists "admin_accounts_auth_all" on public.admin_accounts;
create policy "admin_accounts_anon_all"
  on public.admin_accounts for all to anon using (true) with check (true);
create policy "admin_accounts_auth_all"
  on public.admin_accounts for all to authenticated using (true) with check (true);

drop policy if exists "sub_admin_accounts_anon_all" on public.sub_admin_accounts;
drop policy if exists "sub_admin_accounts_auth_all" on public.sub_admin_accounts;
create policy "sub_admin_accounts_anon_all"
  on public.sub_admin_accounts for all to anon using (true) with check (true);
create policy "sub_admin_accounts_auth_all"
  on public.sub_admin_accounts for all to authenticated using (true) with check (true);

-- Default admin credentials for initial portal access (change after first login).
insert into public.admin_accounts (username, password, status)
values ('admin', 'admin123', 'active')
on conflict (username) do nothing;
