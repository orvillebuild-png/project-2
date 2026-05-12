# Folder structure

One monorepo containing the Next.js application, Supabase migrations, Inngest background functions, and all project documentation. The only service outside this repo is Reacher (deployed separately on Fly.io due to port 25 requirements).

---

```
nonprofit-saas/
│
├── app/                              Next.js App Router root
│   ├── (auth)/                       Route group — unauthenticated pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── invite/[token]/page.tsx
│   │
│   ├── (dashboard)/                  Route group — authenticated app
│   │   ├── layout.tsx                Dashboard shell with sidebar
│   │   ├── contacts/
│   │   │   ├── page.tsx              Contact list with filters
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx         Contact detail + timeline
│   │   │   └── import/page.tsx       CSV import wizard
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/page.tsx         Event detail + guest list
│   │   │   └── [id]/edit/page.tsx
│   │   ├── campaigns/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx          Campaign builder wizard
│   │   │   └── [id]/page.tsx         Campaign stats
│   │   ├── templates/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx         Tiptap template editor
│   │   ├── cards/
│   │   │   ├── page.tsx              Card gallery
│   │   │   └── [id]/page.tsx         Fabric.js card designer
│   │   ├── settings/
│   │   │   ├── page.tsx              General: name, logo, color
│   │   │   ├── sender/page.tsx       Email sender config
│   │   │   ├── users/page.tsx        Members and invite form
│   │   │   ├── billing/page.tsx      Usage + Lemon Squeezy billing links
│   │   │   └── audit/page.tsx        Audit log viewer
│   │   └── admin/                    Platform super-admin only
│   │       ├── page.tsx              All orgs list
│   │       └── orgs/[id]/page.tsx
│   │
│   ├── rsvp/
│   │   └── [token]/page.tsx          Public hosted RSVP page
│   │
│   ├── register/
│   │   └── [slug]/page.tsx           Public self-registration form
│   │
│   └── api/
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── invite/accept/route.ts
│       ├── contacts/
│       │   ├── route.ts              GET (list) + POST (create)
│       │   ├── export/route.ts
│       │   ├── import/route.ts
│       │   ├── import/[job_id]/route.ts
│       │   └── [id]/
│       │       ├── route.ts          PATCH + DELETE
│       │       └── tags/
│       │           ├── route.ts      POST (add tags)
│       │           └── [tag_id]/route.ts  DELETE
│       ├── events/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── attendees/
│       │           ├── route.ts
│       │           ├── bulk-mark/route.ts
│       │           └── [contact_id]/route.ts
│       ├── campaigns/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── send/route.ts
│       │       └── stats/route.ts
│       ├── templates/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── cards/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── rsvp/
│       │   └── [token]/route.ts      GET + POST (public)
│       ├── validation/
│       │   ├── single/route.ts
│       │   ├── bulk/route.ts
│       │   └── jobs/[job_id]/route.ts
│       ├── org/
│       │   ├── route.ts              GET + PATCH
│       │   └── users/
│       │       ├── route.ts
│       │       ├── invite/route.ts
│       │       └── [user_id]/route.ts
│       ├── billing/
│       │   ├── usage/route.ts
│       │   ├── portal/route.ts
│       │   └── invoices/route.ts
│       ├── platform/
│       │   └── orgs/
│       │       ├── route.ts
│       │       └── [id]/
│       │           ├── route.ts
│       │           └── impersonate/route.ts
│       └── webhooks/
│           ├── resend/route.ts
│           ├── lemon-squeezy/route.ts
│           └── inngest/route.ts      Inngest serve endpoint
│
├── components/
│   ├── ui/                           shadcn/ui primitives — auto-generated, do not hand-edit
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   ├── contacts/
│   │   ├── ContactRow.tsx
│   │   ├── ContactFilters.tsx
│   │   ├── TagBadge.tsx
│   │   ├── EmailStatusBadge.tsx
│   │   └── ImportWizard.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── AttendeeTable.tsx
│   │   ├── RecurrenceSelector.tsx
│   │   └── LocationPicker.tsx
│   ├── campaigns/
│   │   ├── CampaignBuilder.tsx
│   │   ├── FilterBuilder.tsx
│   │   ├── RecipientPreview.tsx
│   │   └── StatsCard.tsx
│   ├── canvas/                       All Fabric.js code lives here
│   │   ├── FabricCanvas.tsx          'use client' — never SSR
│   │   ├── CanvasToolbar.tsx
│   │   ├── LayerPanel.tsx
│   │   └── TextEditor.tsx
│   └── rsvp/
│       ├── RSVPForm.tsx
│       ├── LocationSelector.tsx
│       └── ConfirmationScreen.tsx
│
├── lib/                              Pure utilities — no React, no Next.js imports
│   ├── supabase.ts                   createServerClient() + createBrowserClient()
│   ├── supabase.admin.ts             Service-role client — never import in client components
│   ├── auth.ts                       getSession(), requireSession(), requireAdmin()
│   ├── api-error.ts                  ApiError class + createErrorResponse()
│   ├── reacher.ts                    validateEmail() — HTTP client for Fly.io Reacher
│   ├── resend.ts                     sendEmail() + verifyWebhookSignature()
│   ├── billing.ts                    Provider-agnostic billing helpers
│   ├── lemon-squeezy.ts              createCheckout(), reportUsage(), verifyWebhookSignature()
│   ├── usage.ts                      recordUsage(orgId, type, qty)
│   ├── audit.ts                      logAudit(orgId, actorId, action, entity, id, diff)
│   ├── rrule.ts                      expandRule() + describeRule() wrapping rrule.js
│   └── csv.ts                        parse() + serialize() wrapping PapaParse
│
├── inngest/                          Background job functions
│   ├── client.ts                     Inngest client singleton
│   ├── validate-email.ts             validate_email/created
│   ├── bulk-import.ts                contacts/bulk_import
│   ├── bulk-validate.ts              contacts/bulk_validate
│   ├── send-invitation.ts            campaigns/send_invitation
│   ├── send-reminder.ts              events/send_reminder (scheduled)
│   ├── generate-instances.ts         events/generate_instances
│   └── promote-waitlist.ts           events/promote_waitlist
│
├── types/
│   ├── database.ts                   Auto-generated by Supabase CLI — never hand-edit
│   ├── api.ts                        Request/response types for every route
│   └── app.ts                        Domain types derived from DB types
│
├── supabase/
│   ├── migrations/                   One .sql file per schema change, timestamp-prefixed
│   ├── seed/
│   │   ├── seed.sql                  Base seed for local development
│   │   └── seed-dev.ts               Script to generate realistic test data
│   └── config.toml                   Supabase CLI config
│
├── docs/
│   ├── README.md                     Project overview (this planning session)
│   ├── features.md
│   ├── data-model.md
│   ├── tech-stack.md
│   ├── build-sequence.md
│   ├── api.md
│   └── folder-structure.md
│
├── .env.local                        Local secrets — never commit
├── .env.example                      Required variable names with placeholder values
├── middleware.ts                     Edge middleware — protects /dashboard, /admin
├── next.config.ts
└── package.json
```

