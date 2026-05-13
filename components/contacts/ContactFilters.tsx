"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ContactTag, ContactType } from "@/lib/contacts";

export function ContactFilters({
  tags,
  types,
  sources,
  selectedTag,
  selectedType,
  selectedSource,
  search
}: {
  tags: ContactTag[];
  types: ContactType[];
  sources: string[];
  selectedTag?: string;
  selectedType?: string;
  selectedSource?: string;
  search?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showMore, setShowMore] = useState(Boolean(selectedSource));

  function applyDropdownFilter() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} className="flex flex-col gap-2" action="/contacts">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <input
          className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss md:w-52"
          defaultValue={search ?? ""}
          name="search"
          placeholder="Search contacts"
        />
        <select
          className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
          defaultValue={selectedType ?? ""}
          name="type"
          onChange={applyDropdownFilter}
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
          defaultValue={selectedTag ?? ""}
          name="tag"
          onChange={applyDropdownFilter}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>{tag.name}</option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={() => setShowMore((current) => !current)}>More filters</Button>
      </div>
      {showMore ? (
        <div className="flex justify-end">
          <select
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss md:w-64"
            defaultValue={selectedSource ?? ""}
            name="source"
            onChange={applyDropdownFilter}
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>
      ) : selectedSource ? (
        <input name="source" type="hidden" value={selectedSource} />
      ) : null}
    </form>
  );
}
