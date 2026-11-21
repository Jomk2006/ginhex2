import { ExamsAdminView } from "@/components/exams/exams-admin-view";

export default async function AdminExamsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  return <ExamsAdminView courseId={id} locale={locale} role="admin" />;
}
