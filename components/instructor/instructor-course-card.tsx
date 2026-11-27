import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";
import type { Course } from "@/types/domain";

const STATUS_VARIANT: Record<Course["status"], "default" | "outline" | "muted"> = {
  published: "default",
  draft: "outline",
  archived: "muted",
};

const STATUS_LABEL = {
  published: { en: "Published", ar: "منشورة" },
  draft: { en: "Draft", ar: "مسودة" },
  archived: { en: "Archived", ar: "مؤرشفة" },
} as const;
const EXAM_LABEL = {
  required: { en: "required", ar: "مطلوب" },
  optional: { en: "optional", ar: "اختياري" },
  none: { en: "none", ar: "لا يوجد" },
} as const;

export function InstructorCourseCard({ course, adminHref }: { course: Course; adminHref?: string }) {
  const isAr = useLocale() === "ar";
  const l = isAr ? "ar" : "en";
  return (
    <Link href={adminHref ?? `/app/instructor/courses/${course.id}/edit`} className="block h-full rounded-xl">
      <Card className="h-full overflow-hidden">
        <div className="relative h-24 w-full">
          <CourseThumbnail src={course.cover_image_url} alt="" />
        </div>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <CardTitle className="text-lg">{isAr ? course.title_ar : course.title_en}</CardTitle>
          <Badge variant={STATUS_VARIANT[course.status]}>{STATUS_LABEL[course.status][l]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span>{isAr ? course.title_en : course.title_ar}</span>
          <span>
            {course.enrollment_mode === "open"
              ? isAr ? "تسجيل مفتوح" : "Open enrollment"
              : isAr ? "بالتقديم" : "Application-gated"}
            {" · "}
            {isAr ? "الامتحان: " : "Exam: "}
            {EXAM_LABEL[course.exam_requirement][l]}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
