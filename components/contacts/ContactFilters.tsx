import { Button } from "@/components/ui/Button";
import type { ContactTag, ContactType } from "@/lib/contacts";

export function ContactFilters({
  tags,
  types,
  selectedTag,
  selectedType,
  search
}: {
  tags: ContactTag[];
  types: ContactType[];
  selectedTag?: string;
  selectedType?: string;
  search?: string;
}) {
  return (
    <form className="flex flex-col gap-2 md:flex-row md:items-center" action="/contacts">
      <input
        className="h-10 w-full rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss md:w-52"
        defaultValue={search ?? ""}
        name="search"
        placeholder="Search contacts"
      />
      <select className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss" defaultValue={selectedType ?? ""} name="type">
        <option value="">All types</option>
        {types.map((type) => (
          <option key={type.id} value={type.id}>{type.name}</option>
        ))}
      </select>
      <select className="h-10 rounded-md border border-line bg-field px-3 text-sm outline-none focus:border-moss" defaultValue={selectedTag ?? ""} name="tag">
        <option value="">All tags</option>
        {tags.map((tag) => (
          <option key={tag.id} value={tag.id}>{tag.name}</option>
        ))}
      </select>
      <Button type="submit" variant="secondary">Filter</Button>
    </form>
  );
}
