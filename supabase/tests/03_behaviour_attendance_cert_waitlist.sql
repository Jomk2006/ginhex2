-- =====================================================================
-- GENHEX — BEHAVIOUR TESTS (03): attendance_percent, certificate_eligibility,
-- revoke_certificate, promote_from_waitlist
--
-- SAFE TO RUN ON THE LIVE DB: everything happens in ONE statement batch. All fixtures
-- are synthetic (test-*@example.invalid), roles are impersonated with
-- set_config('request.jwt.claims'...) + role switching, and the DO block ENDS BY
-- RAISING AN EXCEPTION carrying the results, so EVERYTHING ROLLS BACK.
-- Run as the `postgres` role (SQL editor / MCP execute_sql). Read the ERROR text:
--   "RESULTS ... PASS=n FAIL=m". Nothing is committed.
-- Side effect that CANNOT roll back: sequences (GEN-xxx numbers) advance a few values.
-- =====================================================================
begin;

create temp table t_res (ord timestamptz default clock_timestamp(), fn text, name text, ok boolean, detail text);
grant all on t_res to public;

create function pg_temp.chk(p_fn text, p_name text, p_ok boolean, p_detail text default null) returns void
language plpgsql as $$ begin insert into t_res(fn, name, ok, detail) values (p_fn, p_name, coalesce(p_ok, false), p_detail); end $$;

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function pg_temp.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;
create function pg_temp.as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('role', 'service_role', true);
end $$;
create function pg_temp.as_super() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'postgres', true);
end $$;

do $test$
declare
  -- users
  u_admin uuid := gen_random_uuid(); u_admin_off uuid := gen_random_uuid();
  u_i1 uuid := gen_random_uuid(); u_i2 uuid := gen_random_uuid();
  s1 uuid := gen_random_uuid(); s2 uuid := gen_random_uuid(); s3 uuid := gen_random_uuid();
  s4 uuid := gen_random_uuid(); s5 uuid := gen_random_uuid(); s6 uuid := gen_random_uuid();
  -- courses / content
  c1 uuid := gen_random_uuid(); c2 uuid := gen_random_uuid(); c3 uuid := gen_random_uuid();
  m1 uuid := gen_random_uuid(); m2 uuid := gen_random_uuid();
  l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); l3 uuid := gen_random_uuid();
  e1 uuid := gen_random_uuid(); e2 uuid := gen_random_uuid();
  en uuid; sess uuid; i int;
  tpl uuid := gen_random_uuid();
  cert1 uuid := gen_random_uuid(); cert2 uuid := gen_random_uuid(); cert3 uuid := gen_random_uuid();
  ev1 uuid := gen_random_uuid(); ev2 uuid := gen_random_uuid(); ev3 uuid := gen_random_uuid(); ev4 uuid := gen_random_uuid();
  r numeric; b boolean; sc numeric; err text; n int; n2 int; st text; txt text;
  rr record; r_a uuid; r_b uuid; w1 uuid; w2 uuid; w3 uuid; rev_at timestamptz;
  v_pass int; v_fail int; orig text := current_user;
