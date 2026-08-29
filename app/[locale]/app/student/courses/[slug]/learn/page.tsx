import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCourseCurriculum, getEnrollmentProgressMap } from "@/lib/data/learn";
import { CoursePlayer } from "@/components/learn/course-player";

export default async function CourseLearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: course } = await supabase.from("courses").select("id").eq("slug", slug).maybeSingle();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  // Not enrolled — RLS would block the curriculum/progress queries below
  // anyway, but redirect to the course page for a clean UX instead of an
  // empty/broken player.
  if (!enrollment) {
    redirect(`/${locale}/courses/${slug}`);
  }

  const [modules, progressMap] = await Promise.all([
    getCourseCurriculum(course.id),
    getEnrollmentProgressMap(enrollment.id),
  ]);

  const playerModules = modules.map((m) => ({
    id: m.id,
    title_en: m.title_en,
    title_ar: m.title_ar,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title_en: l.title_en,
      title_ar: l.title_ar,
      youtube_video_id: l.youtube_video_id,
      duration_seconds: l.duration_seconds,
      watchedSeconds: progressMap.get(l.id)?.watched_seconds ?? 0,
      isCompleted: progressMap.get(l.id)?.is_completed ?? false,
    })),
  }));

  const firstIncomplete = playerModules.flatMap((m) => m.lessons).find((l) => !l.isCompleted);
  const initialLessonId = firstIncomplete?.id ?? playerModules[0]?.lessons[0]?.id ?? "";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <CoursePlayer
        enrollmentId={enrollment.id}
        courseSlug={slug}
        modules={playerModules}
        initialLessonId={initialLessonId}
      />
    </div>
  );
}
