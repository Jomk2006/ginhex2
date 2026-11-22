-- =====================================================================
-- GENHEX — RESET (File 1 of 3). DESTRUCTIVE.
-- Deletes EVERYTHING in the `public` schema (all tables, data, functions,
-- types) plus our storage policies. Keeps: auth.users (accounts) and the
-- files already in Storage buckets. Run once, then 01_schema.sql.
-- =====================================================================
drop policy if exists "course_materials_select_authorized" on storage.objects;
drop policy if exists "course_materials_insert_instructor" on storage.objects;
drop policy if exists "course_materials_delete_instructor" on storage.objects;
drop policy if exists "course_thumbnails_insert" on storage.objects;
drop policy if exists "course_thumbnails_update" on storage.objects;
drop policy if exists "course_thumbnails_delete" on storage.objects;
drop policy if exists "materials_select" on storage.objects;
drop policy if exists "materials_insert" on storage.objects;
drop policy if exists "materials_delete" on storage.objects;
drop policy if exists "thumbs_insert" on storage.objects;
drop policy if exists "thumbs_update" on storage.objects;
drop policy if exists "thumbs_delete" on storage.objects;

drop trigger if exists trg_on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
