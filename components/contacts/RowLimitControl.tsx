"use client";

import { useRef } from "react";

type PreservedFilters = {
  age?: string;
  organization?: string;
  search?: string;
  sex?: string;
  source?: string;
  status?: string;
  tag?: string;
  type?: string;
};

export function RowLimitControl({
  action,
  filters,
  selectedLimit
}: {
  action: string;
  filters: PreservedFilters;
  selectedLimit?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="flex items-center justify-end gap-2 text-sm text-muted">
      {Object.entries(filters).map(([key, value]) => (
        value ? <input key={key} name={key} type="hidden" value={value} /> : null
      ))}
      <span>Rows</span>
      <select
        className="h-9 rounded-md border border-line bg-white px-2 text-sm text-ink outline-none focus:border-moss"
        defaultValue={selectedLimit ?? "20"}
        name="limit"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="20">20</option>
        <option value="30">30</option>
        <option value="40">40</option>
        <option value="50">50</option>
      </select>
    </form>
  );
}
