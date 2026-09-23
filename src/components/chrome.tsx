import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookPlus,
  Folders,
  Heart,
  Home,
  Layers,
  Link as LinkIcon,
  Plus,
  Search,
  Settings,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui";
import { currentView, useApp } from "@/lib/store";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex h-dvh min-h-dvh w-full max-w-md flex-col overflow-hidden border-border bg-bg sm:border-x">
        {children}
      </div>
    </div>
  );
}

export function Screen({
  title,
  children,
  actions,
  hideBack,
  footer,
  className,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  hideBack?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  const back = useApp((s) => s.back);
  const nav = useApp((s) => s.nav);
  const showBack = !hideBack && nav.length > 1;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-bg/95 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-sm">
        {showBack ? (
          <Button variant="ghost" size="icon" aria-label="Back" onClick={back}>
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <div className="w-2" />
        )}
        <h1 className="min-w-0 flex-1 truncate font-display text-lg font-medium leading-tight">
          {title}
        </h1>
        <div className="flex items-center gap-0.5">{actions}</div>
      </header>
      <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 pb-24 pt-3", className)}>
        {children}
      </div>
      {footer}
    </div>
  );
}

const NAV = [
  { view: "home" as const, label: "Home", icon: Home },
  { view: "search" as const, label: "Search", icon: Search },
  { view: "favourites" as const, label: "Favourites", icon: Heart },
  { view: "settings" as const, label: "Settings", icon: Settings },
];

type AddChoice = {
  id: string;
  label: string;
  hint: string;
  icon: typeof BookPlus;
  run: () => void;
};

function addChoices(): AddChoice[] {
  const s = useApp.getState();
  return [
    {
      id: "story",
      label: "Brand new story",
      hint: "Brief, people, acts — then write",
      icon: BookPlus,
      run: () => s.push({ view: "story-new", title: "Brand new story" }),
    },
    {
      id: "import",
      label: "Import a story",
      hint: "Screenshot, file, or type page by page",
      icon: Upload,
      run: () => s.push({ view: "story-import", title: "Import a story" }),
    },
    {
      id: "female",
      label: "Female character",
      hint: "New person on the female template",
      icon: UserRound,
      run: () => {
        const c = s.newCharacter({ gender: "Female" });
        s.upsertCharacter(c);
        s.push({ view: "character-edit", id: c.id, title: "New female character" });
      },
    },
    {
      id: "male",
      label: "Male character",
      hint: "New person on the male template",
      icon: Users,
      run: () => {
        const c = s.newCharacter({ gender: "Male" });
        s.upsertCharacter(c);
        s.push({ view: "character-edit", id: c.id, title: "New male character" });
      },
    },
    {
      id: "scenario",
      label: "Scenario",
      hint: "A reusable setting or situation",
      icon: Folders,
      run: () => {
        const item = s.newScenario();
        s.upsertScenario(item);
        s.push({ view: "scenario-edit", id: item.id, title: "New scenario" });
      },
    },
    {
      id: "series",
      label: "Story series",
      hint: "Connected stories, in order",
      icon: Layers,
      run: () => {
        const item = s.newSeries();
        s.upsertSeries(item);
        s.push({ view: "series-detail", id: item.id, title: "New series" });
      },
    },
    {
      id: "link",
      label: "Website link",
      hint: "A bookmark that opens in the browser",
      icon: LinkIcon,
      run: () => {
        const item = s.newLink();
        s.upsertLink(item);
        s.push({ view: "link-edit", id: item.id, title: "New link" });
      },
    },
  ];
}

function AddSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close add"
        className="absolute inset-0 bg-bg/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sheet-title"
        className="add-sheet relative z-10 max-h-[min(88dvh,40rem)] w-full max-w-md overflow-y-auto rounded-t-xl border border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:rounded-xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="mb-3 flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 id="add-sheet-title" className="font-display text-xl font-medium leading-tight">
              What do you want to add?
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Pick a type. Nothing is generated until you ask.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Close" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          {addChoices().map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onClose();
                  item.run();
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-raised px-3 py-3 text-left"
              >
                <span className="flex size-11 items-center justify-center rounded-md bg-surface text-accent">
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
      </div>
    </div>
  );
}

export function BottomNav() {
  const frame = useApp((s) => currentView(s.nav));
  const replace = useApp((s) => s.replace);
  const goHome = useApp((s) => s.goHome);
  const push = useApp((s) => s.push);
  const [addOpen, setAddOpen] = useState(false);
  if (frame.view === "story-reader" || frame.view === "series-reader") return null;

  function go(view: (typeof NAV)[number]["view"]) {
    setAddOpen(false);
    if (view === "home") goHome();
    else if (frame.view === "home") push({ view, title: view[0]!.toUpperCase() + view.slice(1) });
    else replace({ view, title: view[0]!.toUpperCase() + view.slice(1) });
  }

  const left = NAV.slice(0, 2);
  const right = NAV.slice(2);

  return (
    <>
      {addOpen ? <AddSheet onClose={() => setAddOpen(false)} /> : null}
      <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        {left.map((item) => (
          <NavTab
            key={item.view}
            item={item}
            active={item.view === "home" ? frame.view === "home" : frame.view === item.view}
            onClick={() => go(item.view)}
          />
        ))}
        <button
          type="button"
          aria-label="Add"
          aria-haspopup="dialog"
          aria-expanded={addOpen}
          onClick={() => setAddOpen((open) => !open)}
          className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-fg"
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-transform duration-150 ease-out",
              addOpen
                ? "bg-raised text-fg ring-1 ring-border"
                : "bg-accent text-accent-fg",
            )}
          >
            <Plus className={cn("size-5 transition-transform duration-150", addOpen && "rotate-45")} strokeWidth={2.2} />
          </span>
          Add
        </button>
        {right.map((item) => (
          <NavTab
            key={item.view}
            item={item}
            active={frame.view === item.view}
            onClick={() => go(item.view)}
          />
        ))}
      </nav>
    </>
  );
}

function NavTab({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[11px]",
        active ? "text-fg" : "text-muted",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </button>
  );
}

export function FavButton({
  on,
  onClick,
  label = "Favourite",
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
    >
      <Heart className={cn("size-5", on && "fill-accent text-accent")} />
    </Button>
  );
}

export function BookmarkBtn({
  on,
  onClick,
}: {
  on: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label="Favourite" onClick={onClick}>
      <Bookmark className={cn("size-5", on && "fill-accent text-accent")} />
    </Button>
  );
}
