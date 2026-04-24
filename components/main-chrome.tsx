import { auth } from "@/auth";
import { AuthenticatedChrome } from "@/components/authenticated-chrome";
import { SiteHeader } from "@/components/site-header";
import { getSidebarNavData } from "@/lib/sidebar-nav-data";

export async function MainChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <>
        <SiteHeader />
        <div className="flex-1">{children}</div>
      </>
    );
  }

  const initialData = await getSidebarNavData(session.user.id);

  return <AuthenticatedChrome initialData={initialData}>{children}</AuthenticatedChrome>;
}
