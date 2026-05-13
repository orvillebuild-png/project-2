import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentOrg } from "@/lib/auth";
import { createClientForServer } from "@/lib/supabase";

export type CardSizePreset = "postcard" | "square" | "story" | "banner" | "custom";
export type CardLayerType = "text" | "shape" | "image";

export type CardLayer = {
  id: string;
  type: CardLayerType;
  label: string;
  text?: string;
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "400" | "600" | "700" | "800";
  align?: "left" | "center" | "right";
  radius?: number;
  opacity?: number;
  objectFit?: "contain" | "cover";
};

export type InvitationCardData = {
  version: 1;
  sizePreset: CardSizePreset;
  width: number;
  height: number;
  backgroundColor: string;
  accentColor: string;
  texture: "none" | "paper" | "grid" | "soft";
  layers: CardLayer[];
};

export type InvitationCard = {
  id: string;
  name: string;
  canvas_data: InvitationCardData;
  preview_url: string | null;
  updated_at: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function defaultCardData(): InvitationCardData {
  return {
    version: 1,
    sizePreset: "postcard",
    width: 1400,
    height: 1000,
    backgroundColor: "#fbfaf7",
    accentColor: "#39705f",
    texture: "paper",
    layers: [
      {
        id: "headline",
        type: "text",
        label: "Headline",
        text: "Donation Drive",
        x: 110,
        y: 120,
        width: 760,
        height: 150,
        color: "#102033",
        fontSize: 72,
        fontFamily: "Georgia, serif",
        fontWeight: "800",
        align: "left"
      },
      {
        id: "details",
        type: "text",
        label: "Details",
        text: "May 31, 2026\nAround downtown area\nTacloban City, Philippines",
        x: 115,
        y: 330,
        width: 610,
        height: 190,
        color: "#42526b",
        fontSize: 34,
        fontFamily: "Arial, sans-serif",
        fontWeight: "400",
        align: "left"
      },
      {
        id: "cta",
        type: "shape",
        label: "RSVP callout",
        text: "RSVP",
        x: 1050,
        y: 720,
        width: 220,
        height: 92,
        color: "#ffffff",
        backgroundColor: "#39705f",
        fontSize: 34,
        fontFamily: "Arial, sans-serif",
        fontWeight: "700",
        align: "center",
        radius: 10
      }
    ]
  };
}

export function normalizeCardData(value: unknown): InvitationCardData {
  const defaults = defaultCardData();
  const data = typeof value === "object" && value !== null ? value as Partial<InvitationCardData> : {};

  return {
    version: 1,
    sizePreset: data.sizePreset ?? defaults.sizePreset,
    width: clampNumber(data.width, 320, 3000, defaults.width),
    height: clampNumber(data.height, 320, 3000, defaults.height),
    backgroundColor: normalizeHex(data.backgroundColor, defaults.backgroundColor),
    accentColor: normalizeHex(data.accentColor, defaults.accentColor),
    texture: data.texture === "none" || data.texture === "grid" || data.texture === "soft" || data.texture === "paper"
      ? data.texture
      : defaults.texture,
    layers: Array.isArray(data.layers) && data.layers.length > 0
      ? data.layers.map(normalizeLayer)
      : defaults.layers
  };
}

function normalizeLayer(layer: Partial<CardLayer>, index: number): CardLayer {
  const type = layer.type === "shape" || layer.type === "image" ? layer.type : "text";
  return {
    id: typeof layer.id === "string" && layer.id ? layer.id : `layer-${index}`,
    type,
    label: typeof layer.label === "string" && layer.label ? layer.label : type === "shape" ? "Shape" : type === "image" ? "Image" : "Text",
    text: typeof layer.text === "string" ? layer.text : type === "shape" ? "RSVP" : type === "image" ? "" : "Text",
    imageUrl: typeof layer.imageUrl === "string" ? layer.imageUrl : undefined,
    x: clampNumber(layer.x, 0, 3000, 80),
    y: clampNumber(layer.y, 0, 3000, 80),
    width: clampNumber(layer.width, 20, 3000, 400),
    height: clampNumber(layer.height, 20, 3000, 120),
    color: normalizeHex(layer.color, type === "shape" ? "#ffffff" : "#102033"),
    backgroundColor: normalizeHex(layer.backgroundColor, "#39705f"),
    fontSize: clampNumber(layer.fontSize, 8, 180, type === "shape" ? 32 : 48),
    fontFamily: normalizeFontFamily(layer.fontFamily),
    fontWeight: layer.fontWeight === "400" || layer.fontWeight === "600" || layer.fontWeight === "700" || layer.fontWeight === "800"
      ? layer.fontWeight
      : type === "shape" ? "700" : "600",
    align: layer.align === "center" || layer.align === "right" ? layer.align : "left",
    radius: clampNumber(layer.radius, 0, 100, type === "shape" ? 8 : 0),
    opacity: clampNumber(layer.opacity, 10, 100, 100),
    objectFit: layer.objectFit === "cover" ? "cover" : "contain"
  };
}

function normalizeFontFamily(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "Arial, sans-serif";
}

function normalizeHex(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function parseCardData(value: string) {
  try {
    return normalizeCardData(JSON.parse(value));
  } catch {
    return null;
  }
}

async function requireOrg() {
  const membership = await getCurrentOrg();
  const org = membership?.orgs;

  if (!org) {
    redirect("/onboarding/create-org");
  }

  const supabase = await createClientForServer();
  return { org, supabase };
}

type RawInvitationCard = Omit<InvitationCard, "canvas_data"> & {
  canvas_data: unknown;
};

function normalizeCard(row: RawInvitationCard): InvitationCard {
  return {
    ...row,
    canvas_data: normalizeCardData(row.canvas_data)
  };
}

export function newCardDefaults() {
  return defaultCardData();
}

export async function getCardOrgId() {
  const { org } = await requireOrg();
  return org.id;
}

export async function listCards() {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("invitation_cards")
    .select("id, name, canvas_data, preview_url, updated_at")
    .eq("org_id", org.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeCard(row as RawInvitationCard));
}

export async function getCard(cardId: string) {
  const { org, supabase } = await requireOrg();
  const { data, error } = await supabase
    .from("invitation_cards")
    .select("id, name, canvas_data, preview_url, updated_at")
    .eq("org_id", org.id)
    .eq("id", cardId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeCard(data as RawInvitationCard) : null;
}

export async function createCard(formData: FormData) {
  "use server";

  const { org, supabase } = await requireOrg();
  const name = formValue(formData, "name");
  const cardData = parseCardData(formValue(formData, "canvas_data"));

  if (!name || !cardData) {
    redirect("/cards/new?error=missing_fields");
  }

  const { data, error } = await supabase
    .from("invitation_cards")
    .insert({
      org_id: org.id,
      name,
      canvas_data: cardData
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/cards/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cards");
  redirect(`/cards/${data.id}?created=1`);
}

export async function updateCard(cardId: string, formData: FormData) {
  "use server";

  const name = formValue(formData, "name");
  const cardData = parseCardData(formValue(formData, "canvas_data"));

  if (!name || !cardData) {
    redirect(`/cards/${cardId}?error=missing_fields`);
  }

  const { org, supabase } = await requireOrg();
  const { error } = await supabase
    .from("invitation_cards")
    .update({
      name,
      canvas_data: cardData,
      updated_at: new Date().toISOString()
    })
    .eq("org_id", org.id)
    .eq("id", cardId);

  if (error) {
    redirect(`/cards/${cardId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/cards");
  revalidatePath(`/cards/${cardId}`);
  redirect(`/cards/${cardId}?saved=1`);
}
