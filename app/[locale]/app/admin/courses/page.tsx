import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCoursesAdmin } from "@/lib/data/admin";
import { InstructorCourseCard } from "@/components/instructor/instructor-course-card";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  if (profile && profile.role !== "admin") {
    redirect(`/${locale}/app/${profile.role}`);
  }

  const courses = await getAllCoursesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{isAr ? "إدارة الدورات" : "Course management"}</h1>
      <AdminTabs />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isAr ? `${courses.length} دورة على المنصة` : `${courses.length} courses on the platform`}
        </p>
        <Button asChild size="sm">
          <Link href="/app/admin/courses/new">{isAr ? "دورة جديدة" : "New course"}</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لا توجد دورات بعد" : "No courses yet"}</CardTitle>
            <CardDescription>
              {isAr ? "ابدأ بإنشاء أول دورة على المنصة." : "Start by creating the platform's first course."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <InstructorCourseCard key={course.id} course={course} adminHref={`/app/admin/courses/${course.id}/edit`} />
          ))}
        </div>
      )}
    </div>
  );
}
