import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { LinkedinIcon, InstagramIcon, FacebookIcon, WhatsappIcon } from "@/components/shared/social-icons";

const CREATOR_NAME = "Youssef Kheir Allah";
const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/in/gen-hex-0158bb431/", Icon: LinkedinIcon },
  { name: "Instagram", href: "https://www.instagram.com/gen_hex0", Icon: InstagramIcon },
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61593995577602", Icon: FacebookIcon },
  { name: "WhatsApp", href: "https://wa.me/201149078874", Icon: WhatsappIcon },
];

export async function MarketingFooter() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  return (
    <footer className="border-t border-border bg-canvas">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 text-sm text-muted-foreground sm:flex-row">
        <Logo height={40} />
        <nav className="flex items-center gap-6">
          <Link href="/courses" className="rounded-sm transition-colors hover:text-foreground">
            {isAr ? "الدورات" : "Courses"}
          </Link>
          <Link href="/sign-in" className="rounded-sm transition-colors hover:text-foreground">
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-[color,border-color,transform] duration-150 hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--genhex-cyan)_50%,var(--border))] hover:text-link"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} GENHEX</p>
          <p>
            {isAr ? "تم الإنشاء بواسطة " : "Created by "}
            <span className="font-medium text-foreground">{CREATOR_NAME}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
