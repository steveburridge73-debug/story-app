import { defaultCategories, emptyLibrary, mergeDynamicOptions } from "./defaults";
import { joinStoryPages, pagesFromStory } from "./pages";
import { ensureBidirectionalRelationships } from "./relationships";
import type { HealthItem, HealthReport, HealthStatus, LibraryData } from "./types";
import { uid } from "@/lib/utils";

function item(
  id: string,
  label: string,
  status: HealthStatus,
  detail: string,
  repairable = false,
): HealthItem {
  return { id, label, status, detail, repairable };
}

export function runHealthCheck(lib: LibraryData): HealthReport {
  const items: HealthItem[] = [];
  const storyIds = new Set(lib.stories.map((s) => s.id));
  const charIds = new Set(lib.characters.map((c) => c.id));
  const scenIds = new Set(lib.scenarios.map((s) => s.id));
  const seriesIds = new Set(lib.series.map((s) => s.id));
  const catIds = new Set(lib.categories.map((c) => c.id));
  const tagIds = new Set(lib.tags.map((t) => t.id));
  const imageIds = new Set([
    ...lib.images.map((i) => i.id),
    ...lib.characterImages.map((i) => i.id),
  ]);

  items.push(
    item(
      "database",
      "Database",
      "ok",
      `Library v${lib.version} loaded with ${lib.stories.length} stories.`,
    ),
  );

  const storiesMissingTitle = lib.stories.filter((s) => !s.title.trim());
  items.push(
    item(
      "stories",
      "Stories",
      storiesMissingTitle.length ? "warn" : "ok",
      storiesMissingTitle.length
        ? `${storiesMissingTitle.length} stor${storiesMissingTitle.length === 1 ? "y has" : "ies have"} no title.`
        : `${lib.stories.length} stor${lib.stories.length === 1 ? "y" : "ies"} stored.`,
    ),
  );

  const charsMissingName = lib.characters.filter((c) => !c.name.trim());
  items.push(
    item(
      "characters",
      "Characters",
      charsMissingName.length ? "warn" : "ok",
      charsMissingName.length
        ? `${charsMissingName.length} character record(s) missing a name.`
        : `${lib.characters.length} character${lib.characters.length === 1 ? "" : "s"} stored.`,
    ),
  );

  const brokenRels = lib.relationships.filter(
    (r) => !charIds.has(r.fromId) || !charIds.has(r.toId),
  );
  items.push(
    item(
      "relationships",
      "Character relationships",
      brokenRels.length ? "warn" : "ok",
      brokenRels.length
        ? `${brokenRels.length} relationship(s) point to missing characters.`
        : `${lib.relationships.length} relationship${lib.relationships.length === 1 ? "" : "s"} stored.`,
      brokenRels.length > 0,
    ),
  );

  const scenariosBrokenChars = lib.scenarios.filter((s) =>
    s.characterIds.some((id) => !charIds.has(id)),
  );
  items.push(
    item(
      "scenarios",
      "Scenarios",
      scenariosBrokenChars.length ? "warn" : "ok",
      scenariosBrokenChars.length
        ? `${scenariosBrokenChars.length} scenario(s) link to missing characters.`
        : `${lib.scenarios.length} scenario${lib.scenarios.length === 1 ? "" : "s"} stored.`,
      scenariosBrokenChars.length > 0,
    ),
  );

  const seriesBroken = lib.series.filter(
    (s) =>
      s.stories.some((st) => !storyIds.has(st.storyId)) ||
      s.characterIds.some((id) => !charIds.has(id)) ||
      s.scenarioIds.some((id) => !scenIds.has(id)),
  );
  items.push(
    item(
      "series",
      "Story Series",
      seriesBroken.length ? "warn" : "ok",
      seriesBroken.length
        ? `${seriesBroken.length} series have broken story or character links.`
        : `${lib.series.length} series stored.`,
      seriesBroken.length > 0,
    ),
  );

  const defaultCats = defaultCategories();
  const missingDefaults = defaultCats.filter(
    (c) => !lib.categories.some((x) => x.id === c.id || x.name === c.name),
  );
  const orphanCats = lib.categories.filter(
    (c) => c.parentId && !catIds.has(c.parentId),
  );
  items.push(
    item(
      "categories",
      "Categories",
      missingDefaults.length || orphanCats.length ? "warn" : "ok",
      missingDefaults.length
        ? `${missingDefaults.length} default categor${missingDefaults.length === 1 ? "y is" : "ies are"} missing.`
        : orphanCats.length
          ? `${orphanCats.length} subcategor${orphanCats.length === 1 ? "y has" : "ies have"} a missing parent.`
          : `${lib.categories.length} categor${lib.categories.length === 1 ? "y" : "ies"} stored.`,
      missingDefaults.length > 0 || orphanCats.length > 0,
    ),
  );

  items.push(
    item(
      "tags",
      "Tags",
      "ok",
      `${lib.tags.length} tag${lib.tags.length === 1 ? "" : "s"} stored.`,
    ),
  );

  items.push(
    item(
      "search",
      "Search",
      "ok",
      "Search index is built from current library records.",
    ),
  );

  items.push(
    item(
      "favourites",
      "Favourites",
      "ok",
      `${
        lib.stories.filter((s) => s.favourite).length +
        lib.characters.filter((c) => c.favourite).length +
        lib.scenarios.filter((s) => s.favourite).length +
        lib.series.filter((s) => s.favourite).length +
        lib.links.filter((l) => l.favourite).length
      } favourites marked.`,
    ),
  );

  items.push(
    item(
      "import",
      "Story importing",
      "ok",
      "TXT, DOCX and PDF import is available from Stories.",
    ),
  );

  items.push(
    item(
      "reader",
      "Story reader",
      "ok",
      "Reader stores font size and reading position per story.",
    ),
  );

  const brokenImages = [
    ...lib.stories.filter((s) => s.coverImageId && !imageIds.has(s.coverImageId)),
    ...lib.characters.filter(
      (c) => c.primaryImageId && !imageIds.has(c.primaryImageId),
    ),
    ...lib.scenarios.filter(
      (s) => s.coverImageId && !imageIds.has(s.coverImageId),
    ),
    ...lib.series.filter((s) => s.coverImageId && !imageIds.has(s.coverImageId)),
  ];
  items.push(
    item(
      "images",
      "Images",
      brokenImages.length ? "warn" : "ok",
      brokenImages.length
        ? `${brokenImages.length} record(s) point to missing images.`
        : `${lib.images.length + lib.characterImages.length} image${lib.images.length + lib.characterImages.length === 1 ? "" : "s"} stored.`,
      brokenImages.length > 0,
    ),
  );

  const storyCharBroken = lib.stories.filter((s) =>
    s.characterIds.some((id) => !charIds.has(id)),
  );
  items.push(
    item(
      "story-character-links",
      "Story / character links",
      storyCharBroken.length ? "warn" : "ok",
      storyCharBroken.length
        ? `${storyCharBroken.length} stor${storyCharBroken.length === 1 ? "y has" : "ies have"} missing character links.`
        : "Story and character links are consistent.",
      storyCharBroken.length > 0,
    ),
  );

  const storyScenBroken = lib.stories.filter(
    (s) => s.scenarioId && !scenIds.has(s.scenarioId),
  );
  items.push(
    item(
      "scenario-story-links",
      "Scenario / story links",
      storyScenBroken.length ? "warn" : "ok",
      storyScenBroken.length
        ? `${storyScenBroken.length} stor${storyScenBroken.length === 1 ? "y has" : "ies have"} a missing scenario.`
        : "Scenario and story links are consistent.",
      storyScenBroken.length > 0,
    ),
  );

  items.push(
    item(
      "replacement",
      "Character Replacement",
      "ok",
      "Replacement workspace is available from Home.",
    ),
  );
  items.push(
    item(
      "generation",
      "Auto Generation",
      "ok",
      "Auto Generation workspace is available from Home.",
    ),
  );

  const books = lib.audiobooks ?? [];
  const brokenBooks = books.filter((a) => !storyIds.has(a.storyId) || !a.dataUrl);
  items.push(
    item(
      "audiobooks",
      "Audiobooks",
      brokenBooks.length ? "warn" : "ok",
      brokenBooks.length
        ? `${brokenBooks.length} audiobook file(s) point at a missing story.`
        : `${books.length} audiobook file${books.length === 1 ? "" : "s"} stored. Listen-as-you-read is available on every story.`,
      brokenBooks.length > 0,
    ),
  );

  const badLinks = lib.links.filter((l) => !l.url.trim());
  items.push(
    item(
      "links",
      "Website Links",
      badLinks.length ? "warn" : "ok",
      badLinks.length
        ? `${badLinks.length} saved link(s) have no URL.`
        : `${lib.links.length} website link${lib.links.length === 1 ? "" : "s"} stored.`,
    ),
  );

  items.push(
    item(
      "backup",
      "Backup / export",
      "ok",
      "Backup and restore are available in Settings.",
    ),
  );

  const dynamics = lib.dynamicOptions ?? [];
  const dynLengths = dynamics.filter((o) => o.kind === "length").length;
  const dynActs = dynamics.filter((o) => o.kind === "act").length;
  const dynThemes = dynamics.filter((o) => o.kind === "theme").length;
  const dynCats = dynamics.filter((o) => o.kind === "category").length;
  items.push(
    item(
      "dynamics",
      "Story Dynamics",
      dynamics.length ? "ok" : "warn",
      dynamics.length
        ? `${dynLengths} length${dynLengths === 1 ? "" : "s"}, ${dynActs} sexual act${dynActs === 1 ? "" : "s"}, ${dynThemes} theme${dynThemes === 1 ? "" : "s"}, ${dynCats} ${dynCats === 1 ? "category" : "categories"}.`
        : "Story Dynamics lists are empty. Lucky Dip needs at least a length and a theme.",
    ),
  );

  const structureOk =
    Array.isArray(lib.stories) &&
    Array.isArray(lib.characters) &&
    Array.isArray(lib.categories) &&
    Array.isArray(lib.audiobooks) &&
    Array.isArray(lib.dynamicOptions) &&
    lib.settings?.passcodeHash;
  items.push(
    item(
      "structure",
      "Required application structures",
      structureOk ? "ok" : "fail",
      structureOk
        ? "Required collections and settings are present."
        : "Required collections are missing. Repair will restore empty structures without deleting existing records.",
      !structureOk,
    ),
  );

  void seriesIds;
  void tagIds;
  return { items, ok: items.every((i) => i.status === "ok") };
}

