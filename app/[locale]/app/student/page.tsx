import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentEnrollments } from "@/lib/data/enrollments";
import { EnrolledCourseCard } from "@/components/student/enrolled-course-card";
import { BookOpen, CheckCircle2, ListChecks, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Link } from "@/i18n/navigation";

export default async function StudentDashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "student") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";
  const name = isAr ? profile?.full_name_ar : profile?.full_name_en;

  const enrollments = await getStudentEnrollments(user.id);
  const inProgress = enrollments.filter((e) => e.progressPercent < 100);
  const completed = enrollments.filter((e) => e.progressPercent >= 100);

  const lessonsDone = enrollments.reduce((n, e) => n + e.completedLessons, 0);
  const lessonsTotal = enrollments.reduce((n, e) => n + e.totalLessons, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("welcome", { name: name ?? user.email ?? "" })}
        description={t("studentOverview")}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/app/student/attendance">{isAr ? "الحضور" : "Attendance"}</Link>
          </Button>
        }
      />

      {enrollments.length > 0 && (
        <div className="gx-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile icon={BookOpen} label={isAr ? "الدورات المسجّل بها" : "Enrolled"} value={enrollments.length} />
          <StatTile icon={PlayCircle} label={isAr ? "قيد التعلّم" : "In progress"} value={inProgress.length} />
          <StatTile icon={CheckCircle2} label={isAr ? "مكتملة" : "Completed"} value={completed.length} />
          <StatTile
            icon={ListChecks}
            label={isAr ? "الدروس المنجزة" : "Lessons done"}
            value={<span dir="ltr">{lessonsDone}/{lessonsTotal}</span>}
          />
        </div>
      )}

      {enrollments.length === 0 ? (
        <EmptyState
          title={isAr ? "أول دورة لك في انتظارك" : "Your first course is waiting"}
          description={isAr ? "تصفّح الدورات وسجّل مجانًا وابدأ أول درس." : "Browse the catalog, enroll for free, and start your first lesson."}
        >
          <Button asChild>
            <Link href="/courses">{isAr ? "استعرض الدورات" : "Browse courses"}</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader title={isAr ? "متابعة التعلّم" : "Continue learning"} />
              <div className="gx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map(({ enrollment, progressPercent, completedLessons, totalLessons }) => {
                  const course = (enrollment as unknown as { courses: { slug: string; title_en: string; title_ar: string } }).courses;
                  return (
                    <EnrolledCourseCard
                      key={enrollment.id}
                      courseSlug={course.slug}
                      titleEn={course.title_en}
                      titleAr={course.title_ar}
                      progressPercent={progressPercent}
                      completedLessons={completedLessons}
                      totalLessons={totalLessons}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="flex flex-col gap-4">
              <SectionHeader title={isAr ? "الدورات المكتملة" : "Completed courses"} />
              <div className="gx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map(({ enrollment, progressPercent, completedLessons, totalLessons }) => {
                  const course = (enrollment as unknown as { courses: { slug: string; title_en: string; title_ar: string } }).courses;
                  return (
                    <EnrolledCourseCard
                      key={enrollment.id}
                      courseSlug={course.slug}
                      titleEn={course.title_en}
                      titleAr={course.title_ar}
                      progressPercent={progressPercent}
                      completedLessons={completedLessons}
                      totalLessons={totalLessons}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
