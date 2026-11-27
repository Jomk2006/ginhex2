import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildPageMetadata, LOCALE_META } from "@/lib/seo";
import { GraduationCap, Video, Award, Users, Target } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { HexMotif } from "@/components/ui/hex-motif";
import { Card } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return buildPageMetadata({
    locale,
    path: "/about",
    title: isAr ? "عن GENHEX | تعلّم. وأثبت مستواك." : "About GENHEX | Learn it. Prove it.",
    description: LOCALE_META[isAr ? "ar" : "en"].description,
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const pillars = [
    {
      icon: Video,
      titleEn: "Free live courses",
      titleAr: "دورات مباشرة مجانية",
      bodyEn: "Real-time sessions where you learn alongside other students, ask questions, and get answers on the spot — at no cost.",
      bodyAr: "جلسات مباشرة بتتعلّم فيها مع طلاب تانيين، وتقدر تسأل وتاخد إجابة في اللحظة، من غير أي تكلفة.",
    },
    {
      icon: GraduationCap,
      titleEn: "Professionally recorded courses",
      titleAr: "دورات مسجَّلة باحترافية",
      bodyEn: "Structured, well-produced lessons you can revisit anytime — built with the same care as a live classroom, minus the schedule.",
      bodyAr: "دروس منظَّمة ومُنتَجة باحتراف تقدر ترجعلها في أي وقت — بنفس مستوى الكلاس المباشر، من غير الالتزام بميعاد.",
    },
    {
      icon: Award,
      titleEn: "A certificate that means something",
      titleAr: "شهادة ليها قيمة فعلية",
      bodyEn: "Finish a course and earn a certificate tied to real attendance and real assessment — not just a name on a PDF.",
      bodyAr: "لما تخلّص الدورة، بتاخد شهادة مرتبطة بحضور حقيقي وتقييم حقيقي — مش مجرد اسم على PDF.",
    },
  ];

  return (
    <div className="bg-ambient">
    <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <Reveal>
        <HexMotif className="pointer-events-none absolute end-4 top-14 hidden h-48 w-48 opacity-70 md:block" />
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--genhex-cyan)_28%,transparent)] bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {isAr ? "من نحن" : "About GENHEX"}
        </span>
        <h1 className="gx-ph text-3xl sm:text-5xl md:pe-40">
          {isAr ? (
            <>نحن مش بس بنعلّم دورات — إحنا بنبني مستقبل مهني.</>
          ) : (
            <>We&apos;re not just teaching courses. We&apos;re building careers.</>
          )}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:pe-16">
          {isAr
            ? "GENHEX مركز تعليم تقني بيقدّم دورات مجانية مباشرة ودورات مسجَّلة باحترافية عالية، وكل دورة بتنتهي بشهادة اجتياز حقيقية — مبنية على حضور فعلي وتقييم فعلي، مش مجرد اسم."
            : "GENHEX is a technology education center offering free live courses and professionally recorded courses — every course ends with a real certificate of completion, backed by actual attendance and actual assessment, not just a name on a page."}
        </p>
      </Reveal>

      <Reveal delay={100} className="mt-16">
        <Card className="p-8">
          <div className="gx-icon-chip mb-4 !h-11 !w-11">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="mb-3 text-xl font-semibold">{isAr ? "مهمتنا" : "Our mission"}</h2>
          <p className="text-muted-foreground">
            {isAr
              ? "هدفنا إن كل طالب في جمهورية مصر العربية يلاقي المجال التقني المناسب له، ويتعلّمه صح من الأساس لحد ما يبقى محترف حقيقي فيه — مش بس شخص شاف كورس وخلص. إحنا هنا عشان نقرّب المسافة بين اللي الطالب بيحبه واللي الطالب ممكن يشتغل بيه."
              : "Our goal is for every student across Egypt to find the technology field that genuinely fits them, learn it properly from the ground up, and grow into a real professional in it — not just someone who watched a course and moved on. We exist to close the gap between what a student loves and what a student can build a career on."}
          </p>
        </Card>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {pillars.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <Reveal key={pillar.titleEn} delay={i * 100}>
              <Card interactive className="h-full p-6">
                <div className="gx-icon-chip mb-4 !h-11 !w-11">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{isAr ? pillar.titleAr : pillar.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{isAr ? pillar.bodyAr : pillar.bodyEn}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={200} className="mt-16">
        <Card className="p-8">
          <div className="gx-icon-chip mb-4 !h-11 !w-11">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="mb-3 text-xl font-semibold">{isAr ? "الفريق" : "The team"}</h2>
          <p className="text-muted-foreground">
            {isAr
              ? "إحنا فريق صغير ومتماسك، كل واحد فينا شغال بشغف حقيقي في مجاله — مش شركة ضخمة بعيدة عن طلابها. القرب ده هو اللي بيخلّينا نسمع كل طالب، ونطوّر المنصة والمحتوى بناءً على احتياجه الحقيقي، مش افتراضات بعيدة عن الواقع."
              : "We're a small, close-knit team, each of us genuinely passionate about our own craft — not a distant, oversized company. That closeness is exactly what lets us actually listen to every student and shape the platform and content around real needs, not guesses made from a distance."}
          </p>
        </Card>
      </Reveal>

      <Reveal delay={300} className="mt-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">
          {isAr ? "جاهز تلاقي مجالك؟" : "Ready to find your field?"}
        </h2>
        <Button asChild size="lg">
          <Link href="/courses">{isAr ? "استكشف الدورات" : "Explore courses"}</Link>
        </Button>
      </Reveal>
    </div>
    </div>
  );
}
