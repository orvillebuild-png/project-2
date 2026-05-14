import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { EventSessionForm } from "@/components/events/EventSessionForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { addEventSession, getEvent, listEventSessions, listLocations, publishEvent } from "@/lib/events";
import { listEventInviteeCount } from "@/lib/invitees";

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
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; session_added?: string; session_saved?: string }>;
}) {
  const { id } = await params;
  const { error, saved, session_added: sessionAdded, session_saved: sessionSaved } = await searchParams;
  const [event, sessions, locations, inviteeCount] = await Promise.all([
    getEvent(id),
    listEventSessions(id),
    listLocations(),
    listEventInviteeCount(id)
  ]);

  if (!event) {
    notFound();
  }

  const publishAction = publishEvent.bind(null, event.id);
  const addSessionAction = addEventSession.bind(null, event.id);
  const hasSessions = event.type === "multi_location" || event.type === "multi_time";
  const sessionLabel = event.type === "multi_time" ? "Time sessions" : "Venue sessions";

  return (
    <>
      <PageHeader
        action={
          <div className="flex gap-2">
            <Button href={`/events/${event.id}/edit`} variant="secondary">Edit event</Button>
            <Button href="/events" variant="secondary">Back to events</Button>
          </div>
        }
        description="Review event setup before invitee selection and campaign drafting."
        eyebrow="Events"
        title={event.title}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <Card className="overflow-hidden">
          <div className="border-b border-line/80 bg-night px-5 py-5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={event.status === "published" ? "green" : event.status === "cancelled" ? "coral" : "amber"}>
                {event.status}
              </Badge>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[0.72rem] font-bold capitalize text-white/72">
                {event.type.replace("_", " ")}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/66">
              {event.description || "Event setup is ready for schedule, venue, sessions, invitees, and campaign drafting."}
            </p>
          </div>
          <div className="p-5">
          {error ? (
            <p className="mb-4 rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {error === "session_missing_fields" ? "Session name and venue are required." : decodeURIComponent(error)}
            </p>
          ) : null}
          {saved ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Event updated.
            </p>
          ) : null}
          {sessionAdded ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Session added.
            </p>
          ) : null}
          {sessionSaved ? (
            <p className="mb-4 rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">
              Session updated.
            </p>
          ) : null}
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-field/72 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-moss"><CalendarDays className="h-5 w-5" /></span>
              <h2 className="mt-3 text-sm font-semibold text-ink">Schedule</h2>
              <p className="mt-2 text-sm text-muted">Starts: {eventDate(event.starts_at)}</p>
              <p className="mt-1 text-sm text-muted">Ends: {eventDate(event.ends_at)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-field/72 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-moss"><MapPin className="h-5 w-5" /></span>
              <h2 className="mt-3 text-sm font-semibold text-ink">Venue</h2>
              <p className="mt-2 text-sm text-muted">{event.locations?.name ?? "Not set"}</p>
              {event.locations?.address ? <p className="mt-1 text-sm text-muted">{event.locations.address}</p> : null}
            </div>
          </div>
          {hasSessions ? (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{sessionLabel}</h2>
                  <p className="mt-1 text-sm text-muted">Sessions stay inside this parent event.</p>
                </div>
              </div>
              {sessions.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {sessions.map((session) => (
                    <div className="rounded-2xl border border-line bg-white/80 p-4 shadow-sm" key={session.id}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold text-ink">{session.title}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">Capacity: {session.capacity ?? "Not set"}</span>
                          <Button className="h-8 px-3" href={`/events/${event.id}/sessions/${session.id}/edit`} variant="secondary">Edit</Button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted">{eventDate(session.starts_at)} - {eventDate(session.ends_at)}</p>
                      <p className="mt-1 text-sm text-muted">{session.locations?.name ?? "Venue not set"}</p>
                      {session.locations?.address ? <p className="mt-1 text-sm text-muted">{session.locations.address}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">No sessions yet.</p>
              )}
              <EventSessionForm action={addSessionAction} collapsed locations={locations} />
            </div>
          ) : null}
          </div>
        </Card>
        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <Card className="p-5">
            <Users className="h-5 w-5 text-moss" />
            <h2 className="mt-3 text-base font-semibold text-ink">Invitees</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {inviteeCount} contact{inviteeCount === 1 ? "" : "s"} selected for this event.
            </p>
            <Button className="mt-4 w-full" href={`/events/${event.id}/invitees`} variant="secondary">Select invitees</Button>
          </Card>
          {event.status === "draft" ? (
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink">Publishing</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Publish when the event details are ready for invitee selection and campaigns.
              </p>
              <form action={publishAction} className="mt-4">
                <Button className="w-full" type="submit">Publish event</Button>
              </form>
            </Card>
          ) : null}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-ink">Capacity</h2>
            <p className="mt-2 text-sm text-muted">{event.capacity ?? "Not set"}</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
