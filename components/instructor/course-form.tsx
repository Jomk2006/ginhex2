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

const ERROR_MESSAGES: Record<string, { en: string; ar: string }> = {
  invalidInput: { en: "Please check the highlighted fields.", ar: "يرجى مراجعة الحقول المميّزة." },
  slugTaken: { en: "That URL slug is already in use — pick another.", ar: "هذا المعرّف في الرابط مستخدم بالفعل — اختر معرّفًا آخر." },
  signInRequired: { en: "Your session expired — please sign in again.", ar: "انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى." },
  notAllowed: { en: "Only admins and instructors can create courses.", ar: "يمكن للمسؤولين والمدرّبين فقط إنشاء الدورات." },
  generic: { en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },
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
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [state, formAction, isPending] = useActionState(action, {});
  const [enrollmentMode, setEnrollmentMode] = useState(course?.enrollment_mode ?? "open");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="locale" value={locale} />

      {state.error && (
        <Alert variant="destructive">
          {ERROR_MESSAGES[state.error] ? t(ERROR_MESSAGES[state.error].en, ERROR_MESSAGES[state.error].ar) : state.error}
          {state.errorCode ? ` (${t("code", "الرمز")}: ${state.errorCode})` : ""}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title_en">{t("Title (English)", "العنوان (بالإنجليزية)")}</Label>
          <Input id="title_en" name="title_en" defaultValue={course?.title_en} required />
          {state.fieldErrors?.title_en && (
            <p className="text-xs text-destructive">{state.fieldErrors.title_en[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title_ar">{t("Title (Arabic)", "العنوان (بالعربية)")}</Label>
          <Input id="title_ar" name="title_ar" dir="rtl" defaultValue={course?.title_ar} required />
          {state.fieldErrors?.title_ar && (
            <p className="text-xs text-destructive">{state.fieldErrors.title_ar[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">{t("URL slug", "معرّف الرابط")}</Label>
        <Input id="slug" name="slug" defaultValue={course?.slug} placeholder="ai-fundamentals" required />
        {state.fieldErrors?.slug && <p className="text-xs text-destructive">{state.fieldErrors.slug[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description_en">{t("Description (English)", "الوصف (بالإنجليزية)")}</Label>
          <Textarea id="description_en" name="description_en" defaultValue={course?.description_en ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description_ar">{t("Description (Arabic)", "الوصف (بالعربية)")}</Label>
          <Textarea id="description_ar" name="description_ar" dir="rtl" defaultValue={course?.description_ar ?? ""} />
        </div>
      </div>

      <CoverImageField defaultValue={course?.cover_image_url ?? ""} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">{t("Category", "التصنيف")}</Label>
          <Input id="category" name="category" defaultValue={course?.category ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="level">{t("Level", "المستوى")}</Label>
          <Select id="level" name="level" defaultValue={course?.level ?? ""}>
            <option value="">—</option>
            <option value="beginner">{t("Beginner", "مبتدئ")}</option>
            <option value="intermediate">{t("Intermediate", "متوسط")}</option>
            <option value="advanced">{t("Advanced", "متقدم")}</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">{t("Status", "الحالة")}</Label>
          <Select id="status" name="status" defaultValue={course?.status ?? "draft"}>
            <option value="draft">{t("Draft", "مسودة")}</option>
            <option value="published">{t("Published", "منشورة")}</option>
            <option value="archived">{t("Archived", "مؤرشفة")}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="enrollment_mode">{t("Enrollment", "التسجيل")}</Label>
          <Select
            id="enrollment_mode"
            name="enrollment_mode"
            value={enrollmentMode}
            onChange={(e) => setEnrollmentMode(e.target.value as "open" | "application")}
          >
            <option value="open">{t("Open", "مفتوح")}</option>
            <option value="application">{t("Application-gated", "بطلب تقديم")}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exam_requirement">{t("Exam", "الاختبار")}</Label>
          <Select id="exam_requirement" name="exam_requirement" defaultValue={course?.exam_requirement ?? "none"}>
            <option value="none">{t("None", "بدون")}</option>
            <option value="optional">{t("Optional", "اختياري")}</option>
            <option value="required">{t("Required", "إلزامي")}</option>
          </Select>
        </div>
      </div>

      {/* Only shown (and only required) when "Application-gated" is actually
          selected -- most courses are open enrollment and should never need
          to see, let alone fill in, an application form ID. */}
      {enrollmentMode === "application" && (
        <div className="flex flex-col gap-1.5 rounded-md border border-dashed border-border p-3">
          <Label htmlFor="application_form_id">
            {t("Application form ID", "معرّف نموذج التقديم")}
          </Label>
          <Input
            id="application_form_id"
            name="application_form_id"
            defaultValue={course?.application_form_id ?? ""}
            placeholder={t("UUID of an existing forms row", "UUID لنموذج موجود")}
          />
          <p className="text-xs text-muted-foreground">
            {t(
              "There's no form-builder UI yet — if you don't already have a form, use open enrollment instead.",
              "لا توجد أداة لإنشاء نماذج التقديم من الواجهة بعد — إن لم يكن لديك نموذج جاهز، استخدم التسجيل المفتوح بدلًا من ذلك.",
            )}
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
