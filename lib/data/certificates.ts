import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type MyCertificate = Database["public"]["Tables"]["certificates"]["Row"] & {
  courses: { title_en: string; title_ar: string } | null;
};

export async function getMyCertificates(studentId: string): Promise<MyCertificate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*, courses(title_en, title_ar)")
    .eq("student_id", studentId)
    .order("issued_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MyCertificate[];
}

export interface CertificateRow {
  studentId: string;
  courseId: string;
  studentName: string;
  genhexId: string;
  courseTitleEn: string;
  courseTitleAr: string;
  eligible: boolean;
  score: number | null;
  active: { id: string; number: string; slug: string } | null;
}

/**
 * Admin overview. Service-role is used deliberately: it reads every enrollment and calls
 * certificate_eligibility() (which allows service_role). Caller (the page) must be admin.
 */
export async function getCertificateOverview(limit = 150): Promise<CertificateRow[]> {
  const admin = createServiceRoleClient();
  const { data: enrollments, error } = await admin
    .from("enrollments")
    .select("student_id, course_id, profiles(full_name_en, genhex_id), courses(title_en, title_ar)")
    .neq("status", "withdrawn")
    .order("enrolled_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const { data: certs } = await admin.from("certificates").select("id, student_id, course_id, certificate_number, verification_slug").eq("status", "active");
  const certMap = new Map((certs ?? []).map((c) => [`${c.student_id}:${c.course_id}`, c]));

  const rows = await Promise.all(
    (enrollments ?? []).map(async (e) => {
      const p = (e as unknown as { profiles: { full_name_en: string; genhex_id: string } | null }).profiles;
      const c = (e as unknown as { courses: { title_en: string; title_ar: string } | null }).courses;
      const { data: elig } = await admin.rpc("certificate_eligibility", { student_id: e.student_id, course_id: e.course_id });
      const first = Array.isArray(elig) ? elig[0] : elig;
      const cert = certMap.get(`${e.student_id}:${e.course_id}`);
      return {
        studentId: e.student_id,
        courseId: e.course_id,
        studentName: p?.full_name_en ?? "—",
        genhexId: p?.genhex_id ?? "",
        courseTitleEn: c?.title_en ?? "",
        courseTitleAr: c?.title_ar ?? "",
        eligible: Boolean(first?.eligible),
        score: first?.qualifying_score ?? null,
        active: cert ? { id: cert.id, number: cert.certificate_number, slug: cert.verification_slug } : null,
      } satisfies CertificateRow;
    })
  );
  // issued first, then ready-to-issue, then the rest
  return rows.sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)) || Number(b.eligible) - Number(a.eligible));
}
