import Image from "next/image";
import { HexMotif } from "@/components/ui/hex-motif";
import { cn } from "@/lib/utils";

/** Course cover. Falls back to a brand gradient with the hex motif when there is no image. */
export function CourseThumbnail({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt} fill className={cn("gx-cover-img object-cover", className)} />;
  }

  return (
    <div className="gx-cover gx-cover-fallback flex h-full w-full items-center justify-center" aria-hidden="true">
      <HexMotif tone="dark" still className="gx-cover-img h-[78%] w-auto" />
    </div>
  );
}
