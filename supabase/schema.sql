-- ==========================================
-- Milijuli - Group Savings & Loan Management System
-- Supabase PostgreSQL Database Schema
-- ==========================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Table Definitions
-- ==========================================

-- PROFILES (Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone_number text,
  address text,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  joined_date timestamptz not null default now(),
  profile_photo text,
  created_at timestamptz not null default now()
);

-- SAVINGS
create table public.savings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  receipt_number text unique not null,
  note text,
  proof_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- LOANS
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  interest_rate numeric(5, 2) not null default 0.00 check (interest_rate >= 0),
  date_issued date not null default current_date,
  due_date date,
  receipt_number text unique not null,
  status text not null default 'active' check (status in ('active', 'paid', 'overdue')),
  note text,
  proof_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- PAYMENTS (Repayments linked to Loans)
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references public.loans(id) on delete cascade not null,
  amount numeric(12, 2) not null check (amount > 0),
  date date not null default current_date,
  receipt_number text unique not null,
  note text,
  proof_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ==========================================
-- 2. Row Level Security (RLS) Setup
-- ==========================================

-- Enable RLS on all public tables
alter table public.profiles enable row level security;
alter table public.savings enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;

-- ==========================================
-- 3. Security Helper Functions
-- ==========================================

-- Check if current user is approved
create or replace function public.is_approved(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and status = 'approved'
  );
end;
$$ language plpgsql;

-- Check if current user is approved admin
create or replace function public.is_admin(user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin' and status = 'approved'
  );
end;
$$ language plpgsql;

-- ==========================================
-- 4. RLS Security Policies
-- ==========================================

-- Policies for public.profiles
create policy "Allow approved users to view all profiles"
  on public.profiles for select
  using (public.is_approved(auth.uid()) or auth.uid() = id);

create policy "Allow users to update their own profile details"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Allow approved admins full control over profiles"
  on public.profiles for all
  using (public.is_admin(auth.uid()));

-- Policies for public.savings
create policy "Allow approved members to read all savings"
  on public.savings for select
  using (public.is_approved(auth.uid()));

create policy "Allow approved admins full control over savings"
  on public.savings for all
  using (public.is_admin(auth.uid()));

-- Policies for public.loans
create policy "Allow approved members to read all loans"
  on public.loans for select
  using (public.is_approved(auth.uid()));

create policy "Allow approved admins full control over loans"
  on public.loans for all
  using (public.is_admin(auth.uid()));

-- Policies for public.payments
create policy "Allow approved members to read all repayments"
  on public.payments for select
  using (public.is_approved(auth.uid()));

create policy "Allow approved admins full control over repayments"
  on public.payments for all
  using (public.is_admin(auth.uid()));

-- ==========================================
-- 5. Automate User Registration (Triggers)
-- ==========================================

-- Function to handle automated profile inserts on auth registration
create or replace function public.handle_new_user()
returns trigger security definer as $$
declare
  is_first_profile boolean;
  default_role text := 'member';
  default_status text := 'pending';
begin
  -- Check if this is the first user registering in the system
  select not exists (select 1 from public.profiles) into is_first_profile;
  
  -- If first user, make them auto-approved Admin so they can manage the system instantly
  if is_first_profile then
    default_role := 'admin';
    default_status := 'approved';
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone_number,
    address,
    role,
    status,
    profile_photo
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Member'),
    coalesce(new.raw_user_meta_data->>'phone_number', new.phone),
    coalesce(new.raw_user_meta_data->>'address', ''),
    default_role,
    default_status,
    coalesce(new.raw_user_meta_data->>'profile_photo', '')
  );
  return new;
end;
$$ language plpgsql;

-- Trigger linked to auth.users inserts
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 6. Storage Config & Security (Proofs Bucket)
-- ==========================================
-- Note: Make sure to create a storage bucket named 'proofs' in the Supabase Dashboard.
-- Run these SQL statements if storage policies are loaded through the sql manager:

-- Enable read access to storage assets for approved members
create policy "Approved members can read proof photos"
  on storage.objects for select
  using (
    bucket_id = 'proofs' 
    and public.is_approved(auth.uid())
  );

-- Enable full access to storage assets for approved admins
create policy "Admins can upload proof photos"
  on storage.objects for all
  using (
    bucket_id = 'proofs' 
    and public.is_admin(auth.uid())
  );
