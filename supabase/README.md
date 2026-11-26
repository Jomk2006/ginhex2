# GENHEX database — rebuilt from scratch

Run these **in order** in Supabase → SQL Editor (each as its own run):

1. `00_reset.sql` — **destructive**: wipes everything in the `public` schema. Keeps user accounts (auth) and uploaded files.
2. `01_schema.sql` — creates all tables, functions, triggers, RLS policies, storage buckets/policies. Existing accounts get a profile automatically (backfill).
3. `02_seed.sql` — default certificate template + makes **your** account admin. **Edit the email first.**

After that, in the Supabase dashboard:
- Authentication → Policies/Settings → turn on **Leaked password protection**.
- (Optional) Authentication → Hooks → enable `custom_access_token_hook`. The app does **not** need it: roles are read from `profiles`.

Tested against PostgreSQL 16 with a Supabase-compatible stub (88 checks: sign-up incl. Google, roles, RLS per role, course creation, ordering, enrollment, progress, attendance, exams, certificates, events, storage, privileges).

## Supabase advisor warnings that are intentional

`get_advisors` flags the SECURITY DEFINER functions in `public` as callable via `/rest/v1/rpc`. They are reviewed and kept on purpose:

- `is_admin`, `is_instructor_of`, `is_enrolled_in`, `course_is_published`, `is_lesson_preview`, `course_of_*`: RLS policies call them as the requesting role, so `anon`/`authenticated` need EXECUTE. They only answer questions about the caller.
- `attendance_percent`, `certificate_eligibility`: check `auth.uid()` / instructor / admin / service_role inside the body and return null / false otherwise.
- `issue_certificate`, `revoke_certificate`, `promote_from_waitlist`: raise unless admin (or service_role where noted).
- `verify_certificate`: public by design (unguessable 40-hex slug).
- `register_for_event`: requires a signed-in user.

Last reviewed against the live project on 2026-11-26 by reading each function body. Behavioural tests exist for issue_certificate and verify_certificate; attendance_percent, certificate_eligibility, revoke_certificate and promote_from_waitlist were reviewed by reading only.
