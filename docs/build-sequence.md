# Build sequence

Six phases in dependency order. Each phase ends at a gate — a point where the product is independently usable and testable, even without the phases that follow. Build to gates, not to feature lists.

Total estimated timeline: 9–10 weeks for a solo developer or small team using AI-assisted coding.

---

## Phase 1 — Foundation
**Duration:** ~1 week
**Goal:** A deployable skeleton with working auth, a full database schema, and verified RLS policies.

### Tasks

**1. Init Next.js 15 + TypeScript repo**
Create the repository with Next.js App Router, TypeScript strict mode, Tailwind CSS, and shadcn/ui. Set up ESLint and Prettier. Establish the folder structure: `/app`, `/components`, `/lib`, `/types`, `/inngest`, `/supabase`, `/docs`. This is the last easy opportunity to get folder structure right.

**2. Supabase project + local CLI setup**
Create a Supabase project. Install the Supabase CLI. Run `supabase init` and `supabase start` for a local Postgres instance. Generate TypeScript types from the schema. Commit `supabase/migrations/` to the repo — all schema changes go through migration files, never the Supabase dashboard.

**3. Write all database migrations**
Translate the full data model into migration files: all 17 tables with columns, foreign key constraints, and cascade rules. Add indexes on `org_id`, `email`, `event_id`, `campaign_id`, `rsvp_token`. Verify all constraints hold on a clean database reset.

**4. RLS policies for every table**
Write Row Level Security policies for all tenant-scoped tables. Implement the `org_id` JWT custom claim injection via a Supabase Auth hook. Write a test file that creates two orgs, creates contacts for each, authenticates as Org A, queries contacts, and asserts Org B's contacts return zero rows. Run this test after every migration.

> This is the most important security work in the entire project. Do not defer it.

**5. Auth flow: signup, login, org creation**
Build: (1) user signup with email and password, (2) org creation flow that creates the `orgs` row and the first `org_users` row with `role=admin`, (3) login that issues a JWT with `org_id` and `role` claims, (4) Next.js middleware that protects all `/dashboard` routes.

**6. Deploy skeleton to Vercel**
Connect the repository to Vercel. Configure environment variables. Confirm the app deploys and auth works in production — not only locally. Enable preview deployments for pull requests.

### Gate
You can sign up, create an org, log in, and the dashboard route is protected. RLS tests pass. Running `supabase db reset` from a clean clone produces a working database.

---

## Phase 2 — Contact management
**Duration:** ~1.5 weeks
**Goal:** A fully functional CRM usable by nonprofit staff before any event or email feature exists.

### Tasks

**1. Contact list UI with pagination**
Server-rendered table of contacts with columns: name, email, email status badge, tags, date added. Cursor-based pagination (not offset). Sortable columns. Build the list before the add/edit form — seeing real data forces correct layout decisions early.

**2. Add / edit / delete contact**
Manual contact form: first name, last name, email, phone, sex, age, source, and custom fields (dynamic key-value UI backed by jsonb). Inline client-side email format validation. Soft delete.

**3. Tag create, assign, and filter**
Org admins create tags with name and color. Tags are assigned to contacts via the contact form or inline in the list. The contact list filters by one or more tags. Store filter state in the URL so filtered views are bookmarkable.

**4. CSV import with column mapping**
File upload → parse CSV client-side (PapaParse) → column mapping UI (dropdown per detected header) → preview first 5 rows → confirm → background Inngest job for upsert. Duplicate detection on email address.

**5. Self-registration public form**
Public page at `/register/[org-slug]`. Configurable fields per org. Submitting creates a contact and auto-applies a source tag. Rate-limited at the Next.js edge middleware layer.

**6. CSV export**
Export the current filtered view as a CSV. Streamed response. Hard cap at 50,000 rows; return a 400 error with a clear message if the filter exceeds this.

### Gate
Staff can add contacts manually, import a CSV, filter by tags, and a visitor can self-register via the public form.

