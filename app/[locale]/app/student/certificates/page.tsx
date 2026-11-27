import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyCertificates } from "@/lib/data/certificates";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

export default async function StudentCertificatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "student") redirect(profile ? `/${locale}/app/${profile.role}` : `/${locale}/sign-in`);

  const certs = await getMyCertificates(user.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={isAr ? "شهاداتي" : "My certificates"} />
      {certs.length === 0 ? (
        <EmptyState
          title={isAr ? "لا توجد شهادات بعد" : "No certificates yet"}
          description={
            isAr
              ? "أكمل كل دروس الدورة وانجح في الامتحان، ثم يصدرها الأدمن."
              : "Finish every lesson, pass the exam, and an admin will issue it."
          }
        >
          <Button asChild variant="outline">
            <Link href="/app/student">{isAr ? "العودة إلى دوراتي" : "Back to my courses"}</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="gx-stagger flex flex-col gap-3">
          {certs.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-[box-shadow,border-color] hover:border-[color-mix(in_srgb,var(--genhex-cyan)_45%,var(--border))] hover:shadow-md">
              <div className="flex items-center gap-3">
                <span className="gx-icon-chip" aria-hidden="true"><Award className="h-[18px] w-[18px]" /></span>
                <div>
                <p className="font-medium">{isAr ? c.courses?.title_ar : c.courses?.title_en}</p>
                <p className="text-xs text-muted-foreground">
                  {c.certificate_number} · {new Date(c.issued_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB")}
                </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {c.status === "revoked" && <Badge variant="muted">{isAr ? "ملغاة" : "Revoked"}</Badge>}
                <Link href={`/verify/${c.verification_slug}`} className="gx-link text-sm">
                  {isAr ? "عرض / طباعة" : "View / print"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
