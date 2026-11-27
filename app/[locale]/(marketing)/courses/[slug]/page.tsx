import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildPageMetadata, LOCALE_META } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { getCourseBySlug } from "@/lib/data/courses";
import { getEnrollment } from "@/lib/data/enrollments";
import { createClient } from "@/lib/supabase/server";
import { CurriculumOverview } from "@/components/courses/curriculum-overview";
import { EnrollmentButton } from "@/components/courses/enrollment-button";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { COURSE_LEVEL_LABELS } from "@/types/domain";
import type { CourseLevel } from "@/types/domain";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const result = await getCourseBySlug(slug).catch(() => null);
  if (!result) return { robots: { index: false } };
  const { course } = result;
  const title = isAr ? course.title_ar : course.title_en;
  const description = (isAr ? course.description_ar : course.description_en) || LOCALE_META[isAr ? "ar" : "en"].description;
  return buildPageMetadata({
    locale,
    path: `/courses/${encodeURIComponent(slug)}`,
    title: `${title} | GENHEX`,
    description: description.slice(0, 200),
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const result = await getCourseBySlug(slug).catch((err) => {
    console.error("CoursePage: getCourseBySlug failed", err);
    return null;
  });
  if (!result) notFound();
  const { course, instructor, modules } = result;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const enrollment = user ? await getEnrollment(user.id, course.id) : null;

  const title = isAr ? course.title_ar : course.title_en;
  const description = isAr ? course.description_ar : course.description_en;
  const instructorName = instructor ? (isAr ? instructor.full_name_ar : instructor.full_name_en) : null;

  return (
    <div className="bg-ambient">
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="gx-enter grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {course.category && <Badge variant="muted">{course.category}</Badge>}
              {course.level && (
                <Badge variant="outline">{COURSE_LEVEL_LABELS[course.level as CourseLevel][isAr ? "ar" : "en"]}</Badge>
              )}
            </div>
            <h1 className="gx-ph text-3xl sm:text-4xl">{title}</h1>
            <span className="gx-rule" aria-hidden="true" />
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
            {instructorName && (
              <p className="mt-4 text-sm text-muted-foreground">
                {isAr ? "المدرّب" : "Instructor"}: <span className="text-foreground">{instructorName}</span>
              </p>
            )}
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-md ring-1 ring-border">
            <CourseThumbnail src={course.cover_image_url} alt={title} />
          </div>

          <CurriculumOverview modules={modules} isEnrolled={!!enrollment} />
        </div>

        <div className="lg:col-span-1">
          <Card variant="glass" className="sticky top-28 p-6">
            <EnrollmentButton
              course={course}
              isSignedIn={!!user}
              isEnrolled={!!enrollment}
            />
            <dl className="mt-6 flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{isAr ? "التسجيل" : "Enrollment"}</dt>
                <dd>{course.enrollment_mode === "open" ? (isAr ? "مفتوح" : "Open") : (isAr ? "بالتقديم" : "By application")}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{isAr ? "الاختبار" : "Exam"}</dt>
                <dd>
                  {course.exam_requirement === "required"
                    ? (isAr ? "مطلوب" : "Required")
                    : course.exam_requirement === "optional"
                      ? (isAr ? "اختياري" : "Optional")
                      : (isAr ? "لا يوجد" : "None")}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <dt className="text-muted-foreground">{isAr ? "الدروس" : "Lessons"}</dt>
                <dd>{modules.reduce((sum, m) => sum + m.lessons.length, 0)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
