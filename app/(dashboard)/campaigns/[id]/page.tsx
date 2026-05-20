import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Mail, Send, XCircle } from "lucide-react";
import { EmailStatusBadge } from "@/components/contacts/EmailStatusBadge";
import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { EmailBuilderJsEditor } from "@/components/campaigns/EmailBuilderJsEditor";
import { CollapsibleRail } from "@/components/layout/CollapsibleRail";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getCurrentOrg, requireUser } from "@/lib/auth";
import { campaignRsvpSummary, getCampaign, getCampaignSendLogCount, listCampaignRecipients, prepareCampaignRecipients, sendCampaign, sendCampaignTestEmail, updateCampaignDraft, updateCampaignDraftAndPreview } from "@/lib/campaigns";
import { isSenderDomainVerified } from "@/lib/settings";

export default async function CampaignDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string; prepared?: string; saved?: string; sent?: string; test_sent?: string }>;
}) {
  const { id } = await params;
  const [{ created, error, prepared, saved, sent, test_sent: testSent }, campaign, sendLogCount, recipients, user, membership] = await Promise.all([
    searchParams,
    getCampaign(id),
    getCampaignSendLogCount(id),
    listCampaignRecipients(id),
    requireUser(),
    getCurrentOrg()
  ]);

  if (!campaign || !campaign.email_templates || !membership?.orgs) {
    notFound();
  }

  const updateAction = updateCampaignDraft.bind(null, campaign.id);
  const previewAction = updateCampaignDraftAndPreview.bind(null, campaign.id);
  const prepareAction = prepareCampaignRecipients.bind(null, campaign.id);
  const sendAction = sendCampaign.bind(null, campaign.id);
  const testEmailAction = sendCampaignTestEmail.bind(null, campaign.id);
  const summary = campaignRsvpSummary(recipients);
  const pendingRecipients = recipients.filter((recipient) => recipient.delivery_status === "pending").length;
  const deliveredRecipients = recipients.filter((recipient) => recipient.delivery_status === "delivered").length;
  const bouncedRecipients = recipients.filter((recipient) => recipient.delivery_status === "bounced").length;
  const complainedRecipients = recipients.filter((recipient) => recipient.delivery_status === "complained").length;
  const suppressedRecipients = recipients.filter((recipient) => recipient.delivery_status === "suppressed").length;
  const openedRecipients = recipients.filter((recipient) => recipient.opened_at).length;
  const clickedRecipients = recipients.filter((recipient) => recipient.clicked_at).length;
  const attemptedRecipients = deliveredRecipients + bouncedRecipients + complainedRecipients;
  const deliveryRate = attemptedRecipients > 0 ? Math.round((deliveredRecipients / attemptedRecipients) * 100) : 0;
  const openRate = deliveredRecipients > 0 ? Math.round((openedRecipients / deliveredRecipients) * 100) : 0;
  const clickRate = deliveredRecipients > 0 ? Math.round((clickedRecipients / deliveredRecipients) * 100) : 0;
  const lastProviderEvent = recipients
    .map((recipient) => recipient.last_provider_event_at ?? recipient.sent_at)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
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
  const configuredFromEmail = campaign.email_templates.design_data.from_email.trim();
  const customSenderVerified = configuredFromEmail
    ? await isSenderDomainVerified(membership.orgs.id, configuredFromEmail).catch(() => false)
    : null;
  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  const sendBlocked = pendingRecipients === 0 || blockedEmailRecipients > 0 || campaign.status === "sending" || !emailConfigured || customSenderVerified === false;
  const preflightItems: PreflightItem[] = [
    {
      detail: emailConfigured ? "Resend API and default sender are configured." : "Add RESEND_API_KEY and RESEND_FROM_EMAIL before sending.",
      label: "Email provider",
      status: emailConfigured ? "ready" : "blocked"
    },
    {
      detail: configuredFromEmail
        ? customSenderVerified
          ? `${configuredFromEmail} uses a verified sender domain.`
          : `${configuredFromEmail} needs a verified domain in Settings.`
        : "Using the configured default Resend sender.",
      label: "From address",
      status: customSenderVerified === false ? "blocked" : "ready"
    },
    {
      detail: recipients.length > 0 ? `${recipients.length} recipient record${recipients.length === 1 ? "" : "s"} prepared.` : "Generate RSVP links before sending.",
      label: "RSVP links",
      status: recipients.length > 0 ? "ready" : "blocked"
    },
    {
      detail: pendingRecipients > 0 ? `${pendingRecipients} pending recipient${pendingRecipients === 1 ? "" : "s"} will be considered for send.` : "No pending recipients are available to send.",
      label: "Pending recipients",
      status: pendingRecipients > 0 ? "ready" : "blocked"
    },
    {
      detail: blockedEmailRecipients > 0
        ? `${blockedEmailRecipients} invalid or disposable recipient${blockedEmailRecipients === 1 ? "" : "s"} must be fixed.`
        : "No pending recipients are marked invalid or disposable.",
      label: "Blocked emails",
      status: blockedEmailRecipients > 0 ? "blocked" : "ready"
    },
    {
      detail: suppressedRecipients > 0
        ? `${suppressedRecipients} suppressed recipient${suppressedRecipients === 1 ? " is" : "s are"} skipped automatically.`
        : "No prepared recipients are currently suppressed.",
      label: "Suppressions",
      status: suppressedRecipients > 0 ? "warning" : "ready"
    },
    {
      detail: unverifiedEmailRecipients > 0
        ? `${unverifiedEmailRecipients} pending recipient${unverifiedEmailRecipients === 1 ? " is" : "s are"} not confirmed valid yet.`
        : "Pending recipient email health looks ready.",
      label: "Email health",
      status: unverifiedEmailRecipients > 0 ? "warning" : "ready"
    }
  ];

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
              <HeroMetric label="Opened" value={openedRecipients} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
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

              <EmailBuilderJsEditor
                defaultValue={campaign.email_templates.html_body}
                design={campaign.email_templates.design_data}
                orgId={membership.orgs.id}
                previewAction={previewAction}
              />

              <EmailTemplateControls design={campaign.email_templates.design_data} />

              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>

          <Card>
            <CardHeader description="Tracked from the email pixel and rewritten links in delivered campaign emails." title="Campaign engagement" />
            <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
              {[
                { label: "Delivered", value: deliveredRecipients, detail: "Recipient inbox attempts" },
                { label: "Opened", value: openedRecipients, detail: `${openRate}% open rate` },
                { label: "Clicked", value: clickedRecipients, detail: `${clickRate}% click rate` },
                { label: "Suppressed", value: suppressedRecipients, detail: "Unsubscribed or blocked" }
              ].map(({ detail, label, value }) => (
                <div className="rounded-2xl border border-line bg-field/72 p-4" key={label}>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-moss">{label}</p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
                  <p className="mt-2 text-xs text-muted">{detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              description="Provider feedback from Resend webhooks, unsubscribe suppression, and campaign send state."
              title="Delivery health"
            />
            <div className="grid gap-3 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-line bg-field/72 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-moss">Deliverability</p>
                    <p className="mt-3 text-4xl font-semibold leading-none text-ink">{deliveryRate}%</p>
                    <p className="mt-2 text-xs text-muted">
                      {deliveredRecipients} delivered from {attemptedRecipients} provider-processed recipient{attemptedRecipients === 1 ? "" : "s"}.
                    </p>
                  </div>
                  <Badge tone={bouncedRecipients > 0 || complainedRecipients > 0 ? "amber" : "green"}>
                    {bouncedRecipients > 0 || complainedRecipients > 0 ? "Needs review" : "Clean"}
                  </Badge>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-moss" style={{ width: `${deliveryRate}%` }} />
                </div>
                <p className="mt-3 text-xs text-muted">
                  Last provider update: {lastProviderEvent ? formatCompactDate(lastProviderEvent) : "No webhook events yet"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DeliveryTile label="Pending" tone="gray" value={pendingRecipients} />
                <DeliveryTile label="Bounced" tone={bouncedRecipients > 0 ? "coral" : "gray"} value={bouncedRecipients} />
                <DeliveryTile label="Complaints" tone={complainedRecipients > 0 ? "coral" : "gray"} value={complainedRecipients} />
                <DeliveryTile label="Suppressed" tone={suppressedRecipients > 0 ? "amber" : "gray"} value={suppressedRecipients} />
              </div>
            </div>
            {bouncedRecipients > 0 || complainedRecipients > 0 ? (
              <div className="mx-5 mb-5 flex gap-3 rounded-2xl border border-[#f3c2b8] bg-[#fff0ed] p-4 text-sm leading-6 text-coral">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Review bounced or complained recipients before the next send. They are automatically suppressed, and bounced contacts are marked invalid.
                </p>
              </div>
            ) : null}
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
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-field text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted">
                    <tr>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Delivery</th>
                      <th className="px-4 py-3">Engagement</th>
                      <th className="px-4 py-3">Provider</th>
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
                        <td className="px-4 py-3">
                          <Badge tone={deliveryTone(recipient.delivery_status)}>{recipient.delivery_status}</Badge>
                          <p className="mt-1 text-xs text-muted">
                            {recipient.last_provider_event_at
                              ? formatCompactDate(recipient.last_provider_event_at)
                              : recipient.sent_at
                                ? formatCompactDate(recipient.sent_at)
                                : "Not sent"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge tone={recipient.opened_at ? "green" : "gray"}>{recipient.opened_at ? "opened" : "no open"}</Badge>
                            <Badge tone={recipient.clicked_at ? "green" : "gray"}>{recipient.clicked_at ? "clicked" : "no click"}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="max-w-[13rem] truncate text-xs text-muted" title={recipient.resend_email_id ?? undefined}>
                            {recipient.resend_email_id ?? "No Resend ID yet"}
                          </p>
                        </td>
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

        <CollapsibleRail label="Delivery console">
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
                  <SubmitButton loadingLabel="Syncing" variant="secondary">
                    {sendLogCount > 0 ? "Sync" : "Generate"}
                  </SubmitButton>
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
                <SubmitButton className="mt-3 w-full" loadingLabel="Sending test" variant="secondary">Send test email</SubmitButton>
              </form>

              <form action={sendAction} className="rounded-2xl border border-line bg-night p-4 text-white">
                <p className="text-sm font-semibold">Send campaign</p>
                <p className="mt-2 text-xs leading-5 text-white/62">
                  Sends to {pendingRecipients} pending recipient{pendingRecipients === 1 ? "" : "s"} with prepared RSVP links.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/52">Preflight</p>
                    <Badge tone={sendBlocked ? "coral" : "green"}>{sendBlocked ? "Blocked" : "Ready"}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {preflightItems.map((item) => (
                      <PreflightRow item={item} key={item.label} />
                    ))}
                  </div>
                </div>
                {campaign.status === "sent" ? (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white/78">
                    This campaign has been sent. New recipients can still be synced and sent later.
                  </p>
                ) : null}
                {suppressedRecipients > 0 ? (
                  <p className="mt-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs leading-5 text-white/72">
                    {suppressedRecipients} recipient{suppressedRecipients === 1 ? " is" : "s are"} suppressed and will be skipped automatically.
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
                    disabled={sendBlocked}
                    name="confirm_send"
                    type="checkbox"
                  />
                  I understand this will send real email to every pending recipient.
                </label>
                <SubmitButton className="mt-3 w-full bg-amber text-night hover:bg-butter" disabled={sendBlocked} loadingLabel="Sending campaign">Send campaign</SubmitButton>
              </form>
            </div>
          </Card>
        </CollapsibleRail>
      </div>
    </div>
  );
}

type PreflightItem = {
  detail: string;
  label: string;
  status: "ready" | "warning" | "blocked";
};

function PreflightRow({ item }: { item: PreflightItem }) {
  const icon = item.status === "ready"
    ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#9be7b1]" />
    : item.status === "warning"
      ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
      : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb8a8]" />;

  return (
    <div className="flex gap-2 rounded-xl border border-white/10 bg-night/50 px-3 py-2">
      {icon}
      <div>
        <p className="text-xs font-semibold text-white">{item.label}</p>
        <p className="mt-0.5 text-[0.72rem] leading-5 text-white/58">{item.detail}</p>
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

function DeliveryTile({
  label,
  tone,
  value
}: {
  label: string;
  tone: "green" | "amber" | "coral" | "gray";
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-field/72 p-4">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-3 text-3xl font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}

function deliveryTone(status: string): "green" | "amber" | "coral" | "gray" {
  if (status === "delivered") {
    return "green";
  }

  if (status === "bounced" || status === "complained") {
    return "coral";
  }

  if (status === "suppressed") {
    return "amber";
  }

  return "gray";
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
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
                : error === "no_sendable_recipients"
                  ? "All pending recipients are suppressed. Add new invitees or remove suppressions before sending."
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
