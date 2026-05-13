import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getEvent } from "@/lib/events";

function eventDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function EventDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <PageHeader
        action={<Button href="/events" variant="secondary">Back to events</Button>}
        description="Review event setup before invitee selection and campaign drafting."
        eyebrow="Events"
        title={event.title}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone={event.status === "published" ? "green" : event.status === "cancelled" ? "coral" : "amber"}>
              {event.status}
            </Badge>
            <Badge>{event.type.replace("_", " ")}</Badge>
          </div>
          {event.description ? <p className="mt-4 text-sm leading-6 text-muted">{event.description}</p> : null}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-field p-4">
              <CalendarDays className="h-5 w-5 text-moss" />
              <h2 className="mt-3 text-sm font-semibold text-ink">Schedule</h2>
              <p className="mt-2 text-sm text-muted">Starts: {eventDate(event.starts_at)}</p>
              <p className="mt-1 text-sm text-muted">Ends: {eventDate(event.ends_at)}</p>
            </div>
            <div className="rounded-lg border border-line bg-field p-4">
              <MapPin className="h-5 w-5 text-moss" />
              <h2 className="mt-3 text-sm font-semibold text-ink">Venue</h2>
              <p className="mt-2 text-sm text-muted">{event.locations?.name ?? "Not set"}</p>
              {event.locations?.address ? <p className="mt-1 text-sm text-muted">{event.locations.address}</p> : null}
            </div>
          </div>
        </Card>
        <aside className="space-y-4">
          <Card className="p-5">
            <Users className="h-5 w-5 text-moss" />
            <h2 className="mt-3 text-base font-semibold text-ink">Invitees</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Contact selection by filters, tags, and source is next.
            </p>
            <Button className="mt-4 w-full" href={`/events/${event.id}/invitees`} variant="secondary">Select invitees</Button>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Capacity</h2>
            <p className="mt-2 text-sm text-muted">{event.capacity ?? "Not set"}</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
