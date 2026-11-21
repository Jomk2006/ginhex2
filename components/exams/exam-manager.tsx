"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  createExamAction,
  addQuestionAction,
  deleteQuestionAction,
  setExamStatusAction,
  deleteExamAction,
  type ExamActionState,
} from "@/actions/exams";
import type { ManagerExam } from "@/lib/data/exams";

const initial: ExamActionState = {};

function errorText(state: ExamActionState, isAr: boolean) {
  if (!state.error) return null;
  const map: Record<string, [string, string]> = {
    invalidInput: ["Please check the highlighted fields.", "راجع الحقول المظلّلة."],
    notAllowed: ["You can't manage this course's exams.", "لا تملك صلاحية إدارة امتحانات هذه الدورة."],
    signInRequired: ["Your session expired — sign in again.", "انتهت الجلسة — سجّل الدخول مرة أخرى."],
    needOptions: ["Add at least two options and pick the correct one.", "أضف خيارين على الأقل واختر الإجابة الصحيحة."],
    generic: ["Something went wrong. Please try again.", "حدث خطأ. حاول مرة أخرى."],
  };
  const [en, ar] = map[state.error] ?? map.generic;
  const code = state.fieldErrors?._code?.[0];
  return `${isAr ? ar : en}${code ? ` (code: ${code})` : ""}`;
}

function NewExamForm({ courseId, isAr }: { courseId: string; isAr: boolean }) {
  const [state, action, pending] = useActionState(createExamAction.bind(null, courseId), initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <Alert variant="destructive">{errorText(state, isAr)}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_title_en">Title (English)</Label>
        <Input id="e_title_en" name="title_en" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_title_ar">العنوان (عربي)</Label>
        <Input id="e_title_ar" name="title_ar" dir="rtl" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_dur">{isAr ? "المدة (دقائق)" : "Duration (minutes)"}</Label>
        <Input id="e_dur" name="duration_minutes" type="number" min={1} defaultValue={30} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_pass">{isAr ? "درجة النجاح %" : "Passing score %"}</Label>
        <Input id="e_pass" name="passing_score_percent" type="number" min={0} max={100} defaultValue={60} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_att">{isAr ? "الحد الأدنى للحضور %" : "Minimum attendance %"}</Label>
        <Input id="e_att" name="attendance_requirement_percent" type="number" min={0} max={100} defaultValue={0} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="e_max">{isAr ? "عدد المحاولات" : "Max attempts"}</Label>
        <Input id="e_max" name="max_attempts" type="number" min={1} max={20} defaultValue={1} required />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="counts_toward_certification" defaultChecked />
        {isAr ? "يُحتسب في الشهادة" : "Counts toward the certificate"}
      </label>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? (isAr ? "جارٍ الإنشاء…" : "Creating…") : isAr ? "إنشاء امتحان" : "Create exam"}
        </Button>
      </div>
    </form>
  );
}

function NewQuestionForm({ examId, isAr }: { examId: string; isAr: boolean }) {
  const [state, action, pending] = useActionState(addQuestionAction.bind(null, examId), initial);
  const [type, setType] = useState<"mcq" | "true_false">("mcq");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid grid-cols-1 gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2">
          <Alert variant="destructive">{errorText(state, isAr)}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label>{isAr ? "نوع السؤال" : "Question type"}</Label>
        <Select name="type" value={type} onChange={(e) => setType(e.target.value as "mcq" | "true_false")}>
          <option value="mcq">{isAr ? "اختيار من متعدد" : "Multiple choice"}</option>
          <option value="true_false">{isAr ? "صح / خطأ" : "True / False"}</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{isAr ? "الدرجة" : "Points"}</Label>
        <Input name="points" type="number" min={0.5} step={0.5} defaultValue={1} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Question (English)</Label>
        <Input name="prompt_en" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>السؤال (عربي)</Label>
        <Input name="prompt_ar" dir="rtl" required />
      </div>

      {type === "mcq" ? (
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">
            {isAr ? "الخيارات — اختر الإجابة الصحيحة" : "Options — mark the correct one"}
          </legend>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct_index" value={i} defaultChecked={i === 1} aria-label={`Correct option ${i}`} />
              <Input name={`option_${i}`} placeholder={`${isAr ? "خيار" : "Option"} ${i}`} />
            </div>
          ))}
        </fieldset>
      ) : (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>{isAr ? "الإجابة الصحيحة" : "Correct answer"}</Label>
          <Select name="correct_tf" defaultValue="true">
            <option value="true">{isAr ? "صح" : "True"}</option>
            <option value="false">{isAr ? "خطأ" : "False"}</option>
          </Select>
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {isAr ? "إضافة السؤال" : "Add question"}
        </Button>
      </div>
    </form>
  );
}

export function ExamManager({ courseId, exams, isAr }: { courseId: string; exams: ManagerExam[]; isAr: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "امتحان جديد" : "New exam"}</CardTitle>
          <CardDescription>
            {isAr
              ? "أنشئ الامتحان كمسودة، أضف الأسئلة، ثم انشره للطلاب."
              : "Create the exam as a draft, add questions, then publish it to students."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewExamForm courseId={courseId} isAr={isAr} />
        </CardContent>
      </Card>

      {exams.length === 0 && (
        <p className="text-sm text-muted-foreground">{isAr ? "لا توجد امتحانات بعد." : "No exams yet."}</p>
      )}

      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{isAr ? exam.title_ar : exam.title_en}</CardTitle>
              <Badge>{exam.status}</Badge>
            </div>
            <CardDescription>
              {isAr
                ? `${exam.duration_minutes} دقيقة · النجاح ${exam.passing_score_percent}% · حضور ${exam.attendance_requirement_percent}% · ${exam.max_attempts} محاولة`
                : `${exam.duration_minutes} min · pass ${exam.passing_score_percent}% · attendance ${exam.attendance_requirement_percent}% · ${exam.max_attempts} attempt(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ol className="flex flex-col gap-2">
              {exam.questions.map((q, i) => (
                <li key={q.id} className="flex items-start justify-between gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{i + 1}. </span>
                    {isAr ? q.prompt_ar : q.prompt_en}
                    <span className="ms-2 text-xs text-muted-foreground">
                      ({q.points} {isAr ? "درجة" : "pts"} · {isAr ? "الصحيح" : "answer"}: {q.correct_answer})
                    </span>
                  </span>
                  <form action={deleteQuestionAction.bind(null, q.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {isAr ? "حذف" : "Delete"}
                    </Button>
                  </form>
                </li>
              ))}
            </ol>

            {exam.status !== "published" && <NewQuestionForm examId={exam.id} isAr={isAr} />}

            <div className="flex flex-wrap gap-2">
              {exam.status !== "published" ? (
                <form action={setExamStatusAction.bind(null, exam.id, "published")}>
                  <Button type="submit" size="sm" disabled={exam.questions.length === 0}>
                    {isAr ? "نشر للطلاب" : "Publish to students"}
                  </Button>
                </form>
              ) : (
                <form action={setExamStatusAction.bind(null, exam.id, "closed")}>
                  <Button type="submit" size="sm" variant="outline">
                    {isAr ? "إغلاق الامتحان" : "Close exam"}
                  </Button>
                </form>
              )}
              <form action={deleteExamAction.bind(null, exam.id)}>
                <Button type="submit" size="sm" variant="destructive">
                  {isAr ? "حذف الامتحان" : "Delete exam"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
