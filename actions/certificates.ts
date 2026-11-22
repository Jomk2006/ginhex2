"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Both actions run as the signed-in admin; the database functions re-check admin + eligibility. */
export async function issueCertificateAction(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("issue_certificate", { p_student_id: studentId, p_course_id: courseId });
  if (error) console.error("issueCertificateAction failed", { code: error.code, message: error.message });
  revalidatePath("/[locale]/app", "layout");
}

export async function revokeCertificateAction(certificateId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_certificate", { p_certificate_id: certificateId, p_reason: "Revoked by admin" });
  if (error) console.error("revokeCertificateAction failed", { code: error.code, message: error.message });
  revalidatePath("/[locale]/app", "layout");
}