export function repairLibrary(lib: LibraryData): { next: LibraryData; repaired: string[] } {
  const repaired: string[] = [];
  const next: LibraryData = structuredClone(lib);
  const charIds = new Set(next.characters.map((c) => c.id));
  const storyIds = new Set(next.stories.map((s) => s.id));
  const scenIds = new Set(next.scenarios.map((s) => s.id));
  const catIds = new Set(next.categories.map((c) => c.id));
  const imageIds = new Set([
    ...next.images.map((i) => i.id),
    ...next.characterImages.map((i) => i.id),
  ]);

  const relBefore = next.relationships.length;
  next.relationships = next.relationships.filter(
    (r) => charIds.has(r.fromId) && charIds.has(r.toId),
  );
  if (next.relationships.length !== relBefore) repaired.push("Removed broken character relationships.");
  const paired = ensureBidirectionalRelationships(
    next.relationships,
    next.characters,
    () => uid("rel"),
  );
  if (paired.length !== next.relationships.length) {
    next.relationships = paired;
    repaired.push("Filled in matching reverse relationships.");
  }

  for (const s of next.scenarios) {
    const before = s.characterIds.length;
    s.characterIds = s.characterIds.filter((id) => charIds.has(id));
    if (s.characterIds.length !== before) repaired.push(`Cleaned character links on scenario “${s.title || s.id}”.`);
  }

  for (const s of next.series) {
    const stBefore = s.stories.length;
    s.stories = s.stories.filter((st) => storyIds.has(st.storyId));
    s.characterIds = s.characterIds.filter((id) => charIds.has(id));
    s.scenarioIds = s.scenarioIds.filter((id) => scenIds.has(id));
    if (s.stories.length !== stBefore) repaired.push(`Removed missing stories from series “${s.title || s.id}”.`);
  }

  for (const s of next.stories) {
    s.characterIds = s.characterIds.filter((id) => charIds.has(id));
    if (s.scenarioId && !scenIds.has(s.scenarioId)) s.scenarioId = null;
    if (s.coverImageId && !imageIds.has(s.coverImageId)) s.coverImageId = null;
    s.categoryIds = s.categoryIds.filter((id) => catIds.has(id));
  }

  for (const c of next.characters) {
    if (c.primaryImageId && !imageIds.has(c.primaryImageId)) c.primaryImageId = null;
  }
  for (const s of next.scenarios) {
    if (s.coverImageId && !imageIds.has(s.coverImageId)) s.coverImageId = null;
  }
  for (const s of next.series) {
    if (s.coverImageId && !imageIds.has(s.coverImageId)) s.coverImageId = null;
  }

  next.categories = next.categories.filter((c) => !c.parentId || catIds.has(c.parentId) || c.parentId === c.id);
  const present = new Set(next.categories.map((c) => c.id));
  const names = new Set(next.categories.map((c) => c.name.toLowerCase()));
  for (const cat of defaultCategories()) {
    if (!present.has(cat.id) && !names.has(cat.name.toLowerCase())) {
      next.categories.push(cat);
      repaired.push(`Restored missing category “${cat.name}”.`);
    }
  }

  if (!Array.isArray(next.audiobooks)) next.audiobooks = [];
  const booksBefore = next.audiobooks.length;
  next.audiobooks = next.audiobooks.filter((a) => storyIds.has(a.storyId) && a.dataUrl);
  if (next.audiobooks.length !== booksBefore) {
    repaired.push("Removed audiobook files that no longer match a story.");
  }

  if (!Array.isArray(next.dynamicOptions)) {
    next.dynamicOptions = mergeDynamicOptions(undefined);
    repaired.push("Restored Story Dynamics lists.");
  } else {
    const merged = mergeDynamicOptions(next.dynamicOptions);
    if (merged.length !== next.dynamicOptions.length || merged.some((o, i) => o.id !== next.dynamicOptions[i]?.id || o.description !== next.dynamicOptions[i]?.description)) {
      next.dynamicOptions = merged;
      repaired.push("Updated Story Dynamics lists.");
    }
  }

  if (!Array.isArray(next.stories)) next.stories = [];
  for (const st of next.stories) {
    const pages = pagesFromStory(st);
    if (!Array.isArray(st.pages) || joinStoryPages(st.pages) !== joinStoryPages(pages)) {
      st.pages = pages;
      st.content = joinStoryPages(pages);
      if (pages.length) repaired.push(`Joined story pages for “${st.title || "Untitled"}”.`);
    } else {
      st.content = joinStoryPages(pages);
    }
  }
  if (!Array.isArray(next.characters)) next.characters = [];
  if (!next.settings) {
    next.settings = emptyLibrary().settings;
    repaired.push("Restored settings structure.");
  }

  if (repaired.length === 0) repaired.push("Nothing needed repairing.");
  return { next, repaired };
}
