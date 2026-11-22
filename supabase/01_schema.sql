-- =====================================================================
-- GENHEX — COMPLETE DATABASE, BUILT FROM SCRATCH
-- File 2 of 3. Run 00_reset.sql first (once), then this file, then 02_seed.sql.
--
-- Design rules
--  * Authorization never depends on a JWT custom claim. Roles are read from
--    public.profiles by SECURITY DEFINER helpers, so RLS works even if the
--    Auth Hook is not enabled. (The hook is still provided, optional.)
--  * Every function sets search_path. Helpers are STABLE and cheap.
--  * Sensitive writes (grading, attempts, certificates) happen server-side;
--    students can never write scores, correct answers or attendance.
--  * Re-runnable: starts from the state 00_reset.sql leaves.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------
create type user_role                as enum ('student', 'instructor', 'admin');
create type course_status            as enum ('draft', 'published', 'archived');
create type course_level             as enum ('beginner', 'intermediate', 'advanced');
create type enrollment_mode          as enum ('open', 'application');
create type exam_requirement_type    as enum ('required', 'optional', 'none');
create type enrollment_status        as enum ('active', 'completed', 'withdrawn');
create type attendance_mode          as enum ('onsite', 'online');
create type attendance_status        as enum ('present', 'absent', 'late', 'excused');
create type attendance_record_source as enum ('manual', 'import');
create type import_batch_status      as enum ('pending', 'committed', 'failed');
create type exam_status              as enum ('draft', 'published', 'closed');
create type question_type            as enum ('mcq', 'true_false', 'short_answer');
create type attempt_status           as enum ('in_progress', 'submitted', 'graded');
create type certificate_status       as enum ('active', 'revoked');
create type form_type                as enum ('application', 'event_registration', 'general');
create type submission_status        as enum ('pending', 'under_review', 'approved', 'rejected');
create type event_type               as enum ('workshop', 'masterclass', 'lab_session', 'community');
create type event_location_mode      as enum ('onsite', 'online');
create type event_status             as enum ('draft', 'published', 'completed', 'cancelled');
create type capacity_mode            as enum ('hard_limit', 'waitlist');
create type registration_status      as enum ('registered', 'attended', 'no_show', 'cancelled', 'waitlisted');
create type labs_project_status      as enum ('idea', 'prototype', 'shipped');
create type resource_type            as enum ('pdf', 'link', 'video', 'dataset');
create type resource_visibility      as enum ('public', 'enrolled_only', 'instructors_only');
create type job_status               as enum ('queued', 'processing', 'done', 'failed');
create type video_source_type        as enum ('youtube', 'google_drive');

-- ---------------------------------------------------------------------
-- 2. GENHEX ID sequences (GEN-STU-000001 / GEN-INS-… / GEN-ADM-…)
-- ---------------------------------------------------------------------
create sequence genhex_id_student_seq;
create sequence genhex_id_instructor_seq;
create sequence genhex_id_admin_seq;

-- ---------------------------------------------------------------------
-- 3. TABLES
-- ---------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              user_role   not null default 'student',
  genhex_id         text        not null,
  full_name_en      text        not null,
  full_name_ar      text        not null,
  avatar_url        text,
  phone             text,
  locale_preference text        not null default 'en'     check (locale_preference in ('en', 'ar')),
  theme_preference  text        not null default 'system' check (theme_preference in ('light', 'dark', 'system')),
  is_active         boolean     not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index uq_profiles_genhex_id on public.profiles (genhex_id);
create index idx_profiles_role on public.profiles (role);

create table public.forms (
  id               uuid primary key default gen_random_uuid(),
  slug             text        not null unique,
  title_en         text        not null,
  title_ar         text        not null,
  description_en   text,
  description_ar   text,
  field_schema     jsonb       not null default '[]',
  form_type        form_type   not null,
  requires_account boolean     not null default false,
  is_open          boolean     not null default true,
  created_by       uuid        not null references public.profiles (id),
  created_at       timestamptz not null default now()
);
create index idx_forms_type_open on public.forms (form_type, is_open);

create table public.courses (
  id                  uuid primary key default gen_random_uuid(),
  slug                text        not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_en            text        not null,
  title_ar            text        not null,
  description_en      text,
  description_ar      text,
  cover_image_url     text,
  instructor_id       uuid        not null references public.profiles (id),
  category            text,
  level               course_level,
  status              course_status not null default 'draft',
  enrollment_mode     enrollment_mode not null default 'open',
  application_form_id uuid references public.forms (id),
  exam_requirement    exam_requirement_type not null default 'none',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint chk_courses_application_form
    check (enrollment_mode <> 'application' or application_form_id is not null)
);
create index idx_courses_instructor on public.courses (instructor_id);
create index idx_courses_status on public.courses (status);
create index idx_courses_enrollment_mode on public.courses (enrollment_mode);

create table public.course_instructors (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references public.courses (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (course_id, instructor_id)
);
create index idx_course_instructors_instructor on public.course_instructors (instructor_id);

create table public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title_en    text not null,
  title_ar    text not null,
  order_index integer not null,
  -- Deferrable so two rows can swap positions inside ONE statement/transaction
  -- (see reorder_module / reorder_lesson). A plain UNIQUE would reject the swap.
  constraint uq_modules_course_order unique (course_id, order_index) deferrable initially deferred
);
create index idx_modules_course on public.modules (course_id);

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules (id) on delete cascade,
  title_en         text not null,
  title_ar         text not null,
  video_source     video_source_type not null default 'youtube',
  youtube_video_id text,
  drive_url        text,
  duration_seconds integer not null check (duration_seconds > 0),
  order_index      integer not null,
  is_preview       boolean not null default false,
  created_at       timestamptz not null default now(),
  constraint uq_lessons_module_order unique (module_id, order_index) deferrable initially deferred,
  constraint chk_lesson_video_source check (
    (video_source = 'youtube'      and youtube_video_id is not null)
    or (video_source = 'google_drive' and drive_url is not null)
  )
);
create index idx_lessons_module on public.lessons (module_id);

