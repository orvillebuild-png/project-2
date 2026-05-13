import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { createCampaign, listCampaignEventOptions } from "@/lib/campaigns";

const mergeFields = ["{{first_name}}", "{{event_title}}", "{{event_date}}", "{{venue}}", "{{rsvp_link}}"];

export default async function NewCampaignPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, events] = await Promise.all([searchParams, listCampaignEventOptions()]);
  const defaultEvent = events.find((event) => event.invitee_count > 0) ?? events[0];

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
          <section className="grid gap-4 rounded-2xl border border-line bg-[#fff8dc]/72 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-ink">Design direction</p>
              <p className="mt-1 text-[0.78rem] leading-5 text-muted">Shape the rendered email before you move into preview and delivery.</p>
            </div>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
              Email headline
              <input
                className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="You are invited to {{event_title}}"
                name="headline"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink md:col-span-2">
              Intro copy
              <textarea
                className="min-h-24 rounded-xl border border-line bg-white/90 px-3 py-3 text-[0.85rem] leading-6 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="We would be glad to have you with us."
                name="intro"
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              RSVP button label
              <input
                className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="RSVP now"
                name="button_label"
                required
              />
            </label>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Footer
              <input
                className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue="Thank you."
                name="footer"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-line bg-white/78 px-3 py-3 text-[0.82rem] font-semibold text-ink md:col-span-2">
              <input className="h-4 w-4 rounded border-line text-moss focus:ring-moss" defaultChecked name="show_event_details" type="checkbox" />
              Show event details block
            </label>
          </section>
          <section className="grid gap-4 rounded-2xl border border-line bg-white/68 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Message</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mergeFields.map((field) => (
                  <span className="rounded-full border border-line bg-field px-3 py-1 text-[0.72rem] font-semibold text-muted" key={field}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
              Body
              <textarea
                className="min-h-72 rounded-2xl border border-line bg-field/70 px-4 py-4 text-[0.86rem] leading-6 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
                defaultValue={"Hi {{first_name}},\n\nYou are invited to {{event_title}} on {{event_date}} at {{venue}}.\n\nPlease RSVP here: {{rsvp_link}}\n\nThank you."}
                name="body"
                required
              />
            </label>
          </section>
          <div className="flex justify-end">
            <Button type="submit">Save draft</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
