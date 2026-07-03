import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = "default",
  href = "/",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
  href?: string;
}) {
  const sizeClasses = {
    sm: "h-10 w-auto max-w-[220px]",
    default: "h-12 w-auto max-w-[280px] sm:h-14 sm:max-w-[340px]",
    lg: "h-16 w-auto max-w-[360px] sm:h-[4.5rem] sm:max-w-[420px]",
  };

  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/ucbs-brand-logo.png"
        alt="UCBS Utility Concepts — Business Solutions Ltd"
        width={520}
        height={120}
        className={cn("object-contain object-left", sizeClasses[size])}
        priority
      />
    </Link>
  );
}
