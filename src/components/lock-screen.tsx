import { useState } from "react";
import { Delete, Lock } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "./ui";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"] as const;

export function LockScreen() {
  const [digits, setDigits] = useState("");
  const unlock = useApp((s) => s.unlock);
  const lockError = useApp((s) => s.lockError);
  const hydrated = useApp((s) => s.hydrated);

  async function submit(code: string) {
    if (!code) return;
    if (!useApp.getState().hydrated) {
      await new Promise((resolve) => {
        const t = setInterval(() => {
          if (useApp.getState().hydrated) {
            clearInterval(t);
            resolve(undefined);
          }
        }, 40);
      });
    }
    const ok = await unlock(code);
    setDigits("");
    if (!ok) {
      /* error shown from store */
    }
  }

  function press(key: (typeof KEYS)[number]) {
    if (key === "clear") {
      setDigits("");
      return;
    }
    if (key === "back") {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    setDigits((d) => (d.length >= 12 ? d : d + key));
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-xl border border-border bg-surface">
          <Lock className="size-7 text-accent" />
        </div>
        <p className="font-display text-2xl font-medium leading-tight tracking-tight">
          Top Shelf
        </p>
        <p className="mt-1 font-display text-lg italic text-muted">
          and Under the Counter
        </p>
        <p className="mt-4 text-sm text-subtle">Enter passcode</p>
        <div className="mt-4 flex min-h-8 items-center justify-center gap-2">
          {(digits.length ? digits.split("") : ["", "", "", ""]).map((d, i) => (
            <span
              key={i}
              className="flex size-2.5 items-center justify-center rounded-full bg-accent"
              style={{ opacity: digits.length ? 1 : 0.25 }}
            >
              {d ? "" : null}
            </span>
          ))}
          {digits.length > 4
            ? Array.from({ length: digits.length - 4 }).map((_, i) => (
                <span key={`e${i}`} className="size-2.5 rounded-full bg-accent" />
              ))
            : null}
        </div>
        {lockError ? <p className="mt-3 text-sm text-danger">{lockError}</p> : <div className="mt-3 h-5" />}
      </div>

      <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-3">
        {KEYS.map((key) => {
          const label =
            key === "back" ? <Delete className="size-5" /> : key === "clear" ? "C" : key;
          return (
            <button
              key={key}
              type="button"
              aria-label={key === "back" ? "Backspace" : key === "clear" ? "Clear" : key}
              onClick={() => press(key)}
              className="flex h-14 items-center justify-center rounded-lg bg-raised text-xl font-medium text-fg active:bg-surface"
            >
              {label}
            </button>
          );
        })}
      </div>
      <Button
        className="mx-auto mt-5 w-full max-w-xs"
        size="lg"
        disabled={!digits || !hydrated}
        onClick={() => submit(digits)}
      >
        Unlock
      </Button>
    </div>
  );
}
