import "@/components/marketing/landing.css";
import { HeroSection } from "@/components/marketing/hero-section";
import { JourneySection } from "@/components/marketing/journey/journey-section";
import { FieldsSection } from "@/components/marketing/fields-section";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { MarqueeBand } from "@/components/marketing/marquee-band";
import { CtaSection } from "@/components/marketing/cta-section";

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