---

## Phase 3 — Email validation
**Duration:** ~1 week
**Goal:** Every contact has a validated email status. The Disify-first validation pipeline is proven end-to-end, with a local fallback and optional Reacher support.

### Tasks

**1. Configure Disify-first validation**
Use Disify as the default low-cost validation provider. Test manually with a known-valid, known-invalid, and disposable email address before building automation around it.

> Keep the provider behind an adapter. Reacher, MailboxValidator, or another provider can be added later without changing the contact and campaign workflows.

**2. Inngest setup + first validation job**
Install the Inngest SDK when validation volume needs background execution. Write the `validate_email` function: receives `contact_id`, calls the configured validation adapter, writes a row to `email_validations`, and updates `contacts.email_status` in the same transaction. Run the Inngest dev server locally alongside Supabase. Test the full chain with a manual trigger.

**3. Real-time validation on contact add**
When a contact is saved (manual form or self-registration), fire the `validate_email` Inngest event immediately. The UI shows "validating..." and updates the status badge via a Supabase Realtime subscription when the job completes. The contact save does not wait for validation to finish.

**4. Bulk validation on CSV import**
After the bulk import job completes, fan out one `validate_email` job per imported contact. Show a progress indicator in the UI. Keep concurrency modest to avoid provider rate limits.

**5. Email status filter and summary counts**
Add `email_status` as a filterable field in the contact list. Show a summary count above the table: "2,341 valid · 87 invalid · 14 disposable · 54 unknown".

### Gate
Every contact has an email status. Staff can filter by it. Validation runs automatically on add and import. Disify/free-tier limits are understood, and fallback behavior is tested.

---

## Phase 4 — Event management
**Duration:** ~1.5 weeks
**Goal:** Staff can create all event types, manage capacity, and track attendance. The core contact → event → attendance → tag loop is closed.

### Tasks

**1. Single event CRUD**
Create, edit, cancel, and list events. Fields: title, description, date, time, location (free text for v1), capacity, status. Build this before touching recurring or multi-location events.

**2. Location library**
Locations table CRUD. Org creates a library of reusable venues (name, address, optional coordinates). The event form picks from this library. Required before multi-location events.

**3. Recurring event engine**
Store the recurrence rule as an RRULE string. On publish, generate child event instances via an Inngest job using the `rrule.js` library. When editing a recurring event, show a scope selector: "Edit this event only", "Edit this and all future events", or "Edit all events". Do not write custom recurrence logic — use rrule.js.

**4. Multi-location event**
A parent event with multiple child events, each linked to a different location. The invitation lets the contact choose their location at RSVP time. Each location has its own capacity counter.

**5. Capacity and waitlist logic**
When an RSVP is submitted and the event is at capacity, write the contact to the waitlist (`attendance.status = waitlisted`). When a confirmed RSVP is cancelled, trigger an Inngest `promote_waitlist` job that finds the first waitlisted contact, updates their status to confirmed, and sends a notification email.

**6. Attendance tracking and auto-tag**
Post-event: staff marks contacts as attended or no-show from the event guest list. Bulk-mark all yes-RSVPs as attended in one click. When a contact is marked as attended, fire an Inngest job that applies an event attendance tag (e.g. "Attended: Beach Cleanup May 2025") to the contact record.

### Gate
Staff can create all event types. Capacity and waitlisting work correctly. Attendance is recorded and feeds back into the contact tag system.

---

## Phase 5 — Invitations, email, and RSVP
**Duration:** ~2 weeks
**Goal:** An org can design a card, build a template, send a campaign to a filtered segment, and contacts can respond via the hosted RSVP page.

### Tasks

**1. Resend integration and org sender setup**
Connect Resend. Build the settings page for sender name, sender email, and reply-to configuration. Add domain verification status. Test a transactional send. Set up the bounce and complaint webhook route (`/api/webhooks/resend`) and verify the Resend signature before going live.

