"use client";

import Image from "next/image";
import Link from "next/link";

const BRAND_LOGO_IMG_CLASS =
  "h-7 w-auto max-w-44 object-contain object-left " +
  "opacity-100 " +
  "drop-shadow-sm " +
  "dark:opacity-100 " +
  "dark:brightness-0 dark:invert";

export function BrandLogoLink({
  href,
  className,
  priority = false,
}: {
  href: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={className}
      aria-label="Kernie トップ"
    >
      <Image
        src="/kernie-logo.png"
        alt=""
        width={160}
        height={28}
        className={BRAND_LOGO_IMG_CLASS}
        priority={priority}
      />
    </Link>
  );
}
