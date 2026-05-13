"use client";

import { useMemo, useState } from "react";
import { Box, Copy, Image as ImageIcon, Layers, Palette, PanelRightClose, Save, Settings2, Square, Trash2, Type, Upload } from "lucide-react";
import { CardPreview } from "@/components/cards/CardPreview";
import { Button } from "@/components/ui/Button";
import type { CardLayer, CardSizePreset, InvitationCardData } from "@/lib/cards";
import { createClientForBrowser } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const sizePresets: Array<{ label: string; value: CardSizePreset; width: number; height: number }> = [
  { label: "Postcard", value: "postcard", width: 1400, height: 1000 },
  { label: "Square", value: "square", width: 1080, height: 1080 },
  { label: "Story", value: "story", width: 1080, height: 1920 },
  { label: "Banner", value: "banner", width: 1600, height: 900 }
];

const designPresets: Array<{ label: string; data: Partial<InvitationCardData> }> = [
  { label: "Clean nonprofit", data: { backgroundColor: "#fbfaf7", accentColor: "#39705f", texture: "paper" } },
  { label: "Formal gala", data: { backgroundColor: "#101827", accentColor: "#c8a45d", texture: "soft" } },
  { label: "Community bright", data: { backgroundColor: "#f7f3dc", accentColor: "#d65745", texture: "grid" } },
  { label: "Quiet editorial", data: { backgroundColor: "#f2f5f4", accentColor: "#2f6f8f", texture: "none" } }
];

const fontOptions = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
  { label: "Tahoma", value: "Tahoma, Geneva, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, Haettenschweiler, sans-serif" },
  { label: "Palatino", value: "Palatino, 'Palatino Linotype', serif" },
  { label: "Lucida", value: "'Lucida Sans', 'Lucida Grande', sans-serif" }
];

type Panel = "design" | "layers" | "size" | null;

