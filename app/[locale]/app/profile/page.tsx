import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/shared/profile-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect(`/${locale}/sign-in`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{isAr ? "الملف الشخصي" : "Profile"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "بيانات حسابك الأساسية." : "Your account's basic information."}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{isAr ? "معلومات الحساب" : "Account info"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant="outline">{profile.role}</Badge>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}
