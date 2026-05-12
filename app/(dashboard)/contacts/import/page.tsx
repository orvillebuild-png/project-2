import { CsvImportForm } from "@/components/contacts/CsvImportForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { importMappedContacts } from "@/lib/contacts";

export default async function ImportContactsPage({
  searchParams
}: {
  searchParams: Promise<{ blank?: string; duplicates?: string; error?: string; imported?: string; skipped?: string }>;
}) {
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    invalid_payload: "Upload and map a CSV file before importing.",
    csv_only: "Only .csv files are supported right now.",
    mapping_required: "Map the email column before importing.",
    parse_failed: "The CSV could not be parsed.",
    no_email_rows: "No mapped rows with an email address were found."
  };

  return (
    <>
      <PageHeader
        description="Upload CSV contacts into the current workspace. Imported rows use the CSV filename as their source."
        eyebrow="CRM"
        title="Import contacts"
      />
      <Card className="max-w-3xl p-6">
        <CsvImportForm
          blank={params.blank}
          duplicates={params.duplicates}
          error={params.error ? errorMessages[params.error] ?? params.error : undefined}
          formAction={importMappedContacts}
          imported={params.imported}
          skipped={params.skipped}
        />
      </Card>
    </>
  );
}
