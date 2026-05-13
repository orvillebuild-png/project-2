"use client";

import { useMemo, useState } from "react";
import { Copy, Layers, Save, Square, Trash2, Type } from "lucide-react";
import { CardPreview } from "@/components/cards/CardPreview";
import { Button } from "@/components/ui/Button";
import type { CardLayer, CardSizePreset, InvitationCardData } from "@/lib/cards";
import { cn } from "@/lib/utils";

const sizePresets: Array<{ label: string; value: CardSizePreset; width: number; height: number }> = [
  { label: "Postcard", value: "postcard", width: 1400, height: 1000 },
  { label: "Square", value: "square", width: 1080, height: 1080 },
  { label: "Story", value: "story", width: 1080, height: 1920 },
  { label: "Banner", value: "banner", width: 1600, height: 900 }
];

const designPresets: Array<{ label: string; data: Partial<InvitationCardData> }> = [
  {
    label: "Clean nonprofit",
    data: { backgroundColor: "#fbfaf7", accentColor: "#39705f", texture: "paper" }
  },
  {
    label: "Formal gala",
    data: { backgroundColor: "#101827", accentColor: "#c8a45d", texture: "soft" }
  },
  {
    label: "Community bright",
    data: { backgroundColor: "#f7f3dc", accentColor: "#d65745", texture: "grid" }
  },
  {
    label: "Quiet editorial",
    data: { backgroundColor: "#f2f5f4", accentColor: "#2f6f8f", texture: "none" }
  }
];

