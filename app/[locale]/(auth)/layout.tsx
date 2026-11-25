import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ambient flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" className="rounded-md transition-transform duration-200 hover:-translate-y-px">
        <Logo height={56} />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
