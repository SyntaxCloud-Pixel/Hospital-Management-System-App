-- ============================================================
-- Hospital Management System — Database Schema + RLS Policies
-- Run this in the Supabase SQL Editor on a fresh project.
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles: one row per auth user, mirrors auth.users with app-specific fields
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'doctor', 'receptionist', 'patient')),
  phone text,
  created_at timestamptz not null default now()
);

-- Doctors: extends profiles for users with role = 'doctor'
create table if not exists doctors (
  id uuid primary key references profiles(id) on delete cascade,
  specialization text,
  department text,
  created_at timestamptz not null default now()
);

-- Patients: extends profiles for users with role = 'patient'
create table if not exists patients (
  id uuid primary key references profiles(id) on delete cascade,
  date_of_birth date,
  gender text,
  blood_group text,
  address text,
  created_at timestamptz not null default now()
);

-- Appointments
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Prescriptions
create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  doctor_id uuid not null references doctors(id) on delete cascade,
  patient_id uuid not null references patients(id) on delete cascade,
  medicines text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_appointments_updated on appointments;
create trigger trg_appointments_updated before update on appointments
  for each row execute function set_updated_at();

drop trigger if exists trg_prescriptions_updated on prescriptions;
create trigger trg_prescriptions_updated before update on prescriptions
  for each row execute function set_updated_at();

-- Auto-create a profile row (and doctor/patient row) whenever a new auth user signs up,
-- reading role/full_name/phone out of the signUp() user_metadata.
create or replace function handle_new_user()
returns trigger as $$
declare
  user_role text := coalesce(new.raw_user_meta_data->>'role', 'patient');
begin
  insert into profiles (id, email, full_name, role, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    user_role,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;

  if user_role = 'patient' then
    insert into patients (id) values (new.id) on conflict (id) do nothing;
  elsif user_role = 'doctor' then
    insert into doctors (id) values (new.id) on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- HELPER: get the role of the currently authenticated user
-- ============================================================
create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table doctors enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table prescriptions enable row level security;

-- ---------- PROFILES ----------
create policy "profiles: self select" on profiles
  for select using (id = auth.uid());

create policy "profiles: admin select all" on profiles
  for select using (current_user_role() = 'admin');

-- staff need to see basic profile info of patients/doctors they work with
create policy "profiles: staff select relevant" on profiles
  for select using (current_user_role() in ('doctor', 'receptionist'));

create policy "profiles: self update" on profiles
  for update using (id = auth.uid());

create policy "profiles: admin update all" on profiles
  for update using (current_user_role() = 'admin');

create policy "profiles: admin delete" on profiles
  for delete using (current_user_role() = 'admin');

create policy "profiles: self insert" on profiles
  for insert with check (id = auth.uid());

-- ---------- DOCTORS ----------
create policy "doctors: any authenticated select" on doctors
  for select using (auth.uid() is not null);

create policy "doctors: admin write" on doctors
  for insert with check (current_user_role() = 'admin');

create policy "doctors: admin or self update" on doctors
  for update using (current_user_role() = 'admin' or id = auth.uid());

create policy "doctors: admin delete" on doctors
  for delete using (current_user_role() = 'admin');

-- ---------- PATIENTS ----------
create policy "patients: self select" on patients
  for select using (id = auth.uid());

create policy "patients: staff select all" on patients
  for select using (current_user_role() in ('admin', 'doctor', 'receptionist'));

create policy "patients: self or staff insert" on patients
  for insert with check (id = auth.uid() or current_user_role() in ('admin', 'receptionist'));

create policy "patients: self or staff update" on patients
  for update using (id = auth.uid() or current_user_role() in ('admin', 'receptionist'));

create policy "patients: admin delete" on patients
  for delete using (current_user_role() = 'admin');

-- ---------- APPOINTMENTS ----------
create policy "appointments: patient select own" on appointments
  for select using (patient_id = auth.uid());

create policy "appointments: doctor select own" on appointments
  for select using (doctor_id = auth.uid());

create policy "appointments: staff select all" on appointments
  for select using (current_user_role() in ('admin', 'receptionist'));

create policy "appointments: patient or staff insert" on appointments
  for insert with check (
    patient_id = auth.uid() or current_user_role() in ('admin', 'receptionist')
  );

create policy "appointments: patient update own (cancel)" on appointments
  for update using (patient_id = auth.uid());

create policy "appointments: doctor update own (status)" on appointments
  for update using (doctor_id = auth.uid());

create policy "appointments: staff update all" on appointments
  for update using (current_user_role() in ('admin', 'receptionist'));

create policy "appointments: admin delete" on appointments
  for delete using (current_user_role() = 'admin');

-- ---------- PRESCRIPTIONS ----------
create policy "prescriptions: patient select own" on prescriptions
  for select using (patient_id = auth.uid());

create policy "prescriptions: doctor select own" on prescriptions
  for select using (doctor_id = auth.uid());

create policy "prescriptions: admin select all" on prescriptions
  for select using (current_user_role() = 'admin');

create policy "prescriptions: doctor insert own" on prescriptions
  for insert with check (doctor_id = auth.uid());

create policy "prescriptions: doctor update own" on prescriptions
  for update using (doctor_id = auth.uid());

create policy "prescriptions: admin delete" on prescriptions
  for delete using (current_user_role() = 'admin');

-- ============================================================
-- Seed an initial admin (optional):
-- 1. Sign up normally through the app's /register page with any email,
--    OR create a user in Supabase Auth dashboard.
-- 2. Then run:
--    update profiles set role = 'admin' where email = 'youradmin@example.com';
-- ============================================================
