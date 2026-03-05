-- Invite Pool schema (run in Supabase SQL editor)

create extension if not exists pgcrypto;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  note text,
  status text not null default 'available' check (status in ('available','claimed','used','expired')),
  claimed_by text,
  claimed_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  invite_id uuid references public.invites(id) on delete cascade,
  actor text not null,
  action text not null check (action in ('create','claim','use','release','expire')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invites_updated_at on public.invites;
create trigger trg_invites_updated_at
before update on public.invites
for each row execute function public.touch_updated_at();

-- seed examples (optional)
insert into public.invites (code, note)
values
  ('DEMO-CODE-001', 'friend batch a'),
  ('DEMO-CODE-002', 'friend batch a'),
  ('DEMO-CODE-003', 'friend batch b')
on conflict (code) do nothing;
