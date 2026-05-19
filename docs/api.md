# API reference

All routes are Next.js App Router API routes under `/app/api/`. Auth levels: `public` (no auth), `jwt` (authenticated user in any role), `admin` (org admin role), `platform` (super-admin only).

Error responses always use this shape:
```json
{ "error": { "code": "SNAKE_CASE_CODE", "message": "Human-readable message.", "status": 404 } }
```

---

## Auth

### `POST /api/auth/signup`
**Auth:** public

Creates a user account and a new organization in one transaction.

**Request:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "org_name": "string",
  "org_slug": "string"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "string" },
  "org": { "id": "uuid", "slug": "string" },
  "session": { "access_token": "string", "refresh_token": "string" }
}
```

Creates user in Supabase Auth, creates `orgs` row, creates `org_users` row with `role=admin`, injects `org_id` into JWT via auth hook.

---

### `POST /api/auth/login`
**Auth:** public

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response:**
```json
{
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_at": 1234567890
  }
}
```

JWT contains `org_id` and `role` custom claims. Store tokens in httpOnly cookies.

---

### `POST /api/auth/logout`
**Auth:** jwt — Invalidates the current session server-side.

---

### `POST /api/auth/invite/accept`
**Auth:** public

**Request:**
```json
{ "token": "string", "password": "string" }
```

Validates the invite token, creates the user if new, links them to the org with the stored role, marks the invite as used.

---

## Contacts

### `GET /api/contacts`
**Auth:** jwt

**Query parameters:**
- `tags` — comma-separated tag UUIDs (AND logic)
- `email_status` — `valid`, `invalid`, `disposable`, `unknown`
- `sex` — `male`, `female`, `other`
- `age_min`, `age_max` — integers
- `search` — searches first name, last name, email
- `cursor` — UUID for cursor pagination
- `limit` — default 50, max 200

**Response:**
```json
{
  "data": [{
    "id": "uuid",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "email_status": "valid",
    "tags": [{ "id": "uuid", "name": "string", "color": "#hex" }],
    "created_at": "iso8601"
  }],
  "next_cursor": "uuid | null",
  "total": 1284
}
```

RLS enforces org scope. All filters are AND-combined.

---

### `POST /api/contacts`
**Auth:** jwt

**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string | null",
  "sex": "male | female | other | null",
  "age": "number | null",
  "source": "string",
  "tag_ids": ["uuid"],
  "custom_fields": { "key": "value" }
}
```

**Response:**
```json
{
  "contact": { "id": "uuid", "..." },
  "validation_job_id": "string"
}
```

Saves the contact, then fires an Inngest `validate_email` event. Returns immediately — validation is async.

---

### `PATCH /api/contacts/:id`
**Auth:** jwt — Partial update. If email changes, fires a new validation job and resets `email_status` to `pending`. Writes to `audit_log`.

---

### `DELETE /api/contacts/:id`
**Auth:** jwt — Soft delete (sets `deleted_at`). Historical send and RSVP records are preserved.

---

### `POST /api/contacts/import`
**Auth:** jwt

**Request:** `multipart/form-data` with:
- `file` — CSV binary
- `mapping` — JSON string mapping CSV column names to contact field names

**Response:**
```json
{ "job_id": "string", "row_count": 847, "status": "processing" }
```

Uploads CSV to Supabase Storage and triggers an Inngest `bulk_import` job. Poll `GET /api/contacts/import/:job_id` for progress.

---

### `GET /api/contacts/import/:job_id`
**Auth:** jwt

**Response:**
```json
{
  "status": "processing | complete | failed",
  "processed": 620,
  "total": 847,
  "imported": 598,
  "skipped": 22,
  "errors": [{ "row": 14, "reason": "invalid email format" }]
}
```

---

### `GET /api/contacts/export`
**Auth:** jwt — Same query parameters as `GET /api/contacts`. Returns streamed CSV. Hard cap at 50,000 rows.

---

### `POST /api/contacts/:id/tags`
**Auth:** jwt

**Request:** `{ "tag_ids": ["uuid"] }` — Upsert. Safe to call with already-applied tag IDs.

---

### `DELETE /api/contacts/:id/tags/:tag_id`
**Auth:** jwt — Removes a single tag from a contact.

---

## Events

### `GET /api/events`
**Auth:** jwt

**Query parameters:** `status`, `type`, `from`, `to`, `cursor`, `limit`

**Response:**
```json
{
  "data": [{
    "id": "uuid",
    "title": "string",
    "type": "single | recurring | multi_location",
    "starts_at": "iso8601",
    "capacity": 200,
    "rsvp_count": 87,
    "status": "published",
    "location": { "name": "string" }
  }],
  "next_cursor": "uuid | null"
}
```

---

