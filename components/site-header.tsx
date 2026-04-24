import { auth } from "@/auth";
import { BrandLogoLink } from "@/components/brand-logo-link";
import { SiteHeaderNav } from "@/components/site-header-nav";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 backdrop-blur">
      {/* max-w aligns with main content columns (see app pages using max-w-3xl). */}
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <BrandLogoLink href="/" className="shrink-0" priority />
        <SiteHeaderNav loggedIn={Boolean(session?.user)} />
      </div>
    </header>
  );
}
