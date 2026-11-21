"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getStudentAttendancePercent } from "@/lib/data/attendance";

export interface ExamActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  ok?: boolean;
}

const MSG = {
  signIn: "signInRequired",
  forbidden: "notAllowed",
  generic: "generic",
} as const;

/* ------------------------------------------------------------------ */
/* Authorization                                                       */
/* ------------------------------------------------------------------ */

/** Admins, or the instructor who owns / co-teaches the course. Decided server-side from the DB, not the JWT. */
async function requireCourseManager(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: MSG.signIn } as const;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile) return { error: MSG.forbidden } as const;
  if (profile.role === "admin") return { user, role: profile.role } as const;
  if (profile.role !== "instructor") return { error: MSG.forbidden } as const;

  const admin = createServiceRoleClient();
  const [{ data: course }, { data: link }] = await Promise.all([
    admin.from("courses").select("instructor_id").eq("id", courseId).maybeSingle(),
    admin.from("course_instructors").select("id").eq("course_id", courseId).eq("instructor_id", user.id).maybeSingle(),
  ]);
  if (!course || (course.instructor_id !== user.id && !link)) return { error: MSG.forbidden } as const;
  return { user, role: profile.role } as const;
}

async function courseIdOfExam(examId: string) {
  const admin = createServiceRoleClient();
  const { data } = await admin.from("exams").select("course_id").eq("id", examId).maybeSingle();
  return data?.course_id ?? null;
}

/* ------------------------------------------------------------------ */
/* Instructor / admin: build exams                                     */
/* ------------------------------------------------------------------ */

const examSchema = z.object({
  title_en: z.string().trim().min(2, "Required"),
  title_ar: z.string().trim().min(2, "مطلوب"),
  duration_minutes: z.coerce.number().int().min(1).max(600),
  passing_score_percent: z.coerce.number().min(0).max(100),
  attendance_requirement_percent: z.coerce.number().min(0).max(100),
  max_attempts: z.coerce.number().int().min(1).max(20),
});

export async function createExamAction(
  courseId: string,
  _prev: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const auth = await requireCourseManager(courseId);
  if ("error" in auth) return { error: auth.error };

  const parsed = examSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("exams").insert({
    course_id: courseId,
    ...parsed.data,
    counts_toward_certification: formData.get("counts_toward_certification") === "on",
    status: "draft",
  });
  if (error) {
    console.error("createExamAction failed", { code: error.code, message: error.message });
    return { error: MSG.generic, fieldErrors: { _code: [error.code ?? "?"] } };
  }
  revalidatePath("/[locale]/app", "layout");
  return { ok: true };
}

const questionSchema = z.object({
  type: z.enum(["mcq", "true_false"]),
  prompt_en: z.string().trim().min(2, "Required"),
  prompt_ar: z.string().trim().min(2, "مطلوب"),
  points: z.coerce.number().min(0.5).max(100),
});

export async function addQuestionAction(
  examId: string,
  _prev: ExamActionState,
  formData: FormData
): Promise<ExamActionState> {
  const courseId = await courseIdOfExam(examId);
  if (!courseId) return { error: MSG.generic };
  const auth = await requireCourseManager(courseId);
  if ("error" in auth) return { error: auth.error };

  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };

  let options: string[] | null = null;
  let correct: string;
  if (parsed.data.type === "mcq") {
    options = [1, 2, 3, 4]
      .map((i) => String(formData.get(`option_${i}`) ?? "").trim())
      .filter((o) => o.length > 0);
    const idx = Number(formData.get("correct_index"));
    const chosen = [1, 2, 3, 4].map((i) => String(formData.get(`option_${i}`) ?? "").trim())[idx - 1];
    if (options.length < 2 || !chosen) return { error: "needOptions" };
    correct = chosen;
  } else {
    correct = formData.get("correct_tf") === "false" ? "false" : "true";
  }

  const admin = createServiceRoleClient();
  const { data: last } = await admin
    .from("exam_questions")
    .select("order_index")
    .eq("exam_id", examId)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await admin.from("exam_questions").insert({
    exam_id: examId,
    type: parsed.data.type,
    prompt_en: parsed.data.prompt_en,
    prompt_ar: parsed.data.prompt_ar,
    options,
    correct_answer: correct,
    points: parsed.data.points,
    order_index: (last?.order_index ?? 0) + 1,
  });
  if (error) {
    console.error("addQuestionAction failed", { code: error.code, message: error.message });
    return { error: MSG.generic, fieldErrors: { _code: [error.code ?? "?"] } };
  }
  revalidatePath("/[locale]/app", "layout");
  return { ok: true };
}

export async function deleteQuestionAction(questionId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: q } = await admin.from("exam_questions").select("exam_id").eq("id", questionId).maybeSingle();
  if (!q) return;
  const courseId = await courseIdOfExam(q.exam_id);
  if (!courseId) return;
  const auth = await requireCourseManager(courseId);
  if ("error" in auth) return;
  await admin.from("exam_questions").delete().eq("id", questionId);
  revalidatePath("/[locale]/app", "layout");
}

export async function setExamStatusAction(examId: string, status: "draft" | "published" | "closed"): Promise<void> {
  const courseId = await courseIdOfExam(examId);
  if (!courseId) return;
  const auth = await requireCourseManager(courseId);
  if ("error" in auth) return;
  const admin = createServiceRoleClient();
  if (status === "published") {
    const { count } = await admin.from("exam_questions").select("id", { count: "exact", head: true }).eq("exam_id", examId);
    if (!count) return; // an exam with no questions can't be published
  }
  await admin.from("exams").update({ status }).eq("id", examId);
  revalidatePath("/[locale]/app", "layout");
}

