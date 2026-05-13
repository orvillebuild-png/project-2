"use client";

import { Bold, Italic, Link, List, ListOrdered, Quote, Redo2, Smile, Strikethrough, Underline, Undo2 } from "lucide-react";
import { useRef, useState } from "react";

const emojis = ["🙂", "❤️", "🎉", "🙏", "✨", "📅", "📍", "💛"];

export function CampaignBodyEditor({
  defaultValue,
  mergeFields
}: {
  defaultValue: string;
  mergeFields: string[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [history, setHistory] = useState<string[]>([defaultValue]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night text-amber">
          ✨
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">Message</h3>
          <p className="mt-1 text-[0.78rem] leading-5 text-muted">
            Write the campaign copy. Formatting helpers insert email-safe text tokens.
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
          <ToolButton label="Underline note" onClick={() => wrap("__")}><Underline className="h-4 w-4" /></ToolButton>
          <ToolButton label="Code note" onClick={() => wrap("`")}><Strikethrough className="h-4 w-4" /></ToolButton>
          <Divider />
          <ToolButton label="Insert link" onClick={insertLink}><Link className="h-4 w-4" /></ToolButton>
          <ToolButton label="Bulleted list" onClick={() => insertText("\n- List item")}><List className="h-4 w-4" /></ToolButton>
          <ToolButton label="Numbered list" onClick={() => insertText("\n1. List item")}><ListOrdered className="h-4 w-4" /></ToolButton>
          <ToolButton label="Quote" onClick={() => insertText("\n> Quote")}><Quote className="h-4 w-4" /></ToolButton>
          <div className="relative">
            <ToolButton label="Emoji" onClick={() => setShowEmoji((open) => !open)}><Smile className="h-4 w-4" /></ToolButton>
            {showEmoji ? (
              <div className="absolute left-0 top-10 z-10 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-white p-2 shadow-soft">
                {emojis.map((emoji) => (
                  <button className="h-8 w-8 rounded-full hover:bg-field" key={emoji} onClick={() => insertText(emoji)} type="button">
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
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
