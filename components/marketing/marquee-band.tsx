import { getTranslations } from "next-intl/server";

/** Decorative scrolling ribbon of the learning fields (pure CSS, paused on hover, static under reduced motion). */
export async function MarqueeBand() {
  const t = await getTranslations("landing.fields");
  const raw = t.raw("items") as unknown;
  const names: string[] = Array.isArray(raw)
    ? raw
        .map((i) => (i && typeof (i as { name?: unknown }).name === "string" ? (i as { name: string }).name : ""))
        .filter(Boolean)
    : [];
  if (!names.length) return null;

  const group = (hidden: boolean) => (
    <ul className="lp-marquee-group" aria-hidden={hidden || undefined}>
      {[...names, ...names].map((n, i) => (
        <li key={i} className="lp-marquee-item">
          <span className="lp-marquee-hex" aria-hidden="true" />
          {n}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lp-marquee" aria-hidden="true">
      <div className="lp-marquee-track">
        {group(true)}
        {group(true)}
      </div>
    </div>
  );
}
