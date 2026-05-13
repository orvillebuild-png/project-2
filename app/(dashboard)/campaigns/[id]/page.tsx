import { notFound } from "next/navigation";
import { Mail, Send } from "lucide-react";
import { CampaignBodyEditor } from "@/components/campaigns/CampaignBodyEditor";
import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCurrentOrg, requireUser } from "@/lib/auth";
import { campaignRsvpSummary, getCampaign, getCampaignPreview, getCampaignSendLogCount, listCampaignRecipients, prepareCampaignRecipients, sendCampaign, sendCampaignTestEmail, updateCampaignDraft } from "@/lib/campaigns";

const mergeFields = ["{{first_name}}", "{{event_title}}", "{{event_date}}", "{{venue}}", "{{rsvp_link}}"];

export default async function CampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string; prepared?: string; saved?: string; sent?: string; test_sent?: string }>;
}) {
  const { id } = await params;
  const [{ created, error, prepared, saved, sent, test_sent: testSent }, campaign, preview, sendLogCount, recipients, user, membership] = await Promise.all([
    searchParams,
    getCampaign(id),
    getCampaignPreview(id),
    getCampaignSendLogCount(id),
    listCampaignRecipients(id),
    requireUser(),
    getCurrentOrg()
  ]);

  if (!campaign || !campaign.email_templates || !membership?.orgs) {
    notFound();
  }

  const updateAction = updateCampaignDraft.bind(null, campaign.id);
  const prepareAction = prepareCampaignRecipients.bind(null, campaign.id);
  const sendAction = sendCampaign.bind(null, campaign.id);
  const testEmailAction = sendCampaignTestEmail.bind(null, campaign.id);
  const summary = campaignRsvpSummary(recipients);
  const pendingRecipients = recipients.filter((recipient) => recipient.delivery_status === "pending").length;
  const blockedEmailRecipients = recipients.filter((recipient) => {
    const status = recipient.contacts?.email_status;
    return recipient.delivery_status === "pending" && (status === "invalid" || status === "disposable");
  }).length;
  const unverifiedEmailRecipients = recipients.filter((recipient) => {
    const status = recipient.contacts?.email_status ?? "pending";
    return recipient.delivery_status === "pending" && (status === "pending" || status === "unknown" || status === "risky");
  }).length;
  const campaignTitle = campaign.name ?? campaign.email_templates.name;
  const eventTitle = campaign.events?.title ?? "the event";

  return (
    <div className="space-y-5">
      <section className="surface-in overflow-hidden rounded-[1.75rem] border border-white/70 bg-night text-white shadow-lift">
        <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.18em] text-night">
                Campaign studio
              </span>
              <Badge tone={campaign.status === "sent" ? "green" : campaign.status === "sending" ? "amber" : "gray"}>
                {campaign.status}
              </Badge>
            </div>
            <h1 className="mt-5 max-w-3xl text-[clamp(2rem,5vw,4.25rem)] font-semibold leading-[0.95] tracking-normal">
              {campaignTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
              Compose, preview, prepare RSVP links, test, and send from one focused workspace.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-white/12 bg-white/8 p-4">
            <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-white/42">Active event</p>
            <p className="mt-2 text-lg font-semibold">{eventTitle}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <HeroMetric label="Recipients" value={campaign.recipient_count} />
              <HeroMetric label="Prepared" value={recipients.length} />
              <HeroMetric label="Pending" value={pendingRecipients} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-line/80 bg-white/50 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-moss">Composer</p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">Email campaign editor</h2>
                </div>
                <Button href="/campaigns" variant="secondary">Back to campaigns</Button>
              </div>
            </div>
            <form action={updateAction} className="grid gap-5 p-5">
              {error ? <ErrorNotice error={error} /> : null}
              {created ? <Notice>Campaign draft created.</Notice> : null}
              {saved ? <Notice>Campaign draft saved.</Notice> : null}
              {prepared ? <Notice>Prepared {prepared} new pending recipient{prepared === "1" ? "" : "s"}.</Notice> : null}
              {sent ? <Notice>Sent campaign email to {sent} recipient{sent === "1" ? "" : "s"}.</Notice> : null}
              {testSent ? <Notice>Test email sent.</Notice> : null}

              <section className="grid gap-4 rounded-2xl border border-line/90 bg-field/70 p-4 md:grid-cols-2">
                <SectionTitle
                  description="The internal campaign name keeps operations organized; the subject is what recipients see."
                  icon={<Mail className="h-4 w-4" />}
                  title="Campaign brief"
                />
                <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
                  Campaign name
                  <input
                    className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                    defaultValue={campaignTitle}
                    name="name"
                    required
                  />
                </label>
                <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
                  Subject
                  <input
                    className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                    defaultValue={campaign.email_templates.subject}
                    name="subject"
                    required
                  />
                </label>
              </section>

              <CampaignBodyEditor defaultValue={campaign.email_templates.html_body} mergeFields={mergeFields} />

              <EmailTemplateControls design={campaign.email_templates.design_data} orgId={membership.orgs.id} />

              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader description="Live response counts from prepared recipients." title="RSVP pulse" />
            <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
              {[
                { label: "Yes", value: summary.yes, tone: "green" as const },
                { label: "Maybe", value: summary.maybe, tone: "amber" as const },
                { label: "No", value: summary.no, tone: "coral" as const },
                { label: "Pending", value: summary.pending, tone: "gray" as const }
              ].map(({ label, value, tone }) => (
                <div className="rounded-2xl border border-line bg-field/72 p-4" key={label}>
                  <Badge tone={tone}>{label}</Badge>
                  <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
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
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-field text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Email</th>
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
                        <td className="px-4 py-3">
                          <EmailStatusBadge status={recipient.contacts?.email_status ?? "pending"} />
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
                <p className="rounded-2xl border border-dashed border-line bg-field px-4 py-8 text-center text-sm text-muted">
                  Prepare the recipient log to generate RSVP links.
                </p>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-[#ffe07a] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-night/55">Live email preview</p>
                  <h2 className="mt-1 text-lg font-semibold text-night">Recipient view</h2>
                </div>
                <Button className="bg-white/88 text-night hover:bg-white" href={`/campaigns/${campaign.id}/preview`} variant="secondary">
                  Full size
                </Button>
              </div>
            </div>
            <div className="p-5">
              {preview ? (
                <div className="rounded-[1.4rem] border border-line bg-white p-2 shadow-soft">
                  <div className="rounded-[1.1rem] bg-field px-4 py-3">
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted">To: {preview.sampleEmail}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{preview.subject}</p>
                  </div>
                  <iframe
                    className="mt-3 h-[600px] w-full rounded-[1.1rem] border border-line bg-white"
                    src={`/campaigns/${campaign.id}/email-preview`}
                    title="Email preview"
                  />
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-line bg-field px-4 py-8 text-center text-sm text-muted">
                  Add invitees to preview merge fields.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-moss" />
              <h2 className="text-base font-semibold text-ink">Delivery console</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              Prepare RSVP links, test the render, then send only to pending recipients.
            </p>
            <div className="mt-4 space-y-4">
              <form action={prepareAction} className="rounded-2xl border border-line bg-field/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">RSVP links</p>
                    <p className="mt-1 text-xs text-muted">{sendLogCount} prepared record{sendLogCount === 1 ? "" : "s"}</p>
                  </div>
                  <Button type="submit" variant="secondary">
                    {sendLogCount > 0 ? "Sync" : "Generate"}
                  </Button>
                </div>
              </form>

              <form action={testEmailAction} className="rounded-2xl border border-line bg-white/70 p-3">
                <p className="text-sm font-semibold text-ink">Test email</p>
                <input
                  className="mt-3 h-10 w-full rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                  defaultValue={user.email ?? ""}
                  name="test_to"
                  placeholder="you@example.com"
                  type="email"
                />
                <Button className="mt-3 w-full" type="submit" variant="secondary">Send test email</Button>
              </form>

              <form action={sendAction} className="rounded-2xl border border-line bg-night p-4 text-white">
                <p className="text-sm font-semibold">Send campaign</p>
                <p className="mt-2 text-xs leading-5 text-white/62">
                  Sends to {pendingRecipients} pending recipient{pendingRecipients === 1 ? "" : "s"} with prepared RSVP links.
                </p>
                {campaign.status === "sent" ? (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/78">
                    This campaign has been sent. New recipients can still be synced and sent later.
                  </p>
                ) : null}
                {blockedEmailRecipients > 0 ? (
                  <p className="mt-3 rounded-xl border border-[#ffb8a8]/40 bg-[#ffebe7]/10 px-3 py-2 text-xs leading-5 text-[#ffd4cc]">
                    {blockedEmailRecipients} pending recipient{blockedEmailRecipients === 1 ? " has" : "s have"} invalid or disposable email. Fix or remove them before sending.
                  </p>
                ) : unverifiedEmailRecipients > 0 ? (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs leading-5 text-white/72">
                    {unverifiedEmailRecipients} pending recipient{unverifiedEmailRecipients === 1 ? " is" : "s are"} not confirmed valid yet. You can verify contacts before sending.
                  </p>
                ) : null}
                <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/70">
                  <input
                    className="mt-1 h-4 w-4 rounded border-line text-moss focus:ring-moss"
                    disabled={pendingRecipients === 0 || blockedEmailRecipients > 0 || campaign.status === "sending"}
                    name="confirm_send"
                    type="checkbox"
                  />
                  I understand this will send real email to every pending recipient.
                </label>
                <Button className="mt-3 w-full bg-amber text-night hover:bg-butter" disabled={pendingRecipients === 0 || blockedEmailRecipients > 0 || campaign.status === "sending"} type="submit">
                  Send campaign
                </Button>
              </form>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3">
      <p className="text-xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white/45">{label}</p>
    </div>
  );
}

function SectionTitle({
  description,
  icon,
  title
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex gap-3 md:col-span-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-[0.78rem] leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

function ErrorNotice({ error }: { error: string }) {
  const message = error === "missing_fields"
    ? "Campaign name, subject, and message are required."
    : error === "no_recipients"
      ? "Select invitees for the event before preparing recipients."
      : error === "email_not_configured"
        ? "Email is not configured yet. Add RESEND_API_KEY and RESEND_FROM_EMAIL to enable test sends."
        : error === "missing_test_email"
          ? "Enter an email address for the test send."
          : error === "confirm_send"
            ? "Confirm the send before sending this campaign."
            : error === "no_pending_recipients"
              ? "There are no pending recipients to send. Sync the recipient log first, or the campaign may already be sent."
              : error === "already_sending"
                ? "This campaign is already sending."
                : error === "invalid_email_recipients"
                  ? "Some pending recipients have invalid or disposable emails. Fix or remove those contacts before sending."
                  : decodeURIComponent(error);

  return (
    <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
      {message}
    </p>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
      {children}
    </p>
  );
}
