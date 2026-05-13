import { CalendarDays, MapPin, Plus } from "lucide-react";
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

  return (
    <>
      <PageHeader
        action={<Button href="/events/new"><Plus className="h-4 w-4" />Event</Button>}
        description="Create events, manage venue details, and prepare invitation audiences."
        eyebrow="Events"
        title="Events"
      />
      <Card>
        <CardHeader
          description={`${events.length} event${events.length === 1 ? "" : "s"} in this workspace`}
          title="Event list"
        />
        <div className="p-5">
          {created ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Event created.
            </p>
          ) : null}
          {events.length > 0 ? (
            <div className="grid gap-3">
              {events.map((event) => (
                <div className="rounded-lg border border-line bg-white p-4" key={event.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-ink">{event.title}</h2>
                        <Badge tone={event.status === "published" ? "green" : event.status === "cancelled" ? "coral" : "amber"}>
                          {event.status}
                        </Badge>
                      </div>
                      {event.description ? <p className="mt-2 text-sm leading-6 text-muted">{event.description}</p> : null}
                    </div>
                    <Button href={`/events/${event.id}`} variant="secondary">Open</Button>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted md:grid-cols-3">
                    <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{eventDate(event.starts_at)}</span>
                    <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{event.locations?.name ?? "Location not set"}</span>
                    <span>Capacity: {event.capacity ?? "Not set"}</span>
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
