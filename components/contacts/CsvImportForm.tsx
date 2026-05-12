"use client";

import Papa from "papaparse";
import { Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type CsvRow = Record<string, string>;

type ImportField = {
  key: string;
  label: string;
  required?: boolean;
  candidates: string[];
};

const fields: ImportField[] = [
  { key: "email", label: "Email", required: true, candidates: ["email", "primary_email", "email_address"] },
  { key: "first_name", label: "First name", candidates: ["first_name", "firstname", "given_name"] },
  { key: "last_name", label: "Last name", candidates: ["last_name", "lastname", "surname", "family_name"] },
  { key: "salutation", label: "Salutation", candidates: ["salutation"] },
  { key: "phone", label: "Phone", candidates: ["phone", "primary_phone", "phone_number", "mobile"] },
  { key: "alternate_email", label: "Alternate email", candidates: ["alternate_email", "alt_email", "secondary_email"] },
  { key: "alternate_phone", label: "Alternate phone", candidates: ["alternate_phone", "alt_phone", "secondary_phone"] },
  { key: "organization_name", label: "Organization/account", candidates: ["organization_name", "organization", "account", "company"] },
  { key: "contact_type", label: "Contact type", candidates: ["contact_type", "type"] },
  { key: "address_line1", label: "Address line 1", candidates: ["address_line1", "address_1", "street", "address"] },
  { key: "address_line2", label: "Address line 2", candidates: ["address_line2", "address_2"] },
  { key: "city", label: "City", candidates: ["city"] },
  { key: "state_province", label: "State/province", candidates: ["state_province", "province", "state", "region"] },
  { key: "postal_code", label: "Postal code", candidates: ["postal_code", "zip", "zip_code"] },
  { key: "country", label: "Country", candidates: ["country"] },
  { key: "sex", label: "Sex", candidates: ["sex", "gender"] },
  { key: "age", label: "Age", candidates: ["age"] }
];

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function createDefaultMapping(headers: string[]) {
  const normalized = new Map(headers.map((header) => [normalizeHeader(header), header]));

  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.candidates.map((candidate) => normalized.get(candidate)).find(Boolean) ?? ""
    ])
  );
}

export function CsvImportForm({
  blank,
  duplicates,
  error,
  imported,
  skipped
}: {
  blank?: string;
  duplicates?: string;
  error?: string;
  imported?: string;
  skipped?: string;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const mappedCount = useMemo(() => Object.values(mapping).filter(Boolean).length, [mapping]);

  function handleFileChange(file?: File) {
    setParseError(null);
    setHeaders([]);
    setRows([]);
    setMapping({});

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Only .csv files are supported right now.");
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        if (result.errors.length > 0) {
          setParseError(result.errors[0]?.message ?? "Invalid CSV file.");
          return;
        }

        const parsedHeaders = result.meta.fields ?? [];
        setHeaders(parsedHeaders);
        setRows(result.data);
        setMapping(createDefaultMapping(parsedHeaders));
      },
      error(errorResult) {
        setParseError(errorResult.message);
      }
    });
  }

  return (
    <form action="/contacts/import/submit" className="rounded-lg border border-dashed border-line bg-field px-6 py-10" encType="multipart/form-data" method="post">
      <div className="text-center">
        <Upload className="mx-auto h-8 w-8 text-moss" />
        <h2 className="mt-4 text-lg font-semibold text-ink">Upload CSV</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Map CSV columns before import. Unmapped columns are ignored.
        </p>
      </div>

      {error ? (
        <div className="mx-auto mt-4 max-w-md rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </div>
      ) : null}
      {parseError ? (
        <div className="mx-auto mt-4 max-w-md rounded-md border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
          {parseError}
        </div>
      ) : null}
      {imported ? (
        <div className="mx-auto mt-4 max-w-md rounded-md border border-moss/30 bg-moss/10 px-3 py-2 text-sm text-moss">
          Imported {imported} contact{imported === "1" ? "" : "s"}. Skipped {skipped ?? "0"}
          {duplicates ? `, duplicates ${duplicates}` : ""}
          {blank ? `, blank emails ${blank}` : ""}.
        </div>
      ) : null}

      <div className="mx-auto mt-6 max-w-md">
        <label className="text-sm font-semibold text-ink" htmlFor="file">CSV file</label>
        <input
          accept=".csv,text/csv"
          className="mt-2 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink file:mr-4 file:rounded-md file:border-0 file:bg-moss file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          id="file"
          name="file"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
          required
          type="file"
        />
      </div>

      {rows.length > 0 ? (
        <>
          <input name="csv_mapping" type="hidden" value={JSON.stringify(mapping)} />

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <label className="block" key={field.key}>
                <span className="text-sm font-semibold text-ink">
                  {field.label}{field.required ? " *" : ""}
                </span>
                <select
                  className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-moss"
                  onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value }))}
                  required={field.required}
                  value={mapping[field.key] ?? ""}
                >
                  <option value="">Do not import</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
            <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
              Preview first {Math.min(rows.length, 5)} of {rows.length} rows
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-field text-xs uppercase text-muted">
                  <tr>
                    {headers.slice(0, 8).map((header) => (
                      <th className="px-4 py-3 font-semibold" key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, index) => (
                    <tr className="border-t border-line" key={index}>
                      {headers.slice(0, 8).map((header) => (
                        <td className="max-w-52 truncate px-4 py-3 text-muted" key={header}>{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{mappedCount} field{mappedCount === 1 ? "" : "s"} mapped</p>
            <Button type="submit">Import mapped contacts</Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
