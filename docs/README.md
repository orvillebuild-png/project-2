# Nonprofit SaaS — project overview

A multi-tenant SaaS platform that helps nonprofit organizations manage contacts, run events, send branded invitations, collect RSVPs, and maintain clean email lists — all in one place.

---

## What it is

Nonprofits currently stitch together Google Sheets, Mailchimp, Eventbrite, and Canva to do what this platform does in a single, unified tool. The target audience is small-to-medium nonprofits (50–5,000 contacts) that need a relationship-first contact system, not just a donation tracker.

The platform is offered as a pay-per-use SaaS — organizations pay per email sent and per email validation run, with no large upfront subscription.

---

## Core capabilities

- **Contact CRM** — store and manage contacts with demographics, custom fields, tags, and email validation status
- **Event management** — single events, recurring events, and multi-location parallel events with capacity and waitlist
- **Invitation system** — drag-and-drop invitation card designer, email template builder, segmented campaign sends
- **RSVP collection** — hosted RSVP pages linked by unique token, no login required for contacts
- **Email validation** — real-time and bulk validation via Disify first, optional Reacher later, and bounce feedback loop from Resend
- **Multi-tenancy** — each nonprofit is a fully isolated tenant; row-level security enforces data boundaries at the database level
- **Usage-based billing** — metered billing via Lemon Squeezy; organizations pay for what they use while Lemon Squeezy acts as Merchant of Record for global sales tax and payment compliance

---

## Documentation index

| Document | Contents |
|---|---|
| [features.md](./features.md) | Full feature map — core vs add-on, all six modules |
| [data-model.md](./data-model.md) | All tables, fields, relationships, indexes, and key design decisions |
| [tech-stack.md](./tech-stack.md) | Technology choices with rationale, alternatives, and watch-outs |
| [build-sequence.md](./build-sequence.md) | Six-phase build plan with gates and per-task implementation notes |
| [api.md](./api.md) | Full API reference — routes, request/response shapes, auth levels |
| [folder-structure.md](./folder-structure.md) | Project scaffold and directory annotations |

---

## Technology summary

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Canvas (card designer) | Fabric.js |
| Database + Auth + Storage | Supabase (PostgreSQL + RLS) |
| Background jobs | Inngest |
| Transactional email | Resend |
| Email validation | Disify, with optional Reacher fallback |
| Payments | Lemon Squeezy (Merchant of Record + usage-based billing) |
| Hosting | Vercel (app) |

---

## Market context

The nonprofit software market is valued at approximately USD 4.95 billion (2026) and growing at ~7.9% CAGR. The dominant platforms (Salesforce Nonprofit Cloud, Blackbaud) are expensive and over-engineered for small organizations. No single existing tool combines contact CRM, flexible event management, invitation card design, RSVP collection, and email validation in one product — which is the gap this platform fills.

---

## Build timeline

Six phases, approximately 9–10 weeks of focused development:

- Phase 1 — Foundation (auth, DB, RLS, deploy) — ~1 week
- Phase 2 — Contact management — ~1.5 weeks
- Phase 3 — Email validation — ~1 week
- Phase 4 — Event management — ~1.5 weeks
- Phase 5 — Invitations, email, and RSVP — ~2 weeks
- Phase 6 — SaaS layer (billing, multi-org, polish) — ~1.5 weeks

Each phase ends at a gate where the product is independently usable and testable.

---

## Key architectural decisions

**Multi-tenancy via RLS** — `org_id` is present on every tenant-scoped table. Supabase Row Level Security policies enforce isolation at the database level. No application-layer code can accidentally leak data between organizations.

**Async-first** — bulk email sends, CSV imports, and email validation all run as Inngest background jobs. No synchronous API route handles more than one external call.

**Single repo** — the Next.js app, Inngest functions, Supabase migrations, and documentation all live in one repository. External services are integrated through provider adapters so validation providers can change without reshaping the core app.

**Event data model** — a single `events` table handles all event types using `parent_event_id` (recurring instances) and `location_id` (multi-location children). This avoids separate tables per type while keeping queries straightforward.
