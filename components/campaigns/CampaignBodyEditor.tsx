"use client";

import { Bold, Image as ImageIcon, Italic, Link, List, ListOrdered, Paperclip, Quote, Redo2, Smile, Strikethrough, Underline, Undo2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import type { EmailDesignData } from "@/lib/campaigns";
import { createClientForBrowser } from "@/lib/supabase-browser";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false
});

export function CampaignBodyEditor({
  defaultValue,
  design,
  mergeFields,
  orgId
}: {
  defaultValue: string;
  design: EmailDesignData;
  mergeFields: string[];
  orgId: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [history, setHistory] = useState<string[]>([defaultValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const [imageUrl, setImageUrl] = useState(design.image_url);
  const [imageAlt, setImageAlt] = useState(design.image_alt);
  const [imageWidth, setImageWidth] = useState(design.image_width);
  const [attachmentUrl, setAttachmentUrl] = useState(design.attachment_url);
  const [attachmentName, setAttachmentName] = useState(design.attachment_name);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  function commit(nextValue: string) {
    setValue(nextValue);
    const nextHistory = history.slice(0, historyIndex + 1).concat(nextValue);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  function selection() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return { start: value.length, end: value.length, text: "" };
    }

    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.slice(textarea.selectionStart, textarea.selectionEnd)
    };
  }

  function insertText(text: string) {
    const { start, end } = selection();
    const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
    commit(nextValue);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function wrap(prefix: string, suffix = prefix) {
    const { start, end, text } = selection();
    const selected = text || "text";
    const replacement = `${prefix}${selected}${suffix}`;
    const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
    commit(nextValue);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  function insertLink() {
    const { text } = selection();
    const label = text || "link text";
    const url = window.prompt("Paste the link URL");

    if (!url) {
      return;
    }

    insertText(`[${label}](${url})`);
  }

  async function uploadAsset(file: File, kind: "image" | "attachment") {
    if (!orgId) {
      setUploadStatus("Create or select a workspace before uploading assets.");
      return;
    }

    setUploadStatus(`Uploading ${file.name}...`);
    const supabase = createClientForBrowser();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${orgId}/campaign-assets/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("email-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      setUploadStatus(error.message);
      return;
    }

    const { data } = supabase.storage.from("email-assets").getPublicUrl(path);

    if (kind === "image") {
      setImageUrl(data.publicUrl);
      setImageAlt(file.name.replace(/\.[^.]+$/, ""));
      setUploadStatus(`${file.name} inserted into the email.`);
    } else {
      setAttachmentUrl(data.publicUrl);
      setAttachmentName(file.name);
      setUploadStatus(`${file.name} attached.`);
    }
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>, kind: "image" | "attachment") {
    const file = event.target.files?.[0];

    if (file) {
      void uploadAsset(file, kind);
    }

    event.target.value = "";
  }

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

  function undo() {
    const nextIndex = Math.max(0, historyIndex - 1);
    setHistoryIndex(nextIndex);
    setValue(history[nextIndex]);
  }

  function redo() {
    const nextIndex = Math.min(history.length - 1, historyIndex + 1);
    setHistoryIndex(nextIndex);
    setValue(history[nextIndex]);
  }

  return (
    <section className="rounded-2xl border border-line/90 bg-white/68 p-4">
      <input name="image_url" type="hidden" value={imageUrl} />
      <input name="image_alt" type="hidden" value={imageAlt} />
      <input name="image_width" type="hidden" value={imageWidth} />
      <input name="attachment_url" type="hidden" value={attachmentUrl} />
      <input name="attachment_name" type="hidden" value={attachmentName} />
      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleUpload(event, "image")}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => handleUpload(event, "attachment")}
        ref={attachmentInputRef}
        type="file"
      />

      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
          *
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Message</h3>
          <p className="mt-1 text-[0.78rem] leading-5 text-muted">
            Write the campaign copy. Toolbar actions insert email-safe content into the message.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-2">
        {mergeFields.map((field) => (
          <button
            className="inline-flex h-7 items-center rounded-full border border-line bg-field px-3 text-[0.72rem] font-semibold text-muted transition hover:border-moss hover:text-moss"
            key={field}
            onClick={() => insertText(field)}
            type="button"
          >
            {field}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-5 w-full max-w-3xl">
        <div className="mb-2 flex flex-wrap items-center gap-1 rounded-full bg-[#edf1f5] p-1 text-muted">
          <ToolButton label="Undo" onClick={undo}><Undo2 className="h-4 w-4" /></ToolButton>
          <ToolButton label="Redo" onClick={redo}><Redo2 className="h-4 w-4" /></ToolButton>
          <Divider />
          <span className="h-8 rounded-full bg-white/70 px-3 py-2 text-xs font-semibold text-ink">Sans Serif</span>
          <Divider />
          <ToolButton label="Bold" onClick={() => wrap("**")}><Bold className="h-4 w-4" /></ToolButton>
          <ToolButton label="Italic" onClick={() => wrap("*")}><Italic className="h-4 w-4" /></ToolButton>
          <ToolButton label="Strong text" onClick={() => wrap("__")}><Underline className="h-4 w-4" /></ToolButton>
          <ToolButton label="Inline code" onClick={() => wrap("`")}><Strikethrough className="h-4 w-4" /></ToolButton>
          <Divider />
          <ToolButton label="Insert link" onClick={insertLink}><Link className="h-4 w-4" /></ToolButton>
          <ToolButton label="Upload image" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></ToolButton>
          <ToolButton label="Attach file" onClick={() => attachmentInputRef.current?.click()}><Paperclip className="h-4 w-4" /></ToolButton>
          <ToolButton label="Bulleted list" onClick={() => insertText("\n- List item")}><List className="h-4 w-4" /></ToolButton>
          <ToolButton label="Numbered list" onClick={() => insertText("\n1. List item")}><ListOrdered className="h-4 w-4" /></ToolButton>
          <ToolButton label="Quote" onClick={() => insertText("\n> Quote")}><Quote className="h-4 w-4" /></ToolButton>
          <div className="relative">
            <ToolButton label="Emoji" onClick={() => setShowEmoji((open) => !open)}><Smile className="h-4 w-4" /></ToolButton>
            {showEmoji ? (
              <div className="absolute left-0 top-10 z-10 rounded-2xl border border-line bg-white p-2 shadow-soft">
                <EmojiPicker
                  height={360}
                  lazyLoadEmojis
                  onEmojiClick={(emoji: EmojiClickData) => {
                    insertText(emoji.emoji);
                    setShowEmoji(false);
                  }}
                  previewConfig={{ showPreview: false }}
                  searchPlaceholder="Search emoji"
                  skinTonesDisabled={false}
                  width={320}
                />
              </div>
            ) : null}
          </div>
        </div>

        {uploadStatus ? (
          <p className="mb-3 rounded-xl border border-line bg-field px-3 py-2 text-xs text-muted">{uploadStatus}</p>
        ) : null}

        {imageUrl ? (
          <div className="mb-3 rounded-2xl border border-line bg-field/70 p-3">
            <div className="relative mx-auto max-w-full" style={{ width: `${Math.min(imageWidth, 640)}px` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={imageAlt || "Campaign image"} className="block h-auto w-full rounded-xl border border-line bg-white object-contain" src={imageUrl} />
              <button
                aria-label="Resize image"
                className="absolute -right-2 top-1/2 h-10 w-5 -translate-y-1/2 cursor-ew-resize rounded-full bg-night shadow-lift"
                onPointerDown={startResize}
                onPointerMove={resize}
                onPointerUp={stopResize}
                type="button"
              />
              <button
                aria-label="Remove image"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow"
                onClick={() => {
                  setImageUrl("");
                  setImageAlt("");
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <input
                className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-xs outline-none focus:border-moss"
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Image alt text"
                value={imageAlt}
              />
              <span className="text-xs font-semibold text-muted">{imageWidth}px</span>
            </div>
          </div>
        ) : null}

        {attachmentUrl ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-field px-3 py-2 text-xs text-muted">
            <span className="min-w-0 truncate">Attached: {attachmentName || attachmentUrl}</span>
            <button
              className="font-semibold text-coral"
              onClick={() => {
                setAttachmentUrl("");
                setAttachmentName("");
              }}
              type="button"
            >
              Remove
            </button>
          </div>
        ) : null}

        <label className="grid gap-2 text-[0.78rem] font-semibold text-ink">
          Body
          <textarea
            className="min-h-80 rounded-2xl border border-line bg-field/70 px-4 py-4 text-[0.86rem] leading-6 outline-none focus:border-moss focus:ring-2 focus:ring-moss/10"
            name="body"
            onChange={(event) => setValue(event.target.value)}
            ref={textareaRef}
            required
            value={value}
          />
        </label>
      </div>
    </section>
  );
}

function ToolButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-ink"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-6 w-px bg-line" />;
}
