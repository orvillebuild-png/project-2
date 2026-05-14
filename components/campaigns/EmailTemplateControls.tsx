"use client";

import { useState } from "react";
import type { EmailDesignData } from "@/lib/campaigns";

export function EmailTemplateControls({
  design
}: {
  design: EmailDesignData;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-line/90 bg-[#fff8dc]/72 p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
          Aa
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Template design</h3>
          <p className="mt-1 text-[0.78rem] leading-5 text-muted">
            These fields render in the preview and in the actual Resend HTML.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
          From name
          <input
            className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.from_name}
            name="from_name"
            placeholder="Project 2"
          />
        </label>
        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
          From email
          <input
            className="h-10 rounded-xl border border-line bg-white/90 px-3 text-[0.85rem] outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            defaultValue={design.from_email}
            name="from_email"
            placeholder="verified@example.org"
            type="email"
          />
        </label>
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ColorField label="Email page" name="email_bg" value={design.email_bg} />
        <ColorField label="Header background" name="header_bg" value={design.header_bg} />
        <ColorField label="Headline text" name="headline_color" value={design.headline_color} />
        <ColorField label="Body text" name="text_color" value={design.text_color} />
        <ColorField label="Muted text" name="muted_color" value={design.muted_color} />
        <ColorField label="RSVP button" name="accent_color" value={design.accent_color} />
        <ColorField label="RSVP text" name="button_text_color" value={design.button_text_color} />
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
  const [current, setCurrent] = useState(value);

  return (
    <label className="grid gap-2 text-[0.72rem] font-semibold text-ink">
      {label}
      <span className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white/90 px-2">
        <input
          className="h-6 w-8 border-0 bg-transparent p-0"
          name={name}
          onChange={(event) => setCurrent(event.target.value)}
          type="color"
          value={current}
        />
        <span className="text-xs text-muted">{current}</span>
      </span>
    </label>
  );
}
