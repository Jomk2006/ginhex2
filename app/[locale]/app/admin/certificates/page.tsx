import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCertificateOverview } from "@/lib/data/certificates";
import { issueCertificateAction, revokeCertificateAction } from "@/actions/certificates";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminCertificatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);

  const rows = await getCertificateOverview().catch((e) => {
    console.error("AdminCertificatesPage failed", e);
    return null;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{isAr ? "الشهادات" : "Certificates"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr
            ? "الأهلية: كل الدروس مكتملة، وتجاوز امتحان معتمد إذا كان مطلوبًا للدورة. الإصدار قرار الأدمن."
            : "Eligible = every lesson complete and, if the course requires one, a passed certifying exam. Issuing is your decision."}
        </p>
      </div>

      {rows === null && <p role="alert" className="text-destructive">{isAr ? "تعذّر تحميل البيانات." : "Couldn't load the data."}</p>}
      {rows?.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد طلاب مسجّلون بعد." : "No enrolled students yet."}</p>}

      <ul className="flex flex-col gap-2">
        {rows?.map((r) => (
          <li key={`${r.studentId}:${r.courseId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3 text-sm">
            <div>
              <p className="font-medium">{r.studentName} <span className="text-xs text-muted-foreground">{r.genhexId}</span></p>
              <p className="text-xs text-muted-foreground">{isAr ? r.courseTitleAr : r.courseTitleEn}</p>
            </div>
            <div className="flex items-center gap-3">
              {r.active ? (
                <>
                  <Badge>{isAr ? "صادرة" : "Issued"}</Badge>
                  <Link href={`/verify/${r.active.slug}`} className="text-primary hover:underline">{r.active.number}</Link>
                  <form action={revokeCertificateAction.bind(null, r.active.id)}>
                    <Button type="submit" size="sm" variant="outline">{isAr ? "إلغاء" : "Revoke"}</Button>
                  </form>
                </>
              ) : r.eligible ? (
                <form action={issueCertificateAction.bind(null, r.studentId, r.courseId)}>
                  <Button type="submit" size="sm">{isAr ? "إصدار الشهادة" : "Issue certificate"}</Button>
                </form>
              ) : (
                <span className="text-xs text-muted-foreground">{isAr ? "غير مؤهّل بعد" : "Not eligible yet"}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
