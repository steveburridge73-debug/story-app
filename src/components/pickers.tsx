import type { Category, Character, Scenario, Tag } from "@/lib/library/types";
import { Chip, Field, Input } from "./ui";
import { uid } from "@/lib/utils";

export function CategoryPicker({
  categories,
  selected,
  onChange,
}: {
  categories: Category[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const tops = categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <Field label="Categories">
      <div className="flex flex-col gap-3">
        {tops.map((top) => {
          const subs = categories
            .filter((c) => c.parentId === top.id)
            .sort((a, b) => a.order - b.order);
          return (
            <div key={top.id}>
              <div className="mb-1.5 text-xs text-subtle">{top.name}</div>
              <div className="flex flex-wrap gap-1.5">
                <Chip active={selected.includes(top.id)} onClick={() => toggle(top.id)}>
                  {top.name}
                </Chip>
                {subs.map((s) => (
                  <Chip key={s.id} active={selected.includes(s.id)} onClick={() => toggle(s.id)}>
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Field>
  );
}

export function TagPicker({
  tags,
  selected,
  onChange,
  onCreate,
}: {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
  onCreate: (tag: Tag) => void;
}) {
  function addFromInput(el: HTMLInputElement) {
    const name = el.value.trim();
    if (!name) return;
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selected.includes(existing.id)) onChange([...selected, existing.id]);
    } else {
      const tag = { id: uid("tg"), name };
      onCreate(tag);
      onChange([...selected, tag.id]);
    }
    el.value = "";
  }
  return (
    <Field label="Tags">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Chip
            key={t.id}
            active={selected.includes(t.id)}
            onClick={() =>
              onChange(
                selected.includes(t.id) ? selected.filter((x) => x !== t.id) : [...selected, t.id],
              )
            }
          >
            {t.name}
          </Chip>
        ))}
      </div>
      <Input
        placeholder="Add a tag and press Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addFromInput(e.currentTarget);
          }
        }}
      />
    </Field>
  );
}

export function CharacterPicker({
  people,
  selected,
  onChange,
}: {
  people: Character[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (!people.length) {
    return <p className="mb-3 text-sm text-muted">No people saved yet. Add them from Characters.</p>;
  }
  return (
    <Field label="Characters">
      <div className="flex flex-wrap gap-1.5">
        {people.map((c) => (
          <Chip
            key={c.id}
            active={selected.includes(c.id)}
            onClick={() =>
              onChange(
                selected.includes(c.id)
                  ? selected.filter((x) => x !== c.id)
                  : [...selected, c.id],
              )
            }
          >
            {c.name || "Unnamed"}
          </Chip>
        ))}
      </div>
    </Field>
  );
}

export function ScenarioSelect({
  scenarios,
  value,
  onChange,
}: {
  scenarios: Scenario[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <Field label="Scenario">
      <select
        className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base text-fg"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">None</option>
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title || "Untitled"}
          </option>
        ))}
      </select>
    </Field>
  );
}
