import { getTranslations } from "next-intl/server";
import {
  Gift,
  MonitorPlay,
  TerminalSquare,
  Timer,
  ClipboardCheck,
  QrCode,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

interface Feature {
  title: string;
  body: string;
}

const ICONS = [
  Gift,
  MonitorPlay,
  TerminalSquare,
  Timer,
  ClipboardCheck,
  QrCode,
];

// Bento rhythm on desktop: wide, narrow / narrow, wide / wide, narrow.
const WIDE = new Set([0, 3, 4]);

export async function FeatureGrid() {
  const t = await getTranslations("landing.features");
  const raw = t.raw("items") as unknown;
  const items: Feature[] = Array.isArray(raw)
    ? raw.filter(
        (f): f is Feature => !!f && typeof (f as Feature).title === "string",
      )
    : [];

  return (
    <section className="lp-features relative">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="lp-eyebrow lp-eyebrow-light">{t("eyebrow")}</span>
          <h2 className="lp-h2 mt-5">{t("title")}</h2>
          <span className="lp-rule lp-rule-center" aria-hidden="true" />
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => {
            const Icon = ICONS[i] ?? Gift;
            return (
              <Reveal
                key={f.title}
                delay={i * 70}
                className={`h-full ${WIDE.has(i) ? "lg:col-span-2" : ""}`}
              >
                <article className="lp-card lp-feature group h-full p-7 sm:p-8">
                  <span className="lp-feature-num" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <span className="lp-icon-chip">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl">{f.title}</h3>
                  <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
