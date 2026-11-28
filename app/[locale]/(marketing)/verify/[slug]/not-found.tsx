import { getLocale } from "next-intl/server";
import { ErrorView } from "@/components/shared/error-view";

// Still a real 404 (notFound() in page.tsx), but with certificate-specific copy.
export default async function CertificateNotFound() {
  const isAr = (await getLocale()) === "ar";
  return (
    <ErrorView
      code="404"
      title={isAr ? "لم نجد هذه الشهادة" : "We couldn't find this certificate"}
      body={
        isAr
          ? "تأكد من الرابط أو رمز الاستجابة السريعة (QR) على الشهادة. إذا كنت تعتقد أنها صحيحة، تواصل معنا."
          : "Check the link or the QR code printed on the certificate. If you believe it's genuine, contact us."
      }
      primary={{ label: isAr ? "العودة للرئيسية" : "Back to home", href: "/" }}
    />
  );
}
