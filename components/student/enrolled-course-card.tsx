import { getLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { CourseThumbnail } from "@/components/courses/course-thumbnail";

interface EnrolledCourseCardProps {
  courseSlug: string;
  titleEn: string;
  titleAr: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

export async function EnrolledCourseCard({
  courseSlug,
  titleEn,
  titleAr,
  progressPercent,
  completedLessons,
  totalLessons,
}: EnrolledCourseCardProps) {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const done = progressPercent >= 100;

  return (
    <Card className="flex h-full flex-col overflow-hidden" interactive>
      <div className="relative h-24 w-full">
        <CourseThumbnail src={null} alt="" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <ProgressRing value={progressPercent} size={56} stroke={5} />
          <div className="min-w-0 flex-1">
            <CardTitle className="line-clamp-2 text-lg">{isAr ? titleAr : titleEn}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              <span dir="ltr" className="tabular-nums">
                {completedLessons}/{totalLessons}
              </span>{" "}
              {isAr ? "دروس مكتملة" : "lessons complete"}
            </p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
        <Button asChild size="sm" variant={done ? "outline" : "default"} className="group mt-auto w-fit">
          <Link href={`/app/student/courses/${courseSlug}/learn`}>
            {done ? (isAr ? "مراجعة" : "Review") : isAr ? "متابعة التعلّم" : "Continue learning"}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