create table public.form_submissions (
  id           uuid primary key default gen_random_uuid(),
  form_id      uuid not null references public.forms (id) on delete cascade,
  submitted_by uuid references public.profiles (id),
  guest_email  text,
  data         jsonb not null,
  status       submission_status not null default 'pending',
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  review_notes text,
  submitted_at timestamptz not null default now(),
  constraint chk_submitter_identity check (submitted_by is not null or guest_email is not null),
  constraint chk_review_fields check (
    status not in ('approved', 'rejected') or (reviewed_by is not null and reviewed_at is not null)
  )
);
create index idx_form_submissions_form_status on public.form_submissions (form_id, status);
create index idx_form_submissions_submitter on public.form_submissions (submitted_by);

create table public.enrollments (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references public.profiles (id) on delete cascade,
  course_id            uuid not null references public.courses (id) on delete cascade,
  status               enrollment_status not null default 'active',
  source_submission_id uuid references public.form_submissions (id),
  enrolled_at          timestamptz not null default now(),
  completed_at         timestamptz,
  unique (student_id, course_id)
);
create index idx_enrollments_course on public.enrollments (course_id);
create index idx_enrollments_student on public.enrollments (student_id);

create table public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.enrollments (id) on delete cascade,
  lesson_id       uuid not null references public.lessons (id) on delete cascade,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  is_completed    boolean not null default false,
  completed_at    timestamptz,
  last_watched_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);
create index idx_lesson_progress_enrollment on public.lesson_progress (enrollment_id);
create index idx_lesson_progress_lesson on public.lesson_progress (lesson_id);

create table public.attendance_sessions (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  session_date timestamptz not null,
  mode         attendance_mode not null default 'onsite',
  created_by   uuid not null references public.profiles (id),
  created_at   timestamptz not null default now()
);
create index idx_attendance_sessions_course_date on public.attendance_sessions (course_id, session_date);

create table public.attendance_import_batches (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  uploaded_by  uuid not null references public.profiles (id),
  file_name    text not null,
  status       import_batch_status not null default 'pending',
  total_rows   integer not null default 0,
  matched_rows integer not null default 0,
  error_rows   integer not null default 0,
  staged_rows  jsonb not null default '[]',
  error_log    jsonb not null default '[]',
  committed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_import_batches_course_status on public.attendance_import_batches (course_id, status);

create table public.attendance_records (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.attendance_sessions (id) on delete cascade,
  student_id      uuid not null references public.profiles (id) on delete cascade,
  status          attendance_status not null,
  source          attendance_record_source not null default 'manual',
  import_batch_id uuid references public.attendance_import_batches (id),
  recorded_by     uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (session_id, student_id),
  constraint chk_attendance_import_batch check (source <> 'import' or import_batch_id is not null)
);
create index idx_attendance_records_session on public.attendance_records (session_id);
create index idx_attendance_records_student on public.attendance_records (student_id);
create index idx_attendance_records_batch on public.attendance_records (import_batch_id);

create table public.exams (
  id                             uuid primary key default gen_random_uuid(),
  course_id                      uuid not null references public.courses (id) on delete cascade,
  title_en                       text not null,
  title_ar                       text not null,
  duration_minutes               integer not null check (duration_minutes > 0),
  passing_score_percent          numeric(5,2) not null check (passing_score_percent between 0 and 100),
  attendance_requirement_percent numeric(5,2) not null default 0 check (attendance_requirement_percent between 0 and 100),
  max_attempts                   integer not null default 1 check (max_attempts > 0),
  counts_toward_certification    boolean not null default true,
  available_from                 timestamptz,
  available_to                   timestamptz,
  status                         exam_status not null default 'draft',
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now(),
  constraint chk_exam_window check (available_to is null or available_from is null or available_to > available_from)
);
create index idx_exams_course_status on public.exams (course_id, status);

create table public.exam_questions (
  id             uuid primary key default gen_random_uuid(),
  exam_id        uuid not null references public.exams (id) on delete cascade,
  type           question_type not null,
  prompt_en      text not null,
  prompt_ar      text not null,
  options        jsonb,
  correct_answer text,
  points         numeric(6,2) not null default 1 check (points > 0),
  order_index    integer not null,
  unique (exam_id, order_index),
  constraint chk_mcq_options check (type <> 'mcq' or (options is not null and jsonb_typeof(options) = 'array')),
  constraint chk_gradeable_answer check (type = 'short_answer' or correct_answer is not null)
);
create index idx_exam_questions_exam on public.exam_questions (exam_id);

create table public.exam_attempts (
  id                          uuid primary key default gen_random_uuid(),
  exam_id                     uuid not null references public.exams (id) on delete cascade,
  student_id                  uuid not null references public.profiles (id) on delete cascade,
  attempt_number              integer not null check (attempt_number > 0),
  attendance_percent_at_start numeric(5,2) not null,
  started_at                  timestamptz not null default now(),
  submitted_at                timestamptz,
  status                      attempt_status not null default 'in_progress',
  score_percent               numeric(5,2) check (score_percent is null or score_percent between 0 and 100),
  passed                      boolean,
  unique (exam_id, student_id, attempt_number),
  constraint chk_submit_after_start check (submitted_at is null or submitted_at >= started_at)
);
create index idx_exam_attempts_exam_student on public.exam_attempts (exam_id, student_id);
-- A student can have only ONE live attempt per exam (blocks double-start races).
create unique index uq_one_open_attempt on public.exam_attempts (exam_id, student_id) where status = 'in_progress';

create table public.exam_answers (
  id             uuid primary key default gen_random_uuid(),
  attempt_id     uuid not null references public.exam_attempts (id) on delete cascade,
  question_id    uuid not null references public.exam_questions (id) on delete cascade,
  student_answer text,
  is_correct     boolean,
  points_awarded numeric(6,2) check (points_awarded is null or points_awarded >= 0),
  graded_by      uuid references public.profiles (id),
  graded_at      timestamptz,
  unique (attempt_id, question_id)
);
create index idx_exam_answers_attempt on public.exam_answers (attempt_id);

create table public.certificate_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  design_config jsonb not null default '{}',
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);
create unique index uq_one_default_template on public.certificate_templates (is_default) where is_default;