begin
  -- ---------------- fixtures (as superuser; uid is null so profile guards allow role changes) ------
  insert into auth.users (id, email) values
    (u_admin,'test-admin@example.invalid'),(u_admin_off,'test-admin-off@example.invalid'),
    (u_i1,'test-i1@example.invalid'),(u_i2,'test-i2@example.invalid'),
    (s1,'test-s1@example.invalid'),(s2,'test-s2@example.invalid'),(s3,'test-s3@example.invalid'),
    (s4,'test-s4@example.invalid'),(s5,'test-s5@example.invalid'),(s6,'test-s6@example.invalid');
  update public.profiles set role='admin' where id = u_admin;
  update public.profiles set role='admin', is_active=false where id = u_admin_off;
  update public.profiles set role='instructor' where id in (u_i1,u_i2);

  insert into public.courses (id, slug, title_en, title_ar, instructor_id, exam_requirement) values
    (c1,'test-zz-c1','T1','T1',u_i1,'required'),
    (c2,'test-zz-c2','T2','T2',u_i2,'none'),
    (c3,'test-zz-c3','T3','T3',u_i1,'none');
  insert into public.modules (id, course_id, title_en, title_ar, order_index) values (m1,c1,'m','m',1),(m2,c2,'m','m',1);
  insert into public.lessons (id, module_id, title_en, title_ar, youtube_video_id, duration_seconds, order_index) values
    (l1,m1,'l','l','x',100,1),(l2,m1,'l','l','x',100,2),(l3,m2,'l','l','x',100,1);
  insert into public.exams (id, course_id, title_en, title_ar, duration_minutes, passing_score_percent, counts_toward_certification) values
    (e1,c1,'e','e',30,60,true),(e2,c1,'e','e',30,60,false);

  -- attendance: C1 has 6 sessions. S1: present, present, late, absent, excused, (no record) => 3/6 = 50.00
  for i in 1..6 loop
    insert into public.attendance_sessions (course_id,title,session_date,created_by) values (c1,'s'||i,now()-make_interval(days=>i),u_admin) returning id into sess;
    insert into public.attendance_records (session_id,student_id,status) select sess, s1, (array['present','present','late','absent','excused'])[i]::attendance_status where i<=5;
    insert into public.attendance_records (session_id,student_id,status) values (sess, s2, 'present');   -- S2: 6/6
  end loop;
  -- C2: 2 sessions, S1 present at both (isolation from C1)
  for i in 1..2 loop
    insert into public.attendance_sessions (course_id,title,session_date,created_by) values (c2,'s'||i,now(),u_admin) returning id into sess;
    insert into public.attendance_records (session_id,student_id,status) values (sess,s1,'present');
  end loop;

  -- ================= attendance_percent =================
  perform pg_temp.as_user(s1);
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','S1 own C1: 2 present+1 late+1 absent+1 excused+1 no-record of 6 = 50.00', r = 50.00, 'got '||coalesce(r::text,'NULL'));
  r := public.attendance_percent(s1,c2);
  perform pg_temp.chk('attendance_percent','S1 own C2 = 100.00 (other course isolated)', r = 100.00, 'got '||coalesce(r::text,'NULL'));
  r := public.attendance_percent(s1,c3);
  perform pg_temp.chk('attendance_percent','course with 0 sessions = 0 (not null / no div-by-zero)', r = 0, 'got '||coalesce(r::text,'NULL'));
  r := public.attendance_percent(s2,c1);
  perform pg_temp.chk('attendance_percent','student S1 asking about S2 returns NULL (denied)', r is null, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(s5);
  r := public.attendance_percent(s5,c1);
  perform pg_temp.chk('attendance_percent','S5 (no records) own C1 = 0.00', r = 0, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(s2);
  r := public.attendance_percent(s2,c1);
  perform pg_temp.chk('attendance_percent','S2 own C1 = 100.00', r = 100.00, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(u_i1);
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','instructor of C1 sees S1 = 50.00', r = 50.00, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(u_i2);
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','instructor of OTHER course gets NULL for C1', r is null, 'got '||coalesce(r::text,'NULL'));
  r := public.attendance_percent(s1,c2);
  perform pg_temp.chk('attendance_percent','instructor of C2 sees S1 in C2 = 100.00', r = 100.00, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(u_admin);
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','admin sees S1 C1 = 50.00', r = 50.00, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_user(u_admin_off);
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','INACTIVE admin gets NULL', r is null, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_anon();
  begin r := public.attendance_percent(s1,c1); err := null; exception when others then err := sqlstate; r := null; end;
  perform pg_temp.chk('attendance_percent','anon has no EXECUTE privilege (42501) / gets no data', err = '42501' and r is null, format('sqlstate=%s r=%s', coalesce(err,'none'), coalesce(r::text,'NULL')));
  perform pg_temp.as_service();
  r := public.attendance_percent(s1,c1);
  perform pg_temp.chk('attendance_percent','service_role sees S1 C1 = 50.00', r = 50.00, 'got '||coalesce(r::text,'NULL'));
  perform pg_temp.as_super();

  -- ================= certificate_eligibility fixtures =================
  -- S1: C1 lessons done, passed attempts 70 & 85, plus a FAILED attempt scoring 95 (must be ignored) ; C2 lesson done; C3 enrolled (no lessons)
  -- S2: C1 lessons done, no attempt          S3: C1 lessons done, only failed attempt
  -- S4: C1 only L1 done + L2 at 89% (<90%), passed attempt   S5: WITHDRAWN, all done+passed
  -- S6: C1 lessons done, passed only the NON-counting exam E2
  insert into public.enrollments (student_id,course_id,status) values
    (s1,c1,'active'),(s1,c2,'active'),(s1,c3,'active'),(s2,c1,'active'),(s3,c1,'active'),(s4,c1,'active'),(s5,c1,'withdrawn'),(s6,c1,'active');
  for rr in select e.id eid, e.student_id sid from public.enrollments e where e.course_id = c1 and e.student_id in (s1,s2,s3,s5,s6) loop
    insert into public.lesson_progress (enrollment_id,lesson_id,watched_seconds) values (rr.eid,l1,100),(rr.eid,l2,100);
  end loop;
  select id into en from public.enrollments where student_id=s4 and course_id=c1;
  insert into public.lesson_progress (enrollment_id,lesson_id,watched_seconds) values (en,l1,100),(en,l2,89);
  select id into en from public.enrollments where student_id=s1 and course_id=c2;
  insert into public.lesson_progress (enrollment_id,lesson_id,watched_seconds) values (en,l3,100);
  insert into public.exam_attempts (exam_id,student_id,attempt_number,attendance_percent_at_start,status,score_percent,passed,submitted_at) values
    (e1,s1,1,50,'graded',70,true,now()),(e1,s1,2,50,'graded',85,true,now()),(e1,s1,3,50,'graded',95,false,now()),
    (e1,s3,1,0,'graded',40,false,now()),
    (e1,s4,1,0,'graded',80,true,now()),
    (e1,s5,1,0,'graded',90,true,now()),
    (e2,s6,1,0,'graded',90,true,now());

  -- ================= certificate_eligibility =================
  perform pg_temp.as_user(s1);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce;
  perform pg_temp.chk('certificate_eligibility','eligible: lessons done + passed exam; score = best PASSED (85, ignores failed 95)', b is true and sc = 85, format('eligible=%s score=%s', b, sc));
  perform pg_temp.chk('certificate_eligibility','attendance is NOT a factor (S1 has 50% attendance, still eligible)', b is true, 'attendance_percent=50 but eligible='||coalesce(b::text,'NULL'));
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c2) ce;
  perform pg_temp.chk('certificate_eligibility','exam_requirement=none: eligible with no exam, score NULL', b is true and sc is null, format('eligible=%s score=%s', b, sc));
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c3) ce;
  perform pg_temp.chk('certificate_eligibility','course with zero lessons => NOT eligible', b is false, format('eligible=%s score=%s', b, sc));
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s2,c1) ce;
  perform pg_temp.chk('certificate_eligibility','S1 cannot query S2 => (false,NULL) even though lookup is enforced', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s2);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s2,c1) ce;
  perform pg_temp.chk('certificate_eligibility','required exam, no attempt => NOT eligible', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s3);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s3,c1) ce;
  perform pg_temp.chk('certificate_eligibility','required exam, only failed attempt => NOT eligible', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s4);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s4,c1) ce;
  perform pg_temp.chk('certificate_eligibility','passed exam but a lesson incomplete (89%<90%) => NOT eligible, score still 80', b is false and sc = 80, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s5);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s5,c1) ce;
  perform pg_temp.chk('certificate_eligibility','withdrawn enrollment => NOT eligible', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s6);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s6,c1) ce;
  perform pg_temp.chk('certificate_eligibility','passed only a non-counting exam => NOT eligible', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(s2);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s2,c2) ce;
  perform pg_temp.chk('certificate_eligibility','not enrolled in course => NOT eligible', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(u_i1);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce;
  perform pg_temp.chk('certificate_eligibility','instructor of C1 can see S1 => eligible', b is true and sc = 85, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(u_i2);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce;
  perform pg_temp.chk('certificate_eligibility','instructor of OTHER course gets (false,NULL) for S1/C1', b is false and sc is null, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_user(u_admin);
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce;
  perform pg_temp.chk('certificate_eligibility','admin can see S1 => eligible', b is true and sc = 85, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_anon();
  b := null; sc := null;
  begin select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce; err := null; exception when others then err := sqlstate; end;
  perform pg_temp.chk('certificate_eligibility','anon has no EXECUTE privilege (42501) / gets no data', err = '42501' and b is null, format('sqlstate=%s eligible=%s', coalesce(err,'none'), coalesce(b::text,'NULL')));
  perform pg_temp.as_service();
  select ce.eligible, ce.qualifying_score into b, sc from public.certificate_eligibility(s1,c1) ce;
  perform pg_temp.chk('certificate_eligibility','service_role can see S1 => eligible', b is true and sc = 85, format('eligible=%s score=%s', b, sc));
  perform pg_temp.as_super();

  -- ================= revoke_certificate =================
  insert into public.certificate_templates (id,name,design_config,is_default) values (tpl,'test-zz-template','{}',false);
  insert into public.certificates (id,certificate_number,verification_slug,student_id,course_id,template_id,issued_by) values
    (cert1,'TEST-ZZ-1',md5('t1'),s1,c1,tpl,u_admin),
    (cert2,'TEST-ZZ-2',md5('t2'),s2,c1,tpl,u_admin),
    (cert3,'TEST-ZZ-3',md5('t3'),s1,c2,tpl,u_admin);

  -- denied callers
  perform pg_temp.as_user(s1);
  begin perform public.revoke_certificate(cert1,'student tries'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','student (cert owner) denied, cert stays active', err like '%only admins%' and st='active', format('err=%s status=%s', err, st));
  perform pg_temp.as_user(u_i1);
  begin perform public.revoke_certificate(cert1,'own-course instructor'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','instructor of the cert''s own course denied', err like '%only admins%' and st='active', format('err=%s status=%s', err, st));
  perform pg_temp.as_user(u_i2);
  begin perform public.revoke_certificate(cert1,'other-course instructor'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','instructor of OTHER course denied', err like '%only admins%' and st='active', format('err=%s status=%s', err, st));
  perform pg_temp.as_user(u_admin_off);
  begin perform public.revoke_certificate(cert1,'inactive admin'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','INACTIVE admin denied', err like '%only admins%' and st='active', format('err=%s status=%s', err, st));
  perform pg_temp.as_anon();
  begin perform public.revoke_certificate(cert1,'anon'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','anon denied', err is not null and st='active', format('err=%s status=%s', err, st));
  select count(*) into n from public.audit_logs where entity_id in (cert1,cert2,cert3);
  perform pg_temp.chk('revoke_certificate','denied attempts write NO audit rows', n = 0, 'audit rows='||n);

  -- admin succeeds
  perform pg_temp.as_user(u_admin);
  begin perform public.revoke_certificate(cert1,'test reason A'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select * into rr from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','admin revoke succeeds: status=revoked', err is null and rr.status='revoked', format('err=%s status=%s', err, rr.status));
  perform pg_temp.chk('revoke_certificate','revoked_reason, revoked_by, revoked_at set', rr.revoked_reason='test reason A' and rr.revoked_by=u_admin and rr.revoked_at is not null, format('reason=%s by_admin=%s at_null=%s', rr.revoked_reason, rr.revoked_by=u_admin, rr.revoked_at is null));
  select count(*) into n from public.audit_logs where entity_id=cert1 and action='certificate.revoked' and actor_id=u_admin and metadata->>'reason'='test reason A';
  perform pg_temp.chk('revoke_certificate','audit log row written with actor+reason', n=1, 'rows='||n);
  select status::text into st from public.certificates where id=cert2;
  perform pg_temp.chk('revoke_certificate','other certificates untouched (cert2 active)', st='active', 'cert2='||st);
  select status::text into st from public.certificates where id=cert3;
  perform pg_temp.chk('revoke_certificate','same student, other course cert untouched (cert3 active)', st='active', 'cert3='||st);
  rev_at := rr.revoked_at;

  -- double revoke: no error, original reason/time/by kept (status='active' guard)
  perform pg_temp.as_user(u_admin);
  begin perform public.revoke_certificate(cert1,'test reason B'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select * into rr from public.certificates where id=cert1;
  perform pg_temp.chk('revoke_certificate','double revoke: no error', err is null, 'err='||coalesce(err,'none'));
  perform pg_temp.chk('revoke_certificate','double revoke: original reason and revoked_at preserved', rr.revoked_reason='test reason A' and rr.revoked_at=rev_at, format('reason=%s same_time=%s', rr.revoked_reason, rr.revoked_at=rev_at));
  select count(*) into n from public.audit_logs where entity_id=cert1 and action='certificate.revoked';
  -- OBSERVATION: documents current behaviour (an extra audit row is written although nothing changed)
  perform pg_temp.chk('revoke_certificate','OBSERVATION double revoke writes a 2nd audit row though nothing changed (expect 2 = current behaviour)', n=2, 'audit rows='||n);

  -- nonexistent id
  perform pg_temp.as_user(u_admin);
  begin perform public.revoke_certificate(gen_random_uuid(),'ghost'); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select count(*) into n from public.audit_logs where action='certificate.revoked' and metadata->>'reason'='ghost';
  perform pg_temp.chk('revoke_certificate','OBSERVATION unknown certificate id: no error and an audit row IS written (expect err NULL, rows=1)', err is null and n=1, format('err=%s rows=%s', coalesce(err,'none'), n));

  -- ================= promote_from_waitlist =================
  insert into public.events (id,slug,title_en,title_ar,event_type,starts_at,ends_at,location_mode,capacity,capacity_mode,status,created_by) values
    (ev1,'test-zz-ev1','e','e','workshop',now()+interval '1 day',now()+interval '2 day','online',2,'waitlist','published',u_admin),
    (ev2,'test-zz-ev2','e','e','workshop',now()+interval '1 day',now()+interval '2 day','online',5,'waitlist','published',u_admin),
    (ev3,'test-zz-ev3','e','e','workshop',now()+interval '1 day',now()+interval '2 day','online',null,'waitlist','published',u_admin),
    (ev4,'test-zz-ev4','e','e','workshop',now()+interval '1 day',now()+interval '2 day','online',1,'waitlist','published',u_admin);
  -- EV1 cap 2: S1,S2 registered; waitlist inserted OUT of order (pos3 first): S5=pos3, S3=pos1, S4=pos2
  insert into public.event_registrations (event_id,user_id,status) values (ev1,s1,'registered') returning id into r_a;
  insert into public.event_registrations (event_id,user_id,status) values (ev1,s2,'registered') returning id into r_b;
  insert into public.event_registrations (event_id,user_id,status,waitlist_position) values (ev1,s5,'waitlisted',3) returning id into w3;
  insert into public.event_registrations (event_id,user_id,status,waitlist_position) values (ev1,s3,'waitlisted',1) returning id into w1;
  insert into public.event_registrations (event_id,user_id,status,waitlist_position) values (ev1,s4,'waitlisted',2) returning id into w2;

  -- denied callers (event full AND one seat free later: use the free-seat state to prove nothing changes)
  update public.event_registrations set status='cancelled' where id=r_a;     -- frees one seat
  perform pg_temp.as_user(s3);
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.event_registrations where id=w1;
  perform pg_temp.chk('promote_from_waitlist','student (even a waitlisted one) denied, nobody promoted', err like '%not allowed%' and st='waitlisted', format('err=%s w1=%s', err, st));
  perform pg_temp.as_user(u_i1);
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.event_registrations where id=w1;
  perform pg_temp.chk('promote_from_waitlist','instructor denied', err like '%not allowed%' and st='waitlisted', format('err=%s w1=%s', err, st));
  perform pg_temp.as_user(u_admin_off);
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.event_registrations where id=w1;
  perform pg_temp.chk('promote_from_waitlist','INACTIVE admin denied', err like '%not allowed%' and st='waitlisted', format('err=%s w1=%s', err, st));
  perform pg_temp.as_anon();
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super(); select status::text into st from public.event_registrations where id=w1;
  perform pg_temp.chk('promote_from_waitlist','anon denied', err is not null and st='waitlisted', format('err=%s w1=%s', err, st));

  -- admin promotes exactly one (1 free seat), lowest waitlist_position (S3=pos1) even though inserted 2nd
  perform pg_temp.as_user(u_admin);
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev1 and status in ('registered','attended');
  perform pg_temp.chk('promote_from_waitlist','1 free seat: admin call succeeds, seats taken = capacity (2)', err is null and n=2, format('err=%s taken=%s', coalesce(err,'none'), n));
  select status::text, waitlist_position::text into st, txt from public.event_registrations where id=w1;
  perform pg_temp.chk('promote_from_waitlist','promoted the LOWEST waitlist_position (pos1), position cleared', st='registered' and txt is null, format('w1=%s pos=%s', st, coalesce(txt,'NULL')));
  select count(*) into n from public.event_registrations where id in (w2,w3) and status='waitlisted';
  perform pg_temp.chk('promote_from_waitlist','pos2 and pos3 still waitlisted', n=2, 'still waitlisted='||n);
  -- full: no promotion
  perform pg_temp.as_user(u_admin);
  perform public.promote_from_waitlist(ev1);
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev1 and status='waitlisted';
  perform pg_temp.chk('promote_from_waitlist','event FULL: no promotion (2 still waitlisted)', n=2, 'waitlisted='||n);
  -- 'cancelled'/'no_show' free seats, then two seats free: promotes pos2 then pos3, in order, stops when list empty
  update public.event_registrations set status='no_show' where id=r_b;
  update public.event_registrations set status='cancelled' where id=w1;
  perform pg_temp.as_service();
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev1 and status='registered';
  select count(*) into n2 from public.event_registrations where id in (w2,w3) and status='registered' and waitlist_position is null;
  perform pg_temp.chk('promote_from_waitlist','service_role allowed; no_show+cancelled free seats; pos2 AND pos3 promoted', err is null and n=2 and n2=2, format('err=%s registered=%s promoted=%s', coalesce(err,'none'), n, n2));
  -- empty waitlist: no-op, no error
  perform pg_temp.as_user(u_admin);
  begin perform public.promote_from_waitlist(ev1); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev1 and status='registered';
  perform pg_temp.chk('promote_from_waitlist','empty waitlist: no error, no change', err is null and n=2, format('err=%s registered=%s', coalesce(err,'none'), n));
  -- EV2: seats free but nobody waiting
  insert into public.event_registrations (event_id,user_id,status) values (ev2,s1,'registered');
  perform pg_temp.as_user(u_admin);
  begin perform public.promote_from_waitlist(ev2); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev2;
  perform pg_temp.chk('promote_from_waitlist','seats free, no waitlist: nothing created', err is null and n=1, format('err=%s rows=%s', coalesce(err,'none'), n));
  -- EV3 unlimited capacity: promotes everybody
  insert into public.event_registrations (event_id,user_id,status,waitlist_position) values (ev3,s1,'waitlisted',1),(ev3,s2,'waitlisted',2);
  perform pg_temp.as_user(u_admin);
  perform public.promote_from_waitlist(ev3);
  perform pg_temp.as_super();
  select count(*) into n from public.event_registrations where event_id=ev3 and status='registered';
  perform pg_temp.chk('promote_from_waitlist','capacity NULL (unlimited): all waitlisted promoted', n=2, 'registered='||n);
  -- EV4 cap 1: an 'attended' registration still occupies the seat
  insert into public.event_registrations (event_id,user_id,status) values (ev4,s1,'attended');
  insert into public.event_registrations (event_id,user_id,status,waitlist_position) values (ev4,s2,'waitlisted',1);
  perform pg_temp.as_user(u_admin);
  perform public.promote_from_waitlist(ev4);
  perform pg_temp.as_super();
  select status::text into st from public.event_registrations where event_id=ev4 and user_id=s2;
  perform pg_temp.chk('promote_from_waitlist','attended counts as taken: waitlisted stays waitlisted', st='waitlisted', 'status='||st);
  -- unknown event id
  perform pg_temp.as_user(u_admin);
  begin perform public.promote_from_waitlist(gen_random_uuid()); err := null; exception when others then err := sqlerrm; end;
  perform pg_temp.as_super();
  perform pg_temp.chk('promote_from_waitlist','unknown event id: no error, no effect', err is null, 'err='||coalesce(err,'none'));

  -- ---------------- report + rollback ----------------
  perform pg_temp.as_super();
  select count(*) filter (where ok), count(*) filter (where not ok) into v_pass, v_fail from t_res;
  select string_agg(format('%s %-24s | %s | %s', case when ok then 'PASS' else 'FAIL' end, fn, name, coalesce(detail,'')), E'\n' order by ord) into txt from t_res;
  select string_agg(format('%s: pass=%s fail=%s', fn, p, f), E'\n') into st from
    (select fn, count(*) filter (where ok) p, count(*) filter (where not ok) f from t_res group by fn order by fn) x;
  raise exception E'RESULTS (everything rolled back)\n%\n-- per function --\n%\nPASS=% FAIL=%', txt, st, v_pass, v_fail;
end
$test$;

rollback;
