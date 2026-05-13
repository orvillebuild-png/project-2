"use client";

import { useMemo, useState } from "react";
import { EventDateTimeFields } from "@/components/events/EventDateTimeFields";
import { Button } from "@/components/ui/Button";
import type { EventListItem, LocationOption } from "@/lib/events";

const eventTypeOptions: Array<{ label: string; value: EventListItem["type"] }> = [
  { label: "Single", value: "single" },
  { label: "Recurring", value: "recurring" },
  { label: "Multi-venue", value: "multi_location" }
];

export function EventForm({
  action,
  cancelHref = "/events",
  event,
  locations
}: {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
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
      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Title</span>
        <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={event?.title ?? ""} name="title" required placeholder="Fundraising gala" />
      </label>
      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Description</span>
        <textarea className="min-h-28 w-full rounded-md border border-line bg-field px-3 py-3 outline-none focus:border-moss" defaultValue={event?.description ?? ""} name="description" placeholder="Private notes or public event summary" />
      </label>

      <fieldset className="rounded-lg border border-line bg-field p-4">
        <legend className="px-1 text-sm font-semibold text-ink">Event type</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {eventTypeOptions.map(({ value, label }) => (
            <label className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-3 text-sm font-medium text-ink" key={value}>
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
            <select className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-moss" name="recurrence_rule" defaultValue="weekly">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        ) : null}
        {eventType === "multi_location" ? (
          <p className="mt-3 rounded-md border border-line bg-white px-3 py-2 text-sm text-muted">
            This creates the parent event now. Venue sessions will be added in the next multi-venue pass.
          </p>
        ) : null}
      </fieldset>

      <EventDateTimeFields defaultEndsAt={event?.ends_at} defaultStartsAt={event?.starts_at} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-ink">
          <span>Venue name</span>
          <input
            className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss"
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
          <input className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" defaultValue={event?.capacity ?? ""} min="0" name="capacity" type="number" />
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Venue address</span>
        <input
          className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss"
          name="location_address"
          onChange={(event) => setVenueAddress(event.target.value)}
          placeholder="Street, city, country"
          value={venueAddress}
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-ink">
        <span>Status</span>
        <select className="h-11 w-full rounded-md border border-line bg-field px-3 outline-none focus:border-moss" name="status" defaultValue={event?.status ?? "draft"}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>

      <div className="flex gap-2">
        <Button type="submit">Save event</Button>
        <Button href={cancelHref} variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
