export type StorySource = "created" | "imported" | "other";
export type StoryOrigin = "original" | "generated" | "adapted";
export type ThemeMode = "dark" | "light";
export type AutoLock = "immediate" | "1m" | "5m" | "15m" | "never";
export type ReaderTheme = "follow" | "dark" | "light";
export type DynamicKind = "length" | "act" | "theme" | "category";

export type EntityKind =
  | "story"
  | "character"
  | "scenario"
  | "series"
  | "link";

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface DynamicOption {
  id: string;
  kind: DynamicKind;
  name: string;
  description: string;
  order: number;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
  content: string;
  originalContent: string | null;
  source: StorySource;
  origin: StoryOrigin;
  categoryIds: string[];
  tagIds: string[];
  characterIds: string[];
  scenarioId: string | null;
  notes: string;
  favourite: boolean;
  coverImageId: string | null;
  adaptedFromId: string | null;
  readingPosition: number;
  readerFontSize: number | null;
  speechOffset: number;
  pages: string[];
}

export interface Character {
  id: string;
  name: string;
  nickname: string;
  age: string;
  dateOfBirth: string;
  gender: string;
  breastSize: string;
  occupation: string;
  relationshipStatus: string;
  personality: string;
  mentalCharacteristics: string;
  physicalDescription: string;
  clothingStyle: string;
  background: string;
  likes: string;
  dislikes: string;
  habits: string;
  mentionedPeople: string;
  sexualQuirks: string;
  sexualDeviances: string;
  notes: string;
  dossier: Record<string, string>;
  favourite: boolean;
  primaryImageId: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface CharacterImage {
  id: string;
  characterId: string;
  dataUrl: string;
  description: string;
  isPrimary: boolean;
}

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  type: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  location: string;
  situation: string;
  category: string;
  characterIds: string[];
  tagIds: string[];
  notes: string;
  favourite: boolean;
  coverImageId: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface SeriesStory {
  storyId: string;
  order: number;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  coverImageId: string | null;
  characterIds: string[];
  scenarioIds: string[];
  themes: string;
  notes: string;
  favourite: boolean;
  stories: SeriesStory[];
  createdAt: string;
  modifiedAt: string;
}

export interface WebsiteLink {
  id: string;
  title: string;
  url: string;
  websiteName: string;
  description: string;
  category: string;
  tagIds: string[];
  addedAt: string;
  favourite: boolean;
  imageId: string | null;
  notes: string;
}

export interface Audiobook {
  id: string;
  storyId: string;
  title: string;
  dataUrl: string;
  mimeType: string;
  duration: number;
  position: number;
  source: "imported" | "narrated";
  createdAt: string;
}

export interface LibraryImage {
  id: string;
  dataUrl: string;
  description: string;
  ownerKind: EntityKind | "character-gallery" | "misc";
  ownerId: string;
}

export interface RecentItem {
  kind: EntityKind;
  id: string;
  viewedAt: string;
}

export interface Settings {
  passcodeHash: string;
  theme: ThemeMode;
  autoLock: AutoLock;
  readerFontSize: number;
  readerTheme: ReaderTheme;
  generationRules: string;
  ttsRate: number;
  peopleSeeded?: boolean;
  pornMagsSeeded?: boolean;
}

export interface LibraryData {
  version: 1;
  stories: Story[];
  characters: Character[];
  relationships: Relationship[];
  characterImages: CharacterImage[];
  scenarios: Scenario[];
  series: Series[];
  categories: Category[];
  tags: Tag[];
  dynamicOptions: DynamicOption[];
  links: WebsiteLink[];
  images: LibraryImage[];
  audiobooks: Audiobook[];
  recents: RecentItem[];
  settings: Settings;
}

export type ViewName =
  | "home"
  | "stories"
  | "stories-list"
  | "all-stories"
  | "story"
  | "story-edit"
  | "story-reader"
  | "story-import"
  | "story-new"
  | "audiobooks"
  | "characters"
  | "character"
  | "character-edit"
  | "scenarios"
  | "scenario"
  | "scenario-edit"
  | "series"
  | "series-detail"
  | "series-reader"
  | "series-continue"
  | "replacement"
  | "generation"
  | "dynamics"
  | "lucky-dip"
  | "links"
  | "links-list"
  | "porn-mags"
  | "link-edit"
  | "search"
  | "favourites"
  | "recents"
  | "settings"
  | "categories"
  | "tags"
  | "health"
  | "rules"
  | "passcode"
  | "backup"
  | "sync";

export interface NavFrame {
  view: ViewName;
  id?: string;
  title?: string;
  query?: string;
  seriesId?: string;
}

export type HealthStatus = "ok" | "warn" | "fail";

export interface HealthItem {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  repairable: boolean;
}

export interface HealthReport {
  items: HealthItem[];
  ok: boolean;
  repaired?: string[];
}

export const GENDERS = ["Female", "Male"] as const;
export type PersonGender = (typeof GENDERS)[number];

export function normalizeGender(value: string): PersonGender | "" {
  const t = value.trim().toLowerCase();
  if (t === "female" || t === "woman" || t === "f") return "Female";
  if (t === "male" || t === "man" || t === "m") return "Male";
  if (value === "Female" || value === "Male") return value;
  return "";
}

export type TriState = "yes" | "no" | "maybe";

export function cycleTriState(value: TriState): TriState {
  if (value === "maybe") return "yes";
  if (value === "yes") return "no";
  return "maybe";
}

export const AUTHOR_ME = "Steve Burridge";

export const DYNAMIC_KIND_LABELS: Record<DynamicKind, string> = {
  length: "Length of Story",
  act: "Sexual Act",
  theme: "Theme",
  category: "Category",
};

export function formatDynamicOption(opt: { name: string; description?: string }): string {
  const name = opt.name.trim();
  const description = (opt.description ?? "").trim();
  if (!description) return name;
  if (name.toLowerCase() === description.toLowerCase()) return name;
  return `${name}: ${description}`;
}

export const STORY_SOURCES: { id: StorySource; label: string }[] = [
  { id: "created", label: "Created by me" },
  { id: "imported", label: "Downloaded / imported" },
  { id: "other", label: "Other" },
];

export const AUTO_LOCK_OPTIONS: { id: AutoLock; label: string }[] = [
  { id: "immediate", label: "Immediately" },
  { id: "1m", label: "1 minute" },
  { id: "5m", label: "5 minutes" },
  { id: "15m", label: "15 minutes" },
  { id: "never", label: "Never" },
];
