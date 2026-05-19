import { MailX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getUnsubscribeDetails, unsubscribeByToken } from "@/lib/unsubscribe";

export default async function UnsubscribePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; unsubscribed?: string }>;
}) {
  const [{ token }, { error, unsubscribed }] = await Promise.all([params, searchParams]);
  const details = await getUnsubscribeDetails(token);
  const action = unsubscribeByToken.bind(null, token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4eb] px-4 py-12">
      <Card className="w-full max-w-xl overflow-hidden">
        <div className="bg-night px-6 py-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber">Email preferences</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Unsubscribe</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/70">
            Stop future campaign emails from this organization.
          </p>
        </div>

        <div className="space-y-5 p-6">
          {error ? (
            <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {decodeURIComponent(error)}
            </p>
          ) : null}

          {!details ? (
            <PreferencePanel title="Link not found">
              This unsubscribe link is invalid or has already been disconnected from the campaign record.
            </PreferencePanel>
          ) : unsubscribed || details.already_unsubscribed ? (
            <PreferencePanel title="You are unsubscribed">
              {details.contact_email} will not receive future campaign emails from {details.org_name}.
            </PreferencePanel>
          ) : (
            <>
              <PreferencePanel title={details.org_name}>
                Unsubscribe {details.contact_name?.trim() || details.contact_email} from future campaign emails sent by this workspace.
              </PreferencePanel>
              <form action={action}>
                <Button className="w-full" type="submit">
                  <MailX className="h-4 w-4" />
                  Unsubscribe this email
                </Button>
              </form>
              <p className="text-xs leading-5 text-muted">
                This only suppresses campaign email. It does not delete the contact record or RSVP history.
              </p>
            </>
          )}
        </div>
      </Card>
    </main>
  );
}

function PreferencePanel({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/80 p-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{children}</p>
    </div>
  );
}