create table public.certificates (
  id                  uuid primary key default gen_random_uuid(),
  certificate_number  text not null unique,
  verification_slug   text not null unique,
  student_id          uuid not null references public.profiles (id),
  course_id           uuid not null references public.courses (id),
  template_id         uuid not null references public.certificate_templates (id),
  issued_by           uuid not null references public.profiles (id),
  final_score_percent numeric(5,2),
  status              certificate_status not null default 'active',
  revoked_at          timestamptz,
  revoked_by          uuid references public.profiles (id),
  revoked_reason      text,
  pdf_url             text,
  qr_code_url         text,
  issued_at           timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  constraint chk_revocation_fields check (status <> 'revoked' or (revoked_at is not null and revoked_by is not null))
);
create unique index uq_one_active_cert_per_student_course on public.certificates (student_id, course_id) where status = 'active';
create index idx_certificates_student_course on public.certificates (student_id, course_id);

create table public.events (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  title_en             text not null,
  title_ar             text not null,
  description_en       text,
  description_ar       text,
  cover_image_url      text,
  event_type           event_type not null,
  starts_at            timestamptz not null,
  ends_at              timestamptz not null,
  location_mode        event_location_mode not null,
  location_details     text,
  capacity             integer check (capacity is null or capacity > 0),
  capacity_mode        capacity_mode not null default 'hard_limit',
  registration_form_id uuid references public.forms (id),
  status               event_status not null default 'draft',
  created_by           uuid not null references public.profiles (id),
  created_at           timestamptz not null default now(),
  constraint chk_event_dates check (ends_at > starts_at)
);
create index idx_events_status_start on public.events (status, starts_at);

create table public.event_registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references public.events (id) on delete cascade,
  user_id           uuid references public.profiles (id),
  guest_email       text,
  status            registration_status not null default 'registered',
  waitlist_position integer,
  registered_at     timestamptz not null default now(),
  constraint chk_registrant_identity check (user_id is not null or guest_email is not null),
  constraint chk_waitlist_position check ((status = 'waitlisted') = (waitlist_position is not null))
);
create unique index uq_event_reg_user  on public.event_registrations (event_id, user_id) where user_id is not null;
create unique index uq_event_reg_guest on public.event_registrations (event_id, guest_email) where guest_email is not null;
create index idx_event_registrations_event_status on public.event_registrations (event_id, status);

create table public.labs_projects (
  id               uuid primary key default gen_random_uuid(),
  title_en         text not null,
  title_ar         text not null,
  description_en   text,
  description_ar   text,
  status           labs_project_status not null default 'idea',
  tech_stack       jsonb not null default '[]',
  repo_url         text,
  demo_url         text,
  cover_image_url  text,
  owner_id         uuid not null references public.profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_labs_projects_owner_status on public.labs_projects (owner_id, status);

create table public.labs_collaborators (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.labs_projects (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role_label text not null,
  added_at   timestamptz not null default now(),
  unique (project_id, user_id)
);
create index idx_labs_collaborators_user on public.labs_collaborators (user_id);

create table public.resources (
  id           uuid primary key default gen_random_uuid(),
  title_en     text not null,
  title_ar     text not null,
  type         resource_type not null,
  file_url     text,
  external_url text,
  category     text,
  course_id    uuid references public.courses (id) on delete cascade,
  lesson_id    uuid references public.lessons (id) on delete cascade,
  visibility   resource_visibility not null default 'public',
  uploaded_by  uuid not null references public.profiles (id),
  created_at   timestamptz not null default now(),
  constraint chk_resource_location check (file_url is not null or external_url is not null)
);
create index idx_resources_course_visibility on public.resources (course_id, visibility);
create index idx_resources_lesson on public.resources (lesson_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_unread on public.notifications (user_id, is_read);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_actor_time on public.audit_logs (actor_id, created_at);

create table public.background_jobs (
  id         uuid primary key default gen_random_uuid(),
  job_type   text not null,
  payload    jsonb not null default '{}',
  status     job_status not null default 'queued',
  attempts   integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_background_jobs_status_type on public.background_jobs (status, job_type);

-- ---------------------------------------------------------------------
-- 4. HELPER FUNCTIONS (SECURITY DEFINER — safe inside policies, no recursion)
-- ---------------------------------------------------------------------
create function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select p.role = 'admin' and p.is_active from public.profiles p where p.id = auth.uid()), false);
$$;

create function public.is_instructor_or_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select p.role in ('instructor', 'admin') and p.is_active from public.profiles p where p.id = auth.uid()), false);
$$;

