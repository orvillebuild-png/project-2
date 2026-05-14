import { CampaignBodyEditor } from "@/components/campaigns/CampaignBodyEditor";
import { EmailTemplateControls } from "@/components/campaigns/EmailTemplateControls";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { createCampaign, listCampaignEventOptions, newCampaignDesignDefaults } from "@/lib/campaigns";
import { getCurrentOrg } from "@/lib/auth";

const mergeFields = ["{{first_name}}", "{{event_title}}", "{{event_date}}", "{{venue}}", "{{rsvp_link}}"];

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, events, membership] = await Promise.all([searchParams, listCampaignEventOptions(), getCurrentOrg()]);
  const defaultEvent = events.find((event) => event.invitee_count > 0) ?? events[0];
  const designDefaults = newCampaignDesignDefaults();

  return (
    <>
      <PageHeader
        action={<Button href="/campaigns" variant="secondary">Back to campaigns</Button>}
        description="Create an invitation draft from an event's selected invitees. Nothing is sent from this screen."
        eyebrow="Campaigns"
        title="New campaign"
      />
      <Card className="max-w-5xl overflow-hidden">
        <div className="border-b border-line/80 bg-night px-5 py-5 text-white">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-amber">Campaign studio</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Start with the audience and message.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
            Choose an event, name the campaign internally, then build the first invitation draft with merge fields ready.
          </p>
        </div>
        <CardHeader
          description="The draft stays editable after creation; sending is handled on the campaign detail screen."
          title="Draft invitation"
        />
        <form action={createCampaign} className="grid gap-5 p-5">
          {error ? (
            <p className="rounded-xl border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {error === "missing_fields" ? "Choose an event, campaign name, subject, and message." : decodeURIComponent(error)}
            </p>
          ) : null}
          <section className="grid gap-4 rounded-2xl border border-line bg-field/70 p-4 md:grid-cols-2">
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
              Event
              <select
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={defaultEvent?.id ?? ""}
                name="event_id"
                required
              >
                <option value="">Choose event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.invitee_count} invitee{event.invitee_count === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Campaign name
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={defaultEvent ? `${defaultEvent.title} invitation campaign` : ""}
                name="name"
                placeholder="May donor dinner invite"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Subject
              <input
                className="h-10 rounded-xl border border-line bg-white/88 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="You're invited to {{event_title}}"
                name="subject"
                required
              />
            </label>
          </section>
          <CampaignBodyEditor
            defaultValue={"Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you."}
            design={designDefaults}
            mergeFields={mergeFields}
            orgId={membership?.orgs?.id ?? ""}
          />
          <EmailTemplateControls design={designDefaults} />
          <div className="flex justify-end">
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
