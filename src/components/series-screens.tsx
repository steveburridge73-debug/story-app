import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Star, Trash2 } from "lucide-react";
import type { Series } from "@/lib/library/types";
import { characterProfile, generationBlockers, useApp } from "@/lib/store";
import { progressLabel, runStoryGeneration } from "@/lib/generation/run";
import { countWords, formatDate, prepareImage, uid } from "@/lib/utils";
import { BookmarkBtn, Screen } from "./chrome";
import { CharacterPicker } from "./pickers";
import { Button, Chip, EmptyState, Field, Input, ListRow, Textarea } from "./ui";
import { WeavePoints } from "./weave-field";
import { StoryRolesForPeople, type StoryCastUse } from "./story-cast";

export function SeriesList() {
  const series = useApp((s) => s.lib.series);
  const push = useApp((s) => s.push);
  const create = useApp((s) => s.newSeries);
  const upsert = useApp((s) => s.upsertSeries);

  return (
    <Screen title="Story Series">
      <Button
        className="mb-3 w-full"
        onClick={() => {
          const s = create();
          upsert(s);
          push({ view: "series-detail", id: s.id, title: "New series" });
        }}
      >
        New series
      </Button>
      {series.length === 0 ? (
        <EmptyState
          title="No series yet"
          body="A series holds several connected stories, in order, without duplicating them in the library."
        />
      ) : (
        series.map((s) => (
          <ListRow
            key={s.id}
            title={s.title || "Untitled series"}
            subtitle={`${s.stories.length} stor${s.stories.length === 1 ? "y" : "ies"}`}
            onClick={() => push({ view: "series-detail", id: s.id, title: s.title })}
            trailing={s.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
          />
        ))
      )}
    </Screen>
  );
}

export function SeriesDetail() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const series = useApp((s) => s.lib.series.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const track = useApp((s) => s.track);
  const toggle = useApp((s) => s.toggleSeriesFav);
  const upsert = useApp((s) => s.upsertSeries);
  const askConfirm = useApp((s) => s.askConfirm);
  const deleteSeries = useApp((s) => s.deleteSeries);
  const addImage = useApp((s) => s.addImage);
  const back = useApp((s) => s.back);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Series | null>(series ?? null);
  const [addId, setAddId] = useState("");

  useEffect(() => {
    if (series) {
      track("series", series.id);
      setDraft(series);
    }
  }, [series?.id, series?.modifiedAt]);

  if (!series || !draft) {
    return (
      <Screen title="Series">
        <p className="text-sm text-muted">This series is no longer in the library.</p>
      </Screen>
    );
  }

  const ordered = [...series.stories]
    .sort((a, b) => a.order - b.order)
    .map((slot) => ({
      ...slot,
      story: lib.stories.find((s) => s.id === slot.storyId),
    }));
  const unusedStories = lib.stories.filter(
    (s) => !series.stories.some((st) => st.storyId === s.id),
  );

  function move(index: number, dir: -1 | 1) {
    if (!series) return;
    const items = [...ordered];
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const tmp = items[index]!;
    items[index] = items[j]!;
    items[j] = tmp;
    upsert({
      ...series,
      stories: items.map((it, i) => ({ storyId: it.storyId, order: i + 1 })),
    });
  }

  return (
    <Screen
      title={series.title || "Untitled series"}
      actions={
        <>
          <BookmarkBtn on={series.favourite} onClick={() => toggle(series.id)} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="size-5" />
          </Button>
        </>
      }
    >
      {editing ? (
        <>
          <Field label="Series title">
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>
          <Field label="Themes">
            <Input
              value={draft.themes}
              onChange={(e) => setDraft({ ...draft, themes: e.target.value })}
            />
          </Field>
          <CharacterPicker
            people={lib.characters}
            selected={draft.characterIds}
            onChange={(characterIds) => setDraft({ ...draft, characterIds })}
          />
          <Field label="Main scenarios">
            <div className="flex flex-wrap gap-1.5">
              {lib.scenarios.map((sc) => (
                <Chip
                  key={sc.id}
                  active={draft.scenarioIds.includes(sc.id)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      scenarioIds: draft.scenarioIds.includes(sc.id)
                        ? draft.scenarioIds.filter((x) => x !== sc.id)
                        : [...draft.scenarioIds, sc.id],
                    })
                  }
                >
                  {sc.title || "Untitled"}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <Textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
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
                  ownerKind: "series" as const,
                  ownerId: series.id,
                };
                addImage(image);
                setDraft({ ...draft, coverImageId: image.id });
              }}
            />
          </Field>
          <Button
            className="mb-4 w-full"
            onClick={() => {
              upsert({ ...draft, title: draft.title.trim() || "Untitled series" });
              setEditing(false);
            }}
          >
            Save details
          </Button>
        </>
      ) : (
        <>
          {series.description ? (
            <p className="mb-3 text-sm leading-relaxed text-muted">{series.description}</p>
          ) : null}
          {series.themes ? <p className="mb-3 text-sm">Themes · {series.themes}</p> : null}
        </>
      )}

      <div className="mb-3 flex gap-2">
        <Button
          className="flex-1"
          variant="secondary"
          onClick={() => push({ view: "series-reader", id: series.id, title: series.title })}
          disabled={!ordered.length}
        >
          Read series
        </Button>
        <Button
          className="flex-1"
          onClick={() => push({ view: "series-continue", id: series.id, title: "Continue series" })}
          disabled={!ordered.length}
        >
          Continue
        </Button>
      </div>

      <h2 className="mb-2 font-display text-lg">Stories in order</h2>
      {ordered.length === 0 ? (
        <p className="mb-3 text-sm text-muted">No stories in this series yet.</p>
      ) : (
        ordered.map((slot, i) => (
          <div key={slot.storyId} className="flex items-center gap-1 border-b border-border py-2">
            <span className="w-6 text-sm text-subtle">{i + 1}</span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() =>
                slot.story &&
                push({ view: "story", id: slot.story.id, title: slot.story.title })
              }
            >
              <div className="truncate text-[15px] font-medium">
                {slot.story?.title || "Missing story"}
              </div>
              <div className="text-xs text-muted">
                {slot.story ? formatDate(slot.story.modifiedAt) : "Removed from library"}
              </div>
            </button>
            <Button variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => move(i, -1)}>
              <ChevronUp className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Move down" onClick={() => move(i, 1)}>
              <ChevronDown className="size-4" />
            </Button>
            <button
              type="button"
              className="px-1 text-xs text-danger"
              onClick={() =>
                upsert({
                  ...series,
                  stories: series.stories.filter((st) => st.storyId !== slot.storyId),
                })
              }
            >
              Remove
            </button>
          </div>
        ))
      )}

      <Button
        className="mt-4 w-full"
        variant="secondary"
        onClick={() =>
          push({
            view: "story-import",
            title: "Add story to series",
            seriesId: series.id,
          })
        }
      >
        Create a new story in this series
      </Button>

      {unusedStories.length ? (
        <div className="mt-3 flex gap-2">
          <select
            className="h-11 flex-1 rounded-md border border-border bg-raised px-3 text-base"
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
          >
            <option value="">Add existing story</option>
            {unusedStories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || "Untitled"}
              </option>
            ))}
          </select>
          <Button
            disabled={!addId}
            onClick={() => {
              upsert({
                ...series,
                stories: [...series.stories, { storyId: addId, order: series.stories.length + 1 }],
              });
              setAddId("");
            }}
          >
            Add
          </Button>
        </div>
      ) : null}

      <Button
        variant="danger"
        className="mt-8 w-full"
        onClick={() =>
          askConfirm({
            title: "Delete this series?",
            body: "Stories in the series stay in the library. Only the series record is removed.",
            confirmLabel: "Delete series",
            danger: true,
            onConfirm: () => {
              deleteSeries(series.id);
              closeConfirm();
              back();
            },
          })
        }
      >
        <Trash2 className="size-4" /> Delete series
      </Button>
    </Screen>
  );
}

