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
    <section className="bg-ambient border-y border-border">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:py-16">
        {stats.map((s, i) => (
          <Reveal key={s.value + i} delay={i * 90} className="h-full">
            <div className="glass lp-stat h-full rounded-3xl p-6 text-center sm:p-8">
              <span className="lp-gradient-text-ink font-display block text-[clamp(2.5rem,2rem+2.4vw,4rem)] font-bold leading-none">
                {s.value}
              </span>
              <span className="mt-3 block text-sm text-muted-foreground">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
