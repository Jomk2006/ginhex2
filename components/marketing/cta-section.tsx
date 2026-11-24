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
        <Reveal className="relative mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
          <h2 className="text-[clamp(1.75rem,1.3rem+2vw,3rem)] text-white">{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-white/75">{t("body")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/sign-up">
                {t("button")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/25 bg-white/5 px-7 text-white hover:border-white/40 hover:bg-white/12 hover:text-white"
            >
              <Link href="/courses">{t("secondary")}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