export async function deleteExamAction(examId: string): Promise<void> {
  const courseId = await courseIdOfExam(examId);
  if (!courseId) return;
  const auth = await requireCourseManager(courseId);
  if ("error" in auth) return;
  const admin = createServiceRoleClient();
  await admin.from("exams").delete().eq("id", examId);
  revalidatePath("/[locale]/app", "layout");
}

/* ------------------------------------------------------------------ */
/* Student: take exams. Everything authoritative happens here.         */
/* ------------------------------------------------------------------ */

type Admin = ReturnType<typeof createServiceRoleClient>;

/** Grades server-side against correct answers the browser never receives. */
async function gradeAttempt(admin: Admin, attemptId: string, examId: string, answers: Record<string, string>) {
  // Atomically claim the attempt so a double-click / retry can't grade (and insert answers) twice.
  const { data: claimed } = await admin
    .from("exam_attempts")
    .update({ status: "submitted" })
    .eq("id", attemptId)
    .eq("status", "in_progress")
    .select("id");
  if (!claimed || claimed.length === 0) return null;

  const { data: questions } = await admin
    .from("exam_questions")
    .select("id, correct_answer, points")
    .eq("exam_id", examId);
  const { data: exam } = await admin.from("exams").select("passing_score_percent").eq("id", examId).single();

  let total = 0;
  let earned = 0;
  const rows = (questions ?? []).map((q) => {
    const given = (answers[q.id] ?? "").trim();
    const correct = given !== "" && given === (q.correct_answer ?? "");
    total += Number(q.points);
    if (correct) earned += Number(q.points);
    return {
      attempt_id: attemptId,
      question_id: q.id,
      student_answer: given || null,
      is_correct: correct,
      points_awarded: correct ? Number(q.points) : 0,
      graded_at: new Date().toISOString(),
    };
  });

  if (rows.length) await admin.from("exam_answers").insert(rows);

  const score = total > 0 ? Math.round((earned / total) * 10000) / 100 : 0;
  await admin
    .from("exam_attempts")
    .update({
      status: "graded",
      submitted_at: new Date().toISOString(),
      score_percent: score,
      passed: score >= Number(exam?.passing_score_percent ?? 100),
    })
    .eq("id", attemptId);
  return score;
}

export async function startAttemptAction(examId: string, locale: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: MSG.signIn };

  const admin = createServiceRoleClient();
  const { data: exam } = await admin.from("exams").select("*").eq("id", examId).maybeSingle();
  if (!exam || exam.status !== "published") return { error: "notAvailable" };

  const now = Date.now();
  if (exam.available_from && new Date(exam.available_from).getTime() > now) return { error: "notAvailable" };
  if (exam.available_to && new Date(exam.available_to).getTime() < now) return { error: "notAvailable" };

  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("course_id", exam.course_id)
    .maybeSingle();
  if (!enrollment || enrollment.status === "withdrawn") return { error: "notEnrolled" };

  const { data: attempts } = await admin
    .from("exam_attempts")
    .select("id, attempt_number, status, started_at")
    .eq("exam_id", examId)
    .eq("student_id", user.id);
  const list = attempts ?? [];

  // Close out any attempt whose clock ran out without a submission (graded with whatever was saved: nothing).
  for (const a of list) {
    if (a.status === "in_progress") {
      const deadline = new Date(a.started_at).getTime() + exam.duration_minutes * 60_000 + 30_000;
      if (deadline < now) await gradeAttempt(admin, a.id, examId, {});
    }
  }

  const { data: fresh } = await admin
    .from("exam_attempts")
    .select("id, status")
    .eq("exam_id", examId)
    .eq("student_id", user.id);
  const current = fresh ?? [];
  if (current.some((a) => a.status === "in_progress")) {
    redirect(`/${locale}/app/student/courses/${await slugOf(admin, exam.course_id)}/exam`);
  }
  if (current.length >= exam.max_attempts) return { error: "noAttemptsLeft" };

  const attendance = (await getStudentAttendancePercent(user.id, exam.course_id)) ?? 0;
  if (attendance < Number(exam.attendance_requirement_percent)) return { error: "attendanceTooLow" };

  const { error } = await admin.from("exam_attempts").insert({
    exam_id: examId,
    student_id: user.id,
    attempt_number: current.length + 1,
    attendance_percent_at_start: attendance,
  });
  if (error) {
    console.error("startAttemptAction failed", { code: error.code, message: error.message });
    return { error: MSG.generic };
  }
  redirect(`/${locale}/app/student/courses/${await slugOf(admin, exam.course_id)}/exam`);
}

async function slugOf(admin: Admin, courseId: string) {
  const { data } = await admin.from("courses").select("slug").eq("id", courseId).single();
  return data?.slug ?? "";
}

export async function submitAttemptAction(
  attemptId: string,
  answers: Record<string, string>
): Promise<{ error?: string; score?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: MSG.signIn };

  const admin = createServiceRoleClient();
  const { data: attempt } = await admin.from("exam_attempts").select("*").eq("id", attemptId).maybeSingle();
  if (!attempt || attempt.student_id !== user.id) return { error: MSG.forbidden };
  if (attempt.status !== "in_progress") return { error: "alreadySubmitted" };

  const { data: exam } = await admin.from("exams").select("duration_minutes").eq("id", attempt.exam_id).single();
  const deadline = new Date(attempt.started_at).getTime() + (exam?.duration_minutes ?? 0) * 60_000 + 30_000;
  // Late submissions are graded as empty — the clock is enforced here, not in the browser.
  const safeAnswers = Date.now() > deadline ? {} : answers;

  const score = await gradeAttempt(admin, attemptId, attempt.exam_id, safeAnswers);
  if (score === null) return { error: "alreadySubmitted" };
  revalidatePath("/[locale]/app", "layout");
  return { score };
}
