import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/domain";

const STATUS_VARIANT: Record<Course["status"], "default" | "outline" | "muted"> = {
  published: "default",
  draft: "outline",
  archived: "muted",
};

export function InstructorCourseCard({ course, adminHref }: { course: Course; adminHref?: string }) {
  return (
    <Link href={adminHref ?? `/app/instructor/courses/${course.id}/edit`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <CardTitle className="text-lg">{course.title_en}</CardTitle>
          <Badge variant={STATUS_VARIANT[course.status]}>{course.status}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span>{course.title_ar}</span>
          <span>
            {course.enrollment_mode === "open" ? "Open enrollment" : "Application-gated"} · Exam:{" "}
            {course.exam_requirement}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
