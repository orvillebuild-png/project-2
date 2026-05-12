import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { authMessage } from "@/lib/auth-messages";
import { getCurrentOrg, requireUser } from "@/lib/auth";
import { createWorkspace } from "@/lib/orgs";

export default async function CreateOrgPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const membership = await getCurrentOrg();

  if (membership?.orgs) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;
  const message = authMessage(error) ?? (error ? decodeURIComponent(error) : null);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-xl rounded-lg border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-moss">Workspace setup</p>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Create your organization</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Your account is verified. Create the nonprofit workspace that will own contacts, events, campaigns, and billing.
        </p>
        {message ? (
          <p className="mt-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {message}
          </p>
        ) : null}
        <form action={createWorkspace} className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Organization name</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="org_name" required />
          </label>
          <label className="space-y-2 text-sm font-medium text-ink">
            <span>Organization slug</span>
            <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="org_slug" placeholder="your-org" />
          </label>
          <Button className="w-full" type="submit">Create workspace</Button>
        </form>
      </section>
    </main>
  );
}
