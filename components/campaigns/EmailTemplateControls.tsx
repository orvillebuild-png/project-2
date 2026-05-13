"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { EmailDesignData } from "@/lib/campaigns";

const fontOptions = [
  { label: "Inter / Arial", value: "Inter, Arial, Helvetica, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', Arial, sans-serif" }
];

export function EmailTemplateControls({
  design
}: {
  design: EmailDesignData;
}) {
  const [imageUrl, setImageUrl] = useState(design.image_url);
  const [imageWidth, setImageWidth] = useState(design.image_width);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  function startResize(event: PointerEvent<HTMLButtonElement>) {
    dragStart.current = { x: event.clientX, width: imageWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(event: PointerEvent<HTMLButtonElement>) {
    if (!dragStart.current) {
      return;
    }

    const nextWidth = Math.min(640, Math.max(180, dragStart.current.width + event.clientX - dragStart.current.x));
    setImageWidth(Math.round(nextWidth));
  }

  function stopResize(event: PointerEvent<HTMLButtonElement>) {
    dragStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-line/90 bg-[#fff8dc]/72 p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
          Aa
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Template design</h3>
          <p className="mt-1 text-[0.78rem] leading-5 text-muted">
            Email-safe styling controls for the preview and the real Resend email.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink lg:col-span-2">
          Email headline
          <input
            className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.headline}
            name="headline"
            required
          />
        </label>
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink lg:col-span-2">
          Intro copy
          <textarea
            className="min-h-24 rounded-xl border border-line bg-white/90 px-3 py-3 text-[0.85rem] leading-6 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.intro}
            name="intro"
          />
        </label>
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
          RSVP button label
          <input
            className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.button_label}
            name="button_label"
            required
          />
        </label>
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
          Font
          <select
            className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.font_family}
            name="font_family"
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>{font.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ColorField label="Page" name="email_bg" value={design.email_bg} />
        <ColorField label="Header" name="header_bg" value={design.header_bg} />
        <ColorField label="Accent" name="accent_color" value={design.accent_color} />
        <ColorField label="Text" name="text_color" value={design.text_color} />
        <ColorField label="Muted" name="muted_color" value={design.muted_color} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-line bg-white/70 p-4 lg:grid-cols-[1fr_16rem]">
        <div className="grid gap-3">
          <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
            Image URL
            <input
              className="h-10 rounded-xl border border-line bg-field px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
              name="image_url"
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/header.jpg"
              type="url"
              value={imageUrl}
            />
          </label>
          <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
            Image alt text
            <input
              className="h-10 rounded-xl border border-line bg-field px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
              defaultValue={design.image_alt}
              name="image_alt"
              placeholder="Event photo"
            />
          </label>
          <input name="image_width" type="hidden" value={imageWidth} />
          <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
            Image width
            <input
              className="accent-moss"
              max="640"
              min="180"
              onChange={(event) => setImageWidth(Number(event.target.value))}
              type="range"
              value={imageWidth}
            />
            <span className="text-xs text-muted">{imageWidth}px</span>
          </label>
        </div>
        <div className="rounded-2xl border border-dashed border-line bg-field p-3">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-muted">Drag resize</p>
          <div className="mt-3 overflow-x-auto rounded-xl bg-white p-3">
            {imageUrl ? (
              <div className="relative max-w-full" style={{ width: `${Math.min(imageWidth, 224)}px` }}>
                <div
                  className="h-28 w-full rounded-lg border border-line bg-cover bg-center"
                  style={{ backgroundImage: `url(${JSON.stringify(imageUrl).slice(1, -1)})` }}
                />
                <button
                  aria-label="Resize image"
                  className="absolute -right-2 top-1/2 h-8 w-4 -translate-y-1/2 cursor-ew-resize rounded-full bg-night shadow"
                  onPointerDown={startResize}
                  onPointerMove={resize}
                  onPointerUp={stopResize}
                  type="button"
                />
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-lg border border-line bg-white text-center text-xs text-muted">
                Add an image URL to preview sizing.
              </div>
            )}
          </div>
        </div>
      </div>

      <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
        Footer
        <input
          className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
          defaultValue={design.footer}
          name="footer"
        />
      </label>
      <label className="flex items-center gap-2 rounded-xl border border-line bg-white/78 px-3 py-3 text-[0.82rem] font-semibold text-ink">
        <input
          className="h-4 w-4 rounded border-line text-moss focus:ring-moss"
          defaultChecked={design.show_event_details}
          name="show_event_details"
          type="checkbox"
        />
        Show event details block
      </label>
    </section>
  );
}

function ColorField({
  label,
  name,
  value
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-[0.72rem] font-semibold text-ink">
      {label}
      <span className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white/90 px-2">
        <input className="h-6 w-8 border-0 bg-transparent p-0" defaultValue={value} name={name} type="color" />
        <span className="text-xs text-muted">{value}</span>
      </span>
    </label>
  );
}
