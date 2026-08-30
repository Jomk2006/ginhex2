"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { courseSchema, moduleSchema, lessonSchema } from "@/lib/validation/courses";

export interface FormActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function readCourseFields(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? ""),
    title_en: String(formData.get("title_en") ?? ""),
    title_ar: String(formData.get("title_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    description_ar: String(formData.get("description_ar") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
    category: String(formData.get("category") ?? ""),
    level: (formData.get("level") || undefined) as "beginner" | "intermediate" | "advanced" | undefined,
    status: String(formData.get("status") ?? "draft") as "draft" | "published" | "archived",
    enrollment_mode: String(formData.get("enrollment_mode") ?? "open") as "open" | "application",
    application_form_id: String(formData.get("application_form_id") ?? ""),
    exam_requirement: String(formData.get("exam_requirement") ?? "none") as "required" | "optional" | "none",
  };
}

export async function createCourseAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = courseSchema.safeParse(readCourseFields(formData));
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "signInRequired" };

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      slug: parsed.data.slug,
      title_en: parsed.data.title_en,
      title_ar: parsed.data.title_ar,
      description_en: parsed.data.description_en || null,
      description_ar: parsed.data.description_ar || null,
      cover_image_url: parsed.data.cover_image_url || null,
      category: parsed.data.category || null,
      level: parsed.data.level ?? null,
      status: parsed.data.status,
      enrollment_mode: parsed.data.enrollment_mode,
      application_form_id: parsed.data.application_form_id || null,
      exam_requirement: parsed.data.exam_requirement,
      instructor_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.code === "23505" ? "slugTaken" : "generic" };
  }

  revalidatePath(`/${locale}/app/instructor`);
  redirect(`/${locale}/app/instructor/courses/${course.id}/edit`);
}

export async function updateCourseAction(
  courseId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const locale = String(formData.get("locale") ?? "en");
  const parsed = courseSchema.safeParse(readCourseFields(formData));
  if (!parsed.success) {
    return { error: "invalidInput", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({
      slug: parsed.data.slug,
      title_en: parsed.data.title_en,
      title_ar: parsed.data.title_ar,
      description_en: parsed.data.description_en || null,
      description_ar: parsed.data.description_ar || null,
      cover_image_url: parsed.data.cover_image_url || null,
      category: parsed.data.category || null,
      level: parsed.data.level ?? null,
      status: parsed.data.status,
      enrollment_mode: parsed.data.enrollment_mode,
      application_form_id: parsed.data.application_form_id || null,
      exam_requirement: parsed.data.exam_requirement,
    })
    .eq("id", courseId);

  if (error) {
    return { error: error.code === "23505" ? "slugTaken" : "generic" };
  }

  revalidatePath(`/${locale}/app/instructor/courses/${courseId}/edit`);
  return {};
}

export async function createModuleAction(courseId: string, locale: string, formData: FormData) {
  const parsed = moduleSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    order_index: formData.get("order_index"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("modules").insert({ course_id: courseId, ...parsed.data });
  revalidatePath(`/${locale}/app/instructor/courses/${courseId}/edit`);
}

export async function deleteModuleAction(moduleId: string, courseId: string, locale: string) {
  const supabase = await createClient();
  await supabase.from("modules").delete().eq("id", moduleId);
  revalidatePath(`/${locale}/app/instructor/courses/${courseId}/edit`);
}

export async function createLessonAction(
  moduleId: string,
  courseId: string,
  locale: string,
  formData: FormData
) {
  const parsed = lessonSchema.safeParse({
    title_en: formData.get("title_en"),
    title_ar: formData.get("title_ar"),
    youtube_video_id: formData.get("youtube_video_id"),
    duration_seconds: formData.get("duration_seconds"),
    order_index: formData.get("order_index"),
    is_preview: formData.get("is_preview") === "on",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("lessons").insert({ module_id: moduleId, ...parsed.data });
  revalidatePath(`/${locale}/app/instructor/courses/${courseId}/edit`);
}

export async function deleteLessonAction(lessonId: string, courseId: string, locale: string) {
  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", lessonId);
  revalidatePath(`/${locale}/app/instructor/courses/${courseId}/edit`);
}
