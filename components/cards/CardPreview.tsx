"use client";

import type { PointerEvent } from "react";
import { useRef } from "react";
import type { InvitationCardData } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function CardPreview({
  data,
  is3d = false,
  onMoveLayer,
  onSelectLayer,
  scale = 0.36,
  selectedLayerId
}: {
  data: InvitationCardData;
  is3d?: boolean;
  onMoveLayer?: (layerId: string, position: { x: number; y: number }) => void;
  onSelectLayer?: (layerId: string) => void;
  scale?: number;
  selectedLayerId?: string;
}) {
  const dragRef = useRef<{ layerId: string; offsetX: number; offsetY: number } | null>(null);
  const textureClass = {
    none: "",
    paper: "card-texture-paper",
    grid: "card-texture-grid",
    soft: "card-texture-soft"
  }[data.texture];

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, layerId: string) {
    onSelectLayer?.(layerId);

    if (!onMoveLayer) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      layerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current || !onMoveLayer) {
      return;
    }

    const canvas = event.currentTarget.parentElement?.getBoundingClientRect();
    const layer = data.layers.find((item) => item.id === dragRef.current?.layerId);

    if (!canvas || !layer) {
      return;
    }

    const x = Math.round((event.clientX - canvas.left - dragRef.current.offsetX) / scale);
    const y = Math.round((event.clientY - canvas.top - dragRef.current.offsetY) / scale);

    onMoveLayer(layer.id, {
      x: Math.min(data.width - layer.width, Math.max(0, x)),
      y: Math.min(data.height - layer.height, Math.max(0, y))
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <div
      className={cn(
        "relative transition-transform duration-300",
        is3d && "card-preview-3d"
      )}
      style={{
        width: data.width * scale,
        height: data.height * scale
      }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-md border border-line shadow-soft"
        style={{ backgroundColor: data.backgroundColor }}
      >
        <div className={cn("absolute inset-0", textureClass)} />
        <div
          className="absolute rounded-full opacity-20 blur-3xl"
          style={{
            width: data.width * scale * 0.58,
            height: data.width * scale * 0.58,
            right: -data.width * scale * 0.18,
            top: -data.width * scale * 0.18,
            backgroundColor: data.accentColor
          }}
        />
        {data.layers.map((layer) => {
          const commonStyle = {
            left: layer.x * scale,
            top: layer.y * scale,
            width: layer.width * scale,
            height: layer.height * scale,
            color: layer.color,
            fontFamily: layer.fontFamily ?? "Arial, sans-serif",
            fontSize: (layer.fontSize ?? 36) * scale,
            fontWeight: layer.fontWeight ?? "600",
            opacity: (layer.opacity ?? 100) / 100,
            textAlign: layer.align ?? "left"
          } as const;

          return (
            <button
              className={cn(
                "absolute whitespace-pre-wrap text-left leading-tight outline-none transition",
                onSelectLayer && "cursor-grab active:cursor-grabbing",
                selectedLayerId === layer.id && "ring-2 ring-moss ring-offset-2"
              )}
              key={layer.id}
              onClick={() => onSelectLayer?.(layer.id)}
              onPointerDown={(event) => handlePointerDown(event, layer.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                ...commonStyle,
                alignItems: layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
                backgroundColor: layer.type === "shape" ? layer.backgroundColor : "transparent",
                borderRadius: layer.type === "shape" || layer.type === "image" ? (layer.radius ?? 8) * scale : 0,
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
                padding: layer.type === "shape" ? `${10 * scale}px ${14 * scale}px` : 0,
                touchAction: "none"
              }}
              type="button"
            >
              {layer.type === "image" && layer.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={layer.label}
                  className="h-full w-full"
                  src={layer.imageUrl}
                  style={{ objectFit: layer.objectFit ?? "contain" }}
                />
              ) : layer.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
