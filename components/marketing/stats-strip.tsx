import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/marketing/reveal";

interface Stat {
  value: string;
  label: string;
}

export async function StatsStrip() {
  const t = await getTranslations("landing.stats");
  const raw = t.raw("items") as unknown;
  const stats: Stat[] = Array.isArray(raw)
    ? raw.filter((s): s is Stat => !!s && typeof (s as Stat).value === "string")
    : [];

  return (
    <section className="lp-stats lp-dark relative overflow-hidden">
      <div className="lp-stats-bg" aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:py-24">
        {stats.map((s, i) => (
          <Reveal key={s.value + i} delay={i * 110} className="h-full">
            <div className="lp-stat-card h-full p-7 sm:p-9">
              <span className="lp-rule" aria-hidden="true" />
              <span className="lp-gradient-text font-display mt-6 block text-[clamp(3.25rem,2rem+5vw,6rem)] font-bold leading-none">
                {s.value}
              </span>
              <span className="mt-4 block max-w-[16rem] text-[0.9375rem] leading-relaxed text-white/70">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
