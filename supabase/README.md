# GENHEX database — rebuilt from scratch

Run these **in order** in Supabase → SQL Editor (each as its own run):

1. `00_reset.sql` — **destructive**: wipes everything in the `public` schema. Keeps user accounts (auth) and uploaded files.
2. `01_schema.sql` — creates all tables, functions, triggers, RLS policies, storage buckets/policies. Existing accounts get a profile automatically (backfill).
3. `02_seed.sql` — default certificate template + makes **your** account admin. **Edit the email first.**

After that, in the Supabase dashboard:
- Authentication → Policies/Settings → turn on **Leaked password protection**.
- (Optional) Authentication → Hooks → enable `custom_access_token_hook`. The app does **not** need it: roles are read from `profiles`.

Tested against PostgreSQL 16 with a Supabase-compatible stub (88 checks: sign-up incl. Google, roles, RLS per role, course creation, ordering, enrollment, progress, attendance, exams, certificates, events, storage, privileges).
