import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ImportContactsPage() {
  return (
    <>
      <PageHeader
        description="CSV parsing, mapping, preview, and background import will be wired after the database layer is active."
        eyebrow="CRM"
        title="Import contacts"
      />
      <Card className="max-w-3xl p-6">
        <div className="rounded-lg border border-dashed border-line bg-field px-6 py-12 text-center">
          <Upload className="mx-auto h-8 w-8 text-moss" />
          <h2 className="mt-4 text-lg font-semibold text-ink">Upload CSV</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            This step will preview the first rows and let staff map columns before creating the background import job.
          </p>
          <Button className="mt-5" type="button">Choose file</Button>
        </div>
      </Card>
    </>
  );
}
