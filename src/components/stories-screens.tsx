import { useEffect, useMemo, useState } from "react";
import { BookPlus, FilePenLine, Headphones, Pencil, Plus, Star, Trash2, Upload } from "lucide-react";
import type { Story, StorySource } from "@/lib/library/types";
import { STORY_SOURCES } from "@/lib/library/types";
import { useApp } from "@/lib/store";
import { excerpt, formatDate, prepareImage, uid } from "@/lib/utils";
import { BookmarkBtn, Screen } from "./chrome";
import { CategoryPicker, CharacterPicker, ScenarioSelect, TagPicker } from "./pickers";
import { Button, EmptyState, Field, Input, ListRow, Textarea } from "./ui";
import { pagesFromStory, joinStoryPages } from "@/lib/library/pages";
import { StoryAudioPanel } from "./audiobook-screens";
import { StoryComposer } from "./story-composer";

export { StoryComposer as StoryImport };

function storySubtitle(story: Story, cats: { id: string; name: string }[]) {
  const names = story.categoryIds
    .map((id) => cats.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .slice(0, 2);
  const pageCount = pagesFromStory(story).length;
  const pageBit = pageCount > 1 ? `${pageCount} pages` : "";
  return [story.author, names.join(", "), pageBit].filter(Boolean).join(" · ");
}

export function StoriesHub() {
  const push = useApp((s) => s.push);
  return (
    <Screen title="Stories">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Start a brand new story with AI, amend one you already have, or import pages from a
        screenshot, file, or typed text.
      </p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => push({ view: "story-new", title: "Brand new story" })}
          className="flex items-center gap-3 rounded-lg border border-accent/40 bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <BookPlus className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Brand new story</span>
            <span className="block text-sm text-muted">
              Title, people, acts, themes, extras — then create
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => push({ view: "stories-list", title: "Amend a story" })}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <FilePenLine className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Amend an existing story</span>
            <span className="block text-sm text-muted">Open, edit, add pages, or adapt people</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => push({ view: "story-import", title: "Import a story" })}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <Upload className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Import a story</span>
            <span className="block text-sm text-muted">Screenshot, file, or type page by page</span>
          </span>
        </button>
      </div>
    </Screen>
  );
}

export function StoriesList() {
  const stories = useApp((s) => s.lib.stories);
  const cats = useApp((s) => s.lib.categories);
  const tags = useApp((s) => s.lib.tags);
  const books = useApp((s) => s.lib.audiobooks);
  const frame = useApp((s) => s.nav[s.nav.length - 1]);
  const push = useApp((s) => s.push);
  const [q, setQ] = useState(frame?.query ?? "");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return stories;
    return stories.filter((s) => {
      const catNames = s.categoryIds
        .map((id) => cats.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(" ");
      const tagNames = s.tagIds
        .map((id) => tags.find((x) => x.id === id)?.name)
        .filter(Boolean)
        .join(" ");
      return `${s.title} ${s.author} ${s.content} ${s.notes} ${catNames} ${tagNames}`
        .toLowerCase()
        .includes(t);
    });
  }, [q, stories, cats, tags]);

  return (
    <Screen
      title="Amend a story"
      actions={
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Import a story"
            onClick={() => push({ view: "story-import", title: "Import a story" })}
          >
            <Plus className="size-5" />
          </Button>
        </>
      }
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter stories"
        className="mb-3"
      />
      {filtered.length === 0 ? (
        <EmptyState
          title="No stories yet"
          body="Create a brand new story, or import one page by page from a screenshot, file, or typed text."
        />
      ) : (
        filtered.map((s) => (
          <ListRow
            key={s.id}
            title={s.title || "Untitled story"}
            subtitle={storySubtitle(s, cats) || formatDate(s.modifiedAt)}
            onClick={() => push({ view: "story", id: s.id, title: s.title || "Story" })}
            trailing={
              <span className="flex items-center gap-1">
                {books.some((b) => b.storyId === s.id) ? (
                  <Headphones className="size-4 text-muted" />
                ) : null}
                {s.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
              </span>
            }
          />
        ))
      )}
    </Screen>
  );
}

