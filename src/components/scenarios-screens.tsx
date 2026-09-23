import { useEffect, useState } from "react";
import { Copy, Pencil, Star, Trash2 } from "lucide-react";
import type { Scenario } from "@/lib/library/types";
import { useApp } from "@/lib/store";
import { prepareImage, uid } from "@/lib/utils";
import { BookmarkBtn, Screen } from "./chrome";
import { CharacterPicker, TagPicker } from "./pickers";
import { Button, EmptyState, Field, Input, ListRow, Textarea } from "./ui";

export function ScenariosList() {
  const scenarios = useApp((s) => s.lib.scenarios);
  const push = useApp((s) => s.push);
  const create = useApp((s) => s.newScenario);
  const upsert = useApp((s) => s.upsertScenario);

  return (
    <Screen title="Scenarios">
      <Button
        className="mb-3 w-full"
        onClick={() => {
          const s = create();
          upsert(s);
          push({ view: "scenario-edit", id: s.id, title: "New scenario" });
        }}
      >
        New scenario
      </Button>
      {scenarios.length === 0 ? (
        <EmptyState
          title="No scenarios yet"
          body="A scenario is a reusable situation, setting or story concept — a hotel, a workplace, a holiday, a photography session. Add your own; nothing here is fixed."
        />
      ) : (
        scenarios.map((s) => (
          <ListRow
            key={s.id}
            title={s.title || "Untitled scenario"}
            subtitle={[s.location, s.category].filter(Boolean).join(" · ")}
            onClick={() => push({ view: "scenario", id: s.id, title: s.title })}
            trailing={s.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
          />
        ))
      )}
    </Screen>
  );
}

export function ScenarioDetail() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const scenario = useApp((s) => s.lib.scenarios.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const track = useApp((s) => s.track);
  const toggle = useApp((s) => s.toggleScenarioFav);
  const duplicate = useApp((s) => s.duplicateScenario);
  const askConfirm = useApp((s) => s.askConfirm);
  const deleteScenario = useApp((s) => s.deleteScenario);
  const back = useApp((s) => s.back);
  const closeConfirm = useApp((s) => s.closeConfirm);

  useEffect(() => {
    if (scenario) track("scenario", scenario.id);
  }, [scenario?.id]);

  if (!scenario) {
    return (
      <Screen title="Scenario">
        <p className="text-sm text-muted">This scenario is no longer in the library.</p>
      </Screen>
    );
  }

  const people = scenario.characterIds
    .map((cid) => lib.characters.find((c) => c.id === cid))
    .filter(Boolean);
  const stories = lib.stories.filter((s) => s.scenarioId === scenario.id);
  const tags = scenario.tagIds
    .map((tid) => lib.tags.find((t) => t.id === tid)?.name)
    .filter(Boolean);
  const cover = scenario.coverImageId
    ? lib.images.find((i) => i.id === scenario.coverImageId)
    : null;

  return (
    <Screen
      title={scenario.title || "Untitled"}
      actions={
        <>
          <BookmarkBtn on={scenario.favourite} onClick={() => toggle(scenario.id)} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Duplicate"
            onClick={() => {
              const nid = duplicate(scenario.id);
              if (nid) push({ view: "scenario", id: nid, title: "Copy" });
            }}
          >
            <Copy className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => push({ view: "scenario-edit", id: scenario.id, title: "Edit scenario" })}
          >
            <Pencil className="size-5" />
          </Button>
        </>
      }
    >
      {cover ? (
        <img src={cover.dataUrl} alt="" className="mb-4 h-36 w-full rounded-lg object-cover" />
      ) : null}
      {scenario.location ? <p className="text-sm text-muted">{scenario.location}</p> : null}
      {scenario.situation ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{scenario.situation}</p>
      ) : null}
      {scenario.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {scenario.description}
        </p>
      ) : null}
      {scenario.category ? (
        <p className="mt-3 text-sm">
          <span className="text-subtle">Category · </span>
          {scenario.category}
        </p>
      ) : null}
      {tags.length ? (
        <p className="mt-1 text-sm">
          <span className="text-subtle">Tags · </span>
          {tags.join(", ")}
        </p>
      ) : null}
      {scenario.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{scenario.notes}</p>
      ) : null}

      <h2 className="mb-2 mt-6 font-display text-lg">Characters</h2>
      {people.length === 0 ? (
        <p className="text-sm text-muted">None linked.</p>
      ) : (
        people.map((p) =>
          p ? (
            <ListRow
              key={p.id}
              title={p.name}
              onClick={() => push({ view: "character", id: p.id, title: p.name })}
            />
          ) : null,
        )
      )}

      <h2 className="mb-2 mt-6 font-display text-lg">Related stories</h2>
      {stories.length === 0 ? (
        <p className="text-sm text-muted">No stories use this scenario yet.</p>
      ) : (
        stories.map((s) => (
          <ListRow
            key={s.id}
            title={s.title || "Untitled"}
            onClick={() => push({ view: "story", id: s.id, title: s.title })}
          />
        ))
      )}

      <Button
        variant="danger"
        className="mt-8 w-full"
        onClick={() =>
          askConfirm({
            title: "Delete this scenario?",
            body: "Stories that used it will keep their text; the scenario link will be removed.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => {
              deleteScenario(scenario.id);
              closeConfirm();
              back();
            },
          })
        }
      >
        <Trash2 className="size-4" /> Delete scenario
      </Button>
    </Screen>
  );
}

export function ScenarioEdit() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const existing = useApp((s) => s.lib.scenarios.find((x) => x.id === id));
  const lib = useApp((s) => s.lib);
  const upsert = useApp((s) => s.upsertScenario);
  const addImage = useApp((s) => s.addImage);
  const upsertTag = useApp((s) => s.upsertTag);
  const back = useApp((s) => s.back);
  const [draft, setDraft] = useState<Scenario | null>(existing ?? null);

  useEffect(() => {
    setDraft(existing ?? null);
  }, [existing?.id]);

  if (!draft) {
    return (
      <Screen title="Edit scenario">
        <p className="text-sm text-muted">Scenario not found.</p>
      </Screen>
    );
  }

  function patch(p: Partial<Scenario>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  return (
    <Screen title={draft.title ? "Edit scenario" : "New scenario"}>
      <Field label="Title">
        <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="Location">
        <Input value={draft.location} onChange={(e) => patch({ location: e.target.value })} />
      </Field>
      <Field label="Situation">
        <Textarea value={draft.situation} onChange={(e) => patch({ situation: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="Category">
        <Input value={draft.category} onChange={(e) => patch({ category: e.target.value })} />
      </Field>
      <CharacterPicker
        people={lib.characters}
        selected={draft.characterIds}
        onChange={(characterIds) => patch({ characterIds })}
      />
      <TagPicker
        tags={lib.tags}
        selected={draft.tagIds}
        onChange={(tagIds) => patch({ tagIds })}
        onCreate={upsertTag}
      />
      <Field label="Notes">
        <Textarea value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} />
      </Field>
      <Field label="Image">
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
              ownerKind: "scenario" as const,
              ownerId: draft.id,
            };
            addImage(image);
            patch({ coverImageId: image.id });
          }}
        />
      </Field>
      <Button
        className="w-full"
        onClick={() => {
          upsert({ ...draft, title: draft.title.trim() || "Untitled scenario" });
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
