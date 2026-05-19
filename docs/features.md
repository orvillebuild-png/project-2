# Features

All features are classified as **core** (required at launch) or **add-on** (Phase 2 or premium). Features are organized into six modules.

---

## Module 1 — Contact and relationship management (CRM)

### Core

**Contact profiles**
Store name, email, phone, age, sex, address, source (how they connected), and custom fields (jsonb key-value pairs). All standard fields are indexed for fast filtering.

**Tag system**
Flexible labels applied to contacts: e.g. "Donor", "Volunteer", "Attended Beach Cleanup 2025". Each org defines its own tags. A contact can have multiple tags. Tags are the primary segmentation mechanism for invitation targeting.

**Contact filters**
Filter contacts by age range, sex, one or more tags, event attendance history, email status, source, and date added. Filters support AND/OR combinations. Filter state is stored in the URL so filtered views are bookmarkable and shareable.

**CSV import with column mapping**
Upload a CSV file, map columns to contact fields via a UI dropdown, preview the first five rows, then confirm. Duplicate detection on email address. Imports run as an Inngest background job for large files.

**CSV export**
Export the currently filtered contact list as a CSV. Respects all active filters. Streamed for large lists — does not buffer all rows in memory.

**Self-registration form**
A public URL and QR code that allows contacts to add themselves to an org's list. Configurable fields per org. Auto-applies a source tag (e.g. "Walk-in May 2025"). Rate-limited to prevent spam.

### Add-on

**Activity timeline**
Per-contact log showing events attended, emails sent and opened, RSVPs, and date added. Adds significant relationship-tracking value but not required at launch.

**Duplicate detection**
Flags and merges contacts with the same email or similar name and phone combinations. Can be a manual review queue in v1.

---

## Module 2 — Event management

### Core

**Single event**
One-time event with title, description, date, time, location, capacity, and status (draft / published / cancelled). The atomic unit of the event system.

**Recurring event**
Repeating event defined by an RRULE string (e.g. weekly, monthly, custom). Generates child event instances automatically up to 12 months ahead. Edits can be scoped to one instance, all future instances, or all instances.

**Multi-location parallel event**
The same event concept running simultaneously at different venues. Modeled as one parent event with location-specific child events. Each location has its own capacity and RSVP list. Invitees choose their location at RSVP time.

**Capacity and waitlist**
Set a maximum attendee count. When capacity is reached, additional yes-RSVPs go to a waitlist. When a confirmed attendee cancels, the first waitlisted contact is automatically promoted and notified.

**Attendance tracking**
After the event, staff marks contacts as attended or no-show from the guest list. Bulk-mark all yes-RSVPs as attended in one action, then uncheck no-shows. Marking attended automatically applies an event attendance tag to the contact.

### Add-on

**Sub-events and sessions**
An event can have multiple sessions (e.g. morning talk and afternoon workshop) with per-session RSVPs. Useful for conferences and multi-part events.

**QR code check-in**
Generate a QR code per attendee. Staff scans at the door to mark attendance in real time. Works as a mobile web page — no app required.

**Event analytics dashboard**
Attendance rate, RSVP funnel, no-show rate, top tags among attendees, and source breakdown per event.

---

## Module 3 — Invitations and email

### Core

**Email template builder**
Rich-text editor (Tiptap) with merge tag insertion (`{{first_name}}`, `{{event_name}}`, `{{rsvp_link}}`). Preview renders the template with sample data. Templates are org-scoped and reusable across campaigns.

**Invitation send campaign**
Select an event, filter contacts (by tags, email status, demographics), preview the recipient count, choose a template and optional card, then send immediately or schedule. Creates a `send_campaigns` record and fans out individual sends via Inngest.

**Hosted RSVP page**
Each invitation contains a unique tokenized link. The link opens a branded hosted page where the contact clicks Yes / No / Maybe without needing to log in. Multi-location events show a location selector. Responses are recorded in real time.

**Automated reminder emails**
A scheduled Inngest job sends reminder emails a configurable number of days before the event — to contacts who were invited but have not responded, or to confirmed attendees. Uses the standard email template system.

**Invitation card designer**
Drag-and-drop canvas (Fabric.js) for creating visual invitation cards. Supports text blocks, background colors and images, org logo, and shapes. Cards are serialized to JSON for re-editing and exported as PNG for embedding in emails. Starter templates provided.

