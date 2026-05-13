# Development Documentation

This folder tracks the implementation as it exists now. Keep these documents updated as features change.

## Documents

- [System Overview](./system-overview.md)
- [Auth and Workspace](./auth-and-workspace.md)
- [Contacts and CSV Import](./contacts-and-import.md)
- [Events and Invitees](./events-and-invitees.md)
- [Campaigns and RSVP](./campaigns-and-rsvp.md)
- [Cards](./cards.md)
- [Error Handling and Operations](./error-handling-and-operations.md)
- [Reference Resources](./reference-resources.md)

## Current Product Flow

1. A user signs up, confirms email, logs in, and creates a workspace.
2. The workspace owns contacts, tags, contact types, events, campaigns, billing, and usage records.
3. Contacts can be created manually or imported from CSV with column mapping.
4. Events can be created as single events or multi-session/multi-location style parent events.
5. Invitees are selected from contacts and attached to events.
6. Campaign drafts are created from event invitees.
7. Campaign recipient logs generate RSVP tokens.
8. Public RSVP links record Yes, Maybe, or No responses and update event attendance state.
9. Cards provide reusable visual invitation designs.

## Documentation Maintenance Rule

When a feature changes behavior, data shape, workflow, or error handling, update the matching file in this folder in the same change set.
