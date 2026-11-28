import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";
import { HexMotif } from "@/components/ui/hex-motif";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("landing.hero");
  const facts = t.raw("facts") as string[];

  return (
    <div className="gx-mesh grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col items-center justify-center gap-8 px-4 py-10 sm:px-8">
        <Link href="/" className="rounded-xl transition-transform duration-200 hover:-translate-y-px">
          <Logo height={56} />
        </Link>
        <div className="gx-enter w-full max-w-md">{children}</div>
      </div>

      <aside
        className="gx-auth-panel hidden flex-col items-start justify-center gap-10 p-12 lg:flex xl:p-16"
        aria-label={t("eyebrow")}
      >
        <HexMotif tone="dark" className="gx-auth-hex pointer-events-none absolute -bottom-24 -end-24 h-[26rem] w-[26rem] opacity-40" still />
        <HexMotif tone="dark" className="relative h-52 w-52 xl:h-64 xl:w-64" />
        <div className="relative flex max-w-md flex-col gap-4">
          <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
            {t("titleLine1")}
            <span className="block text-[var(--genhex-cyan)]">{t("titleLine2")}</span>
          </h2>
          <p className="text-base text-white/75">{t("eyebrow")}</p>
        </div>
        <ul className="relative flex flex-col gap-3 text-sm text-white/85">
          {facts.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--genhex-cyan)]" />
              {f}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
