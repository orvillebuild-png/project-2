import { notFound } from "next/navigation";
import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { requireUser } from "@/lib/auth";
import { campaignRsvpSummary, getCampaign, getCampaignPreview, getCampaignSendLogCount, listCampaignRecipients, prepareCampaignRecipients, sendCampaignTestEmail, updateCampaignDraft } from "@/lib/campaigns";

export default async function CampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string; prepared?: string; saved?: string; test_sent?: string }>;
}) {
  const { id } = await params;
  const [{ created, error, prepared, saved, test_sent: testSent }, campaign, preview, sendLogCount, recipients, user] = await Promise.all([
    searchParams,
    getCampaign(id),
    getCampaignPreview(id),
    getCampaignSendLogCount(id),
    listCampaignRecipients(id),
    requireUser()
  ]);

  if (!campaign || !campaign.email_templates) {
    notFound();
  }

  const updateAction = updateCampaignDraft.bind(null, campaign.id);
  const prepareAction = prepareCampaignRecipients.bind(null, campaign.id);
  const testEmailAction = sendCampaignTestEmail.bind(null, campaign.id);
  const summary = campaignRsvpSummary(recipients);

  return (
    <>
      <PageHeader
        action={<Button href="/campaigns" variant="secondary">Back to campaigns</Button>}
        description={`Subject: ${campaign.email_templates.subject}`}
        eyebrow="Campaign draft"
        title={campaign.name ?? campaign.email_templates.name}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              action={<Badge tone="amber">{campaign.status}</Badge>}
              description={`${campaign.recipient_count} selected recipient${campaign.recipient_count === 1 ? "" : "s"} from ${campaign.events?.title ?? "the event"}`}
              title="Email content"
            />
            <form action={updateAction} className="grid gap-4 p-5">
              {error ? (
                <p className="rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
                  {error === "missing_fields"
                    ? "Campaign name, subject, and message are required."
                    : error === "no_recipients"
                      ? "Select invitees for the event before preparing recipients."
                      : error === "email_not_configured"
                        ? "Email is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL to enable test sends."
                        : error === "missing_test_email"
                          ? "Enter an email address for the test send."
                      : decodeURIComponent(error)}
                </p>
              ) : null}
              {created ? <Notice>Campaign draft created.</Notice> : null}
              {saved ? <Notice>Campaign draft saved.</Notice> : null}
              {prepared ? <Notice>Prepared {prepared} new pending recipient{prepared === "1" ? "" : "s"}.</Notice> : null}
              {testSent ? <Notice>Test email sent.</Notice> : null}
              <label className="grid gap-2 text-sm font-medium text-ink">
                Campaign name
                <input
                  className="h-11 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  defaultValue={campaign.name ?? campaign.email_templates.name}
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Subject
                <input
                  className="h-11 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  defaultValue={campaign.email_templates.subject}
                  name="subject"
                  required
                />
              </label>
              <div className="grid gap-4 rounded-lg border border-line bg-field p-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-ink md:col-span-2">
                  Email headline
                  <input
                    className="h-11 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-moss"
                    defaultValue={campaign.email_templates.design_data.headline}
                    name="headline"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink md:col-span-2">
                  Intro copy
                  <textarea
                    className="min-h-24 rounded-md border border-line bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-moss"
                    defaultValue={campaign.email_templates.design_data.intro}
                    name="intro"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink">
                  RSVP button label
                  <input
                    className="h-11 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-moss"
                    defaultValue={campaign.email_templates.design_data.button_label}
                    name="button_label"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-ink">
                  Footer
                  <input
                    className="h-11 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-moss"
                    defaultValue={campaign.email_templates.design_data.footer}
                    name="footer"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink md:col-span-2">
                  <input
                    className="h-4 w-4 rounded border-line text-moss focus:ring-moss"
                    defaultChecked={campaign.email_templates.design_data.show_event_details}
                    name="show_event_details"
                    type="checkbox"
                  />
                  Show event details block
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-ink">
                Message
                <textarea
                  className="min-h-80 rounded-md border border-line bg-field px-3 py-3 text-sm leading-6 outline-none focus:border-moss"
                  defaultValue={campaign.email_templates.html_body}
                  name="body"
                  required
                />
              </label>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
          <Card>
            <CardHeader description="Live response counts from prepared recipients." title="RSVP summary" />
            <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
              {[
                { label: "Yes", value: summary.yes, tone: "green" as const },
                { label: "Maybe", value: summary.maybe, tone: "amber" as const },
                { label: "No", value: summary.no, tone: "coral" as const },
                { label: "Pending", value: summary.pending, tone: "gray" as const }
              ].map(({ label, value, tone }) => (
                <div className="rounded-lg border border-line bg-field p-4" key={label}>
                  <Badge tone={tone}>{label}</Badge>
                  <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader
              description={`${recipients.length} prepared recipient${recipients.length === 1 ? "" : "s"} with RSVP token${recipients.length === 1 ? "" : "s"}`}
              title="Recipient RSVP status"
            />
            <div className="overflow-x-auto p-5">
              {recipients.length > 0 ? (
                <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                  <thead className="bg-field text-xs font-bold uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Delivery</th>
                      <th className="px-4 py-3">RSVP</th>
                      <th className="px-4 py-3">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {recipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{[recipient.contacts?.first_name, recipient.contacts?.last_name].filter(Boolean).join(" ") || recipient.contacts?.email}</p>
                          <p className="text-xs text-muted">{recipient.contacts?.email}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">{recipient.delivery_status}</td>
                        <td className="px-4 py-3">
                          <Badge tone={recipient.rsvp_responses?.response === "yes" ? "green" : recipient.rsvp_responses?.response === "no" ? "coral" : recipient.rsvp_responses?.response === "maybe" ? "amber" : "gray"}>
                            {recipient.rsvp_responses?.response ?? "pending"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <a className="font-semibold text-moss" href={`/rsvp/${recipient.rsvp_token}`} target="_blank">Open RSVP</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="rounded-lg border border-dashed border-line bg-field px-4 py-8 text-center text-sm text-muted">
                  Prepare the recipient log to generate RSVP links.
                </p>
              )}
            </div>
          </Card>
        </div>
        <aside className="space-y-5">
          <Card>
            <CardHeader description="Rendered using the first selected invitee." title="Preview" />
            <div className="p-5">
              {preview ? (
                <div className="rounded-lg border border-line bg-field p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">To: {preview.sampleEmail}</p>
                  <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
                    <div className="bg-moss px-4 py-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">Invitation</p>
                      <h2 className="mt-2 text-xl font-semibold">{preview.design.headline}</h2>
                    </div>
                    <div className="space-y-4 p-4">
                      {preview.design.intro ? <p className="text-sm leading-6 text-muted">{preview.design.intro}</p> : null}
                      <div className="whitespace-pre-wrap text-sm leading-6 text-muted">{preview.body}</div>
                      {preview.design.show_event_details ? (
                        <div className="rounded-md border border-line bg-field p-3 text-sm text-muted">
                          <p className="font-semibold text-ink">{preview.eventTitle}</p>
                          <p className="mt-1">{preview.eventDate}</p>
                          <p className="mt-1">{preview.venue}</p>
                        </div>
                      ) : null}
                      <a className="inline-flex h-10 items-center justify-center rounded-md bg-moss px-4 text-sm font-semibold text-white" href={preview.rsvpLink}>
                        {preview.design.button_label}
                      </a>
                      {preview.design.footer ? <p className="border-t border-line pt-4 text-xs leading-5 text-muted">{preview.design.footer}</p> : null}
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">Subject preview</h3>
                  <p className="mt-1 text-sm text-muted">{preview.subject}</p>
                </div>
              ) : (
                <p className="text-sm text-muted">Add invitees to preview merge fields.</p>
              )}
            </div>
          </Card>
          <Card className="p-5">
            <Link2 className="h-5 w-5 text-moss" />
            <h2 className="mt-3 text-base font-semibold text-ink">RSVP groundwork</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {sendLogCount} pending RSVP record{sendLogCount === 1 ? "" : "s"} prepared for this campaign.
            </p>
            <form action={prepareAction} className="mt-4">
              <Button className="w-full" type="submit" variant="secondary">
                {sendLogCount > 0 ? "Sync recipient log" : "Generate RSVP links"}
              </Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Test email</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Sends the rendered campaign preview to one address when Resend is configured.
            </p>
            <form action={testEmailAction} className="mt-4 space-y-3">
              <input
                className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                defaultValue={user.email ?? ""}
                name="test_to"
                placeholder="you@example.com"
                type="email"
              />
              <Button className="w-full" type="submit" variant="secondary">Send test email</Button>
            </form>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
      {children}
    </p>
  );
}
