"use client";

import type { EmailDesignData } from "@/lib/campaigns";

export function EmailTemplateControls({
  design
}: {
  design: EmailDesignData;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-line/90 bg-field/70 p-4">
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
          @
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Sender identity</h3>
          <p className="mt-1 text-[0.78rem] leading-5 text-muted">
            Template layout, colors, fonts, images, and buttons are controlled inside the visual builder.
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
      </div>
    </section>
  );
}
