import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared, presentation-only 404/500 panel. Logical (start/end) utilities only,
 * so it mirrors correctly in RTL. Colors come from the theme tokens
 * (#FFFFFF / #343D46 / #00B6BF / #374049 / #313A43).
 */
export function ErrorView({
  code,
  title,
  body,
  primary,
  secondary,
}: {
  code: string;
  title: string;
  body: string;
  primary: { label: string; href?: string; onClick?: () => void };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-6xl font-bold tracking-tight text-[#00B6BF]" dir="ltr">
        {code}
      </p>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {primary.onClick ? (
          <button type="button" onClick={primary.onClick} className={cn(buttonVariants({ size: "lg" }))}>
            {primary.label}
          </button>
        ) : null}
        {primary.href ? (
          <Link href={primary.href} className={cn(buttonVariants({ size: "lg" }))}>
            {primary.label}
          </Link>
        ) : null}
        {secondary ? (
          <Link href={secondary.href} className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
