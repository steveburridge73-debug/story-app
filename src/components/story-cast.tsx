import type { Character } from "@/lib/library/types";
import { Field, Input, Textarea } from "./ui";

export interface StoryCastUse {
  narrativeRole: string;
  evolutionPotential: string;
}

export const EMPTY_STORY_USE: StoryCastUse = {
  narrativeRole: "",
  evolutionPotential: "",
};

export function StoryRoleFields({
  name,
  value,
  onChange,
}: {
  name: string;
  value: StoryCastUse;
  onChange: (next: StoryCastUse) => void;
}) {
  return (
    <div className="mt-2 space-y-2">
      <Field label="Narrative role (this story only)">
        <Input
          value={value.narrativeRole}
          placeholder="e.g. heroine, sidekick, catalyst"
          onChange={(e) => onChange({ ...value, narrativeRole: e.target.value })}
        />
      </Field>
      <Field label="Evolution potential (this story only)">
        <Textarea
          className="min-h-20"
          value={value.evolutionPotential}
          placeholder="e.g. arc of self-discovery or transformation"
          onChange={(e) => onChange({ ...value, evolutionPotential: e.target.value })}
        />
      </Field>
      <p className="text-xs text-subtle">
        Used when writing this story. Not saved onto {name || "this person"}.
      </p>
    </div>
  );
}

export function StoryRolesForPeople({
  people,
  values,
  onChange,
}: {
  people: Character[];
  values: Record<string, StoryCastUse>;
  onChange: (id: string, next: StoryCastUse) => void;
}) {
  if (!people.length) return null;
  return (
    <div className="mb-3 space-y-3">
      {people.map((person) => (
        <div key={person.id} className="rounded-md border border-border bg-raised px-3 py-2">
          <p className="text-[15px] font-medium">{person.name || "Unnamed"}</p>
          <StoryRoleFields
            name={person.name || "Unnamed"}
            value={values[person.id] ?? EMPTY_STORY_USE}
            onChange={(next) => onChange(person.id, next)}
          />
        </div>
      ))}
    </div>
  );
}
