import { Upload } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { importContacts } from "@/lib/contacts";

export default async function ImportContactsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; imported?: string; skipped?: string }>;
}) {
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    missing_file: "Choose a CSV file before importing.",
    csv_only: "Only .csv files are supported right now.",
    no_email_rows: "No rows with an email address were found."
  };

  return (
    <>
      <PageHeader
        description="Upload CSV contacts into the current workspace. Imported rows use the CSV filename as their source."
        eyebrow="CRM"
        title="Import contacts"
      />
      <Card className="max-w-3xl p-6">
        <form action={importContacts} className="rounded-lg border border-dashed border-line bg-field px-6 py-12 text-center" encType="multipart/form-data">
          <Upload className="mx-auto h-8 w-8 text-moss" />
          <h2 className="mt-4 text-lg font-semibold text-ink">Upload CSV</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Contacts with duplicate emails are skipped. Contact types are matched when the type already exists.
          </p>
          {params.error ? (
            <div className="mx-auto mt-4 max-w-md rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
              {errorMessages[params.error] ?? params.error}
            </div>
          ) : null}
          {params.imported ? (
            <div className="mx-auto mt-4 max-w-md rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
              Imported {params.imported} contact{params.imported === "1" ? "" : "s"}. Skipped {params.skipped ?? "0"}.
            </div>
          ) : null}
          <div className="mx-auto mt-6 max-w-md text-left">
            <label className="text-sm font-semibold text-ink" htmlFor="file">CSV file</label>
            <input
              accept=".csv,text/csv"
              className="mt-2 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-moss file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              id="file"
              name="file"
              required
              type="file"
            />
          </div>
          <Button className="mt-5" type="submit">Import CSV</Button>
        </form>
      </Card>
    </>
  );
}
