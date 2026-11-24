import { getLocale, getTranslations } from "next-intl/server";
import { JourneyStage, type JourneyStep } from "./journey-stage";

export async function JourneySection() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("landing.journey")]);
  const raw = t.raw("steps") as unknown;
  const steps: JourneyStep[] = Array.isArray(raw)
    ? raw
        .filter((s): s is JourneyStep => !!s && typeof (s as JourneyStep).title === "string")
        .slice(0, 4)
    : [];
  return (
    <JourneyStage
      eyebrow={t("eyebrow")}
      title={t("title")}
      steps={steps}
      side={locale === "ar" ? -1 : 1}
    />
  );
}
