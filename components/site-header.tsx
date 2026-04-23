import { auth } from "@/auth";
import Link from "next/link";
import { SiteHeaderNav } from "@/components/site-header-nav";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 backdrop-blur">
      {/* max-w aligns with main content columns (see app pages using max-w-3xl). */}
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-foreground font-medium">
          GTD マネージャー
        </Link>
        <SiteHeaderNav loggedIn={Boolean(session?.user)} />
      </div>
    </header>
  );
}
