import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses, getInstructorStudentCount } from "@/lib/data/instructor";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { BookOpen, FileEdit, Globe2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Link } from "@/i18n/navigation";

export default async function InstructorDashboardPage() {
  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "instructor") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const t = await getTranslations("dashboard");
  const isAr = locale === "ar";
  const name = isAr ? profile?.full_name_ar : profile?.full_name_en;

  const courses = await getInstructorCourses(user.id);
  const published = courses.filter((c) => c.status === "published").length;
  const draft = courses.filter((c) => c.status === "draft").length;
  const studentCount = await getInstructorStudentCount(user.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("welcome", { name: name ?? user.email ?? "" })} description={t("instructorOverview")} />

      <div className="gx-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={BookOpen} label={isAr ? "إجمالي الدورات" : "Total courses"} value={courses.length} />
        <StatTile icon={Globe2} label={isAr ? "منشورة" : "Published"} value={published} />
        <StatTile icon={FileEdit} label={isAr ? "مسودة" : "Draft"} value={draft} />
        <StatTile icon={Users} label={isAr ? "عدد الطلاب" : "Students"} value={studentCount} />
      </div>

      <SectionHeader
        title={isAr ? "دوراتك" : "Your courses"}
        action={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/app/instructor/attendance">{isAr ? "الحضور" : "Attendance"}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/app/instructor/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
            </Button>
          </div>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          title={isAr ? "انشر أول دورة لك" : "Publish your first course"}
          description={isAr ? "أضف الوحدات والدروس، وانشر حين تكون جاهزًا." : "Add modules and lessons, then publish when you're ready."}
        >
          <Button asChild>
            <Link href="/app/instructor/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="gx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <InstructorCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
