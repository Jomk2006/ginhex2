import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Routes are always locale-prefixed (/en/app, /ar/app), so block both
        // the literal and the prefixed forms.
        disallow: ["/app/", "/en/app/", "/ar/app/", "/auth/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
