import type { DynamicOption, LibraryData } from "./types";
import { emptyLibrary, mergeDynamicOptions, migrateGenerationRules } from "./defaults";
import { pagesFromStory } from "./pages";
import { ensureBidirectionalRelationships } from "./relationships";
import { ensurePeopleSeed } from "./seed-people";
import { ensurePornMagsSeed } from "./seed-links";
import { uid } from "@/lib/utils";

const DB_NAME = "top-shelf-library";
const DB_VERSION = 1;
const STORE = "kv";
const KEY = "library";
const THEME_KEY = "tsc-theme";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

export async function loadLibrary(): Promise<LibraryData> {
  try {
    const db = await openDb();
    const data = await new Promise<LibraryData | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result as LibraryData | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!data || data.version !== 1) return emptyLibrary();
    return migrateShape(data);
  } catch {
    return emptyLibrary();
  }
}

export async function saveLibrary(data: LibraryData): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(data, KEY);
  await txDone(tx);
  db.close();
  try {
    localStorage.setItem(THEME_KEY, data.settings.theme);
  } catch {
    /* ignore */
  }
}

export function readCachedTheme(): "dark" | "light" {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function migrateShape(data: LibraryData): LibraryData {
  const base = emptyLibrary();
  const rawCharacters = asArray<LibraryData["characters"][number]>(data.characters).map((c) => ({
    ...c,
    dateOfBirth: c.dateOfBirth ?? "",
    breastSize: c.breastSize ?? "",
    mentionedPeople: c.mentionedPeople ?? "",
    sexualQuirks: c.sexualQuirks ?? "",
    sexualDeviances: c.sexualDeviances ?? "",
    dossier: c.dossier ?? {},
  }));
  const rawRels = asArray<LibraryData["relationships"][number]>(data.relationships);
  const alreadySeeded = Boolean(data.settings?.peopleSeeded);
  const seeded = ensurePeopleSeed(rawCharacters, rawRels, alreadySeeded);
  return {
    version: 1,
    stories: asArray<LibraryData["stories"][number]>(data.stories).map((s) => {
      const pages = pagesFromStory(s);
      return {
        ...s,
        speechOffset: s.speechOffset ?? 0,
        pages,
        content: pages.length ? pages.join("\n\n") : (s.content ?? ""),
      };
    }),
    characters: seeded.characters,
    relationships: ensureBidirectionalRelationships(
      seeded.relationships,
      seeded.characters,
      () => uid("rel"),
    ),
    characterImages: asArray(data.characterImages),
    scenarios: asArray(data.scenarios),
    series: asArray(data.series),
    categories: asArray(data.categories).length
      ? asArray(data.categories)
      : base.categories,
    tags: asArray(data.tags),
    dynamicOptions: mergeDynamicOptions(
      asArray<DynamicOption>(data.dynamicOptions).map((o) => ({
        ...o,
        description: typeof o.description === "string" ? o.description : "",
      })),
    ),
    links: ensurePornMagsSeed(asArray(data.links), Boolean(data.settings?.pornMagsSeeded)),
    images: asArray(data.images),
    audiobooks: asArray(data.audiobooks),
    recents: asArray(data.recents),
    settings: {
      ...base.settings,
      ...(data.settings ?? {}),
      generationRules: migrateGenerationRules(data.settings?.generationRules),
      peopleSeeded: true,
      pornMagsSeeded: true,
    },
  };
}

export function libraryToJson(data: LibraryData): string {
  return JSON.stringify(data);
}

export function parseLibraryJson(raw: string): LibraryData {
  const parsed = JSON.parse(raw) as LibraryData;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Backup file is not a valid library");
  }
  return migrateShape(parsed);
}
