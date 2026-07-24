# MediCare — Hospital Management System

A role-based Hospital Management System built with **React (Vite)** and **Supabase**
(Auth + PostgreSQL + Row Level Security).

## Project Overview

Four roles share one app, each with their own dashboard and permissions:

| Role | Can do |
|---|---|
| **Admin** | Manage doctors, receptionists, patients; view all appointments; reports; full CRUD |
| **Doctor** | View assigned appointments, patient records, write/update prescriptions, update appointment status |
| **Receptionist** | Register patients, book/update/cancel appointments, view doctor schedules |
| **Patient** | Register/login, view profile, book appointments, view history & prescriptions |

Route access is enforced two ways: client-side via `ProtectedRoute` (redirects
unauthorized users) and server-side via Supabase **Row Level Security** policies
(so the database itself refuses unauthorized reads/writes, not just the UI).

## Tech Stack
- React 18 + Vite
- React Router DOM v6
- Supabase (Auth, PostgreSQL, RLS, Edge Functions)
- Plain CSS / CSS Modules (no UI framework)

## Folder Structure

```
hms/
├── src/
│   ├── components/       # ProtectedRoute, Sidebar, DashboardLayout, Modal
│   ├── context/          # AuthContext (session, profile, role)
│   ├── lib/               # supabaseClient.js
│   ├── pages/
│   │   ├── auth/          # Login, Register (patients only)
│   │   ├── admin/         # Dashboard, ManageDoctors, ManagePatients,
│   │   │                  # ManageReceptionists, AllAppointments, Reports
│   │   ├── doctor/        # Dashboard, Appointments, Prescriptions
│   │   ├── receptionist/  # Dashboard, RegisterPatient, ManageAppointments
│   │   └── patient/       # Dashboard, BookAppointment, AppointmentHistory,
│   │                      # MyPrescriptions, Profile
│   ├── App.jsx            # All routes
│   ├── main.jsx
│   └── index.css          # Global styles / design tokens
├── supabase/
│   ├── schema.sql          # Tables + RLS policies (run this first)
│   └── functions/
│       └── admin-create-user/  # Edge Function for creating staff/patient logins
├── package.json
├── vite.config.js
└── .env.example
```

## Setup Instructions

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) → New Project. Note your **Project URL**
and **anon public key** (Settings → API).

### 2. Run the database schema
Open the Supabase SQL Editor and run the entire contents of `supabase/schema.sql`.
This creates all tables, a `current_user_role()` helper, a trigger that auto-creates
a `profiles` row on signup, and all RLS policies.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Fill in:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 4. Install & run
```bash
npm install
npm run dev
```

### 5. Deploy the admin-create-user Edge Function
Because creating a new auth user client-side with `supabase.auth.signUp()` normally
signs the browser into that *new* user (which would log the Admin out), staff account
creation (Doctor / Receptionist / receptionist-registered Patient) goes through a
Supabase **Edge Function** that uses the service role key server-side instead.

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy admin-create-user
```
No extra secrets to set — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
automatically available inside Edge Functions. You'll also need to add your anon
key as a function secret so the function can verify the caller's JWT:
```bash
supabase secrets set SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 6. Create your first Admin account
Public registration only creates **Patient** accounts (by design — staff accounts
are created by an Admin). To get your first Admin:
1. Register normally through the app (creates a patient account), or create a user
   from the Supabase Dashboard → Authentication → Users.
2. In the SQL Editor, promote that user:
   ```sql
   update profiles set role = 'admin' where email = 'youradmin@example.com';
   ```
3. Log out and back in — you'll land on the Admin dashboard.

From there, the Admin can create Doctor and Receptionist accounts from the UI.

## Features Implemented
- Email/password auth via Supabase Auth, with session persistence
- Role-based signup metadata → auto-provisioned `profiles`/`doctors`/`patients` rows
- Protected routes per role (`ProtectedRoute` + `/unauthorized` page)
- Full CRUD: doctors, patients, receptionists, appointments, prescriptions
- Admin reports: total doctors/patients/appointments, today's/upcoming/completed counts
- Doctor: view assigned appointments, patient record view, add/update prescriptions,
  update appointment status
- Receptionist: register patients, book/update/cancel appointments, view doctor
  schedules (today's appointment count per doctor)
- Patient: self-registration, book appointments, cancel own upcoming appointments,
  view history, view prescriptions, edit profile
- Responsive layout (collapsible sidebar on tablet/mobile)
- Database-level security via RLS — every table is locked down so users can only
  touch rows they're authorized for, independent of the UI

## Deploying the Frontend
Any static host works (Vercel, Netlify, Firebase Hosting). Example for Vercel:
```bash
npm run build
vercel --prod
```
Set the same two `VITE_SUPABASE_*` environment variables in your hosting provider's
dashboard.

## Screenshots
_Add screenshots of each dashboard (Admin, Doctor, Receptionist, Patient) and key
flows (login, booking, prescriptions) here before submission._

## Demo Video
_Record a 3–5 minute walkthrough covering: signup/login, each role's dashboard,
booking an appointment end-to-end, and writing a prescription._
