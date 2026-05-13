import { notFound } from "next/navigation";
import { Link2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCampaign, getCampaignPreview, getCampaignSendLogCount, listCampaignRecipients, prepareCampaignRecipients, updateCampaignDraft } from "@/lib/campaigns";

export default async function CampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string; prepared?: string; saved?: string }>;
}) {
  const { id } = await params;
  const [{ created, error, prepared, saved }, campaign, preview, sendLogCount, recipients] = await Promise.all([
    searchParams,
    getCampaign(id),
    getCampaignPreview(id),
    getCampaignSendLogCount(id),
    listCampaignRecipients(id)
  ]);

  if (!campaign || !campaign.email_templates) {
    notFound();
  }

  const updateAction = updateCampaignDraft.bind(null, campaign.id);
  const prepareAction = prepareCampaignRecipients.bind(null, campaign.id);

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
                      : decodeURIComponent(error)}
                </p>
              ) : null}
              {created ? <Notice>Campaign draft created.</Notice> : null}
              {saved ? <Notice>Campaign draft saved.</Notice> : null}
              {prepared ? <Notice>Prepared {prepared} new pending recipient{prepared === "1" ? "" : "s"}.</Notice> : null}
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
                  <h2 className="mt-3 text-base font-semibold text-ink">{preview.subject}</h2>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted">{preview.body}</div>
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
