import type { EntityKind, LibraryData } from "./types";

export interface SearchHit {
  kind: EntityKind | "category" | "tag";
  id: string;
  title: string;
  subtitle: string;
}

function hay(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" \n ").toLowerCase();
}

export function searchLibrary(lib: LibraryData, query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const s of lib.stories) {
    const cats = s.categoryIds
      .map((id) => lib.categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    const tags = s.tagIds
      .map((id) => lib.tags.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    if (
      hay([s.title, s.author, s.content, s.notes, s.source, cats, tags]).includes(q)
    ) {
      hits.push({
        kind: "story",
        id: s.id,
        title: s.title || "Untitled story",
        subtitle: [s.author, cats].filter(Boolean).join(" · "),
      });
    }
  }

  for (const c of lib.characters) {
    if (
      hay([
        c.name,
        c.nickname,
        c.occupation,
        c.personality,
        c.physicalDescription,
        c.background,
        c.notes,
        c.dateOfBirth,
        ...Object.values(c.dossier ?? {}),
      ]).includes(q)
    ) {
      hits.push({
        kind: "character",
        id: c.id,
        title: c.name || "Unnamed character",
        subtitle: [c.nickname, c.occupation].filter(Boolean).join(" · "),
      });
      for (const s of lib.stories.filter((st) => st.characterIds.includes(c.id))) {
        hits.push({
          kind: "story",
          id: s.id,
          title: s.title || "Untitled story",
          subtitle: `Features ${c.name || "this character"}`,
        });
      }
    }
  }

  for (const s of lib.scenarios) {
    if (hay([s.title, s.description, s.location, s.situation, s.notes, s.category]).includes(q)) {
      hits.push({
        kind: "scenario",
        id: s.id,
        title: s.title || "Untitled scenario",
        subtitle: [s.location, s.category].filter(Boolean).join(" · "),
      });
    }
  }

  for (const s of lib.series) {
    if (hay([s.title, s.description, s.themes, s.notes]).includes(q)) {
      hits.push({
        kind: "series",
        id: s.id,
        title: s.title || "Untitled series",
        subtitle: `${s.stories.length} stor${s.stories.length === 1 ? "y" : "ies"}`,
      });
    }
  }

  for (const l of lib.links) {
    if (hay([l.title, l.url, l.websiteName, l.description, l.notes, l.category]).includes(q)) {
      hits.push({
        kind: "link",
        id: l.id,
        title: l.title || l.websiteName || l.url,
        subtitle: l.websiteName || l.url,
      });
    }
  }

  for (const c of lib.categories) {
    if (c.name.toLowerCase().includes(q)) {
      const linked = lib.stories.filter((s) => s.categoryIds.includes(c.id));
      hits.push({
        kind: "category",
        id: c.id,
        title: c.name,
        subtitle: `${linked.length} linked stor${linked.length === 1 ? "y" : "ies"}`,
      });
      for (const s of linked) {
        hits.push({
          kind: "story",
          id: s.id,
          title: s.title || "Untitled story",
          subtitle: `In ${c.name}`,
        });
      }
    }
  }

  for (const t of lib.tags) {
    if (t.name.toLowerCase().includes(q)) {
      const linked = lib.stories.filter((s) => s.tagIds.includes(t.id));
      hits.push({
        kind: "tag",
        id: t.id,
        title: `#${t.name}`,
        subtitle: `${linked.length} linked stor${linked.length === 1 ? "y" : "ies"}`,
      });
      for (const s of linked) {
        hits.push({
          kind: "story",
          id: s.id,
          title: s.title || "Untitled story",
          subtitle: `Tagged ${t.name}`,
        });
      }
    }
  }

  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = `${h.kind}-${h.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