### `POST /api/events`
**Auth:** jwt

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "type": "single | recurring | multi_location",
  "starts_at": "iso8601",
  "ends_at": "iso8601",
  "location_id": "uuid | null",
  "capacity": "number | null",
  "status": "draft | published",
  "recurrence_rule": "RRULE string | null",
  "locations": ["uuid"]
}
```

For recurring events, fires an Inngest `generate_instances` job to create child rows. For multi-location events, creates one child event per location UUID in `locations`.

---

### `PATCH /api/events/:id`
**Auth:** jwt

Includes optional `scope` field: `this`, `future`, or `all` — controls which recurring instances are updated.

---

### `DELETE /api/events/:id`
**Auth:** jwt — Sets `status=cancelled`. Accepts optional `scope` for recurring events. Triggers cancellation notification emails to all confirmed attendees.

---

### `GET /api/events/:id/attendees`
**Auth:** jwt

**Query parameters:** `status` — `invited`, `rsvp_yes`, `rsvp_no`, `attended`, `no_show`, `waitlisted`

**Response:**
```json
{
  "data": [{
    "contact_id": "uuid",
    "name": "string",
    "email": "string",
    "rsvp_status": "yes",
    "attendance_status": "attended",
    "location_preference": "uuid | null"
  }]
}
```

---

### `PATCH /api/events/:id/attendees/:contact_id`
**Auth:** jwt

**Request:** `{ "attendance_status": "attended | no_show" }`

On `attended`, fires an Inngest job to auto-apply the event attendance tag.

---

### `POST /api/events/:id/attendees/bulk-mark`
**Auth:** jwt

**Request:** `{ "contact_ids": ["uuid"], "attendance_status": "attended | no_show" }`

Single database upsert for bulk attendance marking.

---

## Campaigns

### `GET /api/campaigns`
**Auth:** jwt — Query params: `event_id`, `status`. Returns list with open rate and RSVP rate.

---

### `POST /api/campaigns`
**Auth:** jwt

**Request:**
```json
{
  "event_id": "uuid",
  "template_id": "uuid",
  "card_id": "uuid | null",
  "filter": {
    "tag_ids": ["uuid"],
    "email_status": ["valid"],
    "sex": null,
    "age_min": null,
    "age_max": null
  },
  "scheduled_at": "iso8601 | null"
}
```

**Response:**
```json
{
  "campaign": {
    "id": "uuid",
    "status": "draft",
    "recipient_count": 284,
    "filter_snapshot": {}
  }
}
```

Evaluates the filter to compute `recipient_count`. Snapshots the filter into `filter_snapshot`. Does not send.

---

### `POST /api/campaigns/:id/send`
**Auth:** jwt

Sets `status=sending` via `UPDATE ... WHERE status='draft'` (returns 409 if already sending). Fans out one Inngest `send_invitation` job per recipient. Each job renders the template, calls Resend, writes a `send_log` row with a unique `rsvp_token`, and records a `usage_events` row.

Returns 402 if the org has no active billing subscription.

---

### `GET /api/campaigns/:id/stats`
**Auth:** jwt

**Response:**
```json
{
  "sent": 284, "delivered": 279,
  "opened": 171, "clicked": 108,
  "rsvp_yes": 94, "rsvp_no": 21, "rsvp_pending": 169,
  "bounced": 5, "unsubscribed": 2
}
```

Aggregated from `send_log` and `rsvp_responses`. Recomputed on request.

---

### `GET /api/templates`
**Auth:** jwt — Returns list of email templates for the org.

### `POST /api/templates`
**Auth:** jwt — Create a new template. Validates that all merge tags referenced in `html_body` are declared in the `merge_tags` array.

### `PATCH /api/templates/:id`
**Auth:** jwt — Update template.

### `DELETE /api/templates/:id`
**Auth:** jwt — Delete template.

---

### `GET /api/cards`
**Auth:** jwt — Returns list of invitation card designs.

### `POST /api/cards`
**Auth:** jwt

**Request:**
```json
{
  "name": "string",
  "canvas_data": {},
  "preview_url": "string"
}
```

`preview_url` is the CDN URL of the PNG already uploaded to Supabase Storage by the client. `canvas_data` is the full Fabric.js JSON stored for re-editing.

---

## RSVP

### `GET /api/rsvp/:token`
**Auth:** public

**Response:**
```json
{
  "event": {
    "title": "string",
    "starts_at": "iso8601",
    "description": "string",
    "locations": [{ "id": "uuid", "name": "string", "address": "string" }]
  },
  "org": { "name": "string", "logo_url": "string", "primary_color": "#hex" },
  "contact": { "first_name": "string" },
  "current_response": "yes | no | maybe | null"
}
```

Returns only the fields needed for the RSVP page. No full contact profile or internal IDs exposed. Returns 404 for missing or expired tokens.

---

### `POST /api/rsvp/:token`
**Auth:** public

**Request:**
```json
{ "response": "yes | no | maybe", "location_id": "uuid | null" }
```

**Response:**
```json
{
  "ok": true,
  "event_title": "string",
  "response": "yes",
  "waitlisted": false
}
```

Checks capacity before writing. If at capacity and response is `yes`, sets `waitlisted=true` and triggers an Inngest `promote_waitlist` check. Both endpoints are rate-limited at 10 requests per IP per minute.

---

## Email validation

### `POST /api/validation/single`
**Auth:** jwt

**Request:**
```json
{ "email": "string", "contact_id": "uuid | null" }
```

**Response:**
```json
{
  "email": "string",
  "status": "valid | invalid | disposable | unknown",
  "sub_status": "string | null",
  "mx_found": true,
  "is_disposable": false,
  "provider": "gmail.com"
}
```

Calls the email validation adapter synchronously. The adapter tries Disify first, then optional Reacher, then local syntax/MX fallback. If `contact_id` is provided, updates `contacts.email_status` and writes an `email_validations` row. Records a `usage_events` row for billing.

---

### `POST /api/validation/bulk`
**Auth:** jwt admin — Queues Inngest bulk validation for a filtered contact set. Returns `{ "job_id": "string", "contact_count": 412 }`.

### `GET /api/validation/jobs/:job_id`
**Auth:** jwt — Returns validation job progress.

---

## Organizations and users

### `GET /api/org`
**Auth:** jwt — Returns current org settings.

### `PATCH /api/org`
**Auth:** admin — Updates org settings. Writes to audit log on every change.

### `GET /api/org/users`
**Auth:** admin — Returns list of org members.

### `POST /api/org/users/invite`
**Auth:** admin

**Request:** `{ "email": "string", "role": "admin | member" }`

Creates an invite token (72-hour expiry) and sends an email via Resend.

### `PATCH /api/org/users/:user_id`
**Auth:** admin — Change role. Returns 400 if attempting to demote the last admin.

### `DELETE /api/org/users/:user_id`
**Auth:** admin — Removes user from org. Does not delete the user account.

---

### `GET /api/platform/orgs`
**Auth:** platform — Lists all organizations with usage stats. Uses service role key, bypasses RLS.

### `POST /api/platform/orgs/:id/impersonate`
**Auth:** platform — Issues a 30-minute JWT scoped to the target org. All actions taken while impersonating are flagged in `audit_log`.

---

## Webhooks

### `POST /api/webhooks/resend`
**Auth:** public + Resend signature verification

Processes Resend email events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.failed`, `email.complained`, and `email.suppressed`.