export function CardDesigner({
  action,
  cardData,
  cardName,
  error,
  notice
}: {
  action: (formData: FormData) => void;
  cardData: InvitationCardData;
  cardName: string;
  error?: string;
  notice?: string;
}) {
  const [name, setName] = useState(cardName);
  const [data, setData] = useState(cardData);
  const [selectedLayerId, setSelectedLayerId] = useState(cardData.layers[0]?.id ?? "");
  const selectedLayer = data.layers.find((layer) => layer.id === selectedLayerId) ?? data.layers[0];
  const scale = useMemo(() => Math.min(0.52, 620 / data.width, 520 / data.height), [data.height, data.width]);

  function updateData(update: Partial<InvitationCardData>) {
    setData((current) => ({ ...current, ...update }));
  }

  function updateLayer(layerId: string, update: Partial<CardLayer>) {
    setData((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === layerId ? { ...layer, ...update } : layer)
    }));
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
          fontWeight: "700",
          align: "center",
          radius: 10
        };

    setData((current) => ({ ...current, layers: [...current.layers, layer] }));
    setSelectedLayerId(id);
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
    <form action={action} className="grid gap-5 xl:grid-cols-[18rem_1fr_20rem]">
      <input name="canvas_data" type="hidden" value={JSON.stringify(data)} />
      <aside className="space-y-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Card name</label>
          <input
            className="mt-2 h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-[#f3c2b8] bg-[#fff0ed] px-3 py-2 text-sm text-coral">
            {error === "missing_fields" ? "Card name and design data are required." : decodeURIComponent(error)}
          </p>
        ) : null}
        {notice ? <p className="rounded-md border border-[#d7e9d9] bg-[#edf7f0] px-3 py-2 text-sm text-moss">{notice}</p> : null}

        <ControlGroup title="Size">
          <select
            className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            onChange={(event) => applySizePreset(event.target.value as CardSizePreset)}
            value={data.sizePreset}
          >
            {sizePresets.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
            <option value="custom">Custom</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="W" max={3000} min={320} onChange={(width) => updateData({ width, sizePreset: "custom" })} value={data.width} />
            <NumberInput label="H" max={3000} min={320} onChange={(height) => updateData({ height, sizePreset: "custom" })} value={data.height} />
          </div>
        </ControlGroup>

        <ControlGroup title="Design">
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
            <option value="paper">Paper</option>
            <option value="soft">Soft</option>
            <option value="grid">Grid</option>
            <option value="none">None</option>
          </select>
        </ControlGroup>

        <Button className="w-full" type="submit"><Save className="h-4 w-4" />Save card</Button>
      </aside>

      <main className="min-w-0 rounded-lg border border-line bg-[#eef1f3] p-4 shadow-inner">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">{name || "Untitled card"}</p>
            <p className="text-xs text-muted">{data.width} x {data.height}px</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => addLayer("text")}><Type className="h-4 w-4" />Text</Button>
            <Button type="button" variant="secondary" onClick={() => addLayer("shape")}><Square className="h-4 w-4" />Shape</Button>
          </div>
        </div>
        <div className="flex min-h-[560px] items-center justify-center overflow-auto rounded-lg border border-line bg-white p-5">
          <CardPreview data={data} onSelectLayer={setSelectedLayerId} scale={scale} selectedLayerId={selectedLayerId} />
        </div>
      </main>

      <aside className="space-y-4 rounded-lg border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><Layers className="h-4 w-4" />Layers</h2>
          <span className="text-xs text-muted">{data.layers.length}</span>
        </div>
        <div className="grid gap-2">
          {data.layers.map((layer) => (
            <button
              className={cn(
                "rounded-md border px-3 py-2 text-left text-sm font-semibold",
                selectedLayer?.id === layer.id ? "border-moss bg-[#edf7f0] text-moss" : "border-line bg-field text-ink"
              )}
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id)}
              type="button"
            >
              {layer.label}
            </button>
          ))}
        </div>

        {selectedLayer ? (
          <ControlGroup title="Selected layer">
            <input
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(selectedLayer.id, { label: event.target.value })}
              value={selectedLayer.label}
            />
            <textarea
              className="min-h-24 rounded-md border border-line bg-field px-3 py-2 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(selectedLayer.id, { text: event.target.value })}
              value={selectedLayer.text ?? ""}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput label="X" max={data.width} min={0} onChange={(x) => updateLayer(selectedLayer.id, { x })} value={selectedLayer.x} />
              <NumberInput label="Y" max={data.height} min={0} onChange={(y) => updateLayer(selectedLayer.id, { y })} value={selectedLayer.y} />
              <NumberInput label="W" max={data.width} min={20} onChange={(width) => updateLayer(selectedLayer.id, { width })} value={selectedLayer.width} />
              <NumberInput label="H" max={data.height} min={20} onChange={(height) => updateLayer(selectedLayer.id, { height })} value={selectedLayer.height} />
            </div>
            <NumberInput label="Text size" max={180} min={8} onChange={(fontSize) => updateLayer(selectedLayer.id, { fontSize })} value={selectedLayer.fontSize ?? 36} />
            <select
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(selectedLayer.id, { fontWeight: event.target.value as CardLayer["fontWeight"] })}
              value={selectedLayer.fontWeight}
            >
              <option value="400">Regular</option>
              <option value="600">Semi bold</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
            </select>
            <select
              className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
              onChange={(event) => updateLayer(selectedLayer.id, { align: event.target.value as CardLayer["align"] })}
              value={selectedLayer.align}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
            <ColorInput label="Text" onChange={(color) => updateLayer(selectedLayer.id, { color })} value={selectedLayer.color} />
            {selectedLayer.type === "shape" ? (
              <>
                <ColorInput label="Fill" onChange={(backgroundColor) => updateLayer(selectedLayer.id, { backgroundColor })} value={selectedLayer.backgroundColor ?? data.accentColor} />
                <NumberInput label="Corner radius" max={100} min={0} onChange={(radius) => updateLayer(selectedLayer.id, { radius })} value={selectedLayer.radius ?? 8} />
              </>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="secondary" onClick={duplicateLayer}><Copy className="h-4 w-4" />Copy</Button>
              <Button disabled={data.layers.length <= 1} type="button" variant="secondary" onClick={deleteLayer}><Trash2 className="h-4 w-4" />Delete</Button>
            </div>
          </ControlGroup>
        ) : null}
      </aside>
    </form>
  );
}

function ControlGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <fieldset className="grid gap-3 border-t border-line pt-4">
      <legend className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-muted">{title}</legend>
      {children}
    </fieldset>
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
