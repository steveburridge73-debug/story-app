import { useMemo, useState } from "react";
import { searchLibrary } from "@/lib/library/search";
import type { EntityKind } from "@/lib/library/types";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { Screen } from "./chrome";
import { EmptyState, Input, ListRow } from "./ui";

function openHit(
  push: ReturnType<typeof useApp.getState>["push"],
  kind: string,
  id: string,
  title: string,
) {
  if (kind === "story") push({ view: "story", id, title });
  else if (kind === "character") push({ view: "character", id, title });
  else if (kind === "scenario") push({ view: "scenario", id, title });
  else if (kind === "series") push({ view: "series-detail", id, title });
  else if (kind === "link") {
    const link = useApp.getState().lib.links.find((l) => l.id === id);
    if (link?.url) window.open(link.url, "_blank", "noopener,noreferrer");
  } else if (kind === "category") {
    const cat = useApp.getState().lib.categories.find((c) => c.id === id);
    push({ view: "stories-list", title: cat?.name || "Stories", query: cat?.name });
  } else if (kind === "tag") {
    const tag = useApp.getState().lib.tags.find((t) => t.id === id);
    push({ view: "stories-list", title: tag?.name || "Stories", query: tag?.name });
  }
}

export function SearchScreen() {
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const [q, setQ] = useState("");
  const hits = useMemo(() => searchLibrary(lib, q), [lib, q]);

  return (
    <Screen title="Search">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Stories, people, scenarios, series, tags…"
        autoFocus
        className="mb-3"
      />
      {!q.trim() ? (
        <p className="text-sm text-muted">Search across the whole library, including notes and authors.</p>
      ) : hits.length === 0 ? (
        <EmptyState title="Nothing found" body="Try a character name, a category, or a word from a story." />
      ) : (
        hits.map((h) => (
          <ListRow
            key={`${h.kind}-${h.id}`}
            title={h.title}
            subtitle={`${h.kind} · ${h.subtitle}`}
            onClick={() => openHit(push, h.kind, h.id, h.title)}
          />
        ))
      )}
    </Screen>
  );
}

export function FavouritesScreen() {
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const items: { kind: EntityKind; id: string; title: string; subtitle: string }[] = [
    ...lib.stories
      .filter((s) => s.favourite)
      .map((s) => ({ kind: "story" as const, id: s.id, title: s.title || "Untitled", subtitle: "Story" })),
    ...lib.characters
      .filter((s) => s.favourite)
      .map((s) => ({
        kind: "character" as const,
        id: s.id,
        title: s.name || "Unnamed",
        subtitle: "Character",
      })),
    ...lib.scenarios
      .filter((s) => s.favourite)
      .map((s) => ({
        kind: "scenario" as const,
        id: s.id,
        title: s.title || "Untitled",
        subtitle: "Scenario",
      })),
    ...lib.series
      .filter((s) => s.favourite)
      .map((s) => ({ kind: "series" as const, id: s.id, title: s.title || "Untitled", subtitle: "Series" })),
    ...lib.links
      .filter((s) => s.favourite)
      .map((s) => ({
        kind: "link" as const,
        id: s.id,
        title: s.title || s.url,
        subtitle: "Website link",
      })),
  ];

  return (
    <Screen title="Favourites">
      {items.length === 0 ? (
        <EmptyState title="Nothing favourited" body="Mark stories, people, scenarios, series or links with the heart." />
      ) : (
        items.map((i) => (
          <ListRow
            key={`${i.kind}-${i.id}`}
            title={i.title}
            subtitle={i.subtitle}
            onClick={() => openHit(push, i.kind, i.id, i.title)}
          />
        ))
      )}
    </Screen>
  );
}

export function RecentsScreen() {
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const rows = lib.recents
    .map((r) => {
      if (r.kind === "story") {
        const s = lib.stories.find((x) => x.id === r.id);
        return s
          ? { kind: r.kind, id: r.id, title: s.title || "Untitled", when: r.viewedAt }
          : null;
      }
      if (r.kind === "character") {
        const s = lib.characters.find((x) => x.id === r.id);
        return s ? { kind: r.kind, id: r.id, title: s.name || "Unnamed", when: r.viewedAt } : null;
      }
      if (r.kind === "scenario") {
        const s = lib.scenarios.find((x) => x.id === r.id);
        return s
          ? { kind: r.kind, id: r.id, title: s.title || "Untitled", when: r.viewedAt }
          : null;
      }
      if (r.kind === "series") {
        const s = lib.series.find((x) => x.id === r.id);
        return s
          ? { kind: r.kind, id: r.id, title: s.title || "Untitled", when: r.viewedAt }
          : null;
      }
      const s = lib.links.find((x) => x.id === r.id);
      return s ? { kind: r.kind, id: r.id, title: s.title || s.url, when: r.viewedAt } : null;
    })
    .filter(Boolean);

  return (
    <Screen title="Recently viewed">
      {rows.length === 0 ? (
        <EmptyState title="Nothing viewed yet" body="Stories, people, scenarios, series and links you open will appear here." />
      ) : (
        rows.map((r) =>
          r ? (
            <ListRow
              key={`${r.kind}-${r.id}-${r.when}`}
              title={r.title}
              subtitle={`${r.kind} · ${formatDateTime(r.when)}`}
              onClick={() => openHit(push, r.kind, r.id, r.title)}
            />
          ) : null,
        )
      )}
    </Screen>
  );
}