**2. Email template builder**
Tiptap editor with merge tag node extension. Merge tags render as highlighted inline chips. Preview mode substitutes sample data. Validate that all merge tags referenced in the body exist in the template's `merge_tags` array before saving.

**3. Invitation card designer**
Fabric.js canvas with a toolbar: add text block, upload image, set background color or image, add org logo, add shapes. Serialize to JSON on save. Export as PNG → upload to Supabase Storage → store the CDN URL as `preview_url`. Provide 3–5 starter templates. Timebox this task to one week.

**4. Send campaign builder**
Multi-step flow: (1) select event, (2) build contact filter (tags, email status, demographics), (3) preview recipient count with filter snapshot, (4) select template and optional card, (5) schedule or send now. On send, set `status=sending` in a single `UPDATE ... WHERE status='draft'` to prevent double-sends, then fan out Inngest jobs.

**5. Hosted RSVP page**
Public page at `/rsvp/[token]`. Looks up `send_log` by token. Displays event details and org branding (logo, primary color). Contact selects Yes / No / Maybe. Multi-location events show a location selector. Writes to `rsvp_responses`. If at capacity, marks as waitlisted and shows an appropriate message. Base HTML form works without JavaScript; enhanced with JS for a better experience.

**6. Open and click tracking**
Embed a 1×1 tracking pixel in emails for open tracking. Wrap the RSVP link through a redirect endpoint (`/api/rsvp/click/[token]`) to record clicks before redirecting to the RSVP page. Update `send_log.opened_at` and `send_log.clicked_at` from Resend webhook events.

**7. Automated reminder emails**
Inngest scheduled function: runs daily, finds events within the reminder window (configurable per org, default 3 days), sends reminder emails to invited contacts who have not responded. Uses the standard template system.

### Gate
A complete invitation campaign can be created and sent. Contacts can RSVP. The RSVP flows back into the event guest list and contact history. The core product is end-to-end functional.

---

## Phase 6 — SaaS layer
**Duration:** ~1.5 weeks
**Goal:** Organizations can sign up, pay, invite their team, and be supported via the admin panel. The product is launch-ready.

### Tasks

**1. Lemon Squeezy usage-based billing**
Create Lemon Squeezy subscription products or variants for metered email sends and validation runs. On each billable Inngest job, write to `usage_events` first, then report usage to Lemon Squeezy with an idempotency key. Build the billing settings page: current period usage, estimated cost, and links to Lemon Squeezy-hosted checkout or subscription management. Handle subscription and payment webhooks to keep `plan_status` current and notify the org admin on failed payment or cancellation.

**2. Org user management**
Org admins can invite users by email (Resend sends a magic link), assign roles, and remove members. The invitation landing page at `/invite/[token]` creates the account if the user is new and links them to the org. Prevent removing the last admin.

**3. Org branding settings**
Logo upload (to Supabase Storage), primary color picker, sender name and email configuration. These settings propagate to the RSVP page, email footers, and card designer defaults.

**4. Platform super-admin panel**
Internal route protected by a platform-level role check (separate from org roles). Shows all orgs with contact count, usage stats, plan status, and last active date. Impersonation: issues a time-limited JWT scoped to the target org, flagged in the audit log, with a 30-minute hard expiry.

**5. Onboarding wizard**
Three-step wizard for new orgs after signup: (1) set name and logo, (2) import first contacts or skip, (3) create first event or skip. A persistent checklist on the dashboard tracks completion until all steps are done.

**6. Audit log viewer**
Settings page showing a reverse-chronological log of all org actions. Columns: timestamp, actor, action, entity. Filterable by action type. Backed by the `audit_log` table, which is written by the `logAudit()` helper in every server action and Inngest job that modifies data.

### Gate
Organizations can sign up, pay, invite team members, brand their experience, and the platform team can support them via the admin panel. The product is ready for real nonprofit customers.
