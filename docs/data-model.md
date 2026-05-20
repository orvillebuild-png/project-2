# Data model

All tables are in the `public` schema in Supabase PostgreSQL. Every tenant-scoped table carries an `org_id` column. Row-level security (RLS) policies are enabled on all tables and use `org_id` from the authenticated JWT claim to enforce tenant isolation.

---

## Tables

### `orgs`
One row per nonprofit organization (tenant).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `name` | text | Display name of the organization |
| `slug` | text UNIQUE | URL-safe identifier, used in `/register/[slug]` |
| `logo_url` | text | CDN URL from Supabase Storage |
| `primary_color` | text | Hex color, applied to RSVP pages and card defaults |
| `sender_name` | text | "From" name on all outgoing emails |
| `sender_email` | text | Verified sender email in Resend |
| `reply_to_email` | text | Reply-to address |
| `timezone` | text | Workspace timezone for event and dashboard defaults |
| `website_url` | text | Public website |
| `address` | text | Organization mailing or office address |
| `billing_provider` | text | `lemonsqueezy` at launch; keeps the billing layer provider-agnostic |
| `billing_customer_id` | text | Lemon Squeezy customer ID |
| `billing_subscription_id` | text | Lemon Squeezy subscription ID |
| `billing_email_item_id` | text | Lemon Squeezy subscription item ID for email usage records |
| `billing_validation_item_id` | text | Lemon Squeezy subscription item ID for validation usage records |
| `plan_status` | text | `active`, `trialing`, `past_due`, `paused`, `cancelled` |
| `created_at` | timestamptz | Default `now()` |

---

### `users`
Managed by Supabase Auth. Extended here for profile data.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Matches `auth.users.id` |
| `email` | text | |
| `name` | text | Display name |
| `created_at` | timestamptz | |

---

### `org_users`
Join table — links users to organizations with a role.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | Indexed |
| `user_id` | uuid FK → `users.id` | Indexed |
| `role` | text | `admin` or `member` |
| `joined_at` | timestamptz | |

Constraint: unique on `(org_id, user_id)`.

---

### `team_invitations`
Pending and completed workspace invitations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK -> `orgs.id` | Invitation owner |
| `email` | text | Invited email address |
| `role` | text | `admin` or `member` |
| `status` | text | `pending`, `accepted`, or `revoked` |
| `invited_by` | uuid FK -> `users.id` | Admin who created the invite |
| `token` | text | Unique bearer token used by `/team/invite/[token]` |
| `expires_at` | timestamptz | Defaults to 14 days after invite creation |
| `accepted_at` | timestamptz | Set when accepted |
| `created_at` | timestamptz | |

Constraints and indexes:

- unique on `(org_id, email)`
- unique index on `token`
- index on `(lower(email), status)`

RLS:

- Org members can see their org invitations.
- The invited authenticated email can see and accept its own pending invitation.

---

### `contacts`
One row per person in an organization's contact list.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | Indexed. RLS policy key. |
| `first_name` | text | |
| `last_name` | text | |
| `email` | text | Indexed |
| `phone` | text | |
| `sex` | text | `male`, `female`, `other`, null |
| `age` | int | |
| `source` | text | How they connected (e.g. "Walk-in May 2025") |
| `email_status` | text | `valid`, `invalid`, `disposable`, `unknown`, `pending`. Denormalized cache of latest `email_validations` result. |
| `last_validated_at` | timestamptz | |
| `custom_fields` | jsonb | Org-defined extra fields as key-value pairs |
| `deleted_at` | timestamptz | Soft delete. Null = active. |
| `created_at` | timestamptz | |

Indexes: `org_id`, `email`, `(org_id, email_status)`, `(org_id, deleted_at)`.

---

### `tags`
Org-defined labels applied to contacts.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | |
| `name` | text | |
| `color` | text | Hex color for the badge |

Constraint: unique on `(org_id, name)`.

---

### `contact_tags`
Many-to-many join between contacts and tags.

| Column | Type | Notes |
|---|---|---|
| `contact_id` | uuid FK → `contacts.id` | |
| `tag_id` | uuid FK → `tags.id` | |
| `applied_by` | uuid FK → `users.id` | Null if auto-applied by system |
| `applied_at` | timestamptz | |

Primary key: `(contact_id, tag_id)`.

---

### `locations`
Reusable venue definitions per organization.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | |
| `name` | text | e.g. "Main Hall", "North Campus" |
| `address` | text | |
| `lat` | float8 | Optional — for map display |
| `lng` | float8 | |

---

### `events`
Handles single, recurring, and multi-location events in one table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | Indexed |
| `parent_event_id` | uuid FK → `events.id` | Self-reference. Null for standalone and parent events. Set on recurring child instances and multi-location children. |
| `location_id` | uuid FK → `locations.id` | Null if unset |
| `title` | text | |
| `type` | text | `single`, `recurring`, `multi_location` |
| `status` | text | `draft`, `published`, `cancelled` |
| `description` | text | |
| `starts_at` | timestamptz | Indexed |
| `ends_at` | timestamptz | |
| `recurrence_rule` | text | RRULE string (e.g. `FREQ=WEEKLY;BYDAY=MO`). Null for non-recurring. |
| `capacity` | int | Null = unlimited |
| `created_at` | timestamptz | |

