import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, DEFAULT_THEME } from "@/lib/theme";
import { signOutAction } from "@/actions/auth";
import { ROLE_HOME_PATH } from "@/types/domain";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensive — middleware already gates unauthenticated access to /app/*.
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;
  const t = await getTranslations("nav");
  const tRoles = await getTranslations("roles");

  const role = profile?.role ?? "student";
  const displayName = locale === "ar" ? profile?.full_name_ar : profile?.full_name_en;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={ROLE_HOME_PATH[role]}>
            <Logo />
          </Link>

          <nav className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {displayName ?? user.email} · {tRoles(role)}
            </span>
            <LocaleSwitcher />
            <ThemeToggle current={theme} />
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
