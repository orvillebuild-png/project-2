# Campaigns and RSVP

## Purpose

Campaigns create invitation drafts for event invitees, prepare recipient-specific RSVP links, send invitation emails through Resend, and track RSVP responses.

## Implemented Campaign Features

- Campaign list.
- New campaign draft.
- Campaign detail/edit page.
- Internal campaign name.
- Email subject.
- Email body.
- Visual drag-and-drop email template builder powered by `react-email-editor`.
- Campaign studio UI with separate campaign brief, message, design direction, preview, and delivery console areas.
- Campaign preview is opened intentionally from the message editor instead of running as a permanent side panel.
- The message preview action saves the current draft before opening the full email preview.
- Authenticated email preview route that renders the same HTML used by Resend.
- Full-size email preview screen.
- Email-safe visual template controls:
  - drag-and-drop rows and content blocks
  - text, heading, button, divider, HTML, and image blocks
  - font choices exposed inside the builder, including Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Nunito, Source Sans 3, Merriweather, and Playfair Display
  - built-in color, spacing, sizing, and mobile-responsive controls
- Shared visual builder for new drafts and later edits.
- Builder exports both final HTML and design JSON when a campaign is saved, previewed, tested, or sent.
- Builder image uploads are stored in Supabase Storage through a custom Unlayer image callback.
- File attachment upload remains available from the builder header and is sent through Resend as an email attachment.
- Sender identity fields for from name and from email.
- File attachment upload and attachment link rendering.
- Merge-field preview.
- Recipient log generation.
- Campaign recipient RSVP status table.
- RSVP summary counts.
- Guarded Resend test email action.
- Guarded campaign send action.
- Campaign send guard blocks pending recipients marked `invalid` or `disposable`.
- Recipient table shows contact email verification status.
- Per-recipient delivery status updates after Resend accepts an email.
- Per-recipient open and click tracking through token-scoped tracking routes.
- Campaign engagement summary for delivered, opened, clicked, and pending recipients.
- Tokenized unsubscribe links in real campaign sends.
- Suppressed contacts are skipped before Resend is called.

## Supported Merge Fields

- `{{first_name}}`
- `{{event_title}}`
- `{{event_date}}`
- `{{venue}}`
- `{{rsvp_link}}`

## Current Campaign Flow

1. User selects an event.
2. Campaign uses the event's selected invitees as its recipient source.
3. User enters campaign name and subject.
4. User designs the email in the visual builder, including copy, layout, colors, fonts, buttons, merge fields, images, and links.
5. Campaign is saved as draft.
6. User reviews the live recipient preview in the campaign studio.
7. User generates RSVP links.
8. The app creates `send_log` records with unique `rsvp_token` values.
9. User reviews recipient email statuses.
10. User confirms the campaign send.
11. The app sends only pending recipient rows through Resend.
12. Each accepted email marks its `send_log` row as `delivered` with `sent_at`.
13. Sent campaign HTML includes a 1x1 open pixel and rewrites HTTP links through a click redirect.
14. Open and click events update `send_log.opened_at` and `send_log.clicked_at`.
15. If the recipient unsubscribes, the public unsubscribe page writes a `contact_suppressions` row.
16. Future sends mark suppressed pending rows as `suppressed` and skip them.
17. Campaign detail shows each recipient, email status, delivery status, engagement status, and RSVP status.

## RSVP Flow

1. User opens `/rsvp/[token]`.
2. App resolves the token through a scoped public RPC.
3. RSVP page shows:
   - event title
   - contact name/email
   - schedule
   - venue
   - Yes, Maybe, No buttons
4. Response is saved to `rsvp_responses`.
5. Attendance status is updated.
6. Campaign recipient table reflects the response.

## Use Cases

- Draft an invitation for a donation drive.
- Preview event merge fields before sending.
- Generate a recipient-specific RSVP link.
- Test RSVP response loop without email sending.
- Track pending/yes/maybe/no response status from the campaign page.
- Track open and click engagement from the campaign page.
- Let a recipient unsubscribe from future campaign email without logging in.
- View RSVP summary counts for yes, maybe, no, and pending.
- Adjust the visible email layout without editing raw HTML.
- Compose the email in a focused studio layout instead of a single raw admin form.
- Review the exact email HTML before sending through the side preview or full-size preview.
- Tune the email template styling without editing raw HTML.
- Upload a campaign image or attachment into the `email-assets` Supabase Storage bucket.
- Insert a link into selected words using markdown-style `[text](url)` syntax, which renders as an email-safe link.
- Send one rendered test email when Resend is configured.
- Block real sends when selected recipients are known invalid or disposable.
- Send the real campaign to pending recipients after confirming the action.
- Resume a partial send by sending remaining pending recipients.

