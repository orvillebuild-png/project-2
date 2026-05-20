"use client";

import { CalendarDays, MapPin, RadioTower } from "lucide-react";
import { useMemo, useState } from "react";
import { EventDateTimeFields } from "@/components/events/EventDateTimeFields";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { EventListItem, LocationOption } from "@/lib/events";

const eventTypeOptions: Array<{ label: string; value: EventListItem["type"] }> = [
  { label: "Single", value: "single" },
  { label: "Recurring", value: "recurring" },
  { label: "Multi-location", value: "multi_location" },
  { label: "Multi-time", value: "multi_time" }
];

export function EventForm({
  action,
  cancelHref = "/events",
  dateSeed,
  event,
  locations
}: {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  dateSeed?: string | null;
  event?: EventListItem;
  locations: LocationOption[];
}) {
  const [eventType, setEventType] = useState(event?.type ?? "single");
  const [venueName, setVenueName] = useState(event?.locations?.name ?? "");
  const [venueAddress, setVenueAddress] = useState(event?.locations?.address ?? "");
  const locationLookup = useMemo(() => new Map(locations.map((location) => [location.name, location])), [locations]);

  function updateVenue(name: string) {
    setVenueName(name);
    const location = locationLookup.get(name);

    if (location) {
      setVenueAddress(location.address ?? "");
    }
  }

  return (
    <form action={action} className="grid gap-5">
      <section className="rounded-2xl border border-line/90 bg-field/70 p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night text-amber"><CalendarDays className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Event basics</h2>
            <p className="text-[0.78rem] text-muted">Name the parent event and define what invitees will see.</p>
          </div>
        </div>
      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Title</span>
        <input className="h-11 w-full rounded-xl border border-line bg-white/90 px-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" defaultValue={event?.title ?? ""} name="title" required placeholder="Fundraising gala" />
      </label>
      <label className="mt-4 block space-y-2 text-sm font-medium text-ink">
        <span>Description</span>
        <textarea className="min-h-28 w-full rounded-xl border border-line bg-white/90 px-3 py-3 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10" defaultValue={event?.description ?? ""} name="description" placeholder="Private notes or public event summary" />
      </label>
      </section>

      <fieldset className="rounded-2xl border border-line/90 bg-white/72 p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Event structure</legend>
        <div className="mt-1 flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff8dc] text-ink"><RadioTower className="h-4 w-4" /></span>
          <p className="text-[0.78rem] leading-5 text-muted">Choose whether this event has one schedule, repeats, or contains child sessions by time/location.</p>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {eventTypeOptions.map(({ value, label }) => (
            <label className="flex items-center gap-2 rounded-xl border border-line bg-field/70 px-3 py-3 text-sm font-medium text-ink transition has-[:checked]:border-moss has-[:checked]:bg-[#eaf5ef]" key={value}>
              <input
                checked={eventType === value}
                className="h-4 w-4 accent-moss"
                name="type"
                onChange={() => setEventType(value)}
                type="radio"
                value={value}
              />
              {label}
            </label>
          ))}
        </div>
        {eventType === "recurring" ? (
          <label className="mt-4 block space-y-2 text-sm font-medium text-ink">
            <span>Repeat pattern</span>
            <select className="h-11 w-full rounded-xl border border-line bg-white px-3 outline-none focus:border-moss" name="recurrence_rule" defaultValue="weekly">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        ) : null}
        {eventType === "multi_location" ? (
          <p className="mt-3 rounded-xl border border-line bg-field px-3 py-2 text-sm text-muted">
            This creates the parent event. Add one session per venue from the event detail page.
          </p>
        ) : null}
        {eventType === "multi_time" ? (
          <p className="mt-3 rounded-xl border border-line bg-field px-3 py-2 text-sm text-muted">
            This creates the parent event. Add one session per time slot from the event detail page.
          </p>
        ) : null}
      </fieldset>

      <EventDateTimeFields dateSeed={dateSeed} defaultEndsAt={event?.ends_at} defaultStartsAt={event?.starts_at} />

      <section className="rounded-2xl border border-line/90 bg-field/70 p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night text-amber"><MapPin className="h-4 w-4" /></span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Venue and capacity</h2>
            <p className="text-[0.78rem] text-muted">Known venues auto-fill their saved address.</p>
          </div>
        </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Venue name</span>
          <input
            className="h-11 w-full rounded-xl border border-line bg-white/90 px-3 outline-none focus:border-moss"
            list="event-location-options"
            name="location_name"
            onChange={(event) => updateVenue(event.target.value)}
            placeholder="Main hall"
            value={venueName}
          />
          <datalist id="event-location-options">
            {locations.map((location) => (
              <option key={location.id} value={location.name} />
            ))}
          </datalist>
        </label>
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Capacity</span>
          <input className="h-11 w-full rounded-xl border border-line bg-white/90 px-3 outline-none focus:border-moss" defaultValue={event?.capacity ?? ""} min="0" name="capacity" type="number" />
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Venue address</span>
        <input
          className="h-11 w-full rounded-xl border border-line bg-white/90 px-3 outline-none focus:border-moss"
          name="location_address"
          onChange={(event) => setVenueAddress(event.target.value)}
          placeholder="Street, city, country"
          value={venueAddress}
        />
      </label>
      </section>

      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Status</span>
        <select className="h-11 w-full rounded-xl border border-line bg-field px-3 outline-none focus:border-moss" name="status" defaultValue={event?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <div className="flex gap-2">
        <SubmitButton loadingLabel="Saving event">Save event</SubmitButton>
        <Button href={cancelHref} variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
