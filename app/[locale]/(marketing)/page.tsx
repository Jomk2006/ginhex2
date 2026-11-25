import type { Metadata } from "next";
import { buildPageMetadata, LOCALE_META } from "@/lib/seo";
import "@/components/marketing/landing.css";
import { HeroSection } from "@/components/marketing/hero-section";
import { JourneySection } from "@/components/marketing/journey/journey-section";
import { FieldsSection } from "@/components/marketing/fields-section";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { MarqueeBand } from "@/components/marketing/marquee-band";
import { CtaSection } from "@/components/marketing/cta-section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { title, description } = LOCALE_META[locale === "ar" ? "ar" : "en"];
  return buildPageMetadata({ locale, path: "", title, description });
}

export default function MarketingHome() {
  return (
    <>
      <div className="lp-progress" aria-hidden="true" />
      <HeroSection />
      <MarqueeBand />
      <JourneySection />
      <FieldsSection />
      <StatsStrip />
      <FeatureGrid />
      <CtaSection />
    </>
  );
}
