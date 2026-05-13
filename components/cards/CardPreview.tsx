import type { InvitationCardData } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function CardPreview({
  data,
  selectedLayerId,
  onSelectLayer,
  scale = 0.36
}: {
  data: InvitationCardData;
  selectedLayerId?: string;
  onSelectLayer?: (layerId: string) => void;
  scale?: number;
}) {
  const textureClass = {
    none: "",
    paper: "card-texture-paper",
    grid: "card-texture-grid",
    soft: "card-texture-soft"
  }[data.texture];

  return (
    <div
      className="relative overflow-hidden rounded-md border border-line shadow-soft"
      style={{
        width: data.width * scale,
        height: data.height * scale,
        backgroundColor: data.backgroundColor
      }}
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
          fontSize: (layer.fontSize ?? 36) * scale,
          fontWeight: layer.fontWeight ?? "600",
          textAlign: layer.align ?? "left"
        } as const;

        return (
          <button
            className={cn(
              "absolute whitespace-pre-wrap text-left leading-tight outline-none transition",
              onSelectLayer && "cursor-pointer",
              selectedLayerId === layer.id && "ring-2 ring-moss ring-offset-2"
            )}
            key={layer.id}
            onClick={() => onSelectLayer?.(layer.id)}
            style={{
              ...commonStyle,
              alignItems: layer.align === "center" ? "center" : layer.align === "right" ? "flex-end" : "flex-start",
              backgroundColor: layer.type === "shape" ? layer.backgroundColor : "transparent",
              borderRadius: layer.type === "shape" ? (layer.radius ?? 8) * scale : 0,
              display: "flex",
              justifyContent: "center",
              padding: layer.type === "shape" ? `${10 * scale}px ${14 * scale}px` : 0
            }}
            type="button"
          >
            {layer.text}
          </button>
        );
      })}
    </div>
  );
}
