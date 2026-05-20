"use client";

/* eslint-disable @next/next/no-img-element */
import { Link as LinkIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { createClientForBrowser } from "@/lib/supabase-browser";

export function LogoUploadField({
  initialUrl,
  orgId,
  orgName
}: {
  initialUrl: string;
  orgId: string;
  orgName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialUrl);
  const [status, setStatus] = useState("");
  const initials = orgName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P2";

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatus("Logo must be 2MB or smaller.");
      return;
    }

    setStatus(`Uploading ${file.name}...`);
    const supabase = createClientForBrowser();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${orgId}/workspace-logo/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("email-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    const publicUrl = supabase.storage.from("email-assets").getPublicUrl(path).data.publicUrl;
    setLogoUrl(publicUrl);
    setStatus("Logo uploaded. Save organization settings to apply it.");
  }

  return (
    <div className="grid gap-3 md:col-span-2">
      <input name="logo_url" type="hidden" value={logoUrl} readOnly />
      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadLogo(file);
          }
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <div className="rounded-2xl border border-line bg-field/70 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] bg-amber text-xl font-black text-night">
            {logoUrl ? (
              <img alt={`${orgName} logo`} className="h-full w-full object-cover" src={logoUrl} />
            ) : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Workspace logo</p>
            <p className="mt-1 text-[0.78rem] leading-5 text-muted">
              Upload from your device, or paste an image URL. This logo appears in the app sidebar and workspace surfaces.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full bg-night px-4 text-[0.82rem] font-semibold text-white transition hover:bg-moss"
                onClick={() => inputRef.current?.click()}
                type="button"
              >
                <Upload className="h-4 w-4" />
                Upload logo
              </button>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white/88 px-4 text-[0.82rem] font-semibold text-ink transition hover:border-ink/20"
                onClick={() => setLogoUrl("")}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-ink">
          <span className="inline-flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Image URL</span>
          <input
            className="h-11 rounded-xl border border-line bg-white/80 px-3 outline-none focus:border-moss"
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="https://..."
            type="url"
            value={logoUrl}
          />
        </label>
        {status ? <p className="mt-3 rounded-xl border border-line bg-white/72 px-3 py-2 text-xs text-muted">{status}</p> : null}
      </div>
    </div>
  );
}
