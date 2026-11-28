import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import { getPublishedCourses, getCourseCategories } from "@/lib/data/courses";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFilters } from "@/components/courses/course-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import type { CourseLevel } from "@/types/domain";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return buildPageMetadata({
    locale,
    path: "/courses",
    title: isAr ? "الدورات | GENHEX" : "Courses | GENHEX",
    description: isAr
      ? "تصفّح الدورات المجانية على GENHEX: دروس مسجّلة وجلسات مباشرة وامتحانات وشهادات يمكن التحقق منها."
      : "Browse free GENHEX courses with recorded and live lessons, exams and verifiable certificates.",
  });
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; level?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const isAr = locale === "ar";

  // Public page: never crash on a data error — log it and show a retry notice.
  const [coursesResult, categories] = await Promise.all([
    getPublishedCourses({
      search: params.search,
      category: params.category,
      level: params.level as CourseLevel | undefined,
    }).catch((err) => {
      console.error("CoursesPage: getPublishedCourses failed", err);
      return null;
    }),
    getCourseCategories().catch((err) => {
      console.error("CoursesPage: getCourseCategories failed", err);
      return [] as string[];
    }),
  ]);

  const loadFailed = coursesResult === null;
  const courses = coursesResult ?? [];

  return (
    <div className="gx-wash">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PageHeader
          className="mb-8"
          eyebrow={isAr ? "مجانًا بالكامل" : "Completely free"}
          title={isAr ? "الدورات" : "Courses"}
          description={
            isAr ? "اختر دورتك، وتعلّم بسرعتك، وابنِ مهارات حقيقية." : "Pick a course, learn at your own pace, and build real skills."
          }
        />

        <div className="mb-8">
          <CourseFilters categories={categories} />
        </div>

        {loadFailed ? (
          <div role="alert">
            <EmptyState
              title={isAr ? "تعذّر تحميل الدورات الآن" : "We couldn't load courses"}
              description={isAr ? "حدّث الصفحة بعد قليل." : "Please refresh in a moment."}
            />
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title={isAr ? "لا توجد دورات مطابقة" : "No courses match"}
            description={isAr ? "جرّب تغيير الفلاتر أو كلمات البحث." : "Try changing the filters or search words."}
          />
        ) : (
          <div className="gx-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
