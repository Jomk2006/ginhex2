import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PrintButton } from "@/components/certificates/print-button";

export const metadata = { robots: { index: false, follow: false } };

/** Public: shows (and verifies) a certificate by its unguessable slug. Doubles as the printable certificate. */
export default async function VerifyCertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const isAr = locale === "ar";

  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { p_slug: slug });
  const cert = Array.isArray(data) ? data[0] : null;

  // Unknown slug: real 404 (status 404 + noindex) rather than a 200 "not found" body.
  if (!cert) notFound();

  const revoked = cert.status === "revoked";
  const date = new Date(cert.issued_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { dateStyle: "long" });

  return (
    <div className="bg-ambient">
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Card variant="glass" className="gx-enter mb-6 flex items-center gap-4 p-5" role="status">
        <span
          aria-hidden="true"
          className={`gx-hex-in flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            revoked
              ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
              : "bg-primary text-primary-foreground shadow-[0_0_0_6px_var(--glow)]"
          }`}
        >
          {revoked ? <ShieldAlert className="h-6 w-6" /> : <BadgeCheck className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold">
            {revoked
              ? isAr ? "هذه الشهادة أُلغيت" : "Certificate revoked"
              : isAr ? "تم التحقق من الشهادة" : "Certificate verified"}
          </p>
          <p className="text-sm text-muted-foreground">
            {revoked
              ? isAr ? "هذه الشهادة أُلغيت ولم تعد صالحة." : "This certificate has been revoked and is no longer valid."
              : isAr ? "تم التحقق. هذه الشهادة أصلية." : "Verified. This certificate is authentic."}
          </p>
        </div>
      </Card>

      <article className="gx-enter rounded-2xl border-2 border-[#00B6BF] bg-white p-8 shadow-lg ring-4 ring-[#00B6BF]/10 [animation-delay:120ms] text-center text-[#313A43] print:shadow-none print:ring-0 sm:p-14">
        <p className="brand-wordmark text-3xl font-bold">
          GEN<span className="text-[#00757C]">HEX</span>
        </p>
        <p className="mt-6 text-sm text-[#313A43]/70">{isAr ? "تشهد منصة GENHEX بأن" : "GENHEX certifies that"}</p>
        <h1 className="mt-3 text-3xl font-semibold">{isAr ? cert.student_name_ar : cert.student_name_en}</h1>
        <p className="mt-4 text-sm text-[#313A43]/70">{isAr ? "قد أتمّ بنجاح دورة" : "has successfully completed"}</p>
        <h2 className="mt-2 text-xl font-medium">{isAr ? cert.course_title_ar : cert.course_title_en}</h2>
        {cert.final_score_percent != null && (
          <p className="mt-4 text-sm">{isAr ? `الدرجة النهائية: ${cert.final_score_percent}%` : `Final score: ${cert.final_score_percent}%`}</p>
        )}
        <dl className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-2 text-xs text-[#313A43]/70">
          <div>
            <dt className="inline">{isAr ? "تاريخ الإصدار: " : "Issued: "}</dt>
            <dd className="inline font-medium text-[#313A43]">{date}</dd>
          </div>
          <div>
            <dt className="inline">{isAr ? "رقم الشهادة: " : "Certificate no.: "}</dt>
            <dd className="inline font-mono font-medium text-[#313A43]">{cert.certificate_number}</dd>
          </div>
        </dl>
      </article>

      <div className="mt-6 flex justify-center">
        <PrintButton label={isAr ? "طباعة / حفظ PDF" : "Print / Save as PDF"} />
      </div>
    </div>
    </div>
  );
}
