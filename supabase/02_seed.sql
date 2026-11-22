-- =====================================================================
-- GENHEX — SEED (File 3 of 3)
-- 1) default certificate template   2) make YOUR account the admin
-- =====================================================================

insert into public.certificate_templates (name, design_config, is_default)
values ('GENHEX Classic', '{"primary":"#00B6BF","dark":"#313A43","signature":"GENHEX"}', true)
on conflict do nothing;

-- >>> EDIT THE EMAIL BELOW to your own account's email, then run this block. <<<
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'PUT-YOUR-EMAIL-HERE');

-- Optional: make someone an instructor
-- update public.profiles set role = 'instructor'
--  where id = (select id from auth.users where email = 'instructor@example.com');

-- Check:
select genhex_id, role, full_name_en from public.profiles order by created_at;
