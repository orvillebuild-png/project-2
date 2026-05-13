# System Overview

Project 2 is a nonprofit relationship, event, invitation, RSVP, and billing platform. The current build is a Next.js application backed by Supabase.

## Architecture

- Frontend: Next.js App Router with React Server Components and Server Actions.
- Styling: Tailwind CSS with a restrained operational UI.
- Database and auth: Supabase Auth, Postgres, RLS policies, and SQL migrations.
- Repository: GitHub project `orvillebuild-png/project-2`.
- Billing direction: Lemon Squeezy, not Stripe.
- Email sending: Resend for test sends and guarded campaign sends.

## Current Implemented Areas

- Authentication and workspace creation.
- Contact management with tags, contact types, filtering, bulk tagging, soft delete, and history.
- CSV contact import with mapping, validation, duplicate handling, and import source tracking.
- Event creation, editing, publish state, and session management.
- Invitee selection from contacts.
- Reusable invitation card designer with structured layers.
- Campaign drafts from event invitees.
- Basic campaign email design controls.
- Recipient log generation with RSVP tokens.
- Public RSVP page by token.
- Campaign recipient RSVP status tracking.
- Campaign RSVP summary counts.
- Guarded Resend test email action.
- Guarded Resend campaign send action.

## Core Data Ownership

Most records are scoped to an organization/workspace:

- `orgs`
- `org_users`
- `contacts`
- `tags`
- `contact_types`
- `events`
- `locations`
- `send_campaigns`
- `email_templates`
- `usage_events`

Join or child records inherit access through parent relationships:

- `contact_tags` through contacts/tags.
- `attendance` through events.
- `send_log` through send campaigns.
- `rsvp_responses` through events/send log.

## Build Philosophy

The project is being built in visible gates:

1. Make the workflow usable without external services.
2. Store the right data shape early.
3. Keep dangerous operations reversible or non-sending until verified.
4. Add external providers only after local workflows are working.

Campaigns now send through a separate confirmed action after recipient logs are prepared.

## Known External Dependencies Not Yet Connected

- Lemon Squeezy billing.
- Email validation provider.
- Address autocomplete/geocoding provider.
- Production deployment configuration.