export function CardDesigner({
  action,
  cardData,
  cardName,
  error,
  notice,
  orgId
}: {
  action: (formData: FormData) => void;
  cardData: InvitationCardData;
  cardName: string;
  error?: string;
  notice?: string;
  orgId: string;
}) {
  const [name, setName] = useState(cardName);
  const [data, setData] = useState(cardData);
  const [selectedLayerId, setSelectedLayerId] = useState(cardData.layers[0]?.id ?? "");
  const [panel, setPanel] = useState<Panel>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [is3d, setIs3d] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const selectedLayer = data.layers.find((layer) => layer.id === selectedLayerId) ?? data.layers[0];
  const scale = useMemo(() => Math.min(0.62, 760 / data.width, 600 / data.height), [data.height, data.width]);

  function updateData(update: Partial<InvitationCardData>) {
    setData((current) => ({ ...current, ...update }));
  }

  function updateLayer(layerId: string, update: Partial<CardLayer>) {
    setData((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === layerId ? { ...layer, ...update } : layer)
    }));
  }

  function selectLayer(layerId: string) {
    setSelectedLayerId(layerId);
    setInspectorOpen(true);
  }

  function addLayer(type: "text" | "shape") {
    const id = `${type}-${Date.now()}`;
    const layer: CardLayer = type === "text"
      ? {
          id,
          type,
          label: "Text",
          text: "New text",
          x: 120,
          y: 120,
          width: 460,
          height: 110,
          color: "#102033",
          fontSize: 48,
          fontFamily: "Arial, sans-serif",
          fontWeight: "700",
          align: "left"
        }
      : {
          id,
          type,
          label: "Shape",
          text: "Label",
          x: 120,
          y: 120,
          width: 260,
          height: 96,
          color: "#ffffff",
          backgroundColor: data.accentColor,
          fontSize: 32,
          fontFamily: "Arial, sans-serif",
          fontWeight: "700",
          align: "center",
          radius: 10
        };

    setData((current) => ({ ...current, layers: [...current.layers, layer] }));
    setSelectedLayerId(id);
    setInspectorOpen(true);
  }

  async function addImageLayer(file: File) {
    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClientForBrowser();
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(0, 72);
      const path = `${orgId}/${Date.now()}-${safeName || `image.${extension}`}`;
      const { error } = await supabase.storage.from("card-assets").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      });

      if (error) {
        setUploadError(error.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from("card-assets").getPublicUrl(path);
      const id = `image-${Date.now()}`;
      const layer: CardLayer = {
        id,
        type: "image",
        label: "Image",
        imageUrl: publicUrl.publicUrl,
        x: 120,
        y: 120,
        width: 360,
        height: 240,
        color: "#102033",
        radius: 0,
        opacity: 100,
        objectFit: "contain"
      };

      setData((current) => ({ ...current, layers: [...current.layers, layer] }));
      setSelectedLayerId(id);
      setInspectorOpen(true);
    } finally {
      setUploading(false);
    }
  }

  function duplicateLayer() {
    if (!selectedLayer) {
      return;
    }

    const id = `${selectedLayer.type}-${Date.now()}`;
    const copy = {
      ...selectedLayer,
      id,
      label: `${selectedLayer.label} copy`,
      x: selectedLayer.x + 40,
      y: selectedLayer.y + 40
    };
    setData((current) => ({ ...current, layers: [...current.layers, copy] }));
    setSelectedLayerId(id);
    setInspectorOpen(true);
  }

  function deleteLayer() {
    if (!selectedLayer || data.layers.length <= 1) {
      return;
    }

    const nextLayers = data.layers.filter((layer) => layer.id !== selectedLayer.id);
    setData((current) => ({ ...current, layers: nextLayers }));
    setSelectedLayerId(nextLayers[0]?.id ?? "");
  }

  function applySizePreset(preset: CardSizePreset) {
    const match = sizePresets.find((item) => item.value === preset);
    if (!match) {
      updateData({ sizePreset: preset });
      return;
    }

    updateData({ sizePreset: preset, width: match.width, height: match.height });
  }

  return (
    <form action={action} className="relative overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <input name="canvas_data" type="hidden" value={JSON.stringify(data)} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            className="h-10 min-w-[15rem] rounded-md border border-line bg-field px-3 text-sm font-semibold text-ink outline-none focus:border-moss"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <span className="hidden text-xs text-muted sm:inline">{data.width} x {data.height}px</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToolbarButton active={panel === "design"} icon={<Palette className="h-4 w-4" />} label="Design" onClick={() => setPanel(panel === "design" ? null : "design")} />
          <ToolbarButton active={panel === "size"} icon={<Settings2 className="h-4 w-4" />} label="Size" onClick={() => setPanel(panel === "size" ? null : "size")} />
          <ToolbarButton active={panel === "layers"} icon={<Layers className="h-4 w-4" />} label="Layers" onClick={() => setPanel(panel === "layers" ? null : "layers")} />
          <ToolbarButton active={is3d} icon={<Box className="h-4 w-4" />} label="3D" onClick={() => setIs3d((value) => !value)} />
          <Button type="button" variant="secondary" onClick={() => addLayer("text")}><Type className="h-4 w-4" />Text</Button>
          <Button type="button" variant="secondary" onClick={() => addLayer("shape")}><Square className="h-4 w-4" />Shape</Button>
          <label className={cn(
            "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:bg-field",
            uploading && "cursor-not-allowed opacity-55"
          )}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{uploading ? "Uploading" : "Logo/image"}</span>
            <input
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void addImageLayer(file);
                }
              }}
              type="file"
            />
          </label>
          <Button type="submit"><Save className="h-4 w-4" />Save</Button>
        </div>
      </div>

      {(error || notice || uploadError) ? (
        <div className="border-b border-line px-4 py-3">
          {error || uploadError ? (
            <p className="rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
              {uploadError || (error === "missing_fields" ? "Card name and design data are required." : decodeURIComponent(error ?? ""))}
            </p>
          ) : null}
          {notice ? <p className="rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">{notice}</p> : null}
        </div>
      ) : null}

      <div className="relative min-h-[680px] bg-[#eef1f3]">
        {panel ? (
          <SidePanel title={panel === "design" ? "Design" : panel === "size" ? "Size" : "Layers"} onClose={() => setPanel(null)}>
            {panel === "design" ? (
              <DesignPanel data={data} updateData={updateData} />
            ) : panel === "size" ? (
              <SizePanel data={data} applySizePreset={applySizePreset} updateData={updateData} />
            ) : (
              <LayersPanel layers={data.layers} selectedLayerId={selectedLayer?.id} selectLayer={selectLayer} />
            )}
          </SidePanel>
        ) : null}

        <main className="flex min-h-[680px] items-center justify-center overflow-auto p-6">
          <div className={cn("transition-all", panel && "lg:translate-x-36", inspectorOpen && "lg:-translate-x-36")}>
            <CardPreview
              data={data}
              is3d={is3d}
              onMoveLayer={(layerId, position) => updateLayer(layerId, position)}
              onSelectLayer={selectLayer}
              scale={scale}
              selectedLayerId={selectedLayerId}
            />
          </div>
        </main>

        {inspectorOpen && selectedLayer ? (
          <InspectorPanel
            data={data}
            deleteLayer={deleteLayer}
            duplicateLayer={duplicateLayer}
            layer={selectedLayer}
            onClose={() => setInspectorOpen(false)}
            updateLayer={updateLayer}
          />
        ) : null}
      </div>
    </form>
  );
}

