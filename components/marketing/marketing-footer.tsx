import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";

export async function MarketingFooter() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <Logo height={22} />
        <nav className="flex items-center gap-6">
          <Link href="/courses" className="hover:text-foreground">
            {isAr ? "الدورات" : "Courses"}
          </Link>
          <Link href="/sign-in" className="hover:text-foreground">
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </nav>
        <p>© {new Date().getFullYear()} GENHEX</p>
      </div>
    </footer>
  );
}
