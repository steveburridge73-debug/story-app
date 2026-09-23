import { create } from "zustand";
import { ageIsAmbiguous, looksUnderEighteen } from "./library/detect";
import { emptyLibrary } from "./library/defaults";
import { formatCharacterProfile, hydrateCharacter } from "./library/dossier";
import { repairLibrary } from "./library/health";
import { loadLibrary, saveLibrary } from "./library/storage";
import type {
  AutoLock,
  Category,
  Character,
  CharacterImage,
  DynamicKind,
  DynamicOption,
  EntityKind,
  LibraryData,
  LibraryImage,
  NavFrame,
  Relationship,
  Scenario,
  Series,
  Settings,
  Story,
  StoryOrigin,
  StorySource,
  Tag,
  ThemeMode,
  ViewName,
  WebsiteLink,
  Audiobook,
} from "./library/types";
import { nowIso, uid } from "./utils";
import { withJoinedContent } from "./library/pages";
import {
  applyRelationshipUpsert,
  removeRelationshipPair,
} from "./library/relationships";

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistSoon(data: LibraryData) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void saveLibrary(data);
  }, 80);
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem("tsc-theme", theme);
  } catch {
    /* ignore */
  }
}

function blankStory(partial?: Partial<Story>): Story {
  const t = nowIso();
  return {
    id: uid("st"),
    title: "",
    author: "",
    createdAt: t,
    modifiedAt: t,
    content: "",
    originalContent: null,
    source: "created",
    origin: "original",
    categoryIds: [],
    tagIds: [],
    characterIds: [],
    scenarioId: null,
    notes: "",
    favourite: false,
    coverImageId: null,
    adaptedFromId: null,
    readingPosition: 0,
    readerFontSize: null,
    speechOffset: 0,
    pages: [],
    ...partial,
  };
}

function blankCharacter(partial?: Partial<Character>): Character {
  const t = nowIso();
  return hydrateCharacter({
    id: uid("ch"),
    name: "",
    nickname: "",
    age: "",
    dateOfBirth: "",
    gender: "",
    breastSize: "",
    occupation: "",
    relationshipStatus: "",
    personality: "",
    mentalCharacteristics: "",
    physicalDescription: "",
    clothingStyle: "",
    background: "",
    likes: "",
    dislikes: "",
    habits: "",
    mentionedPeople: "",
    sexualQuirks: "",
    sexualDeviances: "",
    notes: "",
    dossier: {},
    favourite: false,
    primaryImageId: null,
    createdAt: t,
    modifiedAt: t,
    ...partial,
  });
}

function blankScenario(partial?: Partial<Scenario>): Scenario {
  const t = nowIso();
  return {
    id: uid("sc"),
    title: "",
    description: "",
    location: "",
    situation: "",
    category: "",
    characterIds: [],
    tagIds: [],
    notes: "",
    favourite: false,
    coverImageId: null,
    createdAt: t,
    modifiedAt: t,
    ...partial,
  };
}

function blankSeries(partial?: Partial<Series>): Series {
  const t = nowIso();
  return {
    id: uid("se"),
    title: "",
    description: "",
    coverImageId: null,
    characterIds: [],
    scenarioIds: [],
    themes: "",
    notes: "",
    favourite: false,
    stories: [],
    createdAt: t,
    modifiedAt: t,
    ...partial,
  };
}

function blankLink(partial?: Partial<WebsiteLink>): WebsiteLink {
  return {
    id: uid("ln"),
    title: "",
    url: "",
    websiteName: "",
    description: "",
    category: "",
    tagIds: [],
    addedAt: nowIso(),
    favourite: false,
    imageId: null,
    notes: "",
    ...partial,
  };
}

export interface UiState {
  hydrated: boolean;
  unlocked: boolean;
  lockError: string;
  nav: NavFrame[];
  lastActivity: number;
  confirm: null | {
    title: string;
    body: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  };
}

