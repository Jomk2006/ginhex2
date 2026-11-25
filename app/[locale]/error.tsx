"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorView } from "@/components/shared/error-view";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorView
      code="500"
      title={t("server.title")}
      body={t("server.body")}
      primary={{ label: t("tryAgain"), onClick: reset }}
      secondary={{ label: t("goHome"), href: "/" }}
    />
  );
}