Indexes: `org_id`, `(org_id, status)`, `(parent_event_id)`, `starts_at`.

**Event type patterns:**
- Single event: `type=single`, `parent_event_id=null`
- Recurring parent: `type=recurring`, `parent_event_id=null`, `recurrence_rule` set
- Recurring child instance: `type=recurring`, `parent_event_id` → parent row
- Multi-location parent: `type=multi_location`, `parent_event_id=null`
- Multi-location child: `type=multi_location`, `parent_event_id` → parent, `location_id` → location

---

### `attendance`
Records each contact's attendance status per event.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `event_id` | uuid FK → `events.id` | Indexed |
| `contact_id` | uuid FK → `contacts.id` | Indexed |
| `status` | text | `waitlisted`, `confirmed`, `attended`, `no_show` |
| `checked_in_at` | timestamptz | Set when status → `attended` |

Constraint: unique on `(event_id, contact_id)`.

---

### `email_templates`
Reusable and campaign-specific email templates per organization.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | |
| `name` | text | Internal display name |
| `description` | text | Optional library summary |
| `subject` | text | Email subject line. May contain merge tags. |
| `html_body` | text | Full HTML email body. May contain merge tags (`{{first_name}}` etc.) |
| `design_data` | jsonb | Visual builder design JSON and email style controls |
| `merge_tags` | jsonb | Array of merge tag keys used in this template |
| `is_library_template` | boolean | True for templates shown in `/templates`; false for campaign draft copies |
| `updated_at` | timestamptz | |

---

### `invitation_cards`
Saved invitation card designs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | |
| `name` | text | |
| `canvas_data` | jsonb | Full Fabric.js canvas JSON for re-editing |
| `preview_url` | text | CDN URL of the exported PNG |
| `updated_at` | timestamptz | |

---

### `send_campaigns`
One row per invitation send campaign.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | |
| `event_id` | uuid FK → `events.id` | |
| `template_id` | uuid FK → `email_templates.id` | |
| `card_id` | uuid FK → `invitation_cards.id` | Null if no card |
| `status` | text | `draft`, `scheduled`, `sending`, `sent` |
| `filter_snapshot` | jsonb | Exact filter used at send time, preserved for audit |
| `recipient_count` | int | Count at time of send |
| `scheduled_at` | timestamptz | Null if sent immediately |
| `sent_at` | timestamptz | |

---

### `send_log`
One row per contact per campaign send.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `campaign_id` | uuid FK → `send_campaigns.id` | Indexed |
| `contact_id` | uuid FK → `contacts.id` | Indexed |
| `rsvp_token` | text UNIQUE | Random UUID used in `/rsvp/[token]` URL |
| `delivery_status` | text | `pending`, `delivered`, `bounced`, `complained`, `suppressed` |
| `resend_email_id` | text | Provider email ID returned by Resend, used to match webhooks |
| `opened_at` | timestamptz | Set by token-scoped open pixel when remote images load |
| `clicked_at` | timestamptz | Set by token-scoped click redirect |
| `last_provider_event_at` | timestamptz | Last Resend webhook event processed for this row |
| `sent_at` | timestamptz | |

Index: `rsvp_token` (for O(1) RSVP page lookup).

---

### `resend_webhook_events`
Idempotency and audit store for Resend webhook deliveries.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Svix webhook ID |
| `type` | text | Resend event type, e.g. `email.bounced` |
| `resend_email_id` | text | Provider email ID from payload |
| `payload` | jsonb | Raw verified event body |
| `processed_at` | timestamptz | |

RLS:

- Workspace members can read webhook events that match their campaign send logs.
- Writes happen through the signed webhook route and token/provider-scoped RPC.

---

### `contact_suppressions`
One row per contact that should not receive future campaign email.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK -> `orgs.id` | Tenant owner |
| `contact_id` | uuid FK -> `contacts.id` | Suppressed contact |
| `email` | text | Email at the time suppression was created |
| `reason` | text | `unsubscribe`, `bounce`, `complaint`, or `manual` |
| `source_send_log_id` | uuid FK -> `send_log.id` | Campaign email that caused the suppression, when available |
| `created_at` | timestamptz | |

Constraint: unique on `(org_id, contact_id)`.

RLS:

- Org members can read and create suppressions.
- Org members can update suppressions.
- Only org admins can delete suppressions.

---

### `rsvp_responses`
Contact responses to invitations.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `send_log_id` | uuid FK → `send_log.id` UNIQUE | One response per send |
| `event_id` | uuid FK → `events.id` | |
| `contact_id` | uuid FK → `contacts.id` | |
| `response` | text | `yes`, `no`, `maybe` |
| `location_preference` | uuid FK → `locations.id` | For multi-location events |
| `responded_at` | timestamptz | |

