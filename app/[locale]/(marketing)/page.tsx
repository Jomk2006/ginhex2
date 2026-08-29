import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function MarketingHome() {
  const t = useTranslations("marketing");

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("tagline")}</h1>
      <p className="text-lg text-muted-foreground">{t("description")}</p>
      <Button asChild size="lg">
        <Link href="/sign-up">{t("cta")}</Link>
      </Button>
    </div>
  );
}
