import type { Metadata } from "next";
import { LOCALES } from "@/types/domain";

export const FALLBACK_SITE_URL = "https://ginhex2.vercel.app";
export const OG_IMAGE = { url: "/brand/genhex-logo.jpeg", width: 1254, height: 1254, alt: "GENHEX" } as const;

export const LOCALE_META = {
  en: {
    title: "GENHEX | Learn it. Prove it. Build what's next.",
    description:
      "Free courses with recorded and live lessons, labs that run in your browser, self-grading exams and certificates anyone can verify.",
  },
  ar: {
    title: "GENHEX | تعلّم. وأثبت مستواك. ابنِ القادم.",
    description:
      "دورات مجانية بدروس مسجّلة وجلسات مباشرة، ومعامل تعمل من متصفحك، وامتحانات تُصحَّح تلقائيًا، وشهادات يستطيع أي شخص التأكد من صحتها.",
  },
} as const;

/** Absolute site origin without a trailing slash. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  return raw.replace(/\/+$/, "");
}

/** Absolute URL for a locale + path ("" or "/about"). */
export function localizedUrl(locale: string, path = ""): string {
  const suffix = path === "/" ? "" : path;
  return `${getSiteUrl()}/${locale}${suffix}`;
}

/** Canonical + hreflang alternates (self-referencing, reciprocal, with x-default). */
export function localizedAlternates(locale: string, path = ""): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = localizedUrl(l, path);
  languages["x-default"] = localizedUrl("en", path);
  return { canonical: localizedUrl(locale, path), languages };
}

/** Full per-page metadata: title, description, canonical/hreflang, OpenGraph and Twitter. */
export function buildPageMetadata(opts: {
  locale: string;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  const { locale, path = "", title, description } = opts;
  const isAr = locale === "ar";
  const url = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: localizedAlternates(locale, path),
    openGraph: {
      type: "website",
      siteName: "GENHEX",
      title,
      description,
      url,
      locale: isAr ? "ar_AR" : "en_US",
      alternateLocale: isAr ? ["en_US"] : ["ar_AR"],
      images: [OG_IMAGE],
    },
    twitter: { card: "summary", title, description, images: [OG_IMAGE.url] },
  };
}
