import { Check, Minus, X } from "lucide-react";
import type { DynamicOption, TriState } from "@/lib/library/types";
import { cycleTriState } from "@/lib/library/types";
import { cn } from "@/lib/utils";

export const TRI_LEGEND =
  "Tick = must be used. Cross = must not be used. Blank = may be used if it fits.";

export function TriStateButton({
  value,
  onChange,
  label,
}: {
  value: TriState;
  onChange: (next: TriState) => void;
  label: string;
}) {
  const next = cycleTriState(value);
  const spoken =
    value === "yes" ? "Must be included" : value === "no" ? "Must not be included" : "Optional";
  return (
    <button
      type="button"
      aria-label={`${label}: ${spoken}. Tap to change.`}
      onClick={() => onChange(next)}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md border",
        value === "yes" && "border-ok bg-ok/15 text-ok",
        value === "no" && "border-danger bg-danger/15 text-danger",
        value === "maybe" && "border-border bg-raised text-muted",
      )}
    >
      {value === "yes" ? (
        <Check className="size-5" />
      ) : value === "no" ? (
        <X className="size-5" />
      ) : (
        <Minus className="size-5 opacity-40" />
      )}
    </button>
  );
}

export function TriStateList({
  items,
  values,
  onChange,
  exclusiveYes,
}: {
  items: DynamicOption[];
  values: Record<string, TriState>;
  onChange: (id: string, next: TriState) => void;
  exclusiveYes?: boolean;
}) {
  if (!items.length) {
    return <p className="text-sm text-muted">Nothing in this list yet. Add items in Story Dynamics.</p>;
  }
  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const value = values[item.id] ?? "maybe";
        return (
          <div key={item.id} className="flex items-start gap-2 py-2">
            <TriStateButton
              value={value}
              label={item.name}
              onChange={(next) => {
                if (exclusiveYes && next === "yes") {
                  for (const other of items) {
                    if (other.id !== item.id && (values[other.id] ?? "maybe") === "yes") {
                      onChange(other.id, "maybe");
                    }
                  }
                }
                onChange(item.id, next);
              }}
            />
            <button
              type="button"
              className="min-w-0 flex-1 pt-1 text-left"
              onClick={() => {
                const next = cycleTriState(value);
                if (exclusiveYes && next === "yes") {
                  for (const other of items) {
                    if (other.id !== item.id && (values[other.id] ?? "maybe") === "yes") {
                      onChange(other.id, "maybe");
                    }
                  }
                }
                onChange(item.id, next);
              }}
            >
              <span className="block text-[15px] font-medium leading-snug">{item.name}</span>
              {item.description ? (
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                  {item.description}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function splitTri(
  items: DynamicOption[],
  values: Record<string, TriState>,
): { yes: DynamicOption[]; no: DynamicOption[]; maybe: DynamicOption[] } {
  const yes: DynamicOption[] = [];
  const no: DynamicOption[] = [];
  const maybe: DynamicOption[] = [];
  for (const item of items) {
    const v = values[item.id] ?? "maybe";
    if (v === "yes") yes.push(item);
    else if (v === "no") no.push(item);
    else maybe.push(item);
  }
  return { yes, no, maybe };
}
