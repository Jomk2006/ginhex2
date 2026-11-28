import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses } from "@/lib/data/instructor";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function InstructorCoursesPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "instructor") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const courses = await getInstructorCourses(user.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={isAr ? "دوراتك" : "Your courses"}
        actions={
          <Button asChild size="sm">
            <Link href="/app/instructor/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          title={isAr ? "انشر أول دورة لك" : "Publish your first course"}
          description={isAr ? "أضف الوحدات والدروس، وانشر حين تكون جاهزًا." : "Add modules and lessons, then publish when you're ready."}
        />
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
