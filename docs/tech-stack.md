# Tech stack

All technology choices are documented here with rationale, alternatives considered, and specific watch-outs.

---

## Frontend

### Next.js 15 (App Router)
The primary application framework. App Router provides React Server Components for fast, server-rendered pages, route-based code splitting, and API routes in the same repository — no separate backend server is required for standard endpoints.

Server components are used for contact lists, event pages, and dashboards. Client components are used for the invitation card designer and email template editor, where rich interactivity is required.

**Alternative considered:** Remix. Rejected because the Inngest SDK and Supabase SSR helpers have better Next.js support, and the deployment target (Vercel) has first-class Next.js optimization.

**Watch-out:** Server Component and Client Component boundaries require discipline. If every component becomes a client component, the performance benefits of RSC are lost. Plan the component tree before writing code — only components that require browser APIs, event listeners, or third-party canvas/editor libraries should be client components.

---

### TypeScript (strict mode)
Used throughout the entire codebase — frontend, API routes, Inngest functions, and utility libraries. The data model has enough nullable fields, union types (event types, email statuses, RSVP responses), and org-scoped entities that loose TypeScript allows serious bugs through silently.

Types are generated from the Supabase schema via `supabase gen types typescript` and stored in `types/database.ts`. Domain types (with computed fields and UI-specific shapes) are derived from these in `types/app.ts`.

**Watch-out:** Never use `any` as a shortcut. Define DB row types once and propagate them. The discipline pays off as the codebase grows.

---

### Tailwind CSS + shadcn/ui
Tailwind provides utility-first CSS that co-locates styles with components. Essential for a product where the UI iterates constantly.

shadcn/ui provides pre-built, accessible component primitives (Dialog, Dropdown, Table, Badge, Command) that are copied into the codebase rather than installed as a dependency. This means components can be customized freely without fighting a library's opinions.

**Watch-out:** Install the Tailwind CSS IntelliSense VS Code extension from day one. Without autocomplete, Tailwind class names are friction. With it, they feel like inline CSS.

---

### Fabric.js (invitation card designer)
Canvas engine for the drag-and-drop card designer. Fabric wraps HTML Canvas with an object model (text boxes, image layers, shapes, groups) that serializes cleanly to JSON — stored in `invitation_cards.canvas_data`. Exporting the canvas as PNG is a single `canvas.toDataURL()` call.

**Alternative considered:** Konva.js. Both are mature. Fabric has more built-in text editing capabilities which are important for invitation card creation.

**Watch-out:** Pin to a specific Fabric.js major version. v5 → v6 had breaking API changes. Also: large canvases with many high-resolution images can be slow on lower-end machines. Lazy-load image assets and limit background image file size.

---

### Tiptap (email template editor)
Rich-text editor framework built on ProseMirror. Used for the email template builder. The merge tag extension allows inserting `{{first_name}}`, `{{event_name}}`, and `{{rsvp_link}}` as non-editable inline nodes with visual highlighting.

**Watch-out:** Tiptap's HTML output is not always email-safe. Run the output through an email HTML sanitizer and test in multiple email clients (Gmail, Outlook, Apple Mail) before shipping.

---

## Backend and database

### Supabase
The entire backend foundation: PostgreSQL database, Auth, Storage (file hosting), and Row Level Security — all in one managed service.

RLS is the architectural keystone of the multi-tenancy model. Policies are written once per table and enforced at the database level, meaning no application-layer code can accidentally leak cross-org data regardless of bugs in query logic.

Supabase also provides Realtime subscriptions, used to push email validation status updates to the contact list UI without polling.

**Alternative considered:** PlanetScale (database) + NextAuth (auth) + S3 (storage). Rejected because Supabase's integrated offering dramatically reduces configuration surface area, especially for RLS.

**Watch-out:** RLS policies must be tested explicitly with a dedicated test suite. Write tests that authenticate as Org A and assert that Org B's contacts return zero rows. Run these tests after every migration. Silent RLS failures are the most dangerous class of bug in the system.

---

### Supabase Auth
Handles user sessions, JWTs, magic link login, and email+password authentication. Extended with a custom JWT hook (a PostgreSQL function on `auth.users` insert and login) that injects `org_id` and `role` into the JWT claims.

All RLS policies and Next.js middleware read these JWT claims to determine what the current user is allowed to see and do.

**Watch-out:** When a user belongs to multiple organizations (future feature), org-switching requires issuing a new JWT with the selected `org_id`. This must be designed before multi-org users exist in production — retrofitting it is disruptive.

---

## Async jobs and background work

### Inngest
Durable background job runner with a Next.js-native integration. Functions are defined in `inngest/` and served via a single API route (`/api/webhooks/inngest`). Inngest handles retries, concurrency limits, step-level logging, and scheduled (cron) execution.

