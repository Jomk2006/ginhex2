"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ current }: { current: Theme }) {
  const router = useRouter();
  const t = useTranslations("nav");

  function toggle() {
    const next: Theme = current === "dark" ? "light" : "dark";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label={t("toggleTheme")}>
      {current === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