---

### `email_validations`
Full validation result record per validation check.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `contact_id` | uuid FK → `contacts.id` | Indexed |
| `status` | text | `valid`, `invalid`, `disposable`, `unknown` |
| `sub_status` | text | Detailed reason (e.g. `mailbox_not_found`, `catch_all`) |
| `is_disposable` | boolean | |
| `mx_found` | boolean | |
| `provider` | text | Inferred email provider domain |
| `validated_at` | timestamptz | |

The latest row per `contact_id` is the current validation result. `contacts.email_status` is kept in sync with this as a denormalized cache — written in the same transaction.

---

### `usage_events`
Append-only log of all billable actions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | Indexed |
| `event_type` | text | `email_sent`, `validation_run` |
| `quantity` | int | Default 1 |
| `metadata` | jsonb | e.g. `{ "campaign_id": "...", "contact_id": "..." }` |
| `billing_reported` | boolean | Whether this has been reported to the active billing provider |
| `billing_reported_at` | timestamptz | When the usage was successfully reported |
| `billing_idempotency_key` | text UNIQUE | Stable key used to prevent duplicate usage reporting |
| `occurred_at` | timestamptz | |

This table is the source of truth for billing. Lemon Squeezy is the launch collection and Merchant of Record layer, not the internal record. The generic billing fields leave room for Paddle or Stripe adapters later without changing usage semantics.

---

### `billing_webhook_events`
Idempotency ledger for signed Lemon Squeezy webhook payloads.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | Lemon event ID when present; otherwise SHA-256 hash of the raw payload |
| `event_name` | text | Lemon Squeezy event name such as `subscription_created` |
| `payload` | jsonb | Full signed webhook payload for support/debug reconciliation |
| `processed_at` | timestamptz | When the app accepted the event |

RLS is enabled and no client policies are defined. Only the signed server route should insert rows with the Supabase service role.

---

### `audit_log`
Append-only log of all significant actions within an org.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `org_id` | uuid FK → `orgs.id` | Indexed |
| `actor_id` | uuid FK → `users.id` | Null if triggered by system |
| `action` | text | e.g. `contact.created`, `campaign.sent`, `user.invited` |
| `entity_type` | text | e.g. `contact`, `event`, `campaign` |
| `entity_id` | uuid | ID of the affected record |
| `diff` | jsonb | Changed fields: `{ "before": {...}, "after": {...} }` |
| `occurred_at` | timestamptz | |

---

## Key design decisions

### Denormalized `email_status` on contacts
`contacts.email_status` is a cache of the latest `email_validations` result. It exists purely for fast filtering without joining to `email_validations` on every contact list query. The sync rule: write to `email_validations` first, then update `contacts.email_status` in the same database transaction.

### Self-referencing `parent_event_id` on events
A single `events` table handles all event types via `parent_event_id`. Recurring event series have one parent row; each occurrence is a child. Multi-location events have one parent with one child per location. Edits to recurring events use a `scope` parameter (`this`, `future`, `all`) to determine which rows are updated.

### Tokenized RSVP links
`send_log.rsvp_token` is a unique random UUID generated per send. The hosted RSVP page URL is `/rsvp/[token]` — no contact ID is exposed in the URL. When the contact submits a response, the server looks up the token, finds the `send_log` row, and writes to `rsvp_responses`. This prevents token guessing and protects contact privacy.

### Suppression and unsubscribe

Campaign unsubscribe links use `/unsubscribe/[token]`, where the token is the recipient's `send_log.rsvp_token`. The public unsubscribe RPC only creates or updates a suppression row for the token-matched contact and organization. Future sends check `contact_suppressions` before calling Resend and mark matching pending rows as `suppressed`.

### `filter_snapshot` on campaigns
`send_campaigns.filter_snapshot` (jsonb) stores the exact filter used when the campaign was sent. This means you can always audit "who was targeted and why" even if the contact list or tag assignments change afterward.

### `jsonb` fields
`contacts.custom_fields`, `invitation_cards.canvas_data`, `send_campaigns.filter_snapshot`, and `usage_events.metadata` are all stored as jsonb. Custom fields vary per org and cannot be normalized. Canvas data is the Fabric.js object tree — too variable to normalize. Filter snapshots must preserve the exact state at send time. Index specific jsonb paths with `CREATE INDEX ... ON table USING GIN (column)` only when query patterns demand it.

### Soft delete on contacts
`contacts.deleted_at` implements soft deletion. `send_log` and `rsvp_responses` rows remain intact after deletion for historical accuracy. Hard delete is available only through the platform admin panel.

---

## RLS policy pattern

Every tenant-scoped table has a policy of the form:

```sql
CREATE POLICY "org_isolation" ON contacts
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

The `org_id` claim is injected into the JWT by a Supabase Auth hook that fires on user login. Application code never manually filters by `org_id` — the database enforces it.

Public tables (`orgs`, `users`) have more permissive read policies scoped to the authenticated user's own records only.
