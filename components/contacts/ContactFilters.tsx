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
  selectedStatus,
  selectedSex,
  selectedAge,
  selectedOrganization,
  search
}: {
  tags: ContactTag[];
  types: ContactType[];
  sources: string[];
  selectedTag?: string;
  selectedType?: string;
  selectedSource?: string;
  selectedStatus?: string;
  selectedSex?: string;
  selectedAge?: string;
  selectedOrganization?: string;
  search?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showMore, setShowMore] = useState(Boolean(selectedSource || selectedStatus || selectedSex || selectedAge || selectedOrganization));

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
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <select
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            defaultValue={selectedSource ?? ""}
            name="source"
            onChange={applyDropdownFilter}
          >
            <option value="">All sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <select
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            defaultValue={selectedStatus ?? ""}
            name="status"
            onChange={applyDropdownFilter}
          >
            <option value="">All email status</option>
            <option value="pending">Pending</option>
            <option value="valid">Valid</option>
            <option value="risky">Risky</option>
            <option value="unknown">Unknown</option>
            <option value="disposable">Disposable</option>
            <option value="invalid">Invalid</option>
          </select>
          <select
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            defaultValue={selectedSex ?? ""}
            name="sex"
            onChange={applyDropdownFilter}
          >
            <option value="">All sex</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
          <select
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            defaultValue={selectedAge ?? ""}
            name="age"
            onChange={applyDropdownFilter}
          >
            <option value="">All ages</option>
            <option value="under_18">Under 18</option>
            <option value="18_24">18-24</option>
            <option value="25_34">25-34</option>
            <option value="35_44">35-44</option>
            <option value="45_54">45-54</option>
            <option value="55_64">55-64</option>
            <option value="65_plus">65+</option>
            <option value="unknown">Unknown age</option>
          </select>
          <input
            className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss"
            defaultValue={selectedOrganization ?? ""}
            name="organization"
            placeholder="Organization"
          />
        </div>
      ) : (
        <>
          {selectedSource ? <input name="source" type="hidden" value={selectedSource} /> : null}
          {selectedStatus ? <input name="status" type="hidden" value={selectedStatus} /> : null}
          {selectedSex ? <input name="sex" type="hidden" value={selectedSex} /> : null}
          {selectedAge ? <input name="age" type="hidden" value={selectedAge} /> : null}
          {selectedOrganization ? <input name="organization" type="hidden" value={selectedOrganization} /> : null}
        </>
      )}
    </form>
  );
}
