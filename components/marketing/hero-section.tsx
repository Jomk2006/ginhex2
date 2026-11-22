import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FieldsHoneycomb } from "@/components/marketing/fields-honeycomb";
import { ArrowRight, ArrowLeft } from "lucide-react";

export async function HeroSection() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="lg:min-h-dvh relative -mt-24 flex items-center overflow-hidden bg-[#313A43]">
      {/* Soft brand glow behind the honeycomb (static, no motion) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 80% 45%, rgba(0,182,191,0.20), transparent 70%), linear-gradient(180deg, #313A43 0%, #272E35 100%)",
        }}
        aria-hidden="true"
      />

      {/* Hex-grid backdrop -- brand board's own graphic motif */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px), repeating-linear-gradient(60deg, transparent 0 46px, rgba(0,188,200,0.6) 46px 47px)",
        }}
        aria-hidden="true"
      />

      {/* Content -- anchored bottom-left, pointer-events-none so drag/hover
          on the 3D scene still works through the empty space around text;
          buttons re-enable pointer-events individually */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 pb-12 pt-28 sm:pt-32 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pb-16">
        <div>
        <span
          className="animate-fade-up-blur inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#00B6BF] opacity-0"
          style={{ animationDelay: "0.2s" }}
        >
          {isAr ? "منصة تعليم تقني ثنائية اللغة" : "A bilingual technology education platform"}
        </span>

        <h1
          className="brand-wordmark animate-fade-up-blur mb-3 mt-5 text-[clamp(3.25rem,10vw,7rem)] font-bold uppercase text-white opacity-0 md:mb-5"
          style={{ animationDelay: "0.35s" }}
        >
          <span className="text-white">GEN</span>
          <span className="text-[#00B6BF]">HEX</span>
        </h1>

        <p
          className="animate-fade-up-blur mb-3 text-[clamp(1.25rem,2.8vw,2rem)] font-medium text-white opacity-0 md:mb-5"
          style={{ animationDelay: "0.5s" }}
        >
          {isAr ? "ابنِ ما هو قادم." : "Build what's next."}
        </p>

        <p
          className="animate-fade-up-blur mb-5 max-w-prose text-[clamp(0.9375rem,1.5vw,1.125rem)] font-normal text-white/70 opacity-0 md:mb-8"
          style={{ animationDelay: "0.65s" }}
        >
          {isAr
            ? "GENHEX منصة تجمع الدورات والحضور والاختبارات والشهادات في نظام واحد — يتعلّم فيه الطلاب، ويبني فيه المدرّبون، بالعربي والإنجليزي."
            : "GENHEX brings courses, attendance, exams, and certificates into one system — where students learn and instructors build, in Arabic and English."}
        </p>

        <div className="flex flex-wrap gap-3 font-bold" style={{ animationDelay: "0.8s" }}>
          <Link
            href="/courses"
            className="animate-fade-up-blur cursor-pointer rounded-sm bg-[#00B6BF] px-6 py-3 text-sm text-[#0A0A0A] opacity-0 transition-all hover:brightness-110 active:scale-[0.97] md:px-8 md:py-4"
            style={{ animationDelay: "0.8s" }}
          >
            <span className="inline-flex items-center gap-2">
              {isAr ? "استكشف الدورات" : "Explore courses"}
              <Arrow className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/sign-up"
            className="animate-fade-up-blur cursor-pointer rounded-sm bg-white px-6 py-3 text-sm text-[#0A0A0A] opacity-0 transition-all hover:brightness-90 active:scale-[0.97] md:px-8 md:py-4"
            style={{ animationDelay: "0.9s" }}
          >
            {isAr ? "أنشئ حسابًا" : "Create an account"}
          </Link>
        </div>

        <dl
          className="animate-fade-up-blur mt-6 grid grid-cols-3 gap-4 border-t border-white/15 pt-4 opacity-0 md:mt-8"
          style={{ animationDelay: "1.05s" }}
        >
          {(isAr
            ? [
                ["مجانًا", "كل الدورات"],
                ["لايف + مسجّل", "تعلّم بطريقتك"],
                ["شهادة", "عند النجاح"],
              ]
            : [
                ["Free", "every course"],
                ["Live + recorded", "learn your way"],
                ["Certificate", "when you pass"],
              ]
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm font-semibold text-[#00B6BF] sm:text-base">{k}</dt>
              <dd className="text-xs text-white/60 sm:text-sm">{v}</dd>
            </div>
          ))}
        </dl>
        </div>

        <div className="mx-auto w-full max-w-[22rem] lg:max-w-none lg:justify-self-end">
          <FieldsHoneycomb isAr={isAr} />
        </div>
      </div>
    </section>
  );
}
