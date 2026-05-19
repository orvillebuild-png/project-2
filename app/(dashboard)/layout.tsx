import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { getCurrentOrg, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const membership = await getCurrentOrg();
  const org = Array.isArray(membership?.orgs) ? membership?.orgs[0] : membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  return (
    <div className="min-h-screen lg:flex">
      <RouteProgress />
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar orgName={org?.name} userEmail={user.email} />
        <main className="px-4 pb-10 pt-4 md:px-6">{children}</main>
      </div>
    </div>
  );
}
