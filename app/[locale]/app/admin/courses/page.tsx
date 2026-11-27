import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCoursesAdmin } from "@/lib/data/admin";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function AdminCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  const courses = await getAllCoursesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={isAr ? "إدارة الدورات" : "Course management"} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isAr ? `${courses.length} دورة على المنصة` : `${courses.length} courses on the platform`}
        </p>
        <Button asChild size="sm">
          <Link href="/app/admin/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title={isAr ? "لا توجد دورات بعد" : "No courses yet"}
          description={isAr ? "أنشئ أول دورة لتنطلق المنصة." : "Create the first course to get the platform going."}
        />
      ) : (
        <div className="gx-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <InstructorCourseCard key={course.id} course={course} adminHref={`/app/admin/courses/${course.id}/edit`} />
          ))}
        </div>
      )}
    </div>
  );
}
