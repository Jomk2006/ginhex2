import { getTranslations } from "next-intl/server";
import { ErrorView } from "@/components/shared/error-view";

export async function NotFoundView() {
  const t = await getTranslations("errors");
  return <ErrorView code="404" title={t("notFound.title")} body={t("notFound.body")} primary={{ label: t("goHome"), href: "/" }} />;
}
