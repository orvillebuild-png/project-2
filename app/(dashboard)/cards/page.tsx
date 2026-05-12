import { ModulePage } from "@/components/layout/ModulePage";

export default function CardsPage() {
  return (
    <ModulePage
      ctaHref="/cards/new"
      ctaLabel="New card"
      description="Design invitation cards with Fabric.js, save canvas data, and export PNG previews for email embeds."
      eyebrow="Designer"
      rows={[
        { label: "Fabric canvas", status: "Phase 5", tone: "amber" },
        { label: "Toolbar and layers", status: "Phase 5", tone: "amber" },
        { label: "Starter templates", status: "Phase 5", tone: "amber" },
        { label: "PNG export", status: "Phase 5", tone: "amber" }
      ]}
      title="Cards"
    />
  );
}
