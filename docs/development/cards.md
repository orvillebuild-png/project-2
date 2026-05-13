# Cards

## Purpose

Cards are reusable invitation designs that can later be attached to campaigns and embedded into email content.

## Implemented Features

- Card gallery.
- New card designer.
- Edit existing card.
- Custom card dimensions.
- Size presets:
  - postcard
  - square
  - story
  - banner
  - custom
- Design presets for quick visual direction.
- Background color, accent color, and texture controls.
- Layered card data stored in `invitation_cards.canvas_data`.
- Text layers.
- Shape/callout layers.
- Layer selection, duplicate, delete, position, size, text, color, fill, radius, alignment, and font weight controls.
- Live preview.

## Current Card Flow

1. User opens `/cards`.
2. User creates a new card or opens an existing one.
3. User chooses a size preset or custom dimensions.
4. User applies a design direction.
5. User edits layers from the side panel.
6. User saves the card.
7. The design is stored as structured JSON in `invitation_cards.canvas_data`.

## Use Cases

- Build a donation drive invitation card.
- Create a square graphic for social posting.
- Create a portrait story-sized invitation.
- Reuse a visual design across multiple campaigns.
- Maintain design data in a format that can later be exported to PNG or rendered into emails.

## Error Handling

- Card save requires a name and valid design JSON.
- Card JSON is normalized on read and write.
- Invalid or old card data falls back to safe defaults.
- `invitation_cards` is protected by org-scoped RLS.
- Authenticated app access requires explicit grants on `invitation_cards`.

## Important Files

- `app/(dashboard)/cards/page.tsx`
- `app/(dashboard)/cards/new/page.tsx`
- `app/(dashboard)/cards/[id]/page.tsx`
- `components/cards/CardDesigner.tsx`
- `components/cards/CardPreview.tsx`
- `lib/cards.ts`
- `supabase/migrations/20260513143000_grant_invitation_cards.sql`

## Current Limitations

- Layers are edited through numeric controls, not drag-and-drop yet.
- No image upload layer yet.
- No logo library yet.
- No PNG export yet.
- Cards are not attached to campaigns yet.
- No reusable template marketplace/library yet.
