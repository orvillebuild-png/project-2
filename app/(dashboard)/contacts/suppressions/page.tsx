import { Ban, MailWarning, Plus } from "lucide-react";
import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { contactDisplayName, createManualSuppression, listContactSuppressions, removeContactSuppression } from "@/lib/contacts";

export default async function ContactSuppressionsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string; error?: string; removed?: string }>;
}) {
  const [{ created, error, removed }, suppressions] = await Promise.all([
    searchParams,
    listContactSuppressions()
  ]);
  const bounceCount = suppressions.filter((suppression) => suppression.reason === "bounce").length;
  const complaintCount = suppressions.filter((suppression) => suppression.reason === "complaint").length;
  const unsubscribeCount = suppressions.filter((suppression) => suppression.reason === "unsubscribe").length;
  const manualCount = suppressions.filter((suppression) => suppression.reason === "manual").length;

  return (
    <>
      <PageHeader
        action={<Button href="/contacts" variant="secondary">Back to contacts</Button>}
        description="Review contacts that should not receive future campaign email because they bounced, complained, unsubscribed, or were manually suppressed."
        eyebrow="Email health"
        title="Suppression list"
      />

      {error ? <Notice tone="error">{decodeURIComponent(error)}</Notice> : null}
      {created ? <Notice>Email suppressed.</Notice> : null}
      {removed ? <Notice>Suppression removed.</Notice> : null}

      <section className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Total suppressed" value={suppressions.length} />
        <Metric label="Bounces" value={bounceCount} />
        <Metric label="Complaints" value={complaintCount} />
        <Metric label="Manual" value={manualCount + unsubscribeCount} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card>
          <CardHeader
            description="Use this when you need to prevent a known contact from receiving future campaigns."
            title="Manual suppression"
          />
          <form action={createManualSuppression} className="space-y-4 p-5">
            <div className="rounded-2xl border border-line bg-field/70 p-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-moss" />
                <p className="text-sm font-semibold text-ink">Suppress existing contact</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Manual suppression requires the email to already exist as a contact. This avoids creating orphan suppression rows.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-ink">
              Contact email
              <input
                className="h-11 rounded-xl border border-line bg-field px-3 outline-none focus:border-moss"
                name="email"
                placeholder="person@example.org"
                type="email"
                required
              />
            </label>
            <Button className="w-full" type="submit">
              <Ban className="h-4 w-4" />
              Suppress email
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            description="Suppressed contacts are skipped automatically before Resend is called."
            title="Suppressed contacts"
          />
          <div className="p-5">
            {suppressions.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-line bg-white/70">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-field text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Email health</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {suppressions.map((suppression) => {
                      const removeAction = removeContactSuppression.bind(null, suppression.id);
                      const contact = suppression.contacts;

                      return (
                        <tr key={suppression.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-ink">
                              {contact ? contactDisplayName(contact) : suppression.email}
                            </p>
                            <p className="text-xs text-muted">{suppression.email}</p>
                            {contact?.organization_name ? (
                              <p className="mt-1 text-xs text-muted">{contact.organization_name}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={reasonTone(suppression.reason)}>{reasonLabel(suppression.reason)}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <EmailStatusBadge status={contact?.email_status ?? "unknown"} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {suppression.source_send_log_id ? "Campaign feedback" : "Manual or direct preference"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted">
                            {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(suppression.created_at))}
                          </td>
                          <td className="px-4 py-3">
                            <form action={removeAction}>
                              <Button className="h-9 px-3 text-coral" type="submit" variant="ghost">Remove</Button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                description="Bounces, complaints, unsubscribes, and manual suppressions will appear here."
                title="No suppressed contacts"
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex gap-3 p-5 text-sm leading-6 text-muted">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
          <p>
            Removing a suppression allows future campaign sends again. It does not automatically change the contact email status, so verify bounced addresses before sending to them again.
          </p>
        </div>
      </Card>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface-in rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function Notice({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "error" }) {
  return (
    <p className={`mb-4 rounded-xl border px-3 py-2 text-sm ${tone === "error" ? "border-[#f3c2b8] bg-[#fff0ed] text-coral" : "border-[#d7e9d9] bg-[#edf7f0] text-moss"}`}>
      {children}
    </p>
  );
}

function reasonLabel(reason: string) {
  if (reason === "bounce") {
    return "Bounced";
  }

  if (reason === "complaint") {
    return "Complaint";
  }

  if (reason === "unsubscribe") {
    return "Unsubscribed";
  }

  return "Manual";
}

function reasonTone(reason: string): "green" | "amber" | "coral" | "gray" {
  if (reason === "bounce" || reason === "complaint") {
    return "coral";
  }

  if (reason === "unsubscribe") {
    return "amber";
  }

  return "gray";
}
