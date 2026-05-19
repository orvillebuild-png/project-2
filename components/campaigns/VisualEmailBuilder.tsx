"use client";

import { Eye, Paperclip } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EmailEditor from "react-email-editor";
import type { EditorRef, EmailEditorProps } from "react-email-editor";
import type { JSONTemplate } from "@unlayer/types";
import type { EmailDesignData } from "@/lib/campaigns";
import { createClientForBrowser } from "@/lib/supabase-browser";

const starterHtml = `
  <p style="line-height:1.65;margin:0 0 14px;">Hi {{first_name}},</p>
  <p style="line-height:1.65;margin:0 0 14px;">You are invited to {{event_title}} on {{event_date}} at {{venue}}.</p>
  <p style="line-height:1.65;margin:0 0 14px;">Please RSVP here: {{rsvp_link}}</p>
  <p style="line-height:1.65;margin:0;">Thank you.</p>
`;

const mergeTags = {
  first_name: { name: "First name", value: "{{first_name}}" },
  event_title: { name: "Event title", value: "{{event_title}}" },
  event_date: { name: "Event date", value: "{{event_date}}" },
  venue: { name: "Venue", value: "{{venue}}" },
  rsvp_link: { name: "RSVP link", value: "{{rsvp_link}}" }
};

const editorFonts = [
  { label: "Inter", value: "'Inter', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" },
  { label: "Roboto", value: "'Roboto', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" },
  { label: "Open Sans", value: "'Open Sans', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" },
  { label: "Lato", value: "'Lato', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" },
  { label: "Montserrat", value: "'Montserrat', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" },
  { label: "Poppins", value: "'Poppins', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" },
  { label: "Nunito", value: "'Nunito', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" },
  { label: "Source Sans 3", value: "'Source Sans 3', Arial, Helvetica, sans-serif", url: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" },
  { label: "Merriweather", value: "'Merriweather', Georgia, serif", url: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap" }
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return starterHtml;
  }

  if (normalized.startsWith("<")) {
    return value;
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="line-height:1.65;margin:0 0 14px;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function contentDefaults(kind: string, order: number) {
  return {
    containerPadding: "10px 10px",
    anchor: "",
    displayCondition: null,
    _meta: {
      htmlID: `u_content_${kind}_${order}`,
      htmlClassNames: `u_content_${kind}`
    },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
    hideable: true
  };
}

function defaultRow(id: string, order: number, contents: Array<Record<string, unknown>>, backgroundColor = ""): Record<string, unknown> {
  return {
    id,
    cells: [1],
    columns: [{
      id: `${id}_column`,
      contents,
      values: {
        _meta: { htmlID: `u_column_${order}`, htmlClassNames: "u_column" },
        border: {},
        padding: "0px",
        backgroundColor: ""
      }
    }],
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor,
      columnsBackgroundColor: "",
      backgroundImage: { url: "", fullWidth: true, repeat: "no-repeat", size: "custom", position: "center" },
      padding: order === 1 ? "38px 28px" : "14px 28px",
      anchor: "",
      _meta: { htmlID: `u_row_${order}`, htmlClassNames: "u_row" },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true
    }
  };
}

function starterDesign(defaultValue: string): JSONTemplate<"email"> {
  const bodyHtml = textToHtml(defaultValue);

  return {
    counters: {
      u_row: 4,
      u_column: 4,
      u_content_heading: 2,
      u_content_text: 2,
      u_content_button: 1,
      u_content_divider: 1
    },
    body: {
      id: "project-two-email-body",
      rows: [
        defaultRow("hero-row", 1, [
          {
            id: "hero-eyebrow",
            type: "text",
            values: {
              ...contentDefaults("text", 1),
              color: "#ffca3a",
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: "140%",
              textAlign: "left",
              text: "<p style=\"line-height:140%;margin:0;letter-spacing:0.18em;text-transform:uppercase;\">Invitation</p>"
            }
          },
          {
            id: "hero-heading",
            type: "heading",
            values: {
              ...contentDefaults("heading", 1),
              headingType: "h1",
              text: "You are invited to {{event_title}}",
              fontSize: "31px",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "left",
              lineHeight: "116%",
              linkStyle: { inherit: true, linkColor: "#1f6b5d", linkUnderline: true }
            }
          }
        ], "#161616"),
        defaultRow("message-row", 2, [
          {
            id: "message-copy",
            type: "html",
            values: {
              ...contentDefaults("html", 1),
              html: bodyHtml,
              synced: { id: "", dirty: false }
            }
          }
        ]),
        defaultRow("button-row", 3, [
          {
            id: "rsvp-button",
            type: "button",
            values: {
              ...contentDefaults("button", 1),
              href: { name: "web", values: { href: "{{rsvp_link}}", target: "_blank" } },
              buttonColors: {
                color: "#ffffff",
                backgroundColor: "#1f6b5d",
                hoverColor: "#ffffff",
                hoverBackgroundColor: "#164f45"
              },
              size: { autoWidth: true, width: "100%" },
              fontSize: "15px",
              textAlign: "left",
              lineHeight: "120%",
              padding: "12px 18px",
              border: {},
              borderRadius: "999px",
              text: "RSVP now"
            }
          }
        ]),
        defaultRow("footer-row", 4, [
          {
            id: "footer-copy",
            type: "text",
            values: {
              ...contentDefaults("text", 2),
              fontSize: "12px",
              color: "#716f66",
              textAlign: "left",
              lineHeight: "150%",
              text: "<p style=\"line-height:150%;margin:0;\">Thank you.</p>"
            }
          }
        ])
      ],
      values: {
        _styleGuide: "",
        backgroundColor: "#f8f5eb",
        contentWidth: "640px",
        contentAlign: "center",
        fontFamily: {
          label: "Inter",
          value: "'Inter', Arial, Helvetica, sans-serif"
        },
        fontWeight: 400,
        textColor: "#181713",
        language: {},
        linkStyle: {
          body: true,
          linkColor: "#1f6b5d",
          linkUnderline: true,
          linkHoverColor: "#164f45",
          linkHoverUnderline: true
        },
        preheaderText: "",
        accessibilityTitle: "",
        _meta: { htmlID: "u_body", htmlClassNames: "u_body" }
      }
    }
  } as unknown as JSONTemplate<"email">;
}

export function VisualEmailBuilder({
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
  const editorRef = useRef<EditorRef<"email">>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const bypassSubmitRef = useRef(false);
  const starter = useMemo(() => starterDesign(defaultValue), [defaultValue]);
  const [status, setStatus] = useState("Builder loading...");
  const [attachmentUrl, setAttachmentUrl] = useState(design.attachment_url);
  const [attachmentName, setAttachmentName] = useState(design.attachment_name);
  const [bodyHtml, setBodyHtml] = useState(defaultValue);
  const [designJson, setDesignJson] = useState(JSON.stringify(design.unlayer_design ?? starter));

  const uploadAsset = useCallback(async (file: File) => {
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
  }, [orgId]);

  const exportEditor = useCallback(() => new Promise<boolean>((resolve) => {
    const editor = editorRef.current?.editor;

    if (!editor) {
      setStatus("The visual builder is still loading. Try again in a moment.");
      resolve(false);
      return;
    }

    setStatus("Saving the visual template...");
    editor.exportHtml((data) => {
      const html = data.html || "";
      const json = JSON.stringify(data.design ?? {});
      setBodyHtml(html);
      setDesignJson(json);

      if (bodyInputRef.current) {
        bodyInputRef.current.value = html;
      }

      if (designInputRef.current) {
        designInputRef.current.value = json;
      }

      setStatus("Template ready to save.");
      resolve(true);
    });
  }), []);

  useEffect(() => {
    const form = rootRef.current?.closest("form");

    if (!form) {
      return undefined;
    }

    const handleSubmit = (event: SubmitEvent) => {
      if (bypassSubmitRef.current) {
        bypassSubmitRef.current = false;
        return;
      }

      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;
      void exportEditor().then((ready) => {
        if (!ready) {
          return;
        }

        bypassSubmitRef.current = true;
        form.requestSubmit(submitter ?? undefined);
      });
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [exportEditor]);

  const onReady = useCallback<NonNullable<EmailEditorProps<"email">["onReady"]>>((unlayer) => {
    setStatus("Visual builder ready.");
    unlayer.setMergeTags(mergeTags);
    unlayer.registerCallback("image", async (
      file: { accepted: File[]; attachments: File[] },
      done: (result: { progress?: number; url?: string; filename?: string }) => void
    ) => {
      const image = file.attachments[0] ?? file.accepted[0];

      if (!image) {
        done({ progress: 100 });
        return;
      }

      try {
        done({ progress: 20 });
        const url = await uploadAsset(image);
        done({ progress: 100, url, filename: image.name });
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Image upload failed.");
        done({ progress: 100 });
      }
    });

    unlayer.loadDesign((design.unlayer_design ?? starter) as JSONTemplate<"email">);
  }, [design.unlayer_design, starter, uploadAsset]);

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
      <input name="editor_mode" type="hidden" value="visual" />
      <input name="body" readOnly ref={bodyInputRef} type="hidden" value={bodyHtml} />
      <input name="unlayer_design" readOnly ref={designInputRef} type="hidden" value={designJson} />
      <input name="attachment_url" readOnly type="hidden" value={attachmentUrl} />
      <input name="attachment_name" readOnly type="hidden" value={attachmentName} />
      <input name="font_family" readOnly type="hidden" value={design.font_family} />
      <input name="headline" readOnly type="hidden" value={design.headline} />
      <input name="intro" readOnly type="hidden" value={design.intro} />
      <input name="button_label" readOnly type="hidden" value={design.button_label} />
      <input name="footer" readOnly type="hidden" value={design.footer} />
      <input name="email_bg" readOnly type="hidden" value={design.email_bg} />
      <input name="header_bg" readOnly type="hidden" value={design.header_bg} />
      <input name="headline_color" readOnly type="hidden" value={design.headline_color} />
      <input name="accent_color" readOnly type="hidden" value={design.accent_color} />
      <input name="button_text_color" readOnly type="hidden" value={design.button_text_color} />
      <input name="text_color" readOnly type="hidden" value={design.text_color} />
      <input name="muted_color" readOnly type="hidden" value={design.muted_color} />
      <input name="image_url" readOnly type="hidden" value={design.image_url} />
      <input name="image_alt" readOnly type="hidden" value={design.image_alt} />
      <input name="image_width" readOnly type="hidden" value={design.image_width} />
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

      <div ref={rootRef} className="border-b border-line/80 bg-[#fbf7e8] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-amber">*</span>
              <div>
                <h3 className="text-sm font-semibold text-ink">Visual email builder</h3>
                <p className="mt-1 text-[0.78rem] leading-5 text-muted">
                  Drag sections, edit text, style buttons, upload images, and insert merge fields from the editor.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-moss hover:text-moss"
              onClick={() => attachmentInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="h-4 w-4" />
              Attach file
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

      <div className="h-[760px] bg-white">
        <EmailEditor
          minHeight="760px"
          onReady={onReady}
          options={{
            displayMode: "email",
            defaultDevice: "desktop",
            devices: ["desktop", "tablet", "mobile"],
            mergeTags,
            fonts: {
              showDefaultFonts: true,
              customFonts: editorFonts
            },
            appearance: {
              theme: "modern_light",
              panels: {
                tools: {
                  dock: "right",
                  collapsible: true,
                  forceUncollapseOnSelect: false
                }
              }
            }
          }}
          ref={editorRef}
        />
      </div>
    </section>
  );
}
