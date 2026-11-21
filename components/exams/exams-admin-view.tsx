import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourseById } from "@/lib/data/instructor";
import { getCourseExamsForManager } from "@/lib/data/exams";
import { ExamManager } from "@/components/exams/exam-manager";
import { Link } from "@/i18n/navigation";

/** Shared server view for /app/admin|instructor/courses/[id]/exams. Fail-closed role + ownership checks. */
export async function ExamsAdminView({
  courseId,
  locale,
  role,
}: {
  courseId: string;
  locale: string;
  role: "admin" | "instructor";
}) {
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== role) {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  // RLS-scoped read: an instructor only sees courses they teach.
  const result = await getInstructorCourseById(courseId);
  if (!result) notFound();

  const exams = await getCourseExamsForManager(courseId);
  const base = `/app/${role}/courses/${courseId}/edit`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href={base} className="text-sm text-primary hover:underline">
          {isAr ? "← العودة إلى الدورة" : "← Back to course"}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {isAr ? "امتحانات: " : "Exams: "}
          {isAr ? result.course.title_ar : result.course.title_en}
        </h1>
      </div>
      <ExamManager courseId={courseId} exams={exams} isAr={isAr} />
    </div>
  );
}
