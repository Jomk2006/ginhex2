import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourseById } from "@/lib/data/instructor";
import { CourseForm } from "@/components/instructor/course-form";
import { ModuleManager } from "@/components/instructor/module-manager";
import { updateCourseAction } from "@/actions/courses-admin";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "instructor") {
    redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);
  }

  // RLS already scopes this to courses the instructor owns/co-teaches —
  // a null result here means either it doesn't exist or isn't theirs,
  // and both cases should read as 404, not a permissions error.
  const result = await getInstructorCourseById(id);
  if (!result) notFound();
  const { course, modules } = result;

  const boundUpdateAction = updateCourseAction.bind(null, course.id);

  const isAr = locale === "ar";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isAr ? course.title_ar : course.title_en}</h1>
        <Link
          href={`/app/instructor/courses/${course.id}/exams`}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          {isAr ? "الامتحانات" : "Exams"}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "بيانات الدورة" : "Course details"}</CardTitle>
          <CardDescription>{isAr ? "أي تعديل هنا خاص بالدورة كاملة." : "Changes here apply to the course as a whole."}</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm action={boundUpdateAction} course={course} submitLabel={isAr ? "حفظ التعديلات" : "Save changes"} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-medium">{isAr ? "الوحدات والدروس" : "Modules & lessons"}</h2>
        <ModuleManager courseId={course.id} modules={modules} />
      </div>
    </div>
  );
}
