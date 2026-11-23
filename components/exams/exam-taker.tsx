"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { startAttemptAction, submitAttemptAction } from "@/actions/exams";
import type { StudentExam } from "@/lib/data/exams";

const START_ERRORS: Record<string, [string, string]> = {
  notAvailable: ["This exam isn't open at the moment.", "هذا الامتحان غير متاح حاليًا."],
  notEnrolled: ["You must be enrolled in this course.", "يجب أن تكون مسجّلًا في هذه الدورة."],
  noAttemptsLeft: ["You've used all your attempts.", "استنفدت كل محاولاتك."],
  attendanceTooLow: ["Your attendance is below the required minimum.", "نسبة حضورك أقل من الحد المطلوب."],
  signInRequired: ["Please sign in again.", "سجّل الدخول مرة أخرى."],
  generic: ["Something went wrong. Please try again.", "حدث خطأ. حاول مرة أخرى."],
};

export function StartExamButton({ examId, locale, disabled }: { examId: string; locale: string; disabled?: boolean }) {
  const isAr = locale === "ar";
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      {error && <Alert variant="destructive">{(START_ERRORS[error] ?? START_ERRORS.generic)[isAr ? 1 : 0]}</Alert>}
      <Button
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            const res = await startAttemptAction(examId, locale);
            if (res?.error) setError(res.error); // success redirects server-side
          })
        }
      >
        {pending ? (isAr ? "جارٍ البدء…" : "Starting…") : isAr ? "ابدأ الامتحان" : "Start exam"}
      </Button>
    </div>
  );
}

export function ExamTaker({
  exam,
  attemptId,
  startedAt,
  isAr,
}: {
  exam: StudentExam;
  attemptId: string;
  startedAt: string;
  isAr: boolean;
}) {
  const router = useRouter();
  const deadline = new Date(startedAt).getTime() + exam.duration_minutes * 60_000;
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submitted = useRef(false);

  const submit = () => {
    if (submitted.current) return;
    submitted.current = true;
    startTransition(async () => {
      const res = await submitAttemptAction(attemptId, answers);
      if (res.error && res.error !== "alreadySubmitted") {
        submitted.current = false;
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  // Keep a stable ref to the latest submit so the timer can auto-submit at 0.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
        submitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-24 z-10 flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {answered}/{exam.questions.length} {isAr ? "تمت الإجابة" : "answered"}
        </span>
        <span className={`font-mono text-lg font-semibold ${secondsLeft < 60 ? "text-destructive" : ""}`} aria-live="off">
          {mm}:{ss}
        </span>
      </div>

      {error && <Alert variant="destructive">{isAr ? "لم يصل تسليمك. حاول مرة أخرى." : "Your answers didn't go through. Try submitting again."}</Alert>}

      {exam.questions.map((q, i) => {
        const choices = q.type === "true_false" ? ["true", "false"] : (q.options ?? []);
        const label = (c: string) => (q.type === "true_false" ? (c === "true" ? (isAr ? "صح" : "True") : isAr ? "خطأ" : "False") : c);
        return (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {i + 1}. {isAr ? q.prompt_ar : q.prompt_en}
              </CardTitle>
              <CardDescription>
                {q.points} {isAr ? "درجة" : "pts"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">{isAr ? q.prompt_ar : q.prompt_en}</legend>
                {choices.map((c) => (
                  <label key={c} className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">
                    <input
                      type="radio"
                      name={q.id}
                      value={c}
                      checked={answers[q.id] === c}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: c }))}
                    />
                    {label(c)}
                  </label>
                ))}
              </fieldset>
            </CardContent>
          </Card>
        );
      })}

      <Button size="lg" onClick={submit} disabled={pending}>
        {pending ? (isAr ? "جارٍ التسليم…" : "Submitting…") : isAr ? "سلّم الإجابات" : "Submit answers"}
      </Button>
    </div>
  );
}