---

## Naming conventions

**Files and folders:** kebab-case for routes and utilities (`validate-email.ts`, `bulk-import/`). PascalCase for React components (`ContactRow.tsx`, `FabricCanvas.tsx`).

**API routes:** Each route segment gets a `route.ts` file. Avoid deeply nested route files — prefer flat structure with clear segment names.

**Inngest functions:** Named with a domain prefix and verb-noun pattern (`validate-email`, `bulk-import`, `send-reminder`). The Inngest event name mirrors the filename with a slash separator (`validate_email/created`, `campaigns/send_invitation`).

**Database migrations:** Timestamp prefix + descriptive name (`20250601120000_create_contacts.sql`). Never modify a committed migration — add a new one.

---

## Key rules

**`lib/` is framework-free.** Nothing in `lib/` imports from `react`, `next`, or any other framework. These are pure TypeScript modules callable from server components, API routes, Inngest functions, and tests without any environment setup.

**`components/canvas/` is always a client component.** Fabric.js requires browser APIs. Every file in this directory must have `'use client'` at the top. Never import canvas components into server components directly — use dynamic imports with `ssr: false`.

**`supabase.admin.ts` is server-only.** The service role key bypasses RLS. This file must never be imported by client components or exposed to the browser. Add a runtime check at the top of the file:
```typescript
if (typeof window !== 'undefined') {
  throw new Error('supabase.admin.ts must not be imported in browser environments');
}
```

**`types/database.ts` is generated, not hand-written.** Regenerate with `supabase gen types typescript --local > types/database.ts` after every migration. Never add manual types to this file — put derived types in `types/app.ts`.

**Migrations are append-only.** Once a migration file is committed, never modify it. Create a new migration to alter a table. This ensures `supabase db reset` always produces a deterministic database state.