export interface AppState extends UiState {
  lib: LibraryData;
  hydrate: () => Promise<void>;
  lock: () => void;
  unlock: (code: string) => Promise<boolean>;
  touch: () => void;
  push: (frame: NavFrame) => void;
  replace: (frame: NavFrame) => void;
  back: () => void;
  goHome: () => void;
  askConfirm: (opts: NonNullable<UiState["confirm"]>) => void;
  closeConfirm: () => void;
  setTheme: (theme: ThemeMode) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  changePasscode: (current: string, next: string) => Promise<boolean>;
  replaceLibrary: (lib: LibraryData) => void;
  repair: () => string[];
  track: (kind: EntityKind, id: string) => void;
  upsertStory: (story: Story) => void;
  deleteStory: (id: string) => void;
  toggleStoryFav: (id: string) => void;
  setReading: (id: string, position: number, fontSize?: number) => void;
  upsertCharacter: (character: Character) => void;
  deleteCharacter: (id: string) => void;
  toggleCharacterFav: (id: string) => void;
  addCharacterImage: (image: CharacterImage) => void;
  deleteCharacterImage: (id: string) => void;
  setPrimaryCharacterImage: (characterId: string, imageId: string) => void;
  patchCharacterImage: (id: string, patch: Partial<CharacterImage>) => void;
  upsertRelationship: (rel: Relationship) => void;
  deleteRelationship: (id: string) => void;
  upsertDynamicOption: (opt: DynamicOption) => void;
  deleteDynamicOption: (id: string) => void;
  reorderDynamicOptions: (kind: DynamicKind, ids: string[]) => void;
  upsertScenario: (scenario: Scenario) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => string | null;
  toggleScenarioFav: (id: string) => void;
  upsertSeries: (series: Series) => void;
  deleteSeries: (id: string) => void;
  toggleSeriesFav: (id: string) => void;
  upsertLink: (link: WebsiteLink) => void;
  deleteLink: (id: string) => void;
  toggleLinkFav: (id: string) => void;
  upsertCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ids: string[]) => void;
  upsertTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  addImage: (image: LibraryImage) => void;
  deleteImage: (id: string) => void;
  upsertAudiobook: (book: Audiobook) => void;
  deleteAudiobook: (id: string) => void;
  setAudiobookPosition: (id: string, position: number, duration?: number) => void;
  setSpeechOffset: (storyId: string, offset: number) => void;
  newStory: (partial?: Partial<Story>) => Story;
  newCharacter: (partial?: Partial<Character>) => Character;
  newScenario: (partial?: Partial<Scenario>) => Scenario;
  newSeries: (partial?: Partial<Series>) => Series;
  newLink: (partial?: Partial<WebsiteLink>) => WebsiteLink;
}

const HOME: NavFrame = { view: "home", title: "Home" };

function commit(lib: LibraryData): LibraryData {
  persistSoon(lib);
  return lib;
}

