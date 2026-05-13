import { Badge } from "@/components/ui/Badge";

const tones = {
  valid: "green",
  pending: "amber",
  invalid: "coral",
  disposable: "coral",
  risky: "amber",
  unknown: "gray"
} as const;

export function EmailStatusBadge({ status }: { status: string }) {
  const tone = tones[status as keyof typeof tones] ?? "gray";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return <Badge tone={tone}>{label}</Badge>;
}
