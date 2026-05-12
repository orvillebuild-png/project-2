import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NewCardPage() {
  return (
    <>
      <PageHeader description="A Fabric.js designer will live here once the interactive card editor is added." eyebrow="Designer" title="New card" />
      <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_18rem]">
        <div className="aspect-[7/5] rounded-lg border border-line bg-[#f5efe7] p-8">
          <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#d8c7b5] bg-white/50 text-center">
            <div>
              <p className="text-lg font-semibold text-ink">Invitation canvas</p>
              <p className="mt-2 text-sm text-muted">Toolbar, layers, and export controls are next.</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Button className="w-full" type="button">Add text</Button>
          <Button className="w-full" type="button" variant="secondary">Upload image</Button>
          <Button className="w-full" type="button" variant="secondary">Set color</Button>
        </div>
      </Card>
    </>
  );
}
