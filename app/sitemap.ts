import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { LOCALES } from "@/types/domain";
import { localizedUrl } from "@/lib/seo";

// Rendered per request so newly published courses appear without a rebuild.
export const dynamic = "force-dynamic";

const STATIC_PATHS = ["", "/about", "/courses"];

function entry(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = localizedUrl(l, path);
  return LOCALES.map((locale) => ({
    url: localizedUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

/** Published course slugs via the public anon key (RLS limits this to published rows). */
async function getCourseSlugs(): Promise<{ slug: string; updated_at: string | null }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("courses")
      .select("slug, updated_at")
      .eq("status", "published");
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getCourseSlugs();
  return [
    ...STATIC_PATHS.flatMap((p) => entry(p)),
    ...courses.flatMap((c) => entry(`/courses/${encodeURIComponent(c.slug)}`, c.updated_at ? new Date(c.updated_at) : undefined)),
  ];
}
