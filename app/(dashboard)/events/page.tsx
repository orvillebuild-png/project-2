import { CalendarDays, Clock3, MapPin, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { listEvents } from "@/lib/events";

function eventDate(value: string | null) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const events = await listEvents();
  const publishedCount = events.filter((event) => event.status === "published").length;
  const draftCount = events.filter((event) => event.status === "draft").length;
  const multiCount = events.filter((event) => event.type === "multi_location" || event.type === "multi_time").length;

  return (
    <>
      <PageHeader
        action={<Button href="/events/new"><Plus className="h-4 w-4" />Event</Button>}
        description="Create events, manage venue details, and prepare invitation audiences."
        eyebrow="Events"
        title="Events"
      />
      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <EventMetric icon={<CalendarDays className="h-4 w-4" />} label="Published" value={publishedCount} />
        <EventMetric icon={<Clock3 className="h-4 w-4" />} label="Drafts" value={draftCount} />
        <EventMetric icon={<MapPin className="h-4 w-4" />} label="Multi-session" value={multiCount} />
      </section>
      <Card className="overflow-hidden">
        <CardHeader
          description={`${events.length} event${events.length === 1 ? "" : "s"} in this workspace`}
          title="Event list"
        />
        <div className="p-4 sm:p-5">
          {created ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Event created.
            </p>
          ) : null}
          {events.length > 0 ? (
            <div className="grid gap-3">
              {events.map((event) => (
                <div className="group overflow-hidden rounded-[1.25rem] border border-line/90 bg-white/84 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift" key={event.id}>
                  <div className="grid gap-0 lg:grid-cols-[1fr_14rem]">
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[1rem] font-semibold text-ink">{event.title}</h2>
                        <Badge tone={event.status === "published" ? "green" : event.status === "cancelled" ? "coral" : "amber"}>
                          {event.status}
                        </Badge>
                        <Badge>{event.type.replace("_", " ")}</Badge>
                      </div>
                      {event.description ? <p className="mt-2 text-sm leading-6 text-muted">{event.description}</p> : null}
                      <div className="mt-4 grid gap-2 text-[0.82rem] text-muted md:grid-cols-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-field/70 px-3 py-2"><CalendarDays className="h-4 w-4" />{eventDate(event.starts_at)}</span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-field/70 px-3 py-2"><MapPin className="h-4 w-4" />{event.locations?.name ?? "Location not set"}</span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-field/70 px-3 py-2"><Users className="h-4 w-4" />Capacity: {event.capacity ?? "Not set"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end border-t border-line bg-[#fbf7e8] p-4 lg:border-l lg:border-t-0">
                      <Button href={`/events/${event.id}`} variant="secondary">Open</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              actionLabel="Create event"
              description="Start with a single event. Invitee selection and campaign drafts come next."
              href="/events/new"
              title="No events yet"
            />
          )}
        </div>
      </Card>
    </>
  );
}

function EventMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="surface-in rounded-[1.4rem] border border-white/70 bg-white/74 p-4 shadow-soft ring-1 ring-ink/5">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-moss">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff8dc] text-ink">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none text-ink">{value}</p>
    </div>
  );
}