create function public.is_instructor_of(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and (
    exists (select 1 from public.courses c where c.id = p_course_id and c.instructor_id = auth.uid())
    or exists (select 1 from public.course_instructors ci where ci.course_id = p_course_id and ci.instructor_id = auth.uid())
  );
$$;

create function public.is_enrolled_in(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select auth.uid() is not null and exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id and e.student_id = auth.uid() and e.status <> 'withdrawn'
  );
$$;

create function public.course_is_published(p_course_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.courses c where c.id = p_course_id and c.status = 'published');
$$;

create function public.course_of_module(p_module_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select m.course_id from public.modules m where m.id = p_module_id;
$$;

create function public.course_of_lesson(p_lesson_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select m.course_id from public.lessons l join public.modules m on m.id = l.module_id where l.id = p_lesson_id;
$$;

create function public.course_of_exam(p_exam_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select e.course_id from public.exams e where e.id = p_exam_id;
$$;

create function public.course_of_session(p_session_id uuid)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select s.course_id from public.attendance_sessions s where s.id = p_session_id;
$$;

create function public.is_lesson_preview(p_lesson_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((select l.is_preview from public.lessons l where l.id = p_lesson_id), false);
$$;

-- ---------------------------------------------------------------------
-- 5. BUSINESS FUNCTIONS
-- ---------------------------------------------------------------------

-- (present + late) / sessions held. Callable by the student themself, an
-- instructor of the course, or an admin — never by anyone else.
create function public.attendance_percent(student_id uuid, course_id uuid)
returns numeric language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when not (
      auth.uid() = attendance_percent.student_id
      or public.is_instructor_of(attendance_percent.course_id)
      or public.is_admin()
      or auth.role() = 'service_role'
    ) then null
    else coalesce((
      select round(100.0 * count(*) filter (where r.status in ('present', 'late')) / nullif(count(s.id), 0), 2)
      from public.attendance_sessions s
      left join public.attendance_records r
        on r.session_id = s.id and r.student_id = attendance_percent.student_id
      where s.course_id = attendance_percent.course_id
    ), 0)
  end;
$$;

-- Lesson completion = watched >= 90% of duration. Server-derived; client input ignored.
create function public.recompute_lesson_completion()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_duration integer;
begin
  select l.duration_seconds into v_duration from public.lessons l where l.id = new.lesson_id;
  if v_duration is null then raise exception 'lesson % not found', new.lesson_id; end if;
  new.watched_seconds := least(new.watched_seconds, v_duration);
  if new.watched_seconds >= 0.9 * v_duration then
    new.is_completed := true;
    new.completed_at := coalesce(case when tg_op = 'UPDATE' then old.completed_at end, now());
  else
    new.is_completed := false;
    new.completed_at := null;
  end if;
  new.last_watched_at := now();
  return new;
end $$;

-- Move a module/lesson one step up or down. One statement, so the deferrable
-- unique constraint lets the two rows trade positions. SECURITY INVOKER: RLS applies.
create function public.reorder_module(p_module_id uuid, p_direction text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_course uuid; v_cur integer; v_other uuid; v_other_idx integer;
begin
  if p_direction not in ('up', 'down') then raise exception 'direction must be up or down'; end if;
  select course_id, order_index into v_course, v_cur from public.modules where id = p_module_id;
  if v_course is null then return; end if;
  if p_direction = 'up' then
    select id, order_index into v_other, v_other_idx from public.modules
      where course_id = v_course and order_index < v_cur order by order_index desc limit 1;
  else
    select id, order_index into v_other, v_other_idx from public.modules
      where course_id = v_course and order_index > v_cur order by order_index asc limit 1;
  end if;
  if v_other is null then return; end if;
  update public.modules
     set order_index = case id when p_module_id then v_other_idx else v_cur end
   where id in (p_module_id, v_other);
end $$;

create function public.reorder_lesson(p_lesson_id uuid, p_direction text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_module uuid; v_cur integer; v_other uuid; v_other_idx integer;
begin
  if p_direction not in ('up', 'down') then raise exception 'direction must be up or down'; end if;
  select module_id, order_index into v_module, v_cur from public.lessons where id = p_lesson_id;
  if v_module is null then return; end if;
  if p_direction = 'up' then
    select id, order_index into v_other, v_other_idx from public.lessons
      where module_id = v_module and order_index < v_cur order by order_index desc limit 1;
  else
    select id, order_index into v_other, v_other_idx from public.lessons
      where module_id = v_module and order_index > v_cur order by order_index asc limit 1;
  end if;
  if v_other is null then return; end if;
  update public.lessons
     set order_index = case id when p_lesson_id then v_other_idx else v_cur end
   where id in (p_lesson_id, v_other);
end $$;

-- Certificate eligibility: every lesson ≥90% watched; if the course requires an
-- exam, at least one certifying exam passed. qualifying_score = best passing score.
create function public.certificate_eligibility(student_id uuid, course_id uuid)
returns table (eligible boolean, qualifying_score numeric)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_enrollment uuid; v_total integer; v_done integer; v_req exam_requirement_type; v_best numeric;
begin
  if not (public.is_admin() or auth.uid() = certificate_eligibility.student_id
          or public.is_instructor_of(certificate_eligibility.course_id) or auth.role() = 'service_role') then
    return query select false, null::numeric; return;
  end if;

  select e.id into v_enrollment from public.enrollments e
   where e.student_id = certificate_eligibility.student_id and e.course_id = certificate_eligibility.course_id
     and e.status <> 'withdrawn';
  if v_enrollment is null then return query select false, null::numeric; return; end if;

  select count(*) into v_total from public.lessons l
    join public.modules m on m.id = l.module_id where m.course_id = certificate_eligibility.course_id;
  select count(*) into v_done from public.lesson_progress lp
    join public.lessons l on l.id = lp.lesson_id join public.modules m on m.id = l.module_id
   where lp.enrollment_id = v_enrollment and lp.is_completed and m.course_id = certificate_eligibility.course_id;

  select c.exam_requirement into v_req from public.courses c where c.id = certificate_eligibility.course_id;

  select max(a.score_percent) into v_best
    from public.exam_attempts a join public.exams x on x.id = a.exam_id
   where a.student_id = certificate_eligibility.student_id and x.course_id = certificate_eligibility.course_id
     and x.counts_toward_certification and a.passed;

  return query select
    (v_total > 0 and v_done >= v_total and (v_req <> 'required' or v_best is not null)),
    v_best;
end $$;

-- Admin-only issuance. Non-sequential, non-guessable identifiers.
create function public.issue_certificate(p_student_id uuid, p_course_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_ok boolean; v_score numeric; v_template uuid; v_id uuid;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then raise exception 'only admins can issue certificates'; end if;
  select ce.eligible, ce.qualifying_score into v_ok, v_score from public.certificate_eligibility(p_student_id, p_course_id) ce;
  if not coalesce(v_ok, false) then raise exception 'student is not eligible for this certificate'; end if;
  select t.id into v_template from public.certificate_templates t where t.is_default limit 1;
  if v_template is null then raise exception 'no default certificate template'; end if;
  insert into public.certificates (certificate_number, verification_slug, student_id, course_id, template_id, issued_by, final_score_percent)
  values (
    'GEN-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    p_student_id, p_course_id, v_template, coalesce(auth.uid(), (select id from public.profiles where role = 'admin' order by created_at limit 1)), v_score
  ) returning id into v_id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'certificate.issued', 'certificate', v_id, jsonb_build_object('student_id', p_student_id, 'course_id', p_course_id));
  return v_id;
end $$;

create function public.revoke_certificate(p_certificate_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'only admins can revoke certificates'; end if;
  update public.certificates
     set status = 'revoked', revoked_at = now(), revoked_by = auth.uid(), revoked_reason = p_reason
   where id = p_certificate_id and status = 'active';
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'certificate.revoked', 'certificate', p_certificate_id, jsonb_build_object('reason', p_reason));
end $$;

-- Public verification: returns only non-sensitive fields, by unguessable slug.
create function public.verify_certificate(p_slug text)
returns table (certificate_number text, status certificate_status, issued_at timestamptz,
               student_name_en text, student_name_ar text, course_title_en text, course_title_ar text, final_score_percent numeric)
language sql stable security definer set search_path = public, pg_temp as $$
  select c.certificate_number, c.status, c.issued_at, p.full_name_en, p.full_name_ar, co.title_en, co.title_ar, c.final_score_percent
    from public.certificates c
    join public.profiles p on p.id = c.student_id
    join public.courses co on co.id = c.course_id
   where c.verification_slug = p_slug;
$$;

-- Capacity-safe event registration (row lock serializes concurrent callers).
create function public.register_for_event(p_event_id uuid, p_guest_email text default null)
returns registration_status language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_event public.events%rowtype; v_taken integer; v_status registration_status; v_pos integer;
  v_uid uuid := auth.uid();
begin
  if v_uid is null and (p_guest_email is null or auth.role() <> 'service_role') then
    raise exception 'sign in required';
  end if;
  select * into v_event from public.events where id = p_event_id for update;
  if not found or v_event.status <> 'published' then raise exception 'event not open for registration'; end if;
  select count(*) into v_taken from public.event_registrations where event_id = p_event_id and status in ('registered', 'attended');

  if v_event.capacity is null or v_taken < v_event.capacity then
    v_status := 'registered'; v_pos := null;
  elsif v_event.capacity_mode = 'waitlist' then
    v_status := 'waitlisted';
    select coalesce(max(waitlist_position), 0) + 1 into v_pos from public.event_registrations where event_id = p_event_id;
  else
    raise exception 'event is full';
  end if;

  insert into public.event_registrations (event_id, user_id, guest_email, status, waitlist_position)
  values (p_event_id, v_uid, case when v_uid is null then p_guest_email end, v_status, v_pos);
  return v_status;
end $$;

create function public.promote_from_waitlist(p_event_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_event public.events%rowtype; v_taken integer; v_next uuid;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then raise exception 'not allowed'; end if;
  select * into v_event from public.events where id = p_event_id for update;
  loop
    select count(*) into v_taken from public.event_registrations where event_id = p_event_id and status in ('registered', 'attended');
    exit when v_event.capacity is not null and v_taken >= v_event.capacity;
    select id into v_next from public.event_registrations
     where event_id = p_event_id and status = 'waitlisted' order by waitlist_position limit 1;
    exit when v_next is null;
    update public.event_registrations set status = 'registered', waitlist_position = null where id = v_next;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 6. TRIGGER FUNCTIONS
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at := now(); return new; end $$;

create function public.generate_genhex_id(p_role user_role)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return case p_role
    when 'student'    then 'GEN-STU-' || lpad(nextval('genhex_id_student_seq')::text, 6, '0')
    when 'instructor' then 'GEN-INS-' || lpad(nextval('genhex_id_instructor_seq')::text, 6, '0')
    when 'admin'      then 'GEN-ADM-' || lpad(nextval('genhex_id_admin_seq')::text, 6, '0')
  end;
end $$;

create function public.assign_genhex_id()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.genhex_id is null or new.genhex_id = '' then new.genhex_id := public.generate_genhex_id(new.role); end if;
  return new;
end $$;

-- Re-issue a GENHEX ID with the right prefix if an admin changes a user's role.
create function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.role is distinct from old.role then
    if not (auth.uid() is null or public.is_admin() or auth.role() = 'service_role') then
      raise exception 'only admins can change a role';
    end if;
    new.genhex_id := public.generate_genhex_id(new.role);
  end if;
  if new.genhex_id is distinct from old.genhex_id and new.role is not distinct from old.role then
    new.genhex_id := old.genhex_id;   -- the ID is system-owned
  end if;
  if new.is_active is distinct from old.is_active
     and not (auth.uid() is null or public.is_admin() or auth.role() = 'service_role') then
    raise exception 'only admins can (de)activate accounts';
  end if;
  return new;
end $$;

-- Create the profile when an auth user is created. Handles email/password AND
-- Google (whose metadata has full_name / name instead of our custom keys).
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_fallback text := coalesce(nullif(v_meta ->> 'full_name', ''), nullif(v_meta ->> 'name', ''), split_part(coalesce(new.email, 'user'), '@', 1));
  v_en text := coalesce(nullif(trim(v_meta ->> 'full_name_en'), ''), v_fallback);
  v_ar text := coalesce(nullif(trim(v_meta ->> 'full_name_ar'), ''), v_en);
begin
  insert into public.profiles (id, full_name_en, full_name_ar, avatar_url, genhex_id)
  values (new.id, v_en, v_ar, nullif(v_meta ->> 'avatar_url', ''), public.generate_genhex_id('student'))
  on conflict (id) do nothing;
  return new;
end $$;

create function public.enforce_instructor_role()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.instructor_id and p.role in ('instructor', 'admin')) then
    raise exception 'user % is not an instructor or admin', new.instructor_id;
  end if;
  return new;
end $$;

-- courses.instructor_id must also exist in course_instructors (kept in sync automatically).
create function public.sync_primary_instructor()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.course_instructors (course_id, instructor_id, is_primary)
  values (new.id, new.instructor_id, true)
  on conflict (course_id, instructor_id) do update set is_primary = true;
  return new;
end $$;

create function public.validate_application_enrollment()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_course public.courses%rowtype; v_sub public.form_submissions%rowtype;
begin
  select * into v_course from public.courses where id = new.course_id;
  if v_course.enrollment_mode = 'application' then
    select * into v_sub from public.form_submissions where id = new.source_submission_id;
    if not found or v_sub.status <> 'approved' or v_sub.form_id is distinct from v_course.application_form_id
       or v_sub.submitted_by is distinct from new.student_id then
      raise exception 'this course requires an approved application';
    end if;
  end if;
  return new;
end $$;

create function public.requires_account_guard()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.submitted_by is null and exists (select 1 from public.forms f where f.id = new.form_id and f.requires_account) then
    raise exception 'this form requires an account';
  end if;
  return new;
end $$;

-- Exam attempts: clients can never alter score/attendance snapshots.
create function public.guard_exam_attempt()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.attendance_percent_at_start is distinct from old.attendance_percent_at_start then
    raise exception 'attendance snapshot is immutable';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 7. TRIGGERS
-- ---------------------------------------------------------------------
create trigger trg_profiles_updated   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger trg_courses_updated    before update on public.courses    for each row execute function public.set_updated_at();
create trigger trg_exams_updated      before update on public.exams      for each row execute function public.set_updated_at();
create trigger trg_labs_updated       before update on public.labs_projects for each row execute function public.set_updated_at();
create trigger trg_jobs_updated       before update on public.background_jobs for each row execute function public.set_updated_at();
create trigger trg_attendance_updated before update on public.attendance_records for each row execute function public.set_updated_at();

create trigger trg_profiles_genhex_id  before insert on public.profiles for each row execute function public.assign_genhex_id();
create trigger trg_profiles_protect    before update on public.profiles for each row execute function public.protect_profile_columns();
create trigger trg_course_instructor_role before insert or update on public.course_instructors for each row execute function public.enforce_instructor_role();
create trigger trg_courses_primary_instructor after insert on public.courses for each row execute function public.sync_primary_instructor();
create trigger trg_enrollment_application before insert on public.enrollments for each row execute function public.validate_application_enrollment();
create trigger trg_lesson_completion before insert or update on public.lesson_progress for each row execute function public.recompute_lesson_completion();
create trigger trg_submission_account before insert on public.form_submissions for each row execute function public.requires_account_guard();
create trigger trg_exam_attempt_guard before update on public.exam_attempts for each row execute function public.guard_exam_attempt();

create trigger trg_on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.forms                     enable row level security;
alter table public.courses                   enable row level security;
alter table public.course_instructors        enable row level security;
alter table public.modules                   enable row level security;
alter table public.lessons                   enable row level security;
alter table public.form_submissions          enable row level security;
alter table public.enrollments               enable row level security;
alter table public.lesson_progress           enable row level security;
alter table public.attendance_sessions       enable row level security;
alter table public.attendance_import_batches enable row level security;
alter table public.attendance_records        enable row level security;
alter table public.exams                     enable row level security;
alter table public.exam_questions            enable row level security;
alter table public.exam_attempts             enable row level security;
alter table public.exam_answers              enable row level security;
alter table public.certificate_templates     enable row level security;
alter table public.certificates              enable row level security;
alter table public.events                    enable row level security;
alter table public.event_registrations       enable row level security;
alter table public.labs_projects             enable row level security;
alter table public.labs_collaborators        enable row level security;
alter table public.resources                 enable row level security;
alter table public.notifications             enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.background_jobs           enable row level security;

-- profiles ------------------------------------------------------------
create policy profiles_select_own   on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select to authenticated using (public.is_admin());
create policy profiles_select_my_students on public.profiles for select to authenticated using (
  exists (select 1 from public.enrollments e where e.student_id = profiles.id and public.is_instructor_of(e.course_id))
);
-- Public course pages show the instructor's name/avatar (column grants below limit anon to safe columns).
create policy profiles_select_public_instructors on public.profiles for select to anon, authenticated using (
  exists (select 1 from public.courses c where c.instructor_id = profiles.id and c.status = 'published')
);
create policy profiles_update_own   on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_admin on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- forms ---------------------------------------------------------------
create policy forms_select_open  on public.forms for select to anon, authenticated using (is_open or public.is_admin());
create policy forms_admin_write  on public.forms for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- courses -------------------------------------------------------------
-- NOTE: `instructor_id = auth.uid()` is checked directly on the row (not only via
-- is_instructor_of) because a STABLE function cannot see a row being inserted by the
-- same statement — without it, `INSERT ... RETURNING` of a DRAFT course fails under RLS.
create policy courses_select on public.courses for select to anon, authenticated using (
  status = 'published' or instructor_id = auth.uid() or public.is_admin() or public.is_instructor_of(id)
);
create policy courses_insert on public.courses for insert to authenticated with check (
  public.is_instructor_or_admin() and (instructor_id = auth.uid() or public.is_admin())
);
create policy courses_update on public.courses for update to authenticated
  using (public.is_admin() or instructor_id = auth.uid() or public.is_instructor_of(id))
  with check (public.is_admin() or instructor_id = auth.uid() or public.is_instructor_of(id));
create policy courses_delete on public.courses for delete to authenticated using (public.is_admin());

-- course_instructors ---------------------------------------------------
create policy ci_select on public.course_instructors for select to authenticated using (
  public.is_admin() or instructor_id = auth.uid() or public.is_instructor_of(course_id)
);
create policy ci_admin_write on public.course_instructors for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- modules / lessons -----------------------------------------------------
create policy modules_select on public.modules for select to anon, authenticated using (
  public.course_is_published(course_id) or public.is_admin() or public.is_instructor_of(course_id)
);
create policy modules_write on public.modules for all to authenticated
  using (public.is_admin() or public.is_instructor_of(course_id))
  with check (public.is_admin() or public.is_instructor_of(course_id));

-- Lesson ROWS are listed publicly for published courses (the catalog shows the syllabus);
-- the video id / drive url are what's valuable, and the app only renders them to enrolled users.
create policy lessons_select on public.lessons for select to anon, authenticated using (
  public.course_is_published(public.course_of_module(module_id))
  or public.is_admin() or public.is_instructor_of(public.course_of_module(module_id))
);
create policy lessons_write on public.lessons for all to authenticated
  using (public.is_admin() or public.is_instructor_of(public.course_of_module(module_id)))
  with check (public.is_admin() or public.is_instructor_of(public.course_of_module(module_id)));

-- form_submissions ------------------------------------------------------
create policy fs_select on public.form_submissions for select to authenticated using (submitted_by = auth.uid() or public.is_admin());
create policy fs_insert on public.form_submissions for insert to authenticated with check (submitted_by = auth.uid() and status = 'pending');
create policy fs_admin_update on public.form_submissions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy fs_admin_delete on public.form_submissions for delete to authenticated using (public.is_admin());

-- enrollments -------------------------------------------------------------
create policy enr_select on public.enrollments for select to authenticated using (
  student_id = auth.uid() or public.is_admin() or public.is_instructor_of(course_id)
);
create policy enr_insert_self on public.enrollments for insert to authenticated with check (
  student_id = auth.uid() and status = 'active'
  and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published' and c.enrollment_mode = 'open')
);
create policy enr_insert_admin on public.enrollments for insert to authenticated with check (public.is_admin());
create policy enr_update on public.enrollments for update to authenticated
  using (public.is_admin() or public.is_instructor_of(course_id) or student_id = auth.uid())
  with check (public.is_admin() or public.is_instructor_of(course_id) or (student_id = auth.uid() and status in ('active', 'withdrawn')));
create policy enr_delete on public.enrollments for delete to authenticated using (public.is_admin());

-- lesson_progress -----------------------------------------------------------
create policy lp_select on public.lesson_progress for select to authenticated using (
  exists (select 1 from public.enrollments e where e.id = enrollment_id
          and (e.student_id = auth.uid() or public.is_admin() or public.is_instructor_of(e.course_id)))
);
create policy lp_insert on public.lesson_progress for insert to authenticated with check (
  exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid() and e.status <> 'withdrawn')
);
create policy lp_update on public.lesson_progress for update to authenticated
  using (exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid()))
  with check (exists (select 1 from public.enrollments e where e.id = enrollment_id and e.student_id = auth.uid()));

-- attendance --------------------------------------------------------------------
create policy as_select on public.attendance_sessions for select to authenticated using (
  public.is_admin() or public.is_instructor_of(course_id) or public.is_enrolled_in(course_id)
);
create policy as_write on public.attendance_sessions for all to authenticated
  using (public.is_admin() or public.is_instructor_of(course_id))
  with check ((public.is_admin() or public.is_instructor_of(course_id)) and created_by = auth.uid());

create policy ar_select on public.attendance_records for select to authenticated using (
  student_id = auth.uid() or public.is_admin() or public.is_instructor_of(public.course_of_session(session_id))
);
create policy ar_write on public.attendance_records for all to authenticated
  using (public.is_admin() or public.is_instructor_of(public.course_of_session(session_id)))
  with check (public.is_admin() or public.is_instructor_of(public.course_of_session(session_id)));

create policy aib_select on public.attendance_import_batches for select to authenticated using (public.is_admin() or public.is_instructor_of(course_id));
create policy aib_write on public.attendance_import_batches for all to authenticated
  using (public.is_admin() or public.is_instructor_of(course_id))
  with check ((public.is_admin() or public.is_instructor_of(course_id)) and uploaded_by = auth.uid());

-- exams (students read via server code that strips answers; direct student SELECT on
-- questions is intentionally NOT granted so correct_answer can never leak) --------
create policy ex_select on public.exams for select to authenticated using (
  public.is_admin() or public.is_instructor_of(course_id)
  or (status = 'published' and public.is_enrolled_in(course_id))
);
create policy ex_write on public.exams for all to authenticated
  using (public.is_admin() or public.is_instructor_of(course_id))
  with check (public.is_admin() or public.is_instructor_of(course_id));

create policy eq_staff on public.exam_questions for all to authenticated
  using (public.is_admin() or public.is_instructor_of(public.course_of_exam(exam_id)))
  with check (public.is_admin() or public.is_instructor_of(public.course_of_exam(exam_id)));

create policy ea_select on public.exam_attempts for select to authenticated using (
  student_id = auth.uid() or public.is_admin() or public.is_instructor_of(public.course_of_exam(exam_id))
);
-- (no student INSERT/UPDATE policy: attempts are created and graded server-side)
create policy ea_admin on public.exam_attempts for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy eans_select on public.exam_answers for select to authenticated using (
  exists (select 1 from public.exam_attempts a where a.id = attempt_id and
          (a.student_id = auth.uid() or public.is_admin() or public.is_instructor_of(public.course_of_exam(a.exam_id))))
);
create policy eans_staff_update on public.exam_answers for update to authenticated
  using (exists (select 1 from public.exam_attempts a where a.id = attempt_id and (public.is_admin() or public.is_instructor_of(public.course_of_exam(a.exam_id)))))
  with check (exists (select 1 from public.exam_attempts a where a.id = attempt_id and (public.is_admin() or public.is_instructor_of(public.course_of_exam(a.exam_id)))));

-- certificates ----------------------------------------------------------------------
create policy ct_select on public.certificate_templates for select to anon, authenticated using (true);
create policy ct_admin  on public.certificate_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cert_select on public.certificates for select to authenticated using (
  student_id = auth.uid() or public.is_admin() or public.is_instructor_of(course_id)
);
-- (issue / revoke only via issue_certificate() / revoke_certificate())

-- events ------------------------------------------------------------------------------
create policy ev_select on public.events for select to anon, authenticated using (status = 'published' or public.is_admin() or created_by = auth.uid());
create policy ev_admin  on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy er_select on public.event_registrations for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy er_cancel on public.event_registrations for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check ((user_id = auth.uid() and status = 'cancelled') or public.is_admin());
create policy er_admin_delete on public.event_registrations for delete to authenticated using (public.is_admin());
-- (registration only via register_for_event())

-- labs ----------------------------------------------------------------------------------
create policy lab_select on public.labs_projects for select to anon, authenticated using (true);
create policy lab_insert on public.labs_projects for insert to authenticated with check (owner_id = auth.uid());
create policy lab_update on public.labs_projects for update to authenticated
  using (owner_id = auth.uid() or public.is_admin() or exists (select 1 from public.labs_collaborators lc where lc.project_id = labs_projects.id and lc.user_id = auth.uid()))
  with check (owner_id = auth.uid() or public.is_admin() or exists (select 1 from public.labs_collaborators lc where lc.project_id = labs_projects.id and lc.user_id = auth.uid()));
create policy lab_delete on public.labs_projects for delete to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy labc_select on public.labs_collaborators for select to anon, authenticated using (true);
create policy labc_write on public.labs_collaborators for all to authenticated
  using (public.is_admin() or exists (select 1 from public.labs_projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (public.is_admin() or exists (select 1 from public.labs_projects p where p.id = project_id and p.owner_id = auth.uid()));

-- resources ---------------------------------------------------------------------------------
create policy res_select on public.resources for select to anon, authenticated using (
  public.is_admin()
  or (course_id is not null and public.is_instructor_of(course_id))
  or (visibility = 'public')
  or (visibility = 'enrolled_only' and course_id is not null and public.is_enrolled_in(course_id))
);
create policy res_write on public.resources for all to authenticated
  using (public.is_admin() or (course_id is not null and public.is_instructor_of(course_id)))
  with check (uploaded_by = auth.uid() and (public.is_admin() or (course_id is not null and public.is_instructor_of(course_id))));

-- notifications / audit / jobs ----------------------------------------------------------------
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_delete on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy audit_select on public.audit_logs for select to authenticated using (public.is_admin());
create policy jobs_select on public.background_jobs for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 9. PRIVILEGES (least privilege: tables closed by default, opened per role)
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to service_role;
grant all on all functions in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- anonymous visitors: public catalog only (column-limited on profiles)
grant select on public.courses, public.modules, public.lessons, public.forms,
                public.certificate_templates, public.events, public.labs_projects,
                public.labs_collaborators, public.resources to anon;
grant select (id, full_name_en, full_name_ar, avatar_url) on public.profiles to anon;

-- signed-in users (RLS decides rows)
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.certificates, public.audit_logs, public.background_jobs from authenticated;
revoke insert, delete on public.exam_answers from authenticated;
revoke delete on public.profiles from authenticated;
revoke insert on public.profiles from authenticated;                        -- created by trigger only

-- helper + RPC execute rights
grant execute on function
  public.is_admin(), public.is_instructor_or_admin(), public.is_instructor_of(uuid), public.is_enrolled_in(uuid),
  public.course_is_published(uuid), public.course_of_module(uuid), public.course_of_lesson(uuid),
  public.course_of_exam(uuid), public.course_of_session(uuid), public.is_lesson_preview(uuid)
  to anon, authenticated;
grant execute on function
  public.attendance_percent(uuid, uuid), public.certificate_eligibility(uuid, uuid),
  public.reorder_module(uuid, text), public.reorder_lesson(uuid, text),
  public.issue_certificate(uuid, uuid), public.revoke_certificate(uuid, text),
  public.register_for_event(uuid, text), public.promote_from_waitlist(uuid)
  to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 10. STORAGE
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('course-materials',  'course-materials',  false),
  ('course-thumbnails', 'course-thumbnails', true)
on conflict (id) do update set public = excluded.public;

create policy "materials_select" on storage.objects for select to authenticated using (
  bucket_id = 'course-materials' and (
    public.is_admin()
    or public.is_instructor_of(((storage.foldername(name))[1])::uuid)
    or public.is_enrolled_in(((storage.foldername(name))[1])::uuid)
  )
);
create policy "materials_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'course-materials'
  and (public.is_admin() or public.is_instructor_of(((storage.foldername(name))[1])::uuid))
);
create policy "materials_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'course-materials'
  and (public.is_admin() or public.is_instructor_of(((storage.foldername(name))[1])::uuid))
);

create policy "thumbs_insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'course-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text and public.is_instructor_or_admin()
);
create policy "thumbs_update" on storage.objects for update to authenticated using (
  bucket_id = 'course-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "thumbs_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'course-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------
-- 11. OPTIONAL Auth Hook (stamps user_role into the JWT). The app does NOT
--     depend on it; enable under Authentication → Hooks only if you want it.
-- ---------------------------------------------------------------------
create function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_role user_role; v_claims jsonb;
begin
  select role into v_role from public.profiles where id = (event ->> 'user_id')::uuid;
  v_claims := coalesce(event -> 'claims', '{}'::jsonb);
  v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(coalesce(v_role, 'student'::user_role)));
  return jsonb_set(event, '{claims}', v_claims);
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.profiles to supabase_auth_admin;
create policy profiles_auth_admin_read on public.profiles for select to supabase_auth_admin using (true);

-- ---------------------------------------------------------------------
-- 12. BACKFILL: keep existing sign-ups (auth.users survives a reset)
-- ---------------------------------------------------------------------
insert into public.profiles (id, full_name_en, full_name_ar, genhex_id)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'full_name_en', ''), nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, 'user'), '@', 1)),
       coalesce(nullif(u.raw_user_meta_data ->> 'full_name_ar', ''), nullif(u.raw_user_meta_data ->> 'full_name_en', ''), nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, 'user'), '@', 1)),
       public.generate_genhex_id('student')
from auth.users u
order by u.created_at
on conflict (id) do nothing;

commit;
