import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME_PATH } from "@/types/domain";

// Resolves the signed-in user's role from public.profiles (source of truth)
// and sends them to the right dashboard.
export default async function AppIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  redirect(`/${locale}${ROLE_HOME_PATH[data?.role ?? "student"]}`);
}
