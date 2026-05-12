import { ModulePage } from "@/components/layout/ModulePage";

export default function TemplatesPage() {
  return (
    <ModulePage
      ctaLabel="New template"
      description="Reusable email templates with merge tags, preview rendering, and validation before campaign sends."
      eyebrow="Email"
      rows={[
        { label: "Tiptap editor", status: "Phase 5", tone: "amber" },
        { label: "Merge tags", status: "Phase 5", tone: "amber" },
        { label: "Email-safe HTML", status: "Phase 5", tone: "amber" },
        { label: "Preview mode", status: "Phase 5", tone: "amber" }
      ]}
      title="Templates"
    />
  );
}
