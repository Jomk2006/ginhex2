import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Defense in depth: middleware already blocks non-students from this
  // segment, but every server render re-checks — RLS is still the real
  // boundary on every query above and below this page.
  if (profile && profile.role !== "student") {
    redirect(`/${locale}/app/${profile.role}`);
  }

  const t = await getTranslations("dashboard");
  const name = locale === "ar" ? profile?.full_name_ar : profile?.full_name_en;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("welcome", { name: name ?? user.email ?? "" })}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Student dashboard</CardTitle>
          <CardDescription>{t("studentOverview")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
