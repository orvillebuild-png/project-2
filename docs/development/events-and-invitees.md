# Events and Invitees

## Purpose

Events represent fundraising, volunteer, community, or organization activities. Invitees connect contacts to events before campaign drafting and RSVP collection.

## Implemented Event Features

- Event list.
- Event creation.
- Event editing.
- Draft and published status.
- Event detail page.
- Single event type.
- Recurring event type placeholder field.
- Multi-location and multi-time parent event modes.
- Event sessions under parent events.
- Session add/edit flow.
- Parent event list hides child sessions.
- Publish action from event detail.

## Invitee Selection

Invitees are selected from existing contacts and stored through the `attendance` table.

Implemented invitee features:

- `/events/[id]/invitees`
- Contact filtering by search, type, tag, source, sex, age bracket, organization, and row count.
- Select individual contacts.
- Add selected contacts to an event.
- Remove selected invitees from an event.
- Invitee count on event detail.
- Upload contacts shortcut if invitees are not in the CRM yet.

## Attendance Statuses

Current attendance statuses:

- `invited`
- `waitlisted`
- `confirmed`
- `declined`
- `attended`
- `no_show`

RSVP responses update attendance:

- RSVP Yes -> `confirmed`
- RSVP Maybe -> `waitlisted`
- RSVP No -> `declined`

## Use Cases

- Create a fundraising dinner.
- Create a parent event with morning and afternoon sessions.
- Add invitees from donors tagged in the CRM.
- Add a multi-location event and track invitees under the parent event.
- Publish a draft event once details are stable.

## Error Handling

- Invalid event times are rejected when end time is before start time.
- Session creation requires a session title and venue.
- Event and session updates are scoped by organization through RLS.
- Invitee selection validates that selected contacts belong to the current organization.
- Adding invitees uses upsert semantics so repeat selection does not duplicate attendance records.

## Important Files

- `app/(dashboard)/events/page.tsx`
- `app/(dashboard)/events/new/page.tsx`
- `app/(dashboard)/events/[id]/page.tsx`
- `app/(dashboard)/events/[id]/edit/page.tsx`
- `app/(dashboard)/events/[id]/invitees/page.tsx`
- `app/(dashboard)/events/[id]/sessions/[sessionId]/edit/page.tsx`
- `components/events/EventForm.tsx`
- `components/events/EventDateTimeFields.tsx`
- `components/events/EventSessionForm.tsx`
- `components/events/InviteeFilterForm.tsx`
- `lib/events.ts`
- `lib/invitees.ts`

## Current Limitations

- Recurrence rules are not fully implemented.
- No calendar integration yet.
- No capacity enforcement yet.
- No check-in UI yet.
- No venue autocomplete/geocoding yet.