All bulk operations run through Inngest: email sends, CSV imports, email validation, reminder scheduling, recurring event instance generation, and waitlist promotion.

**Alternative considered:** Trigger.dev. Both are strong. Inngest was chosen for its slightly simpler Next.js integration and more granular concurrency controls per function.

**Watch-out:** Never perform bulk operations synchronously in an API route. Vercel functions have a 10-second timeout. Any operation touching more than one external service belongs in an Inngest function.

---

### Resend
Transactional email provider. Clean REST API, high deliverability, generous free tier (3,000 emails/month), and reliable webhook delivery for bounce, complaint, open, and click events.

Bounce and complaint webhooks POST to `/api/webhooks/resend`, which triggers an Inngest job to update `contacts.email_status` and `send_log.delivery_status`.

**Watch-out:** Configure DNS records (SPF, DKIM, DMARC) for every org sender domain before sending real email. Skipping this tanks deliverability and the reputation damage is very hard to recover from. Consider offering a shared platform sender domain (e.g. `invites.yourplatform.com`) as a fallback for orgs that cannot configure DNS.

---

### Reacher (self-hosted)
Open-source email validation engine written in Rust, deployed as a Docker container on Fly.io. Performs syntax checking, MX record lookup, SMTP server ping, and disposable email domain detection.

Called from Inngest jobs — not directly from API routes — to keep validation async and rate-controlled.

**Alternative considered:** ZeroBounce API. Rejected at launch to avoid per-validation API costs. Reacher can be replaced with a third-party API later if self-hosting becomes a maintenance burden.

**Watch-out:** Reacher requires outbound port 25 for SMTP checks. Many cloud providers (Railway, Render, Vercel) block this port. Fly.io allows it. Test outbound port 25 connectivity on the chosen host in the first week of development — not after the validation UI is built. Also: rate-limit Reacher calls to ~10 concurrent validations per org. Aggressive parallel SMTP checks will cause IP blocks from major email providers.

---

## Billing and payments

### Lemon Squeezy (Merchant of Record + usage-based billing)
Lemon Squeezy handles global checkout, subscriptions, payment collection, and sales tax/VAT compliance as Merchant of Record. Each billable event (email sent, validation run) is written to `usage_events` first (the source of truth), then reported to Lemon Squeezy asynchronously as a usage record using an idempotency key to prevent double-billing on retry.

Organizations manage checkout, payment method updates, subscription status, and invoices through Lemon Squeezy-hosted flows and customer links, so the app only needs usage summaries and links out to billing management.

**Alternative considered:** Stripe Billing. Rejected for launch because Stripe is not directly available to businesses registered in the Philippines. Stripe remains a possible future adapter if the business later forms an entity in a supported Stripe country.

**Watch-out:** Usage-based Lemon Squeezy products bill in arrears. Test the full lifecycle before launch: create checkout, receive subscription webhooks, store subscription item IDs, report email and validation usage, verify renewal invoice, handle failed payment or cancellation, and reconcile local `usage_events` against Lemon Squeezy usage records.

---

## Hosting and infrastructure

### Vercel
Deploys the Next.js application with zero configuration. Provides the edge CDN, automatic preview deployments per pull request, and built-in analytics. Inngest functions deploy alongside the Next.js app automatically via the API route integration.

**Watch-out:** Vercel's Hobby plan has a 10-second function timeout and limits on build minutes. Move to the Pro plan before adding paying customers. Confirm pricing at current rates before committing.

---

### Fly.io (Reacher host)
Fly.io hosts the Reacher Docker container separately from the main application. It is the only service that runs outside the Next.js monorepo. A single small Fly machine is sufficient for moderate validation volumes.

**Watch-out:** Monitor the Reacher machine's memory usage. The Rust binary is efficient but multiple concurrent SMTP connections can spike memory on a very small instance. Start with a shared-cpu-1x, 512MB machine and scale up if needed.

---

### Supabase Storage
Stores org logos, card designer image assets, and exported invitation card PNGs. S3-compatible, access-controlled by RLS policies, and served via a built-in CDN.

**Watch-out:** Set upload size limits (2MB for logos, 20MB for card background images). Large uploads slow down the canvas editor and inflate storage costs.

---

## Environment variables

All required environment variables are listed in `.env.example` in the project root. Required keys:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
RESEND_API_KEY
RESEND_WEBHOOK_SECRET
REACHER_API_URL
REACHER_API_KEY
LEMONSQUEEZY_API_KEY
LEMONSQUEEZY_WEBHOOK_SECRET
LEMONSQUEEZY_STORE_ID
LEMONSQUEEZY_EMAIL_VARIANT_ID
LEMONSQUEEZY_VALIDATION_VARIANT_ID
```

Never commit `.env.local`. The `.env.example` file (with placeholder values) is committed to the repository.