The route verifies Svix headers with `RESEND_WEBHOOK_SECRET`, stores the webhook ID in `resend_webhook_events` for idempotency, then calls the database RPC through the Supabase service role. The RPC is not executable through the public Supabase API by `anon` or `authenticated`.

On bounce or failure: updates `send_log.delivery_status=bounced`, updates `contacts.email_status=invalid`, writes an `email_validations` row, and creates a bounce suppression.

On complaint or suppression: updates `send_log.delivery_status` and creates a suppression so future sends skip the recipient.

On opened/clicked: updates `send_log.opened_at` or `send_log.clicked_at`.

Missing webhook secret returns 503. Invalid signature returns 400. Unknown event types return 200 with `{ "ignored": true }`.

---

### `POST /api/webhooks/lemon-squeezy`
**Auth:** public + Lemon Squeezy signature verification

Processes Lemon Squeezy billing events such as subscription created, subscription updated, subscription cancelled, order created, and payment failed.

On active subscription events: stores the Lemon Squeezy customer, subscription, and subscription item IDs needed for usage reporting.
On failed payment or cancelled subscription events: updates `plan_status`, records an audit event, and sends a warning email to the org admin.

---

### `POST /api/webhooks/inngest`
**Auth:** Inngest signing key verification

The serve endpoint for all Inngest background functions. All jobs (email send, CSV import, validation, reminders, instance generation, waitlist promotion) are registered and served from this single route.

---

## Billing

### `GET /api/billing/usage`
**Auth:** admin

**Response:**
```json
{
  "period_start": "iso8601",
  "period_end": "iso8601",
  "emails_sent": 1840,
  "validations_run": 412,
  "estimated_total_usd": 4.25
}
```

Aggregated from `usage_events` for the current billing period. Estimated total computed locally; actual invoice amount comes from Lemon Squeezy.

---

### `POST /api/billing/portal`
**Auth:** admin

**Request:** `{ "return_url": "string" }`

**Response:** `{ "url": "string" }`

Creates or returns a Lemon Squeezy-hosted billing management link. The client redirects to the returned URL. Org manages payment method, views invoices, and can cancel from the hosted billing flow.

---

### `GET /api/billing/invoices`
**Auth:** admin

Returns invoice/order history fetched from the Lemon Squeezy API. Cached for 60 seconds per org. Each record includes amount, status, billing period, and hosted receipt or invoice URL when available.
