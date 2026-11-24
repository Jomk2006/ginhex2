import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HexCluster } from "@/components/marketing/fields-honeycomb";
import { HeroScene } from "@/components/marketing/scene/hero-scene";

export async function HeroSection() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("landing.hero")]);
  const rawFacts = t.raw("facts") as unknown;
  const facts = Array.isArray(rawFacts) ? rawFacts.filter((f): f is string => typeof f === "string") : [];

  return (
    <section className="lp-hero lp-dark relative -mt-24 overflow-hidden">
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-hero-mesh" aria-hidden="true" />
      <div className="lp-hero-orb lp-hero-orb-a" aria-hidden="true" />
      <div className="lp-hero-orb lp-hero-orb-b" aria-hidden="true" />
      <HeroScene
        side={locale === "ar" ? -1 : 1}
        fallback={<HexCluster className="lp-hero-fallback" />}
      />
      <div className="lp-hero-shade" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-32 sm:px-6 lg:justify-center lg:pb-16">
        <div className="max-w-[52rem]">
          <span className="lp-eyebrow lp-rise" style={{ animationDelay: "0.1s" }}>
            {t("eyebrow")}
          </span>
          <h1 className="lp-hero-title lp-rise mt-5" style={{ animationDelay: "0.2s" }}>
            <span className="block text-white">{t("titleLine1")}</span>
            <span className="lp-hl-wrap block">
              <span className="lp-gradient-text lp-shimmer">{t("titleLine2")}</span>
              <span className="lp-underline" aria-hidden="true" />
            </span>
          </h1>
          <p
            className="lp-rise mt-5 max-w-[34rem] text-[clamp(1rem,0.92rem+0.4vw,1.1875rem)] text-white/75"
            style={{ animationDelay: "0.35s" }}
          >
            {t("subtitle")}
          </p>

          <div className="lp-rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.5s" }}>
            <Button asChild size="lg" className="lp-btn lp-btn-primary rounded-full px-8">
              <Link href="/sign-up">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="lp-btn rounded-full border-white/25 bg-white/5 px-8 text-white hover:border-white/40 hover:bg-white/12 hover:text-white"
            >
              <Link href="/courses">{t("ctaSecondary")}</Link>
            </Button>
          </div>

          <ul className="lp-rise mt-8 flex flex-wrap gap-2" style={{ animationDelay: "0.65s" }}>
            {facts.map((f) => (
              <li key={f} className="lp-chip">
                <span className="lp-chip-dot" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <span className="lp-scroll-cue" aria-hidden="true" />
    </section>
  );
}
