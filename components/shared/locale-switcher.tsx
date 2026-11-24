"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/types/domain";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const next: Locale = locale === "ar" ? "en" : "ar";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.replace(pathname, { locale: next })}
      aria-label={next === "ar" ? "التبديل إلى العربية" : "Switch to English"}
      title={next === "ar" ? "العربية" : "English"}
    >
      <Globe className="size-[18px]" aria-hidden="true" />
    </Button>
  );
}
