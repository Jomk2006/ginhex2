"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/admin", en: "Overview", ar: "نظرة عامة" },
  { href: "/app/admin/courses", en: "Courses", ar: "الدورات" },
  { href: "/app/admin/users", en: "Users", ar: "المستخدمون" },
  { href: "/app/admin/attendance", en: "Attendance", ar: "الحضور" },
];

export function AdminTabs() {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <div className="mb-6 flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/app/admin" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-[#00BCC8] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {isAr ? tab.ar : tab.en}
          </Link>
        );
      })}
    </div>
  );
}
