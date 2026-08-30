import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GenhexCoreScene } from "@/components/marketing/genhex-core-scene";
import { ArrowRight, ArrowLeft } from "lucide-react";

export async function HeroSection() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      {/* Hex-grid backdrop — brand board's own graphic motif, not decoration for its own sake */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px), repeating-linear-gradient(60deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px)",
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top,_rgba(0,188,200,0.14),_transparent_60%)]" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:py-32">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-[#00BCC8]">
            {isAr ? "منصة تعليم تقني ثنائية اللغة" : "A bilingual technology education platform"}
          </span>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {isAr ? (
              <>
                ابنِ <span className="text-[#00BCC8]">ما هو</span>{" "}
                <span className="text-[#D0FF00]">قادم</span>.
              </>
            ) : (
              <>
                Build <span className="text-[#00BCC8]">what&apos;s</span>{" "}
                <span className="text-[#D0FF00]">next</span>.
              </>
            )}
          </h1>
          <p className="max-w-md text-lg text-white/70">
            {isAr
              ? "GENHEX منصة تجمع الدورات والحضور والاختبارات والشهادات في نظام واحد — يتعلّم فيه الطلاب، ويبني فيه المدرّبون، بالعربي والإنجليزي."
              : "GENHEX brings courses, attendance, exams, and certificates into one system — where students learn and instructors build, in Arabic and English."}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg" className="bg-[#00BCC8] text-[#0A0A0A] hover:bg-[#00BCC8]/90">
              <Link href="/courses">
                {isAr ? "استكشف الدورات" : "Explore courses"}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link href="/sign-up">{isAr ? "أنشئ حسابًا" : "Create an account"}</Link>
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <GenhexCoreScene />
        </div>
      </div>
    </section>
  );
}
