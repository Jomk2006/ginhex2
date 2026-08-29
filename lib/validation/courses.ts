import { z } from "zod";

export const courseSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase letters, numbers, and hyphens only"),
  title_en: z.string().min(3).max(150),
  title_ar: z.string().min(3).max(150),
  description_en: z.string().max(4000).optional().or(z.literal("")),
  description_ar: z.string().max(4000).optional().or(z.literal("")),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  category: z.string().max(60).optional().or(z.literal("")),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  status: z.enum(["draft", "published", "archived"]),
  enrollment_mode: z.enum(["open", "application"]),
  exam_requirement: z.enum(["required", "optional", "none"]),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  title_en: z.string().min(2).max(150),
  title_ar: z.string().min(2).max(150),
  order_index: z.coerce.number().int().min(0),
});
export type ModuleInput = z.infer<typeof moduleSchema>;

export const lessonSchema = z.object({
  title_en: z.string().min(2).max(150),
  title_ar: z.string().min(2).max(150),
  youtube_video_id: z.string().min(5).max(30),
  duration_seconds: z.coerce.number().int().min(1),
  order_index: z.coerce.number().int().min(0),
  is_preview: z.coerce.boolean().optional(),
});
export type LessonInput = z.infer<typeof lessonSchema>;
