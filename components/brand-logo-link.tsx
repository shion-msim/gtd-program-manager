"use client";

import Image from "next/image";
import Link from "next/link";

const BRAND_LOGO_IMG_CLASS =
  "h-7 w-auto max-w-[min(11rem,100%)] object-contain object-left " +
  "opacity-[0.98] " +
  "[filter:contrast(1.05)_saturate(0.99)_drop-shadow(0_1px_1px_rgba(0,0,0,0.1))] " +
  "dark:opacity-100 " +
  "dark:[filter:brightness(0)_invert(1)_contrast(1.05)_saturate(0.99)_drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]";

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
