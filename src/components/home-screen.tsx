import {
  BookOpen,
  Dices,
  Folders,
  Headphones,
  Layers,
  Link as LinkIcon,
  Moon,
  PenLine,
  Repeat,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Users,
  Lock,
  Search,
  Heart,
  Clock,
  Settings,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "./ui";

const MAIN = [
  { view: "stories" as const, label: "Stories", hint: "New, amend or import", icon: BookOpen },
  { view: "audiobooks" as const, label: "Audiobooks", hint: "Listen and attach audio", icon: Headphones },
  { view: "characters" as const, label: "Characters / People", hint: "New female or male", icon: Users },
  { view: "scenarios" as const, label: "Scenarios", hint: "Settings & situations", icon: Folders },
  { view: "series" as const, label: "Story Series", hint: "Connected stories", icon: Layers },
  { view: "replacement" as const, label: "Character Replacement", hint: "Adapt a story", icon: Repeat },
  { view: "generation" as const, label: "Auto Generation", hint: "Write from references", icon: PenLine },
  { view: "links" as const, label: "Website Links", hint: "Bookmarks and porn mags", icon: LinkIcon },
];

const FEATURE = [
  {
    view: "dynamics" as const,
    label: "Story Dynamics",
    hint: "Length of Story · Sexual Act · Theme · Category",
    icon: SlidersHorizontal,
  },
  {
    view: "lucky-dip" as const,
    label: "Lucky Dip",
    hint: "Random length, acts, theme, category and people",
    icon: Dices,
  },
];

const QUICK = [
  { view: "search" as const, label: "Search", icon: Search },
  { view: "favourites" as const, label: "Favourites", icon: Heart },
  { view: "recents" as const, label: "Recently viewed", icon: Clock },
  { view: "settings" as const, label: "Settings", icon: Settings },
];

export function HomeScreen() {
  const push = useApp((s) => s.push);
  const lock = useApp((s) => s.lock);
  const theme = useApp((s) => s.lib.settings.theme);
  const setTheme = useApp((s) => s.setTheme);
  const stories = useApp((s) => s.lib.stories.length);
  const people = useApp((s) => s.lib.characters.length);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start justify-between gap-2 px-4 pb-2 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <div className="neon-sign-board min-w-0">
          <p className="neon-sign font-display text-[1.7rem] font-medium leading-[1.12] tracking-tight">
            Top Shelf
          </p>
          <p className="neon-sign-sub font-display text-base italic">and Under the Counter</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Lock" onClick={lock}>
            <Lock className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Application health check"
            onClick={() => push({ view: "health", title: "Application check" })}
          >
            <ShieldCheck className="size-5" />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="mb-4 text-sm text-subtle">
          {stories} stor{stories === 1 ? "y" : "ies"} · {people} {people === 1 ? "person" : "people"}
        </p>

        <div className="mb-3 grid grid-cols-1 gap-2">
          {FEATURE.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => push({ view: item.view, title: item.label })}
                className="flex min-h-[4.75rem] items-center gap-3 rounded-lg border border-accent/35 bg-surface px-3 py-3.5 text-left"
              >
                <span className="flex size-12 items-center justify-center rounded-md bg-raised text-accent">
                  <Icon className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-medium leading-tight">{item.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {MAIN.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => push({ view: item.view, title: item.label })}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-left"
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium">{item.label}</span>
                  <span className="block text-sm text-muted">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {QUICK.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => push({ view: item.view, title: item.label })}
                className="flex h-12 items-center gap-2 rounded-md border border-border bg-raised px-3 text-sm font-medium"
              >
                <Icon className="size-4 text-muted" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
