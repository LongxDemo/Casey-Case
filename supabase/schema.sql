-- Casey — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) to provision the
-- backend shared by the mobile app and the admin dashboard.

-- ─────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Catalog: phone models
-- ─────────────────────────────────────────────────────────────
create table if not exists phone_models (
  id          text primary key,
  brand       text not null,
  name        text not null,
  aspect      numeric not null default 0.49,
  camera      jsonb,                      -- { x, y, w, h } normalized 0..1
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Catalog: sticker packs + stickers
-- ─────────────────────────────────────────────────────────────
create table if not exists sticker_packs (
  id          text primary key,
  name        text not null,
  cover       text,                       -- emoji shown on the pack chip
  active      boolean not null default true,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists stickers (
  id          uuid primary key default gen_random_uuid(),
  pack_id     text references sticker_packs(id) on delete cascade,
  emoji       text,
  image_url   text,                        -- for uploaded image stickers
  label       text,
  sort        int not null default 0
);

-- ─────────────────────────────────────────────────────────────
-- Catalog: backgrounds + templates
-- ─────────────────────────────────────────────────────────────
create table if not exists backgrounds (
  id          text primary key,
  name        text not null,
  colors      jsonb not null,              -- ["#FF7EC0", "#FF3E9A"]
  active      boolean not null default true,
  sort        int not null default 0
);

create table if not exists templates (
  id          text primary key,
  name        text not null,
  tag         text,
  accent      text,
  background  jsonb not null,              -- { id, name, colors }
  layers      jsonb not null default '[]', -- LayerSpec[]
  active      boolean not null default true,
  featured    boolean not null default false,
  sort        int not null default 0,
  uses_count  int not null default 0,      -- times a customer tapped this to start designing
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Front page content (admin-controlled)
-- ─────────────────────────────────────────────────────────────
create table if not exists front_page (
  id            int primary key default 1,
  hero_title    text not null default 'Design it. Print it. Love it.',
  hero_subtitle text not null default '100% you, 100% Casey',
  hero_cta      text not null default 'Start designing',
  banner_text   text,
  featured_template_ids text[] not null default '{}',
  updated_at    timestamptz not null default now(),
  constraint front_page_singleton check (id = 1)
);
insert into front_page (id) values (1) on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Customer designs (collected — guest or logged-in)
-- ─────────────────────────────────────────────────────────────
create table if not exists designs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete set null, -- null = guest
  model_id       text,
  background     jsonb,
  layers         jsonb not null default '[]',
  preview_url    text,                        -- rendered PNG in storage
  -- Storefront "send to Casey" submissions have no checkout — contact info
  -- lets the admin follow up manually to sort printing/shipping/pickup.
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  note           text,
  status         text not null default 'new', -- 'new' | 'contacted' | 'done'
  created_at     timestamptz not null default now()
);
-- Safe to re-run on an already-provisioned project.
alter table designs add column if not exists contact_name text;
alter table designs add column if not exists contact_email text;
alter table designs add column if not exists contact_phone text;
alter table designs add column if not exists note text;
alter table designs add column if not exists status text not null default 'new';

-- ─────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────
create type order_status as enum ('pending', 'paid', 'printing', 'shipped', 'ready_pickup', 'completed', 'cancelled');

create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  order_no      text unique not null,
  user_id       uuid references auth.users(id) on delete set null,
  email         text,
  full_name     text,
  address       text,
  fulfillment   text not null default 'ship',       -- 'ship' | 'pickup'
  status        order_status not null default 'pending',
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents   int not null default 0,
  stripe_payment_intent text,
  created_at    timestamptz not null default now()
);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade,
  design_id    uuid references designs(id) on delete set null,
  model_id     text,
  quantity     int not null default 1,
  price_cents  int not null default 1990,
  preview_url  text
);

-- ─────────────────────────────────────────────────────────────
-- Admins (dashboard access)
-- ─────────────────────────────────────────────────────────────
create table if not exists admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

-- security definer so RLS policies can call this without recursing through
-- the admins table's own policy (which itself depends on is_admin()).
create or replace function is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- Callable directly by clients (security definer, bypasses RLS on `admins`)
-- so the app can ask "is the signed-in user an admin" without recursing
-- through admins' own RLS policy, which itself depends on is_admin().
create or replace function am_i_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function am_i_admin() to anon, authenticated;

-- Lets any client (including guests) bump a gallery template's popularity
-- counter without granting UPDATE on templates itself — the table stays
-- admin-write-only via the templates_admin_write policy below.
create or replace function increment_template_uses(p_template_id text)
returns void language sql security definer set search_path = public as $$
  update templates set uses_count = uses_count + 1
  where id = p_template_id and active = true;
$$;
grant execute on function increment_template_uses(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table phone_models  enable row level security;
alter table sticker_packs enable row level security;
alter table stickers      enable row level security;
alter table backgrounds   enable row level security;
alter table templates     enable row level security;
alter table front_page    enable row level security;
alter table designs       enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table admins        enable row level security;

-- Catalog + front page: readable by everyone, writable by admins only
do $$
declare t text;
begin
  foreach t in array array['phone_models','sticker_packs','stickers','backgrounds','templates','front_page']
  loop
    execute format('drop policy if exists %I_read on %I;', t, t);
    execute format('create policy %I_read on %I for select using (true);', t, t);
    execute format('drop policy if exists %I_admin_write on %I;', t, t);
    execute format('create policy %I_admin_write on %I for all using (is_admin()) with check (is_admin());', t, t);
  end loop;
end $$;

-- Designs: anyone can insert (guest submissions, or a signed-in customer
-- inserting their own row); owner or admin can read. Guest rows (user_id
-- null) are NOT publicly readable — they carry customer contact info, and
-- only the admin needs to see them.
drop policy if exists designs_insert on designs;
create policy designs_insert on designs for insert with check (user_id is null or user_id = auth.uid());
drop policy if exists designs_read_own on designs;
create policy designs_read_own on designs for select using (auth.uid() is not null and user_id = auth.uid());
-- Lets a signed-in customer autosave/update their own design (drafts, and
-- flipping a draft to a real "Send to Casey" submission) without going
-- through the admin-only designs_admin_all policy.
drop policy if exists designs_update_own on designs;
create policy designs_update_own on designs for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());
create policy designs_admin_all on designs for all using (is_admin()) with check (is_admin());

-- Orders: customer can create + see their own; admin sees all
create policy orders_insert on orders for insert with check (true);
create policy orders_read_own on orders for select using (user_id = auth.uid() or is_admin());
create policy orders_admin_all on orders for all using (is_admin()) with check (is_admin());
create policy order_items_insert on order_items for insert with check (true);
create policy order_items_read on order_items for select using (is_admin() or exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid())));

-- Admins table: readable by admins
create policy admins_read on admins for select using (is_admin());

-- ─────────────────────────────────────────────────────────────
-- Storage: customer design photos
-- ─────────────────────────────────────────────────────────────
-- Uploaded photos live here (public URLs stored in designs.layers) instead of
-- base64 data URLs inside the jsonb, which bloats rows and page loads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-photos', 'design-photos', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists design_photos_insert on storage.objects;
create policy design_photos_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'design-photos');
