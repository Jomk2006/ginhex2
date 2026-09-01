import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionById, getSessionRoster } from "@/lib/data/attendance";
import { AttendanceRoster } from "@/components/attendance/attendance-roster";
import { AdminTabs } from "@/components/admin/admin-tabs";

export default async function AdminSessionRosterPage({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string; locale: string }>;
}) {
  const { courseId, sessionId, locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile && profile.role !== "admin") {
    redirect(`/${locale}/app/${profile.role}`);
  }

  const session = await getSessionById(sessionId);
  if (!session || session.course_id !== courseId) notFound();

  const roster = await getSessionRoster(sessionId, courseId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{session.title}</h1>
        <p className="text-muted-foreground">
          {new Date(session.session_date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
        </p>
      </div>
      <AdminTabs />
      <AttendanceRoster sessionId={sessionId} roster={roster} />
    </div>
  );
}
