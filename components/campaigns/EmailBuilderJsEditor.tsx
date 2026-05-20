"use client";

/* eslint-disable @next/next/no-img-element */
import { Eye, ImagePlus, Paperclip, Palette, Type } from "lucide-react";
import { Reader } from "@usewaypoint/email-builder";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { EmailDesignData } from "@/lib/campaigns";
import {
  buildEmailBuilderDocument,
  defaultEmailBuilderDraft,
  emailBuilderFonts,
  safeHex,
  type EmailBuilderDraft
} from "@/lib/email-builder-document";
import { createClientForBrowser } from "@/lib/supabase-browser";

function draftFromDesign(defaultValue: string, design: EmailDesignData): EmailBuilderDraft {
  const defaults = defaultEmailBuilderDraft(defaultValue);
  const fontFamily = emailBuilderFonts.some((font) => font.value === design.email_builder_font)
    ? design.email_builder_font
    : defaults.fontFamily;

  return {
    ...defaults,
    accentColor: safeHex(design.accent_color, defaults.accentColor),
    backdropColor: safeHex(design.email_bg, defaults.backdropColor),
    bodyText: design.email_builder_body || defaults.bodyText,
    buttonLabel: design.button_label || defaults.buttonLabel,
    buttonTextColor: safeHex(design.button_text_color, defaults.buttonTextColor),
    canvasColor: design.email_builder_canvas_color || defaults.canvasColor,
    footerText: design.footer || defaults.footerText,
    fontFamily,
    headerColor: safeHex(design.header_bg, defaults.headerColor),
    headline: design.headline || defaults.headline,
    imageAlt: design.image_alt || defaults.imageAlt,
    imageUrl: design.image_url || defaults.imageUrl,
    imageWidth: design.image_width || defaults.imageWidth,
    textColor: safeHex(design.text_color, defaults.textColor)
  };
}

