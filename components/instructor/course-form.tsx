"use client";

import { useActionState, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { CoverImageField } from "@/components/instructor/cover-image-field";
import type { FormActionState } from "@/actions/courses-admin";
import type { Course } from "@/types/domain";

const ERROR_MESSAGES: Record<string, string> = {
  invalidInput: "Please check the highlighted fields.",
  slugTaken: "That URL slug is already in use — pick another.",
  signInRequired: "Your session expired — please sign in again.",
  generic: "Something went wrong. Please try again.",
};

export function CourseForm({
  action,
  course,
  submitLabel,
}: {
  action: (state: FormActionState, formData: FormData) => Promise<FormActionState>;
  course?: Course;
  submitLabel: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [state, formAction, isPending] = useActionState(action, {});
  const [enrollmentMode, setEnrollmentMode] = useState(course?.enrollment_mode ?? "open");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />

      {state.error && <Alert variant="destructive">{ERROR_MESSAGES[state.error] ?? state.error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title_en">Title (English)</Label>
          <Input id="title_en" name="title_en" defaultValue={course?.title_en} required />
          {state.fieldErrors?.title_en && (
            <p className="text-xs text-destructive">{state.fieldErrors.title_en[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title_ar">Title (Arabic)</Label>
          <Input id="title_ar" name="title_ar" dir="rtl" defaultValue={course?.title_ar} required />
          {state.fieldErrors?.title_ar && (
            <p className="text-xs text-destructive">{state.fieldErrors.title_ar[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">URL slug</Label>
        <Input id="slug" name="slug" defaultValue={course?.slug} placeholder="ai-fundamentals" required />
        {state.fieldErrors?.slug && <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description_en">Description (English)</Label>
          <Textarea id="description_en" name="description_en" defaultValue={course?.description_en ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description_ar">Description (Arabic)</Label>
          <Textarea id="description_ar" name="description_ar" dir="rtl" defaultValue={course?.description_ar ?? ""} />
        </div>
      </div>

      <CoverImageField defaultValue={course?.cover_image_url ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={course?.category ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="level">Level</Label>
          <Select id="level" name="level" defaultValue={course?.level ?? ""}>
            <option value="">—</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={course?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrollment_mode">Enrollment</Label>
          <Select
            id="enrollment_mode"
            name="enrollment_mode"
            value={enrollmentMode}
            onChange={(e) => setEnrollmentMode(e.target.value as "open" | "application")}
          >
            <option value="open">Open</option>
            <option value="application">Application-gated</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exam_requirement">Exam</Label>
          <Select id="exam_requirement" name="exam_requirement" defaultValue={course?.exam_requirement ?? "none"}>
            <option value="none">None</option>
            <option value="optional">Optional</option>
            <option value="required">Required</option>
          </Select>
        </div>
      </div>

      {/* Only shown (and only required) when "Application-gated" is actually
          selected -- most courses are open enrollment and should never need
          to see, let alone fill in, an application form ID. */}
      {enrollmentMode === "application" && (
        <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-3">
          <Label htmlFor="application_form_id">
            {isAr ? "معرّف نموذج التقديم" : "Application form ID"}
          </Label>
          <Input
            id="application_form_id"
            name="application_form_id"
            defaultValue={course?.application_form_id ?? ""}
            placeholder="UUID of an existing forms row"
          />
          <p className="text-xs text-muted-foreground">
            {isAr
              ? "لسه مفيش أداة لإنشاء نماذج التقديم من الواجهة — لو مفيش نموذج جاهز، استخدم التسجيل المفتوح بدلاً من ذلك."
              : "There's no form-builder UI yet — if you don't already have a form, use open enrollment instead."}
          </p>
          {state.fieldErrors?.application_form_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.application_form_id[0]}</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