export const useApp = create<AppState>((set, get) => ({
  hydrated: false,
  unlocked: false,
  lockError: "",
  nav: [HOME],
  lastActivity: Date.now(),
  confirm: null,
  lib: emptyLibrary(),

  hydrate: async () => {
    const lib = await loadLibrary();
    applyTheme(lib.settings.theme);
    persistSoon(lib);
    set({ lib, hydrated: true });
  },

  lock: () => {
    void import("./audiobook/engine").then((m) => m.stopAll());
    set({ unlocked: false, lockError: "", nav: [HOME], confirm: null });
  },

  unlock: async (code: string) => {
    const { hashPasscode } = await import("./library/hash");
    const hashed = await hashPasscode(code);
    if (hashed !== get().lib.settings.passcodeHash) {
      set({ lockError: "Incorrect passcode", unlocked: false });
      return false;
    }
    set({ unlocked: true, lockError: "", lastActivity: Date.now() });
    return true;
  },

  touch: () => set({ lastActivity: Date.now() }),

  push: (frame) =>
    set((s) => ({
      nav: [...s.nav, frame],
      lastActivity: Date.now(),
    })),

  replace: (frame) =>
    set((s) => ({
      nav: [...s.nav.slice(0, -1), frame],
      lastActivity: Date.now(),
    })),

  back: () =>
    set((s) => ({
      nav: s.nav.length > 1 ? s.nav.slice(0, -1) : s.nav,
      lastActivity: Date.now(),
    })),

  goHome: () => set({ nav: [HOME], lastActivity: Date.now() }),

  askConfirm: (opts) => set({ confirm: opts }),
  closeConfirm: () => set({ confirm: null }),

  setTheme: (theme) => {
    applyTheme(theme);
    set((s) => ({ lib: commit({ ...s.lib, settings: { ...s.lib.settings, theme } }) }));
  },

  patchSettings: (patch) => {
    set((s) => {
      const settings = { ...s.lib.settings, ...patch };
      if (patch.theme) applyTheme(patch.theme);
      return { lib: commit({ ...s.lib, settings }) };
    });
  },

  changePasscode: async (current, next) => {
    const { hashPasscode } = await import("./library/hash");
    const cur = await hashPasscode(current);
    if (cur !== get().lib.settings.passcodeHash) return false;
    const hashed = await hashPasscode(next);
    set((s) => ({
      lib: commit({
        ...s.lib,
        settings: { ...s.lib.settings, passcodeHash: hashed },
      }),
    }));
    return true;
  },

  replaceLibrary: (lib) => {
    applyTheme(lib.settings.theme);
    set({ lib: commit(lib) });
  },

  repair: () => {
    const { next, repaired } = repairLibrary(get().lib);
    set({ lib: commit(next) });
    return repaired;
  },

  track: (kind, id) => {
    set((s) => {
      const recents = [
        { kind, id, viewedAt: nowIso() },
        ...s.lib.recents.filter((r) => !(r.kind === kind && r.id === id)),
      ].slice(0, 40);
      return { lib: commit({ ...s.lib, recents }) };
    });
  },

  upsertStory: (story) => {
    set((s) => {
      const next = withJoinedContent({ ...story, modifiedAt: nowIso() });
      const stories = s.lib.stories.some((x) => x.id === next.id)
        ? s.lib.stories.map((x) => (x.id === next.id ? next : x))
        : [next, ...s.lib.stories];
      return { lib: commit({ ...s.lib, stories }) };
    });
  },

  deleteStory: (id) => {
    set((s) => {
      const stories = s.lib.stories.filter((x) => x.id !== id);
      const series = s.lib.series.map((se) => ({
        ...se,
        stories: se.stories.filter((st) => st.storyId !== id),
      }));
      const recents = s.lib.recents.filter((r) => !(r.kind === "story" && r.id === id));
      const audiobooks = s.lib.audiobooks.filter((a) => a.storyId !== id);
      return { lib: commit({ ...s.lib, stories, series, recents, audiobooks }) };
    });
  },

  toggleStoryFav: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        stories: s.lib.stories.map((x) => (x.id === id ? { ...x, favourite: !x.favourite } : x)),
      }),
    }));
  },

  setReading: (id, position, fontSize) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        stories: s.lib.stories.map((x) =>
          x.id === id
            ? {
                ...x,
                readingPosition: position,
                readerFontSize: fontSize ?? x.readerFontSize,
              }
            : x,
        ),
      }),
    }));
  },

  upsertCharacter: (character) => {
    set((s) => {
      const next = hydrateCharacter({ ...character, modifiedAt: nowIso() });
      const characters = s.lib.characters.some((x) => x.id === next.id)
        ? s.lib.characters.map((x) => (x.id === next.id ? next : x))
        : [next, ...s.lib.characters];
      return { lib: commit({ ...s.lib, characters }) };
    });
  },

  deleteCharacter: (id) => {
    set((s) => {
      const characters = s.lib.characters.filter((x) => x.id !== id);
      const relationships = s.lib.relationships.filter((r) => r.fromId !== id && r.toId !== id);
      const characterImages = s.lib.characterImages.filter((i) => i.characterId !== id);
      const stories = s.lib.stories.map((st) => ({
        ...st,
        characterIds: st.characterIds.filter((cid) => cid !== id),
      }));
      const scenarios = s.lib.scenarios.map((sc) => ({
        ...sc,
        characterIds: sc.characterIds.filter((cid) => cid !== id),
      }));
      const series = s.lib.series.map((se) => ({
        ...se,
        characterIds: se.characterIds.filter((cid) => cid !== id),
      }));
      const recents = s.lib.recents.filter((r) => !(r.kind === "character" && r.id === id));
      return {
        lib: commit({
          ...s.lib,
          characters,
          relationships,
          characterImages,
          stories,
          scenarios,
          series,
          recents,
        }),
      };
    });
  },

  toggleCharacterFav: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        characters: s.lib.characters.map((x) =>
          x.id === id ? { ...x, favourite: !x.favourite } : x,
        ),
      }),
    }));
  },

  addCharacterImage: (image) => {
    set((s) => {
      let characters = s.lib.characters;
      let characterImages = [...s.lib.characterImages, image];
      if (image.isPrimary) {
        characterImages = characterImages.map((i) =>
          i.characterId === image.characterId ? { ...i, isPrimary: i.id === image.id } : i,
        );
        characters = characters.map((c) =>
          c.id === image.characterId ? { ...c, primaryImageId: image.id } : c,
        );
      } else if (
        !characters.find((c) => c.id === image.characterId)?.primaryImageId
      ) {
        characters = characters.map((c) =>
          c.id === image.characterId ? { ...c, primaryImageId: image.id } : c,
        );
        characterImages = characterImages.map((i) =>
          i.id === image.id ? { ...i, isPrimary: true } : i,
        );
      }
      return { lib: commit({ ...s.lib, characterImages, characters }) };
    });
  },

  deleteCharacterImage: (id) => {
    set((s) => {
      const removed = s.lib.characterImages.find((i) => i.id === id);
      const characterImages = s.lib.characterImages.filter((i) => i.id !== id);
      let characters = s.lib.characters;
      if (removed) {
        const remaining = characterImages.filter((i) => i.characterId === removed.characterId);
        const nextPrimary = remaining.find((i) => i.isPrimary)?.id ?? remaining[0]?.id ?? null;
        characters = characters.map((c) =>
          c.id === removed.characterId ? { ...c, primaryImageId: nextPrimary } : c,
        );
      }
      return { lib: commit({ ...s.lib, characterImages, characters }) };
    });
  },

  setPrimaryCharacterImage: (characterId, imageId) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        characterImages: s.lib.characterImages.map((i) =>
          i.characterId === characterId ? { ...i, isPrimary: i.id === imageId } : i,
        ),
        characters: s.lib.characters.map((c) =>
          c.id === characterId ? { ...c, primaryImageId: imageId } : c,
        ),
      }),
    }));
  },

  patchCharacterImage: (id, patch) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        characterImages: s.lib.characterImages.map((i) =>
          i.id === id ? { ...i, ...patch } : i,
        ),
      }),
    }));
  },

  upsertRelationship: (rel) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        relationships: applyRelationshipUpsert(
          s.lib.relationships,
          rel,
          s.lib.characters,
          () => uid("rel"),
        ),
      }),
    }));
  },

  deleteRelationship: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        relationships: removeRelationshipPair(s.lib.relationships, id, s.lib.characters),
      }),
    }));
  },

  upsertDynamicOption: (opt) => {
    set((s) => {
      const dynamicOptions = s.lib.dynamicOptions.some((x) => x.id === opt.id)
        ? s.lib.dynamicOptions.map((x) => (x.id === opt.id ? opt : x))
        : [...s.lib.dynamicOptions, opt];
      return { lib: commit({ ...s.lib, dynamicOptions }) };
    });
  },

  deleteDynamicOption: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        dynamicOptions: s.lib.dynamicOptions.filter((o) => o.id !== id),
      }),
    }));
  },

  reorderDynamicOptions: (kind, ids) => {
    set((s) => {
      const map = new Map(ids.map((id, i) => [id, i]));
      const dynamicOptions = s.lib.dynamicOptions.map((o) =>
        o.kind === kind && map.has(o.id) ? { ...o, order: map.get(o.id)! } : o,
      );
      return { lib: commit({ ...s.lib, dynamicOptions }) };
    });
  },

  upsertScenario: (scenario) => {
    set((s) => {
      const scenarios = s.lib.scenarios.some((x) => x.id === scenario.id)
        ? s.lib.scenarios.map((x) =>
            x.id === scenario.id ? { ...scenario, modifiedAt: nowIso() } : x,
          )
        : [{ ...scenario, modifiedAt: nowIso() }, ...s.lib.scenarios];
      return { lib: commit({ ...s.lib, scenarios }) };
    });
  },

  deleteScenario: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        scenarios: s.lib.scenarios.filter((x) => x.id !== id),
        stories: s.lib.stories.map((st) =>
          st.scenarioId === id ? { ...st, scenarioId: null } : st,
        ),
        series: s.lib.series.map((se) => ({
          ...se,
          scenarioIds: se.scenarioIds.filter((sid) => sid !== id),
        })),
        recents: s.lib.recents.filter((r) => !(r.kind === "scenario" && r.id === id)),
      }),
    }));
  },

  duplicateScenario: (id) => {
    const src = get().lib.scenarios.find((s) => s.id === id);
    if (!src) return null;
    const copy = blankScenario({
      ...src,
      id: uid("sc"),
      title: src.title ? `${src.title} (copy)` : "Untitled scenario (copy)",
      createdAt: nowIso(),
      modifiedAt: nowIso(),
    });
    get().upsertScenario(copy);
    return copy.id;
  },

  toggleScenarioFav: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        scenarios: s.lib.scenarios.map((x) =>
          x.id === id ? { ...x, favourite: !x.favourite } : x,
        ),
      }),
    }));
  },

  upsertSeries: (series) => {
    set((s) => {
      const all = s.lib.series.some((x) => x.id === series.id)
        ? s.lib.series.map((x) => (x.id === series.id ? { ...series, modifiedAt: nowIso() } : x))
        : [{ ...series, modifiedAt: nowIso() }, ...s.lib.series];
      return { lib: commit({ ...s.lib, series: all }) };
    });
  },

  deleteSeries: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        series: s.lib.series.filter((x) => x.id !== id),
        recents: s.lib.recents.filter((r) => !(r.kind === "series" && r.id === id)),
      }),
    }));
  },

  toggleSeriesFav: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        series: s.lib.series.map((x) => (x.id === id ? { ...x, favourite: !x.favourite } : x)),
      }),
    }));
  },

  upsertLink: (link) => {
    set((s) => {
      const links = s.lib.links.some((x) => x.id === link.id)
        ? s.lib.links.map((x) => (x.id === link.id ? link : x))
        : [link, ...s.lib.links];
      return { lib: commit({ ...s.lib, links }) };
    });
  },

  deleteLink: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        links: s.lib.links.filter((x) => x.id !== id),
        recents: s.lib.recents.filter((r) => !(r.kind === "link" && r.id === id)),
      }),
    }));
  },

  toggleLinkFav: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        links: s.lib.links.map((x) => (x.id === id ? { ...x, favourite: !x.favourite } : x)),
      }),
    }));
  },

  upsertCategory: (cat) => {
    set((s) => {
      const categories = s.lib.categories.some((x) => x.id === cat.id)
        ? s.lib.categories.map((x) => (x.id === cat.id ? cat : x))
        : [...s.lib.categories, cat];
      return { lib: commit({ ...s.lib, categories }) };
    });
  },

  deleteCategory: (id) => {
    set((s) => {
      return {
        lib: commit({
          ...s.lib,
          categories: s.lib.categories
            .filter((c) => c.id !== id)
            .map((c) => (c.parentId === id ? { ...c, parentId: null } : c)),
          stories: s.lib.stories.map((st) => ({
            ...st,
            categoryIds: st.categoryIds.filter((cid) => cid !== id),
          })),
        }),
      };
    });
  },

  reorderCategories: (ids) => {
    set((s) => {
      const map = new Map(ids.map((id, i) => [id, i]));
      const categories = s.lib.categories.map((c) =>
        map.has(c.id) ? { ...c, order: map.get(c.id)! } : c,
      );
      return { lib: commit({ ...s.lib, categories }) };
    });
  },

  upsertTag: (tag) => {
    set((s) => {
      const tags = s.lib.tags.some((x) => x.id === tag.id)
        ? s.lib.tags.map((x) => (x.id === tag.id ? tag : x))
        : [...s.lib.tags, tag];
      return { lib: commit({ ...s.lib, tags }) };
    });
  },

  deleteTag: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        tags: s.lib.tags.filter((t) => t.id !== id),
        stories: s.lib.stories.map((st) => ({
          ...st,
          tagIds: st.tagIds.filter((tid) => tid !== id),
        })),
        scenarios: s.lib.scenarios.map((sc) => ({
          ...sc,
          tagIds: sc.tagIds.filter((tid) => tid !== id),
        })),
        links: s.lib.links.map((l) => ({
          ...l,
          tagIds: l.tagIds.filter((tid) => tid !== id),
        })),
      }),
    }));
  },

  addImage: (image) => {
    set((s) => ({ lib: commit({ ...s.lib, images: [...s.lib.images, image] }) }));
  },

  deleteImage: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        images: s.lib.images.filter((i) => i.id !== id),
        stories: s.lib.stories.map((st) =>
          st.coverImageId === id ? { ...st, coverImageId: null } : st,
        ),
        scenarios: s.lib.scenarios.map((sc) =>
          sc.coverImageId === id ? { ...sc, coverImageId: null } : sc,
        ),
        series: s.lib.series.map((se) =>
          se.coverImageId === id ? { ...se, coverImageId: null } : se,
        ),
        links: s.lib.links.map((l) => (l.imageId === id ? { ...l, imageId: null } : l)),
      }),
    }));
  },

  upsertAudiobook: (book) => {
    set((s) => {
      const audiobooks = s.lib.audiobooks.some((x) => x.id === book.id)
        ? s.lib.audiobooks.map((x) => (x.id === book.id ? book : x))
        : [book, ...s.lib.audiobooks];
      return { lib: commit({ ...s.lib, audiobooks }) };
    });
  },

  deleteAudiobook: (id) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        audiobooks: s.lib.audiobooks.filter((a) => a.id !== id),
      }),
    }));
  },

  setAudiobookPosition: (id, position, duration) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        audiobooks: s.lib.audiobooks.map((a) =>
          a.id === id
            ? { ...a, position, duration: duration && duration > 0 ? duration : a.duration }
            : a,
        ),
      }),
    }));
  },

  setSpeechOffset: (storyId, offset) => {
    set((s) => ({
      lib: commit({
        ...s.lib,
        stories: s.lib.stories.map((st) =>
          st.id === storyId ? { ...st, speechOffset: offset } : st,
        ),
      }),
    }));
  },

  newStory: (partial) => blankStory(partial),
  newCharacter: (partial) => blankCharacter(partial),
  newScenario: (partial) => blankScenario(partial),
  newSeries: (partial) => blankSeries(partial),
  newLink: (partial) => blankLink(partial),
}));

export function characterProfile(
  c: Character,
  storyUse?: { narrativeRole?: string; evolutionPotential?: string },
) {
  return formatCharacterProfile(c, storyUse);
}

export function generationBlockers(lib: LibraryData, characterIds: string[]) {
  const issues: string[] = [];
  for (const id of characterIds) {
    const c = lib.characters.find((x) => x.id === id);
    if (!c) continue;
    if (looksUnderEighteen(c.age)) {
      issues.push(`${c.name || "A character"} is marked under 18 and cannot be used.`);
    } else if (ageIsAmbiguous(c.age)) {
      issues.push(`${c.name || "A character"} has no confirmed adult age.`);
    }
  }
  return issues;
}

export function autoLockMs(lock: AutoLock): number | null {
  if (lock === "never" || lock === "immediate") return null;
  if (lock === "1m") return 60_000;
  if (lock === "5m") return 5 * 60_000;
  if (lock === "15m") return 15 * 60_000;
  return null;
}

export function currentView(nav: NavFrame[]): NavFrame {
  return nav[nav.length - 1] ?? HOME;
}

export type {
  AutoLock,
  Story,
  StoryOrigin,
  StorySource,
  Tag,
  ViewName,
};
