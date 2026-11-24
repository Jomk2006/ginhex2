import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export async function CtaSection() {
  const t = await getTranslations("landing.cta");
  return (
    <section className="px-4 pb-20 sm:px-6 lg:pb-28">
      <div className="lp-cta lp-dark relative mx-auto max-w-6xl overflow-hidden rounded-[2rem]">
        <div className="lp-cta-hex" aria-hidden="true" />
        <div className="lp-hero-orb lp-hero-orb-a" aria-hidden="true" />
        <div className="lp-grain" aria-hidden="true" />
        <Reveal className="relative mx-auto max-w-2xl px-6 py-20 text-center sm:py-28">
          <h2 className="lp-h2 lp-h2-xl text-white">{t("title")}</h2>
          <span className="lp-rule lp-rule-center" aria-hidden="true" />
          <p className="mx-auto mt-4 max-w-lg text-white/75">{t("body")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="lp-btn lp-btn-primary rounded-full px-8">
              <Link href="/sign-up">
                {t("button")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="lp-btn rounded-full border-white/25 bg-white/5 px-8 text-white hover:border-white/40 hover:bg-white/12 hover:text-white"
            >
              <Link href="/courses">{t("secondary")}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
