import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createModuleAction,
  deleteModuleAction,
  createLessonAction,
  deleteLessonAction,
} from "@/actions/courses-admin";
import type { CourseModule, Lesson } from "@/types/domain";

export function ModuleManager({
  courseId,
  modules,
}: {
  courseId: string;
  modules: Array<CourseModule & { lessons: Lesson[] }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {modules.map((module) => (
        <Card key={module.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {module.order_index}. {module.title_en} / {module.title_ar}
            </CardTitle>
            <form action={deleteModuleAction.bind(null, module.id)}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Delete module">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </form>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {module.lessons.length > 0 && (
              <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      {lesson.order_index}. {lesson.title_en} — {lesson.youtube_video_id} (
                      {Math.round(lesson.duration_seconds / 60)}m){lesson.is_preview ? " · preview" : ""}
                    </span>
                    <form action={deleteLessonAction.bind(null, lesson.id)}>
                      <Button type="submit" variant="ghost" size="sm" aria-label="Delete lesson">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <details className="rounded-md border border-dashed border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">+ Add lesson</summary>
              <form
                action={createLessonAction.bind(null, module.id)}
                className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-title-en-${module.id}`}>Title (English)</Label>
                  <Input id={`lesson-title-en-${module.id}`} name="title_en" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-title-ar-${module.id}`}>Title (Arabic)</Label>
                  <Input id={`lesson-title-ar-${module.id}`} name="title_ar" dir="rtl" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-yt-${module.id}`}>YouTube video ID</Label>
                  <Input id={`lesson-yt-${module.id}`} name="youtube_video_id" placeholder="dQw4w9WgXcQ" required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-duration-${module.id}`}>Duration (seconds)</Label>
                  <Input id={`lesson-duration-${module.id}`} name="duration_seconds" type="number" min={1} required />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`lesson-order-${module.id}`}>Order</Label>
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
                  Free preview
                </label>
                <Button type="submit" size="sm" className="w-fit sm:col-span-2">
                  Add lesson
                </Button>
              </form>
            </details>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">+ Add module</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createModuleAction.bind(null, courseId)}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-title-en">Title (English)</Label>
              <Input id="module-title-en" name="title_en" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-title-ar">Title (Arabic)</Label>
              <Input id="module-title-ar" name="title_ar" dir="rtl" required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="module-order">Order</Label>
              <Input id="module-order" name="order_index" type="number" min={0} defaultValue={modules.length} required />
            </div>
            <Button type="submit" size="sm" className="w-fit sm:col-span-3">
              Add module
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
