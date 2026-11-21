import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Both readers use the service-role client ON PURPOSE and are only called
 * from pages that already authorized the viewer. Students must never receive
 * `correct_answer`, so the student reader selects explicit safe columns.
 */

/** Manager view (instructor/admin): exams with full questions incl. answers. */
export async function getCourseExamsForManager(courseId: string) {
  const admin = createServiceRoleClient();
  const { data: exams, error } = await admin
    .from("exams")
    .select("*")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = (exams ?? []).map((e) => e.id);
  const { data: questions } = ids.length
    ? await admin.from("exam_questions").select("*").in("exam_id", ids).order("order_index", { ascending: true })
    : { data: [] };

  return (exams ?? []).map((e) => ({ ...e, questions: (questions ?? []).filter((q) => q.exam_id === e.id) }));
}

export type ManagerExam = Awaited<ReturnType<typeof getCourseExamsForManager>>[number];

/** Student view: published exams, answer-free questions, and this student's attempts. */
export async function getStudentExams(studentId: string, courseId: string) {
  const admin = createServiceRoleClient();
  const { data: exams, error } = await admin
    .from("exams")
    .select("id, title_en, title_ar, duration_minutes, passing_score_percent, attendance_requirement_percent, max_attempts, available_from, available_to")
    .eq("course_id", courseId)
    .eq("status", "published")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const ids = (exams ?? []).map((e) => e.id);
  if (ids.length === 0) return [];

  const [{ data: questions }, { data: attempts }] = await Promise.all([
    admin
      .from("exam_questions")
      .select("id, exam_id, type, prompt_en, prompt_ar, options, points, order_index")
      .in("exam_id", ids)
      .order("order_index", { ascending: true }),
    admin
      .from("exam_attempts")
      .select("id, exam_id, attempt_number, status, started_at, submitted_at, score_percent, passed")
      .eq("student_id", studentId)
      .in("exam_id", ids)
      .order("attempt_number", { ascending: true }),
  ]);

  return (exams ?? []).map((e) => ({
    ...e,
    questions: (questions ?? []).filter((q) => q.exam_id === e.id),
    attempts: (attempts ?? []).filter((a) => a.exam_id === e.id),
  }));
}

export type StudentExam = Awaited<ReturnType<typeof getStudentExams>>[number];

/** Wall-clock helper so server components don't call impure Date.now() inline (react-hooks/purity). */
export function currentTimeMs() {
  return Date.now();
}
