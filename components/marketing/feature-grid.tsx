import { getTranslations } from "next-intl/server";
import { Languages, MonitorPlay, TerminalSquare, Timer, ClipboardCheck, QrCode } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

interface Feature {
  title: string;
  body: string;
}

const ICONS = [Languages, MonitorPlay, TerminalSquare, Timer, ClipboardCheck, QrCode];

export async function FeatureGrid() {
  const t = await getTranslations("landing.features");
  const raw = t.raw("items") as unknown;
  const items: Feature[] = Array.isArray(raw)
    ? raw.filter((f): f is Feature => !!f && typeof (f as Feature).title === "string")
    : [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="lp-eyebrow lp-eyebrow-light">{t("eyebrow")}</span>
        <h2 className="mt-4 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">{t("title")}</h2>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f, i) => {
          const Icon = ICONS[i] ?? Languages;
          return (
            <Reveal key={f.title} delay={(i % 3) * 80} className="h-full">
              <article className="lp-card group h-full p-6">
                <span className="lp-icon-chip">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