**Email open and click tracking**
Tracks which contacts opened the invitation email (via tracking pixel) and clicked the RSVP link (via redirect). Per-contact, per-campaign tracking stored in `send_log`.

### Add-on

**Post-event thank-you email**
Automated email sent after the event ends — to attendees and optionally to no-shows. Uses the same template and scheduling infrastructure as reminder emails.

**Email deliverability tools (infra)**
Unsubscribe link (required by CAN-SPAM and GDPR), bounce handling, and complaint rate monitoring. Must be built in, not optional.

---

## Module 4 — Email validation

### Core

**Real-time validation on contact entry**
When a contact is added manually or via the self-registration form, the email address is validated through the provider adapter. Disify is the default low-cost provider, with optional Reacher support and a local syntax/MX fallback. The UI shows a "validating" state and updates the badge when the async job completes.

**Bulk validation on CSV import**
After a CSV import completes, validation jobs are queued for every imported contact. A progress indicator shows validation status. Inngest handles concurrency and rate-limiting.

**Email status badges**
Each contact displays a badge: Valid / Invalid / Disposable / Unknown. Status is stored on the contact record (`email_status`) as a denormalized cache of the latest validation result. Filterable in the contact list.

**Bounce auto-update (infra)**
When Resend reports an email bounce via webhook, the contact's `email_status` is automatically updated to "invalid" and a new `email_validations` row is written. Keeps validation status accurate over time without manual intervention.

### Add-on

**Periodic re-validation**
Scheduled job that re-validates all contacts older than N months. Email addresses go stale over time — this is especially useful for orgs with older lists.

---

## Module 5 — SaaS platform and multi-tenancy

### Core (SaaS layer)

**Organization accounts**
Each nonprofit is a fully isolated tenant with its own contacts, events, templates, billing, and users. Row-level security policies in Supabase enforce tenant boundaries at the database level — no query can return data from another organization.

**User roles within an organization**
Two roles at launch: Admin (full access including billing and settings) and Member (all features except billing and org settings). Each org manages its own users and can invite new members via email.

**Usage-based billing**
Lemon Squeezy usage-based billing. Billable actions (emails sent, validation runs) are written to `usage_events` first (source of truth), then reported to Lemon Squeezy asynchronously with idempotency keys to prevent double-billing on retry. Lemon Squeezy is the initial Merchant of Record so the product can sell globally without relying on Stripe availability in the Philippines.

**Organization branding settings**
Each org uploads a logo, sets a primary color, and configures a sender name and reply-to email. These apply to the hosted RSVP page, email footers, and card designer defaults.

**Platform super-admin panel**
Internal-only dashboard showing all organizations, usage stats, billing status, and last active date. Supports impersonating an org for support purposes (all impersonation sessions are flagged in the audit log).

### Add-on

**Guided onboarding wizard**
A 3-step wizard for new orgs: (1) set name and logo, (2) import first contacts, (3) create first event. A dashboard checklist tracks completion. Significantly reduces time-to-value and churn.

**Custom subdomain**
Each org gets their RSVP pages served from their own domain (e.g. `rsvp.theirorg.org`) via CNAME setup. Increases trust for contacts receiving invitations.

---

## Module 6 — Backend infrastructure

These are non-visible features that the product depends on.

**Authentication and sessions** — Supabase Auth with email+password and magic link login. JWT sessions with `org_id` and `role` custom claims. Next.js middleware protects all dashboard routes.

**Email send queue** — Campaign sends fan out one provider request per pending recipient. Resend handles delivery. Provider IDs are stored per recipient, and bounce/complaint/suppression events return via Resend webhooks.

**Campaign delivery health** — Campaign detail shows delivery rate, opened/clicked counts, bounced/complained/suppressed counts, last provider update, and per-recipient provider IDs for troubleshooting.

**File and image storage** — Supabase Storage for org logos, card designer image assets, and exported invitation card PNGs. Served via CDN.

**Scheduled jobs** — Inngest handles all time-based work: reminder emails, periodic re-validation, waitlist promotion, recurring event instance generation.

**Audit log** — Append-only log of every significant action in an org: who added a contact, who sent a campaign, who changed billing settings. Stored in `audit_log` and viewable by org admins.