export function SeriesReader() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const series = useApp((s) => s.lib.series.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const replace = useApp((s) => s.replace);

  if (!series) {
    return (
      <Screen title="Series">
        <p className="text-sm text-muted">Series not found.</p>
      </Screen>
    );
  }

  const ordered = [...series.stories]
    .sort((a, b) => a.order - b.order)
    .map((slot, i) => ({
      n: i + 1,
      story: lib.stories.find((s) => s.id === slot.storyId),
    }))
    .filter((x) => x.story);

  return (
    <Screen title={series.title || "Series"}>
      {ordered.map((item, i) => (
        <div key={item.story!.id} className="border-b border-border py-3">
          <button
            type="button"
            className="w-full text-left"
            onClick={() =>
              replace({ view: "story-reader", id: item.story!.id, title: item.story!.title })
            }
          >
            <div className="text-xs text-subtle">
              {item.n}. {item.story!.title}
            </div>
            <div className="mt-1 font-display text-lg">{item.story!.title}</div>
          </button>
          <div className="mt-2 flex gap-2">
            {i > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  push({
                    view: "story-reader",
                    id: ordered[i - 1]!.story!.id,
                    title: ordered[i - 1]!.story!.title,
                  })
                }
              >
                Previous
              </Button>
            ) : null}
            {i < ordered.length - 1 ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  push({
                    view: "story-reader",
                    id: ordered[i + 1]!.story!.id,
                    title: ordered[i + 1]!.story!.title,
                  })
                }
              >
                Next
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </Screen>
  );
}

const KINDS = ["Direct continuation", "Sequel", "Side story", "Prequel", "Standalone in this series"];
const LENGTHS = ["Short (~1,000 words)", "Medium (~2,000 words)", "Long (~4,000 words)"];

export function SeriesContinue() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const series = useApp((s) => s.lib.series.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const upsertStory = useApp((s) => s.upsertStory);
  const upsertSeries = useApp((s) => s.upsertSeries);
  const newStory = useApp((s) => s.newStory);
  const replace = useApp((s) => s.replace);
  const [kind, setKind] = useState(KINDS[0]!);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [adultOk, setAdultOk] = useState(false);
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [castUse, setCastUse] = useState<Record<string, StoryCastUse>>({});
  const [length, setLength] = useState(LENGTHS[1]!);
  const [progress, setProgress] = useState("");
  const [localDraft, setLocalDraft] = useState(false);

  if (!series) {
    return (
      <Screen title="Continue">
        <p className="text-sm text-muted">Series not found.</p>
      </Screen>
    );
  }

  const ordered = [...series.stories]
    .sort((a, b) => a.order - b.order)
    .map((s) => lib.stories.find((st) => st.id === s.storyId))
    .filter(Boolean);
  const last = ordered[ordered.length - 1];
  const blockers = generationBlockers(lib, series.characterIds);

  async function run() {
    if (!last || !series) return;
    setBusy(true);
    setError("");
    setLocalDraft(false);
    setProgress("Starting… long stories take a few minutes. The page fills as it goes.");
    const people = series.characterIds
      .map((cid) => lib.characters.find((c) => c.id === cid))
      .filter(Boolean)
      .map((c) =>
        c
          ? {
              name: c.name,
              profile: characterProfile(c, castUse[c.id]),
            }
          : null,
      )
      .filter(Boolean) as { name: string; profile: string }[];
    const result = await runStoryGeneration(
      {
        mode: "continue",
        rules: lib.settings.generationRules,
        title,
        instructions,
        mustInclude,
        seriesMode: true,
        continuationKind: kind,
        originalStory: last.content,
        originalTitle: last.title,
        length,
        referenceStories: ordered.slice(0, -1).map((s) => ({
          title: s!.title,
          content: s!.content,
        })),
        characters: people,
        themes: series.themes,
      },
      (p) => {
        setPreview(p.text);
        setProgress(progressLabel(p));
        if (p.local) setLocalDraft(true);
      },
    );
    setBusy(false);
    setProgress("");
    if (!result.ok) setError(result.error);
    else {
      setPreview(result.text);
      setLocalDraft(Boolean(result.local));
    }
  }

  return (
    <Screen title="Continue series">
      <p className="mb-3 text-sm text-muted">
        New writing will keep continuity with {ordered.length} earlier stor
        {ordered.length === 1 ? "y" : "ies"} in {series.title || "this series"}.
      </p>
      {blockers.length ? (
        <div className="mb-3 rounded-md border border-border bg-raised p-3 text-sm text-danger">
          {blockers.map((b) => (
            <p key={b}>{b}</p>
          ))}
          <p className="mt-1 text-muted">Confirm adult ages on those characters before generating.</p>
        </div>
      ) : null}
      <label className="mb-3 flex items-start gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1"
          checked={adultOk}
          onChange={(e) => setAdultOk(e.target.checked)}
        />
        Characters in this continuation are consenting adults aged 18 or over.
      </label>
      <Field label="Kind">
        <div className="flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {k}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="New title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="People in this series">
        <p className="mb-2 text-sm text-muted">
          Narrative role and evolution apply to this next story only. Series continuity is kept.
        </p>
        <StoryRolesForPeople
          people={series.characterIds
            .map((cid) => lib.characters.find((c) => c.id === cid))
            .filter((c): c is NonNullable<typeof c> => Boolean(c))}
          values={castUse}
          onChange={(cid, next) => setCastUse((cur) => ({ ...cur, [cid]: next }))}
        />
      </Field>
      <Field label="Approximate length">
        <div className="flex flex-wrap gap-1.5">
          {LENGTHS.map((l) => (
            <Chip key={l} active={length === l} onClick={() => setLength(l)}>
              {l}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="Direction">
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </Field>
      <WeavePoints points={mustInclude} onChange={setMustInclude} />
      <Button className="w-full" disabled={busy || !!blockers.length || !last || !adultOk} onClick={() => void run()}>
        {busy ? progress || "Writing… this can take a few minutes" : preview ? "Regenerate" : "Write continuation"}
      </Button>
      {busy && progress ? <p className="mt-2 text-sm text-muted">{progress}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {localDraft ? (
        <p className="mt-2 text-sm text-muted">
          The live writer could not finish, so this is a local draft. Try again for the studio
          version, or edit and save this one.
        </p>
      ) : null}
      {preview ? (
        <>
          <Field label={`Preview — about ${countWords(preview)} words`} className="mt-4">
            <Textarea className="min-h-64" value={preview} onChange={(e) => setPreview(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => {
              const story = newStory({
                title: title.trim() || `${series.title} — ${kind}`,
                content: preview,
                origin: "generated",
                source: "created",
                characterIds: series.characterIds,
                scenarioId: series.scenarioIds[0] ?? last?.scenarioId ?? null,
                notes: `Generated as a ${kind.toLowerCase()} in series “${series.title}”.`,
              });
              upsertStory(story);
              upsertSeries({
                ...series,
                stories: [
                  ...series.stories,
                  { storyId: story.id, order: series.stories.length + 1 },
                ],
              });
              replace({ view: "story", id: story.id, title: story.title });
            }}
          >
            Save as new story
          </Button>
        </>
      ) : null}
    </Screen>
  );
}
