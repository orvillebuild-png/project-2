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
- Image/logo layers uploaded to Supabase Storage.
- Web-safe font picker for text and shape layers.
- Layer selection, duplicate, delete, position, size, text, color, fill, radius, alignment, and font weight controls.
- Centered editing canvas.
- Pop-up side panels for design, size, layers, and selected-layer editing.
- Drag-to-position for selected layers.
- 3D preview toggle using CSS perspective.
- Live preview.

## Current Card Flow

1. User opens `/cards`.
2. User creates a new card or opens an existing one.
3. User chooses a size preset or custom dimensions.
4. User applies a design direction.
5. User adds text or shape layers from the toolbar.
6. User clicks a layer to open the inspector.
7. User drags a layer on the card or fine-tunes values in the inspector.
8. User saves the card.
9. The design is stored as structured JSON in `invitation_cards.canvas_data`.

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
- `supabase/migrations/20260513150000_create_card_assets_bucket.sql`

## Current Limitations

- Layers can be moved by dragging, but resize handles are not implemented yet.
- No reusable logo library yet.
- No PNG export yet.
- Cards are not attached to campaigns yet.
- No reusable template marketplace/library yet.
- 3D mode is a preview effect, not a true 3D object editor.
- Font list currently uses web-safe fonts to avoid extra download cost and rendering instability.
