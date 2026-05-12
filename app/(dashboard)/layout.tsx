import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { getCurrentOrg, requireUser } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const membership = await getCurrentOrg();
  const org = Array.isArray(membership?.orgs) ? membership?.orgs[0] : membership?.orgs;

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar orgName={org?.name} userEmail={user.email} />
        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
