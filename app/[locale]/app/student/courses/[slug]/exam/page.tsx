import { notFound, redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentExams, currentTimeMs } from "@/lib/data/exams";
import { getStudentAttendancePercent } from "@/lib/data/attendance";
import { ExamTaker, StartExamButton } from "@/components/exams/exam-taker";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function StudentExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in?redirect_to=/${locale}/app/student/courses/${slug}/exam`);

  const { data: course } = await supabase.from("courses").select("id, title_en, title_ar").eq("slug", slug).maybeSingle();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!enrollment) redirect(`/${locale}/courses/${slug}`);

  const [exams, attendance] = await Promise.all([
    getStudentExams(user.id, course.id),
    getStudentAttendancePercent(user.id, course.id),
  ]);
  const attendancePct = attendance ?? 0;
  const now = currentTimeMs();

  // An unexpired in-progress attempt takes over the whole page.
  for (const exam of exams) {
    const live = exam.attempts.find(
      (a) => a.status === "in_progress" && new Date(a.started_at).getTime() + exam.duration_minutes * 60_000 + 30_000 > now
    );
    if (live) {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <h1 className="text-2xl font-semibold">{isAr ? exam.title_ar : exam.title_en}</h1>
          <ExamTaker exam={exam} attemptId={live.id} startedAt={live.started_at} isAr={isAr} />
        </div>
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link href={`/app/student/courses/${slug}/learn`} className="text-sm text-primary hover:underline">
          {isAr ? "← العودة إلى الدورة" : "← Back to course"}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {isAr ? "امتحانات: " : "Exams: "}
          {isAr ? course.title_ar : course.title_en}
        </h1>
      </div>

      {exams.length === 0 && (
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد امتحانات منشورة لهذه الدورة بعد." : "No exams are published for this course yet."}</p>
      )}

      {exams.map((exam) => {
        const finished = exam.attempts.filter((a) => a.status === "graded");
        const best = finished.reduce<number | null>((m, a) => (a.score_percent != null && (m == null || a.score_percent > m) ? Number(a.score_percent) : m), null);
        const passed = finished.some((a) => a.passed);
        const attendanceOk = attendancePct >= Number(exam.attendance_requirement_percent);
        const attemptsLeft = exam.max_attempts - exam.attempts.length;
        const open =
          (!exam.available_from || new Date(exam.available_from).getTime() <= now) &&
          (!exam.available_to || new Date(exam.available_to).getTime() >= now);

        return (
          <Card key={exam.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{isAr ? exam.title_ar : exam.title_en}</CardTitle>
                {passed && <Badge>{isAr ? "ناجح" : "Passed"}</Badge>}
              </div>
              <CardDescription>
                {isAr
                  ? `${exam.duration_minutes} دقيقة · ${exam.questions.length} سؤال · النجاح ${exam.passing_score_percent}% · متبقي ${Math.max(0, attemptsLeft)} محاولة`
                  : `${exam.duration_minutes} min · ${exam.questions.length} questions · pass ${exam.passing_score_percent}% · ${Math.max(0, attemptsLeft)} attempt(s) left`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {finished.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {finished.map((a) => (
                    <li key={a.id}>
                      {isAr ? `المحاولة ${a.attempt_number}: ` : `Attempt ${a.attempt_number}: `}
                      <strong>{a.score_percent}%</strong> — {a.passed ? (isAr ? "نجاح" : "passed") : isAr ? "لم ينجح" : "not passed"}
                    </li>
                  ))}
                  {best != null && (
                    <li className="text-muted-foreground">
                      {isAr ? "أعلى درجة: " : "Best score: "}
                      {best}%
                    </li>
                  )}
                </ul>
              )}
              {!attendanceOk && (
                <p className="text-destructive">
                  {isAr
                    ? `حضورك ${Math.round(attendancePct)}% والمطلوب ${exam.attendance_requirement_percent}%.`
                    : `Your attendance is ${Math.round(attendancePct)}% — ${exam.attendance_requirement_percent}% is required.`}
                </p>
              )}
              {!open && <p className="text-muted-foreground">{isAr ? "الامتحان غير متاح في هذا الوقت." : "This exam isn't open right now."}</p>}
              <StartExamButton examId={exam.id} locale={locale} disabled={!attendanceOk || !open || attemptsLeft <= 0} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
