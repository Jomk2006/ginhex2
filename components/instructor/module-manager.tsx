import { useLocale } from "next-intl";
import { Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MaterialsManager } from "@/components/instructor/materials-manager";
import {
  createModuleAction,
  deleteModuleAction,
  createLessonAction,
  deleteLessonAction,
  moveModuleAction,
  moveLessonAction,
} from "@/actions/courses-admin";
import type { CourseModule, Lesson } from "@/types/domain";

interface LessonWithResources extends Lesson {
  resources: Array<{
    id: string;
    title_en: string;
    title_ar: string;
    type: string;
    file_url: string | null;
    external_url: string | null;
  }>;
}

export function ModuleManager({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Array<CourseModule & { lessons: LessonWithResources[] }>;
}) {
  const isAr = useLocale() === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);
  return (
    <div className="flex flex-col gap-6">
      {modules.map((module, moduleIndex) => (
        <Card key={module.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {module.order_index}. {module.title_en} / {module.title_ar}
            </CardTitle>
            <div className="flex items-center gap-1">
              <form action={moveModuleAction.bind(null, module.id, "up")}>
                <Button type="submit" variant="ghost" size="sm" disabled={moduleIndex === 0} aria-label={t("Move module up", "نقل الوحدة للأعلى")}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </form>
              <form action={moveModuleAction.bind(null, module.id, "down")}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  disabled={moduleIndex === modules.length - 1}
                  aria-label={t("Move module down", "نقل الوحدة للأسفل")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </form>
              <form action={deleteModuleAction.bind(null, module.id)}>
                <Button type="submit" variant="ghost" size="sm" aria-label={t("Delete module", "حذف الوحدة")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {module.lessons.length > 0 && (
              <div className="flex flex-col divide-y divide-border rounded-md border border-border">
                {module.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="flex flex-col gap-3 px-3 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {lesson.order_index}. {isAr ? lesson.title_ar : lesson.title_en} —{" "}
                        {lesson.video_source === "google_drive" ? "Drive" : lesson.youtube_video_id} (
                        {Math.round(lesson.duration_seconds / 60)}
                        {t("m", " د")}){lesson.is_preview ? ` · ${t("preview", "معاينة")}` : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        <form action={moveLessonAction.bind(null, lesson.id, "up")}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={lessonIndex === 0}
                            aria-label={t("Move lesson up", "نقل الدرس للأعلى")}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                        <form action={moveLessonAction.bind(null, lesson.id, "down")}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            disabled={lessonIndex === module.lessons.length - 1}
                            aria-label={t("Move lesson down", "نقل الدرس للأسفل")}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                        <form action={deleteLessonAction.bind(null, lesson.id)}>
                          <Button type="submit" variant="ghost" size="sm" aria-label={t("Delete lesson", "حذف الدرس")}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </div>
                    <details>
                      <summary className="cursor-pointer text-xs text-muted-foreground">{t("Materials", "المواد")} ({lesson.resources.length})</summary>
                      <div className="mt-2">
                        <MaterialsManager courseId={courseId} lessonId={lesson.id} existing={lesson.resources} />
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}

            <details className="rounded-md border border-dashed border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">{t("+ Add lesson", "+ إضافة درس")}</summary>
              <form
                action={createLessonAction.bind(null, module.id)}
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-title-en-${module.id}`}>{t("Title (English)", "العنوان (بالإنجليزية)")}</Label>
                  <Input id={`lesson-title-en-${module.id}`} name="title_en" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-title-ar-${module.id}`}>{t("Title (Arabic)", "العنوان (بالعربية)")}</Label>
                  <Input id={`lesson-title-ar-${module.id}`} name="title_ar" dir="rtl" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-source-${module.id}`}>{t("Video source", "مصدر الفيديو")}</Label>
                  <Select id={`lesson-source-${module.id}`} name="video_source" defaultValue="youtube">
                    <option value="youtube">{t("YouTube", "يوتيوب")}</option>
                    <option value="google_drive">{t("Google Drive", "جوجل درايف")}</option>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-duration-${module.id}`}>{t("Duration (seconds)", "المدة (بالثواني)")}</Label>
                  <Input id={`lesson-duration-${module.id}`} name="duration_seconds" type="number" min={1} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-yt-${module.id}`}>{t("YouTube video ID (if YouTube)", "معرّف فيديو يوتيوب (إن كان المصدر يوتيوب)")}</Label>
                  <Input id={`lesson-yt-${module.id}`} name="youtube_video_id" placeholder="dQw4w9WgXcQ" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-drive-${module.id}`}>{t("Google Drive link (if Drive)", "رابط جوجل درايف (إن كان المصدر درايف)")}</Label>
                  <Input id={`lesson-drive-${module.id}`} name="drive_url" placeholder="https://drive.google.com/file/d/.../view" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-order-${module.id}`}>{t("Order", "الترتيب")}</Label>
                  <Input
                    id={`lesson-order-${module.id}`}
                    name="order_index"
                    type="number"
                    min={0}
                    defaultValue={module.lessons.length}
                    required
                  />
                </div>
                <label className="flex items-center gap-2 self-end text-sm">
                  <input type="checkbox" name="is_preview" className="h-4 w-4" />
                  {t("Free preview", "معاينة مجانية")}
                </label>
                <Button type="submit" size="sm" className="w-fit sm:col-span-2">
                  {t("Add lesson", "إضافة درس")}
                </Button>
              </form>
            </details>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("+ Add module", "+ إضافة وحدة")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createModuleAction.bind(null, courseId)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-title-en">{t("Title (English)", "العنوان (بالإنجليزية)")}</Label>
              <Input id="module-title-en" name="title_en" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-title-ar">{t("Title (Arabic)", "العنوان (بالعربية)")}</Label>
              <Input id="module-title-ar" name="title_ar" dir="rtl" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-order">{t("Order", "الترتيب")}</Label>
              <Input id="module-order" name="order_index" type="number" min={0} defaultValue={modules.length} required />
            </div>
            <Button type="submit" size="sm" className="w-fit sm:col-span-3">
              {t("Add module", "إضافة وحدة")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
