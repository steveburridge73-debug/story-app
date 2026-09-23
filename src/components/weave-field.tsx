import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Field, Input } from "./ui";

export function WeavePoints({
  points,
  onChange,
}: {
  points: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    onChange([...points, t]);
    setDraft("");
  }

  return (
    <Field label="Must weave into the story">
      <p className="mb-2 text-sm leading-relaxed text-muted">
        Add as many points as you like. Each one must be included or adhered to — for example
        “initial hesitation about nudity” or “the main woman refuses to remove her bra throughout”.
      </p>
      {points.length ? (
        <ul className="mb-2 space-y-1.5">
          {points.map((point, i) => (
            <li key={`${i}-${point.slice(0, 24)}`} className="flex items-start gap-2">
              <p className="min-w-0 flex-1 rounded-md border border-border bg-raised px-3 py-2 text-sm leading-relaxed">
                {point}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove point ${i + 1}`}
                onClick={() => onChange(points.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          className="min-w-0 flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a point"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>
    </Field>
  );
}