export function StoryDetail() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const story = useApp((s) => s.lib.stories.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const track = useApp((s) => s.track);
  const toggle = useApp((s) => s.toggleStoryFav);
  const askConfirm = useApp((s) => s.askConfirm);
  const deleteStory = useApp((s) => s.deleteStory);
  const back = useApp((s) => s.back);
  const closeConfirm = useApp((s) => s.closeConfirm);

  useEffect(() => {
    if (story) track("story", story.id);
  }, [story?.id]);

  if (!story) {
    return (
      <Screen title="Story">
        <p className="text-sm text-muted">This story is no longer in the library.</p>
      </Screen>
    );
  }

  const cats = story.categoryIds
    .map((cid) => lib.categories.find((c) => c.id === cid)?.name)
    .filter(Boolean);
  const tags = story.tagIds
    .map((tid) => lib.tags.find((t) => t.id === tid)?.name)
    .filter(Boolean);
  const people = story.characterIds
    .map((cid) => lib.characters.find((c) => c.id === cid))
    .filter(Boolean);
  const scenario = story.scenarioId
    ? lib.scenarios.find((s) => s.id === story.scenarioId)
    : null;
  const origin =
    story.origin === "generated"
      ? "Generated"
      : story.origin === "adapted"
        ? "Adapted"
        : "Original";
  const source = STORY_SOURCES.find((s) => s.id === story.source)?.label ?? story.source;
  const cover = story.coverImageId
    ? lib.images.find((i) => i.id === story.coverImageId)
    : null;
  const versions = lib.stories.filter((s) => s.adaptedFromId === story.id);

  return (
    <Screen
      title={story.title || "Untitled story"}
      actions={
        <>
          <BookmarkBtn on={story.favourite} onClick={() => toggle(story.id)} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => push({ view: "story-edit", id: story.id, title: "Edit story" })}
          >
            <Pencil className="size-5" />
          </Button>
        </>
      }
    >
      {cover ? (
        <img src={cover.dataUrl} alt="" className="mb-4 h-40 w-full rounded-lg object-cover" />
      ) : null}
      <p className="text-sm text-muted">
        {story.author || "No author"} · {formatDate(story.modifiedAt)}
      </p>
      <p className="mt-1 text-xs text-subtle">
        {source} · {origin}
        {story.adaptedFromId ? " · adapted from another story" : ""}
        {pagesFromStory(story).length > 1
          ? ` · ${pagesFromStory(story).length} pages read as one story`
          : ""}
      </p>
      <Button
        className="mt-4 w-full"
        onClick={() => push({ view: "story-reader", id: story.id, title: story.title })}
      >
        Read
      </Button>
      <Button
        variant="secondary"
        className="mt-2 w-full"
        onClick={() => push({ view: "story-import", id: story.id, title: "Add pages" })}
      >
        Add pages
      </Button>
      <Button
        variant="secondary"
        className="mt-2 w-full"
        onClick={() =>
          push({ view: "replacement", id: story.id, title: "Character Replacement" })
        }
      >
        Adapt characters
      </Button>
      <StoryAudioPanel story={story} />
      <div className="mt-4 text-sm leading-relaxed text-muted">{excerpt(story.content, 280)}</div>
      {cats.length ? (
        <p className="mt-4 text-sm">
          <span className="text-subtle">Categories · </span>
          {cats.join(", ")}
        </p>
      ) : null}
      {tags.length ? (
        <p className="mt-1 text-sm">
          <span className="text-subtle">Tags · </span>
          {tags.join(", ")}
        </p>
      ) : null}
      {people.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-subtle">Characters</p>
          {people.map((p) =>
            p ? (
              <ListRow
                key={p.id}
                title={p.name}
                subtitle={p.occupation}
                onClick={() => push({ view: "character", id: p.id, title: p.name })}
              />
            ) : null,
          )}
        </div>
      ) : null}
      {scenario ? (
        <div className="mt-2">
          <p className="text-xs font-medium text-subtle">Scenario</p>
          <ListRow
            title={scenario.title}
            onClick={() => push({ view: "scenario", id: scenario.id, title: scenario.title })}
          />
        </div>
      ) : null}
      {story.notes ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-subtle">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{story.notes}</p>
        </div>
      ) : null}
      {story.originalContent ? (
        <p className="mt-3 text-xs text-subtle">
          Original imported wording is stored separately and was not rewritten.
        </p>
      ) : null}
      {versions.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-subtle">Adaptations</p>
          {versions.map((v) => (
            <ListRow
              key={v.id}
              title={v.title || "Untitled adaptation"}
              onClick={() => push({ view: "story", id: v.id, title: v.title })}
            />
          ))}
        </div>
      ) : null}
      <Button
        variant="danger"
        className="mt-8 w-full"
        onClick={() =>
          askConfirm({
            title: "Delete this story?",
            body: "The story will be removed from the library. Characters, series and scenarios it used will not be deleted.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => {
              deleteStory(story.id);
              closeConfirm();
              back();
            },
          })
        }
      >
        <Trash2 className="size-4" /> Delete story
      </Button>
    </Screen>
  );
}

