# Reference Resources

These repositories are project references only. They are not application dependencies unless explicitly added later.

## Front-End Design Checklist

- URL: https://github.com/thedaviddias/Front-End-Design-Checklist
- Use case: quality checks before shipping UI changes.
- Useful for: accessibility, performance, SEO, responsive behavior, markup quality, and release readiness.
- Project note: use this as a final review checklist before larger frontend releases or visual redesigns.

## Public API Lists

- URL: https://github.com/public-api-lists/public-api-lists
- Use case: discovery source for public APIs.
- Useful for: finding lower-friction APIs for address lookup, geocoding, enrichment, validation, and future integrations.
- Project note: verify API reliability, pricing, country support, rate limits, and terms before building any production feature around a listed API.

## EmailBuilderJS

- URL: https://github.com/usewaypoint/email-builder-js
- Use case: MIT-licensed open-source email template builder and renderer.
- Useful for: self-hosted campaign/template email composition, JSON email documents, email-safe rendered HTML, image/button/text blocks, and matching preview/send output.
- Project note: this is now the preferred campaign builder dependency. Store EmailBuilderJS JSON in `design_data.email_builder_document` and server-render final HTML with `renderToStaticMarkup`.

## Unlayer React Email Editor

- URL: https://github.com/unlayer/react-email-editor
- Use case: maintained drag-and-drop visual email editor for React.
- Useful for: legacy campaign drafts that may still contain Unlayer design JSON.
- Project note: parked as a legacy escape hatch. New campaign/template edits should use EmailBuilderJS instead.

## Atomic CRM

- URL: https://github.com/marmelab/atomic-crm
- Use case: MIT-licensed CRM reference built with React, shadcn-style UI, and Supabase.
- Useful for: contact/company UX, activity history, merge contacts, custom fields, import/export, and dense CRM layout patterns.
- Project note: use as a design and architecture reference for CRM modules. If code is copied directly later, preserve the MIT license notice and attribution.
