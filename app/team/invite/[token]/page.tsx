import Link from "next/link";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSessionUser } from "@/lib/auth";
import { acceptTeamInvitation, getTeamInvitation } from "@/lib/settings";

const errorMessages: Record<string, string> = {
  already_used: "This invitation has already been used.",
  email_mismatch: "You are signed in with a different email than the invited address.",
  expired: "This invitation has expired. Ask an admin to send a new one.",
  not_found: "This invitation could not be found or is not available to the current account."
};

export default async function TeamInvitePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ token }, { error }, user] = await Promise.all([params, searchParams, getSessionUser()]);
  const invitation = user ? await getTeamInvitation(token) : null;
  const acceptAction = acceptTeamInvitation.bind(null, token);
  const next = `/team/invite/${token}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4eb] px-4 py-12">
      <Card className="w-full max-w-xl overflow-hidden">
        <div className="bg-night px-6 py-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber">Team invitation</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Join a Project 2 workspace</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
            Accept the invite with the same email address it was sent to.
          </p>
        </div>

        <div className="space-y-5 p-6">
          {error ? (
            <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {errorMessages[error] ?? decodeURIComponent(error)}
            </p>
          ) : null}

          {!user ? (
            <>
              <InviteStep icon={<Mail className="h-4 w-4" />} title="Sign in first">
                Use the invited email address so the invitation can be matched safely.
              </InviteStep>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button href={`/login?next=${encodeURIComponent(next)}`}>Log in to accept</Button>
                <Button href={`/signup?invite=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`} variant="secondary">Create account</Button>
              </div>
            </>
          ) : invitation ? (
            <>
              <InviteStep icon={<ShieldCheck className="h-4 w-4" />} title={invitation.orgs?.name ?? "Workspace invitation"}>
                {invitation.email} will join as {invitation.role}. This invite expires on {new Intl.DateTimeFormat("en", {
                  dateStyle: "medium"
                }).format(new Date(invitation.expires_at))}.
              </InviteStep>
              {invitation.status === "pending" ? (
                <form action={acceptAction}>
                  <Button className="w-full" type="submit"><CheckCircle2 className="h-4 w-4" />Accept invitation</Button>
                </form>
              ) : (
                <Button className="w-full" href="/dashboard">Go to dashboard</Button>
              )}
            </>
          ) : (
            <>
              <InviteStep icon={<Mail className="h-4 w-4" />} title="No matching invitation">
                You are signed in as {user.email}. If this invite was sent to another email, log out and sign in with that address.
              </InviteStep>
              <div className="flex flex-wrap gap-3">
                <Button href="/dashboard">Go to dashboard</Button>
                <Link className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold text-muted hover:text-ink" href="/login">
                  Switch account
                </Link>
              </div>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}

function InviteStep({
  children,
  icon,
  title
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-night">{icon}</span>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}