export function StoryEdit() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const existing = useApp((s) => s.lib.stories.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const upsert = useApp((s) => s.upsertStory);
  const addImage = useApp((s) => s.addImage);
  const upsertTag = useApp((s) => s.upsertTag);
  const back = useApp((s) => s.back);
  const push = useApp((s) => s.push);
  const [draft, setDraft] = useState<Story | null>(existing ?? null);

  useEffect(() => {
    if (!existing) {
      setDraft(null);
      return;
    }
    setDraft({ ...existing, pages: pagesFromStory(existing) });
  }, [existing?.id]);

  if (!draft) {
    return (
      <Screen title="Edit story">
        <p className="text-sm text-muted">Story not found.</p>
      </Screen>
    );
  }

  function patch(p: Partial<Story>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  const pageList = Array.isArray(draft.pages) ? draft.pages : pagesFromStory(draft);

  function setPages(next: string[]) {
    patch({ pages: next, content: joinStoryPages(next) });
  }

  return (
    <Screen title={draft.title ? "Edit story" : "New story"}>
      <Field label="Title">
        <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="Author">
        <Input value={draft.author} onChange={(e) => patch({ author: e.target.value })} />
      </Field>
      <Field label="Source">
        <select
          className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
          value={draft.source}
          onChange={(e) => patch({ source: e.target.value as StorySource })}
        >
          {STORY_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <p className="mb-2 text-sm text-muted">
        Each box is a page. Reading, listening and analysis join them in order as one story.
      </p>
      {pageList.map((page, index) => (
        <Field key={index} label={`Page ${index + 1}`}>
          <Textarea
            className="min-h-36"
            value={page}
            onChange={(e) => {
              const next = [...pageList];
              next[index] = e.target.value;
              setPages(next);
            }}
          />
        </Field>
      ))}
      {pageList.length === 0 ? (
        <Field label="Page 1">
          <Textarea
            className="min-h-36"
            value=""
            onChange={(e) => setPages([e.target.value])}
          />
        </Field>
      ) : null}
      <Button
        variant="secondary"
        className="mb-3 w-full"
        onClick={() => setPages([...pageList, ""])}
      >
        Add a typed page
      </Button>
      <Button
        variant="secondary"
        className="mb-4 w-full"
        onClick={() => {
          upsert({
            ...draft,
            title: draft.title.trim() || "Untitled story",
            pages: pageList,
            content: joinStoryPages(pageList),
          });
          push({ view: "story-import", id: draft.id, title: "Add pages" });
        }}
      >
        Add from screenshot or file
      </Button>
      <CategoryPicker
        categories={lib.categories}
        selected={draft.categoryIds}
        onChange={(categoryIds) => patch({ categoryIds })}
      />
      <TagPicker
        tags={lib.tags}
        selected={draft.tagIds}
        onChange={(tagIds) => patch({ tagIds })}
        onCreate={upsertTag}
      />
      <CharacterPicker
        people={lib.characters}
        selected={draft.characterIds}
        onChange={(characterIds) => patch({ characterIds })}
      />
      <ScenarioSelect
        scenarios={lib.scenarios}
        value={draft.scenarioId}
        onChange={(scenarioId) => patch({ scenarioId })}
      />
      <Field label="Notes">
        <Textarea value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} />
      </Field>
      <Field label="Cover image">
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const dataUrl = await prepareImage(file);
            const image = {
              id: uid("im"),
              dataUrl,
              description: "",
              ownerKind: "story" as const,
              ownerId: draft.id,
            };
            addImage(image);
            patch({ coverImageId: image.id });
          }}
        />
      </Field>
      <Button
        className="mt-2 w-full"
        onClick={() => {
          const pages = pagesFromStory(draft).map((p) => p.trim()).filter(Boolean);
          upsert({
            ...draft,
            title: draft.title.trim() || "Untitled story",
            pages,
            content: joinStoryPages(pages),
          });
          back();
        }}
      >
        Save
      </Button>
      <Button variant="secondary" className="mt-2 w-full" onClick={back}>
        Cancel
      </Button>
    </Screen>
  );
}