function ToolbarButton({
  active,
  icon,
  label,
  onClick
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
        active ? "border-moss bg-[#edf7f0] text-moss" : "border-line bg-white text-ink hover:bg-field"
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SidePanel({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <aside className="absolute left-4 top-4 z-20 w-[20rem] max-w-[calc(100%-2rem)] rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <button className="rounded-md p-2 text-muted hover:bg-field hover:text-ink" onClick={onClose} type="button">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4">{children}</div>
    </aside>
  );
}

function DesignPanel({
  data,
  updateData
}: {
  data: InvitationCardData;
  updateData: (update: Partial<InvitationCardData>) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        {designPresets.map((preset) => (
          <button
            className="rounded-md border border-line bg-field px-3 py-2 text-left text-sm font-semibold text-ink hover:border-moss"
            key={preset.label}
            onClick={() => updateData(preset.data)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <ColorInput label="Background" onChange={(backgroundColor) => updateData({ backgroundColor })} value={data.backgroundColor} />
      <ColorInput label="Accent" onChange={(accentColor) => updateData({ accentColor })} value={data.accentColor} />
      <select
        className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
        onChange={(event) => updateData({ texture: event.target.value as InvitationCardData["texture"] })}
        value={data.texture}
      >
        <option value="paper">Paper texture</option>
        <option value="soft">Soft light</option>
        <option value="grid">Grid</option>
        <option value="none">None</option>
      </select>
    </>
  );
}

function SizePanel({
  applySizePreset,
  data,
  updateData
}: {
  applySizePreset: (preset: CardSizePreset) => void;
  data: InvitationCardData;
  updateData: (update: Partial<InvitationCardData>) => void;
}) {
  return (
    <>
      <select
        className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
        onChange={(event) => applySizePreset(event.target.value as CardSizePreset)}
        value={data.sizePreset}
      >
        {sizePresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
        <option value="custom">Custom</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Width" max={3000} min={320} onChange={(width) => updateData({ width, sizePreset: "custom" })} value={data.width} />
        <NumberInput label="Height" max={3000} min={320} onChange={(height) => updateData({ height, sizePreset: "custom" })} value={data.height} />
      </div>
    </>
  );
}

function LayersPanel({
  layers,
  selectLayer,
  selectedLayerId
}: {
  layers: CardLayer[];
  selectLayer: (layerId: string) => void;
  selectedLayerId?: string;
}) {
  return (
    <div className="grid gap-2">
      {layers.map((layer) => (
        <button
          className={cn(
            "rounded-md border px-3 py-2 text-left text-sm font-semibold",
            selectedLayerId === layer.id ? "border-moss bg-[#edf7f0] text-moss" : "border-line bg-field text-ink"
          )}
          key={layer.id}
          onClick={() => selectLayer(layer.id)}
          type="button"
        >
          {layer.type === "image" ? <ImageIcon className="mr-2 inline h-4 w-4" /> : null}
          {layer.label}
        </button>
      ))}
    </div>
  );
}

function InspectorPanel({
  data,
  deleteLayer,
  duplicateLayer,
  layer,
  onClose,
  updateLayer
}: {
  data: InvitationCardData;
  deleteLayer: () => void;
  duplicateLayer: () => void;
  layer: CardLayer;
  onClose: () => void;
  updateLayer: (layerId: string, update: Partial<CardLayer>) => void;
}) {
  return (
    <aside className="absolute right-4 top-4 z-20 max-h-[calc(100%-2rem)] w-[21rem] max-w-[calc(100%-2rem)] overflow-auto rounded-lg border border-line bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Edit layer</h2>
          <p className="mt-1 text-xs text-muted">Drag the selected item on the card, then fine tune here.</p>
        </div>
        <button className="rounded-md p-2 text-muted hover:bg-field hover:text-ink" onClick={onClose} type="button">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3">
        <input
          className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
          onChange={(event) => updateLayer(layer.id, { label: event.target.value })}
          value={layer.label}
        />
        <textarea
          disabled={layer.type === "image"}
          className="min-h-24 rounded-md border border-line bg-field px-3 py-2 text-sm outline-none focus:border-moss"
          onChange={(event) => updateLayer(layer.id, { text: event.target.value })}
          placeholder={layer.type === "image" ? "Image layers do not use text." : undefined}
          value={layer.type === "image" ? "" : layer.text ?? ""}
        />
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="X" max={data.width} min={0} onChange={(x) => updateLayer(layer.id, { x })} value={layer.x} />
          <NumberInput label="Y" max={data.height} min={0} onChange={(y) => updateLayer(layer.id, { y })} value={layer.y} />
          <NumberInput label="Width" max={data.width} min={20} onChange={(width) => updateLayer(layer.id, { width })} value={layer.width} />
          <NumberInput label="Height" max={data.height} min={20} onChange={(height) => updateLayer(layer.id, { height })} value={layer.height} />
        </div>
        {layer.type !== "image" ? (
          <>
            <NumberInput label="Text size" max={180} min={8} onChange={(fontSize) => updateLayer(layer.id, { fontSize })} value={layer.fontSize ?? 36} />
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Font
              <select
                className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
                onChange={(event) => updateLayer(layer.id, { fontFamily: event.target.value })}
                style={{ fontFamily: layer.fontFamily ?? "Arial, sans-serif" }}
                value={layer.fontFamily ?? "Arial, sans-serif"}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} style={{ fontFamily: font.value }} value={font.value}>{font.label}</option>
                ))}
              </select>
            </label>
            <select
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(layer.id, { fontWeight: event.target.value as CardLayer["fontWeight"] })}
              value={layer.fontWeight}
            >
              <option value="400">Regular</option>
              <option value="600">Semi bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
            </select>
            <select
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(layer.id, { align: event.target.value as CardLayer["align"] })}
              value={layer.align}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <ColorInput label="Text" onChange={(color) => updateLayer(layer.id, { color })} value={layer.color} />
          </>
        ) : null}
        {layer.type === "shape" ? (
          <>
            <ColorInput label="Fill" onChange={(backgroundColor) => updateLayer(layer.id, { backgroundColor })} value={layer.backgroundColor ?? data.accentColor} />
            <NumberInput label="Corner radius" max={100} min={0} onChange={(radius) => updateLayer(layer.id, { radius })} value={layer.radius ?? 8} />
          </>
        ) : null}
        {layer.type === "image" ? (
          <>
            <select
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(layer.id, { objectFit: event.target.value as CardLayer["objectFit"] })}
              value={layer.objectFit ?? "contain"}
            >
              <option value="contain">Fit image</option>
              <option value="cover">Fill frame</option>
            </select>
            <NumberInput label="Corner radius" max={100} min={0} onChange={(radius) => updateLayer(layer.id, { radius })} value={layer.radius ?? 0} />
            <NumberInput label="Opacity" max={100} min={10} onChange={(opacity) => updateLayer(layer.id, { opacity })} value={layer.opacity ?? 100} />
          </>
        ) : null}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={duplicateLayer}><Copy className="h-4 w-4" />Copy</Button>
          <Button disabled={data.layers.length <= 1} type="button" variant="secondary" onClick={deleteLayer}><Trash2 className="h-4 w-4" />Delete</Button>
        </div>
      </div>
    </aside>
  );
}

function ColorInput({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted">
      {label}
      <div className="flex items-center gap-2">
        <input className="h-10 w-12 rounded-md border border-line bg-field p-1" onChange={(event) => onChange(event.target.value)} type="color" value={value} />
        <input className="h-10 min-w-0 flex-1 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss" onChange={(event) => onChange(event.target.value)} value={value} />
      </div>
    </label>
  );
}

function NumberInput({
  label,
  max,
  min,
  onChange,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted">
      {label}
      <input
        className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}
