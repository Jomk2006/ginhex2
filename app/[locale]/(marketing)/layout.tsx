import { cookies } from "next/headers";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { THEME_COOKIE, DEFAULT_THEME } from "@/lib/theme";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav theme={theme} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