export function EmailBuilderJsEditor({
  defaultValue,
  design,
  orgId,
  previewAction
}: {
  defaultValue: string;
  design: EmailDesignData;
  orgId: string;
  previewAction?: (formData: FormData) => void | Promise<void>;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => draftFromDesign(defaultValue, design));
  const [attachmentUrl, setAttachmentUrl] = useState(design.attachment_url);
  const [attachmentName, setAttachmentName] = useState(design.attachment_name);
  const [status, setStatus] = useState("EmailBuilderJS ready.");
  const document = useMemo(() => buildEmailBuilderDocument(draft), [draft]);
  const activeFont = emailBuilderFonts.find((font) => font.value === draft.fontFamily) ?? emailBuilderFonts[0];

  async function uploadAsset(file: File) {
    if (!orgId) {
      throw new Error("Create or select a workspace before uploading assets.");
    }

    const supabase = createClientForBrowser();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${orgId}/campaign-assets/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("email-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      throw new Error(error.message);
    }

    return supabase.storage.from("email-assets").getPublicUrl(path).data.publicUrl;
  }

  async function handleImage(file: File) {
    setStatus(`Uploading ${file.name}...`);

    try {
      const url = await uploadAsset(file);
      setDraft((current) => ({
        ...current,
        imageAlt: current.imageAlt || file.name.replace(/\.[^.]+$/, ""),
        imageUrl: url
      }));
      setStatus(`${file.name} inserted into the email.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Image upload failed.");
    }
  }

  async function handleAttachment(file: File) {
    setStatus(`Uploading ${file.name}...`);

    try {
      const url = await uploadAsset(file);
      setAttachmentUrl(url);
      setAttachmentName(file.name);
      setStatus(`${file.name} will be sent as an email attachment.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Attachment upload failed.");
    }
  }

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-line/90 bg-white/72">
      <input name="editor_mode" type="hidden" value="emailbuilder" />
      <input name="email_builder_document" type="hidden" value={JSON.stringify(document)} readOnly />
      <input name="email_builder_body" type="hidden" value={draft.bodyText} readOnly />
      <input name="email_builder_canvas_color" type="hidden" value={draft.canvasColor} readOnly />
      <input name="email_builder_font" type="hidden" value={draft.fontFamily} readOnly />
      <input name="body" type="hidden" value={draft.bodyText} readOnly />
      <input name="headline" type="hidden" value={draft.headline} readOnly />
      <input name="button_label" type="hidden" value={draft.buttonLabel} readOnly />
      <input name="footer" type="hidden" value={draft.footerText} readOnly />
      <input name="font_family" type="hidden" value={activeFont.css} readOnly />
      <input name="email_bg" type="hidden" value={draft.backdropColor} readOnly />
      <input name="header_bg" type="hidden" value={draft.headerColor} readOnly />
      <input name="headline_color" type="hidden" value="#ffffff" readOnly />
      <input name="accent_color" type="hidden" value={draft.accentColor} readOnly />
      <input name="button_text_color" type="hidden" value={draft.buttonTextColor} readOnly />
      <input name="text_color" type="hidden" value={draft.textColor} readOnly />
      <input name="muted_color" type="hidden" value={design.muted_color} readOnly />
      <input name="image_url" type="hidden" value={draft.imageUrl} readOnly />
      <input name="image_alt" type="hidden" value={draft.imageAlt} readOnly />
      <input name="image_width" type="hidden" value={draft.imageWidth} readOnly />
      <input name="attachment_url" type="hidden" value={attachmentUrl} readOnly />
      <input name="attachment_name" type="hidden" value={attachmentName} readOnly />
      <input name="unlayer_design" type="hidden" value="" readOnly />

      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImage(file);
          }
          event.target.value = "";
        }}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept="application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleAttachment(file);
          }
          event.target.value = "";
        }}
        ref={attachmentInputRef}
        type="file"
      />

      <div className="border-b border-line/80 bg-[#fbf7e8] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-amber">*</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">EmailBuilderJS composer</h3>
              <p className="mt-1 text-[0.78rem] leading-5 text-muted">
                Build the campaign from email-safe blocks. Preview and send use the same HTML renderer.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
              onClick={() => imageInputRef.current?.click()}
              type="button"
            >
              <ImagePlus className="h-4 w-4" />
              Image
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
              onClick={() => attachmentInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="h-4 w-4" />
              Attach
            </button>
            {previewAction ? (
              <button
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-night px-3 text-xs font-semibold text-white transition hover:bg-moss"
                formAction={previewAction}
                type="submit"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-muted">
          <span className="rounded-full border border-line bg-white px-3 py-1">{status}</span>
          {attachmentUrl ? (
            <span className="rounded-full border border-line bg-white px-3 py-1">
              Attached: {attachmentName || "file"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(42rem,1fr)_24rem]">
        <div className="bg-[#eeebe2] p-4 md:p-6 xl:p-8">
          <div className="mx-auto max-w-[880px] overflow-hidden rounded-[1.35rem] border border-line bg-white shadow-soft">
            <Reader document={document} rootBlockId="root" />
          </div>
        </div>

        <aside className="border-t border-line/80 bg-white/74 p-4 xl:border-l xl:border-t-0 xl:p-5">
          <div className="space-y-4">
            <EditorGroup icon={<Type className="h-4 w-4" />} title="Content">
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Headline
                <input
                  className="h-9 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))}
                  value={draft.headline}
                />
              </label>
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Body
                <textarea
                  className="min-h-56 rounded-xl border border-line bg-field px-3 py-3 text-sm leading-6 outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, bodyText: event.target.value }))}
                  value={draft.bodyText}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {["{{first_name}}", "{{event_title}}", "{{event_date}}", "{{venue}}", "{{rsvp_link}}"].map((token) => (
                  <button
                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-muted hover:border-moss hover:text-moss"
                    key={token}
                    onClick={() => setDraft((current) => ({ ...current, bodyText: `${current.bodyText}${current.bodyText.endsWith(" ") ? "" : " "}${token}` }))}
                    type="button"
                  >
                    {token}
                  </button>
                ))}
              </div>
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Button label
                <input
                  className="h-9 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, buttonLabel: event.target.value }))}
                  value={draft.buttonLabel}
                />
              </label>
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Footer
                <input
                  className="h-9 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, footerText: event.target.value }))}
                  value={draft.footerText}
                />
              </label>
            </EditorGroup>

            <EditorGroup icon={<Palette className="h-4 w-4" />} title="Design">
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Font
                <select
                  className="h-9 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, fontFamily: event.target.value as EmailBuilderDraft["fontFamily"] }))}
                  value={draft.fontFamily}
                >
                  {emailBuilderFonts.map((font) => (
                    <option key={font.value} value={font.value}>{font.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label="Header" onChange={(value) => setDraft((current) => ({ ...current, headerColor: value }))} value={draft.headerColor} />
                <ColorInput label="Accent" onChange={(value) => setDraft((current) => ({ ...current, accentColor: value }))} value={draft.accentColor} />
                <ColorInput label="Canvas" onChange={(value) => setDraft((current) => ({ ...current, canvasColor: value }))} value={draft.canvasColor} />
                <ColorInput label="Backdrop" onChange={(value) => setDraft((current) => ({ ...current, backdropColor: value }))} value={draft.backdropColor} />
                <ColorInput label="Text" onChange={(value) => setDraft((current) => ({ ...current, textColor: value }))} value={draft.textColor} />
                <ColorInput label="Button text" onChange={(value) => setDraft((current) => ({ ...current, buttonTextColor: value }))} value={draft.buttonTextColor} />
              </div>
            </EditorGroup>

            <EditorGroup icon={<ImagePlus className="h-4 w-4" />} title="Image">
              {draft.imageUrl ? (
                <div className="rounded-2xl border border-line bg-field p-3">
                  <img alt={draft.imageAlt} className="mx-auto max-h-40 rounded-xl object-contain" src={draft.imageUrl} />
                  <button
                    className="mt-3 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-coral hover:text-coral"
                    onClick={() => setDraft((current) => ({ ...current, imageAlt: "", imageUrl: "" }))}
                    type="button"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <button
                  className="w-full rounded-xl border border-dashed border-line bg-field px-3 py-6 text-sm font-semibold text-muted hover:border-moss hover:text-moss"
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                >
                  Upload image
                </button>
              )}
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Alt text
                <input
                  className="h-9 rounded-xl border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setDraft((current) => ({ ...current, imageAlt: event.target.value }))}
                  value={draft.imageAlt}
                />
              </label>
              <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
                Width
                <input
                  className="accent-moss"
                  max={640}
                  min={160}
                  onChange={(event) => setDraft((current) => ({ ...current, imageWidth: Number(event.target.value) }))}
                  type="range"
                  value={draft.imageWidth}
                />
                <span className="text-xs font-normal text-muted">{draft.imageWidth}px</span>
              </label>
            </EditorGroup>
          </div>
        </aside>
      </div>
    </section>
  );
}

function EditorGroup({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <details className="rounded-2xl border border-line bg-white/80 p-3" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night text-amber">{icon}</span>
        {title}
      </summary>
      <div className="mt-3 grid gap-3">{children}</div>
    </details>
  );
}

function ColorInput({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-[0.72rem] font-bold text-ink">
      {label}
      <span className="flex h-9 overflow-hidden rounded-xl border border-line bg-field">
        <input
          className="h-full w-10 border-0 bg-transparent"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
        <input
          className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none"
          onChange={(event) => onChange(safeHex(event.target.value, value))}
          value={value}
        />
      </span>
    </label>
  );
}
