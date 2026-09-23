import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Search, X, Headphones } from "lucide-react";
import { useApp } from "@/lib/store";
import { BookmarkBtn } from "./chrome";
import { Button, Input } from "./ui";
import { cn } from "@/lib/utils";
import { playVoice } from "@/lib/audiobook/engine";

export function StoryReader() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const story = useApp((s) => s.lib.stories.find((x) => x.id === id));
  const settings = useApp((s) => s.lib.settings);
  const theme = useApp((s) => s.lib.settings.theme);
  const setReading = useApp((s) => s.setReading);
  const toggle = useApp((s) => s.toggleStoryFav);
  const lib = useApp((s) => s.lib);
  const patchSettings = useApp((s) => s.patchSettings);
  const push = useApp((s) => s.push);
  const back = useApp((s) => s.back);
  const scroller = useRef<HTMLDivElement>(null);
  const [font, setFont] = useState(
    story?.readerFontSize ?? settings.readerFontSize ?? 19,
  );
  const [readerTheme, setReaderTheme] = useState(settings.readerTheme);
  const [query, setQuery] = useState("");
  const [showFind, setShowFind] = useState(false);
  const restored = useRef(false);

  const dark = readerTheme === "follow" ? theme === "dark" : readerTheme === "dark";

  useEffect(() => {
    const el = scroller.current;
    if (!el || !story || restored.current) return;
    restored.current = true;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0 && story.readingPosition > 0) {
      el.scrollTop = story.readingPosition * max;
    }
  }, [story?.id, story?.content]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !story) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const max = el.scrollHeight - el.clientHeight;
        const pos = max > 0 ? el.scrollTop / max : 0;
        setReading(story.id, pos, font);
      }, 250);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, [story?.id, font, setReading]);

  if (!story) {
    return (
      <div className="p-6 text-sm text-muted">
        Story not found.{" "}
        <button type="button" className="underline" onClick={back}>
          Back
        </button>
      </div>
    );
  }

  const people = story.characterIds
    .map((cid) => lib.characters.find((c) => c.id === cid)?.name)
    .filter(Boolean);
  const scenario = story.scenarioId
    ? lib.scenarios.find((s) => s.id === story.scenarioId)?.title
    : null;
  const cats = story.categoryIds
    .map((cid) => lib.categories.find((c) => c.id === cid)?.name)
    .filter(Boolean);

  const inSeries = lib.series
    .map((se) => {
      const ordered = [...se.stories]
        .sort((a, b) => a.order - b.order)
        .map((slot) => lib.stories.find((s) => s.id === slot.storyId))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      const index = ordered.findIndex((s) => s.id === story.id);
      return index >= 0 ? { series: se, ordered, index } : null;
    })
    .find((x): x is NonNullable<typeof x> => Boolean(x));

  const highlighted = (() => {
    if (!query.trim()) return story.content;
    const q = query.trim();
    try {
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return story.content.split(re);
    } catch {
      return story.content;
    }
  })();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", dark ? "bg-bg text-fg" : "bg-surface text-fg")}>
      <header className="flex items-center gap-1 border-b border-border px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={back}>
          <X className="size-5" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-display text-base font-medium">
          {story.title || "Untitled"}
        </h1>
        <Button variant="ghost" size="icon-sm" aria-label="Smaller text" onClick={() => setFont((f) => Math.max(14, f - 1))}>
          <Minus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Larger text" onClick={() => setFont((f) => Math.min(32, f + 1))}>
          <Plus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Find in story"
          onClick={() => setShowFind((v) => !v)}
        >
          <Search className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Listen to this story"
          onClick={() =>
            playVoice({
              storyId: story.id,
              title: story.title || "Untitled",
              text: story.content,
              offset: story.speechOffset ?? 0,
              rate: settings.ttsRate ?? 1,
            })
          }
        >
          <Headphones className="size-4" />
        </Button>
        <BookmarkBtn on={story.favourite} onClick={() => toggle(story.id)} />
      </header>
      {showFind ? (
        <div className="border-b border-border px-3 py-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find in this story"
            autoFocus
          />
        </div>
      ) : null}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <article
          className="mx-auto max-w-prose whitespace-pre-wrap font-display leading-relaxed"
          style={{ fontSize: font }}
        >
          {Array.isArray(highlighted)
            ? highlighted.map((part, i) =>
                i % 2 === 1 ? (
                  <mark key={i} className="bg-accent/40 text-inherit">
                    {part}
                  </mark>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )
            : highlighted}
        </article>
        <div className="mx-auto mt-10 max-w-prose border-t border-border pt-4 text-sm">
          <button
            type="button"
            className="text-muted underline"
            onClick={() => push({ view: "story-edit", id: story.id, title: "Edit story" })}
          >
            Edit
          </button>
          {cats.length ? <p className="mt-2 text-muted">Categories · {cats.join(", ")}</p> : null}
          {people.length ? <p className="mt-1 text-muted">Characters · {people.join(", ")}</p> : null}
          {scenario ? <p className="mt-1 text-muted">Scenario · {scenario}</p> : null}
          {story.notes ? (
            <p className="mt-3 whitespace-pre-wrap text-muted">Notes · {story.notes}</p>
          ) : null}
          {inSeries ? (
            <div className="mt-4 flex gap-2">
              {inSeries.index > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    push({
                      view: "story-reader",
                      id: inSeries.ordered[inSeries.index - 1]!.id,
                      title: inSeries.ordered[inSeries.index - 1]!.title,
                    })
                  }
                >
                  Previous in series
                </Button>
              ) : null}
              {inSeries.index < inSeries.ordered.length - 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    push({
                      view: "story-reader",
                      id: inSeries.ordered[inSeries.index + 1]!.id,
                      title: inSeries.ordered[inSeries.index + 1]!.title,
                    })
                  }
                >
                  Next in series
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next =
                  readerTheme === "dark" ? "light" : readerTheme === "light" ? "follow" : "dark";
                setReaderTheme(next);
                patchSettings({ readerTheme: next });
              }}
            >
              Reading: {readerTheme === "follow" ? "match app" : readerTheme}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