## Error Handling

- Campaign creation requires event, campaign name, subject, and message.
- Email design data is stored as JSON and falls back to safe defaults if missing.
- Recipient log generation requires event invitees.
- Recipient log generation only inserts missing records, so repeat sync is safe.
- RSVP token lookup returns 404 if token is invalid.
- RSVP submission only accepts `yes`, `maybe`, or `no`.
- Public RSVP RPCs expose only token-scoped lookup and token-scoped response submission.
- Test email sending requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- If email env vars are missing, the UI shows a setup error and does not attempt to send.
- Campaign sending requires a confirmation checkbox.
- Campaign sending only targets `send_log` rows with `delivery_status = pending`.
- Campaign sending stops before Resend if pending recipients include `invalid` or `disposable` email statuses.
- Pending, unknown, and risky email statuses are visible in the delivery console so the user can verify before sending.
- Resend calls use deterministic idempotency keys per campaign recipient to reduce accidental duplicate sends during retries.
- If a send fails partway through, already accepted recipients remain `delivered`; the campaign returns to `draft` so remaining pending recipients can be sent later.
- If no pending recipients exist, the send action stops without calling Resend.
- Tracking routes never expose contact or campaign data; they only update a matching token row and return a pixel or redirect.
- Tracking writes go through `record_campaign_open` and `record_campaign_click`, both token-scoped public RPCs.
- Click tracking only redirects to `http` or `https` URLs and falls back to the app origin for malformed values.
- Unsubscribe writes go through `unsubscribe_by_token`, a token-scoped public RPC.
- Suppressed contacts are marked `suppressed` in `send_log` and are not sent to Resend.

## UI Direction

- The campaign editor follows the app's modern warm/yellow design direction.
- The editor separates content authoring from operational sending controls.
- Merge fields are always visible as chips while writing the message.
- Preview opens from the message editor so the main campaign page stays focused on editing and delivery controls.
- Side preview and full-size preview use an iframe pointed at the same HTML renderer used by Resend sends.
- Template controls intentionally use email-client-safe inline styles.
- Image insertion uploads from the message toolbar and stores the public URL, alt text, and target width in template design JSON.
- Image resizing is performed by dragging the handle on the previewed image itself.
- Uploaded email images and attachments are stored in a public org-scoped `email-assets` bucket.
- Attachments are included as Resend attachments when sending and also shown as a link in the email body.
- `from_email` must be a sender/domain Resend is allowed to send from; otherwise Resend will reject the send.
- Sent links are rewritten through `/api/campaigns/click/[token]`; previews and test emails are left untracked so testing does not pollute engagement analytics.
- Real campaign sends append a small unsubscribe footer.
- Delivery actions are grouped into one console:
  - RSVP link generation/sync
  - test email
  - guarded real send
- The UI structure is inspired by "design direction" workflows: each screen should have a clear posture, not just a collection of fields.

## Important Files

- `app/(dashboard)/campaigns/page.tsx`
- `app/(dashboard)/campaigns/new/page.tsx`
- `app/(dashboard)/campaigns/[id]/page.tsx`
- `app/(dashboard)/campaigns/[id]/email-preview/route.ts`
- `app/(dashboard)/campaigns/[id]/preview/page.tsx`
- `app/api/campaigns/open/[token]/route.ts`
- `app/api/campaigns/click/[token]/route.ts`
- `app/unsubscribe/[token]/page.tsx`
- `lib/unsubscribe.ts`
- `components/campaigns/CampaignBodyEditor.tsx`
- `components/campaigns/EmailTemplateControls.tsx`
- `app/rsvp/[token]/page.tsx`
- `lib/campaigns.ts`
- `lib/rsvp.ts`

## Current Limitations

- Test email sending is available only when Resend env vars are configured.
- Real campaign sending is available only when Resend env vars are configured.
- Unlayer loads from its hosted editor script, so the builder requires network access while editing.
- Complex visual templates can produce larger Server Action payloads; the app raises the action body limit to support saved design JSON.
- RSVP link is rendered as a CTA in preview and real sends.
- No Resend webhook processing yet for bounce or complaint events.
- Open tracking depends on email clients loading remote images; some clients block or proxy pixels.
- Manual suppression management UI is not built yet; suppressions are currently created by unsubscribe links and respected during send.
