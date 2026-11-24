import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FieldsHoneycomb, FIELD_ICONS } from "@/components/marketing/fields-honeycomb";
import { Reveal } from "@/components/marketing/reveal";

interface Item {
  name: string;
  description: string;
}

export async function FieldsSection() {
  const t = await getTranslations("landing.fields");
  const raw = t.raw("items") as unknown;
  const items: Item[] = Array.isArray(raw)
    ? raw.filter((i): i is Item => !!i && typeof (i as Item).name === "string")
    : [];

  return (
    <section className="lp-fields relative -mt-8 rounded-t-[2rem] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="lp-eyebrow lp-eyebrow-light">{t("eyebrow")}</span>
          <h2 className="mt-4 text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">{t("title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal className="hidden justify-center lg:flex">
            <div className="lp-hex-panel">
              <FieldsHoneycomb items={items.map((i) => i.name)} decorative />
            </div>
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => {
              const Icon = FIELD_ICONS[i] ?? FIELD_ICONS[0];
              return (
                <li key={item.name}>
                  <Reveal delay={i * 70} className="h-full">
                    <Link href="/courses" className="lp-card group flex h-full flex-col gap-3 p-5">
                      <span className="lp-icon-chip">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg font-semibold">{item.name}</span>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-link rtl:-scale-x-100 rtl:group-hover:translate-x-0"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
