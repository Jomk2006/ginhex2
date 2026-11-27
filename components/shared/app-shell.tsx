"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AccountMenu } from "@/components/shared/account-menu";
import { cn } from "@/lib/utils";
import { getAppNavItems, type NavItem } from "@/lib/nav-items";
import type { Theme } from "@/lib/theme";
import type { UserRole } from "@/types/domain";
import { ROLE_HOME_PATH } from "@/types/domain";

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-4" aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}>
      {items.map((item) => {
        const isDashboardRoot =
          item.href === "/app/student" || item.href === "/app/instructor" || item.href === "/app/admin";
        const isActive = isDashboardRoot ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "gx-nav-item group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              isActive ? "text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="gx-nav-icon h-[18px] w-[18px] shrink-0" />
            {isAr ? item.labelAr : item.labelEn}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  role,
  displayName,
  email,
  genhexId,
  avatarUrl,
  theme,
  children,
}: {
  role: UserRole;
  displayName: string;
  email: string;
  genhexId: string;
  avatarUrl: string | null;
  theme: Theme;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Escape closes the drawer; the drawer also closes on any route change.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);
  const tNav = useTranslations("nav");
  // Computed here (client-side) from the plain role string, not received
  // as a prop -- NavItem.icon holds actual component references, and
  // function/component values can't be passed from a Server Component
  // into a Client Component's props. That was the real bug: the layout
  // (a Server Component) was calling getAppNavItems() and passing the
  // result in as a prop, which crashed at runtime on every /app/* page.
  const navItems = getAppNavItems(role);

  return (
    <div className="gx-mesh flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0 shadow-[0_1px_0_var(--border),0_8px_24px_-16px_rgb(52_61_70/0.25)]">
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={tNav("openMenu")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card/60 text-foreground transition-colors hover:bg-muted sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href={ROLE_HOME_PATH[role]}>
              <Logo height={48} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle current={theme} />
            <AccountMenu displayName={displayName} email={email} role={role} genhexId={genhexId} avatarUrl={avatarUrl} />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Permanent sidebar on sm+ (laptop/tablet/desktop) */}
        <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 self-start overflow-y-auto border-e border-border bg-card/50 backdrop-blur-sm sm:block">
          <NavLinks items={navItems} />
        </aside>

        {/* Mobile drawer: always mounted so it can slide; inert + invisible when closed */}
        <div className="gx-drawer sm:hidden" data-open={mobileOpen} inert={!mobileOpen}>
          <div className="gx-drawer-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label={tNav("openMenu")} className="gx-drawer-panel border-e border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-3">
              <Logo height={40} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={tNav("closeMenu")}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks items={navItems} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>

        <main id="main" className="gx-app-main mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-10">
          <div key={pathname} className="gx-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
