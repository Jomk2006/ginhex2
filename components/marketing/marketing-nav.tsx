"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Theme } from "@/lib/theme";

export function MarketingNav({ theme }: { theme: Theme }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/courses" className="me-2 hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
            Courses
          </Link>
          <LocaleSwitcher />
          <ThemeToggle current={theme} />
          <Button asChild size="sm" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
