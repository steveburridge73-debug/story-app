import { useEffect, useMemo, useState } from "react";
import { detectCharacterNames } from "@/lib/library/detect";
import { progressLabel, runStoryGeneration } from "@/lib/generation/run";
import { characterProfile, generationBlockers, useApp } from "@/lib/store";
import { countWords } from "@/lib/utils";
import { Screen } from "./chrome";
import { Button, Field, Input, Textarea } from "./ui";
import { WeavePoints } from "./weave-field";
import { StoryRoleFields, EMPTY_STORY_USE, type StoryCastUse } from "./story-cast";

type Assignment = {
  original: string;
  mode: "keep" | "replace" | "new" | "remove";
  characterId: string;
  newName: string;
  narrativeRole: string;
  evolutionPotential: string;
};

export function ReplacementScreen() {
  const lib = useApp((s) => s.lib);
  const upsertStory = useApp((s) => s.upsertStory);
  const upsertCharacter = useApp((s) => s.upsertCharacter);
  const newStory = useApp((s) => s.newStory);
  const newCharacter = useApp((s) => s.newCharacter);
  const push = useApp((s) => s.push);
  const [storyId, setStoryId] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [extraName, setExtraName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adultOk, setAdultOk] = useState(false);
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [progress, setProgress] = useState("");
  const [localDraft, setLocalDraft] = useState(false);
  const navId = useApp((s) => s.nav[s.nav.length - 1]?.id);

  const story = lib.stories.find((s) => s.id === storyId);

  useEffect(() => {
    if (navId && lib.stories.some((s) => s.id === navId)) {
      setStoryId(navId);
      analyse(navId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navId]);

  function analyse(id: string) {
    const s = lib.stories.find((x) => x.id === id);
    if (!s) return;
    const detected = detectCharacterNames(s.content);
    const linked = s.characterIds
      .map((cid) => lib.characters.find((c) => c.id === cid)?.name)
      .filter(Boolean) as string[];
    const unique = [...new Set([...linked, ...detected])];
    setNames(unique);
    setAssignments(
      unique.map((original) => ({
        original,
        mode: "keep" as const,
        characterId: "",
        newName: "",
        ...EMPTY_STORY_USE,
      })),
    );
    setPreview("");
    setError("");
  }

  const selectedIds = assignments
    .filter((a) => a.mode === "replace" && a.characterId)
    .map((a) => a.characterId);
  const blockers = generationBlockers(lib, selectedIds);

  const relationshipText = useMemo(() => {
    const ids = new Set(selectedIds);
    return lib.relationships
      .filter((r) => ids.has(r.fromId) && ids.has(r.toId))
      .map((r) => {
        const a = lib.characters.find((c) => c.id === r.fromId)?.name;
        const b = lib.characters.find((c) => c.id === r.toId)?.name;
        return `${a} is ${r.type} ${b}`;
      })
      .join("\n");
  }, [lib, selectedIds.join("|")]);

  async function generate() {
    if (!story) return;
    setBusy(true);
    setError("");
    setLocalDraft(false);
    setProgress("Starting… this can take a few minutes. The page fills as it goes.");
    const replacements = [];
    for (const a of assignments) {
      if (a.mode === "keep" || a.mode === "remove") continue;
      if (a.mode === "replace") {
        const c = lib.characters.find((x) => x.id === a.characterId);
        if (!c) continue;
        replacements.push({
          from: a.original,
          toName: c.name,
          profile: characterProfile(c, {
            narrativeRole: a.narrativeRole,
            evolutionPotential: a.evolutionPotential,
          }),
        });
      }
      if (a.mode === "new" && a.newName.trim()) {
        replacements.push({
          from: a.original,
          toName: a.newName.trim(),
          profile: "Newly created adult character. Infer a consistent personality from context.",
        });
      }
    }
    const result = await runStoryGeneration(
      {
        mode: "adapt",
        rules: lib.settings.generationRules,
        originalStory: story.content,
        originalTitle: story.title,
        length: `${Math.min(6000, Math.max(1000, countWords(story.content)))} words`,
        replacements,
        relationships: relationshipText,
        instructions: assignments
          .filter((a) => a.mode === "remove")
          .map((a) => `Remove or fade out the character named ${a.original}.`)
          .join(" "),
        mustInclude,
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

  function save(mode: "new" | "replace-original") {
    if (!story || !preview.trim()) return;
    for (const a of assignments) {
      if (a.mode === "new" && a.newName.trim()) {
        const c = newCharacter({ name: a.newName.trim(), age: "adult, 18+" });
        upsertCharacter(c);
      }
    }
    const linked = assignments
      .filter((a) => a.mode === "replace" && a.characterId)
      .map((a) => a.characterId);
    if (mode === "replace-original") {
      upsertStory({
        ...story,
        content: preview,
        origin: "adapted",
        characterIds: [...new Set([...story.characterIds, ...linked])],
        notes: story.notes,
      });
      push({ view: "story", id: story.id, title: story.title });
      return;
    }
    const created = newStory({
      title: `${story.title} (adapted)`,
      author: story.author,
      content: preview,
      origin: "adapted",
      source: "created",
      categoryIds: story.categoryIds,
      tagIds: story.tagIds,
      characterIds: linked,
      scenarioId: story.scenarioId,
      adaptedFromId: story.id,
      notes: `Adapted from “${story.title}”.`,
    });
    upsertStory(created);
    push({ view: "story", id: created.id, title: created.title });
  }

  return (
    <Screen title="Character Replacement">
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Choose a story, check the people it names, then assign replacements from your people
        database. The original is never overwritten unless you ask.
      </p>
      <Field label="Story">
        <select
          className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
          value={storyId}
          onChange={(e) => {
            setStoryId(e.target.value);
            if (e.target.value) analyse(e.target.value);
          }}
        >
          <option value="">Select a story</option>
          {lib.stories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title || "Untitled"}
            </option>
          ))}
        </select>
      </Field>

      {story ? (
        <>
          <p className="mb-2 text-xs font-medium text-subtle">Detected characters — correct if needed</p>
          {assignments.map((a, i) => (
            <div key={a.original} className="mb-3 rounded-lg border border-border bg-surface p-3">
              <p className="mb-2 text-sm font-medium">Story character: {a.original}</p>
              <select
                className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-sm"
                value={a.mode}
                onChange={(e) => {
                  const next = [...assignments];
                  next[i] = { ...a, mode: e.target.value as Assignment["mode"] };
                  setAssignments(next);
                }}
              >
                <option value="keep">Leave unchanged</option>
                <option value="replace">Replace with someone in People</option>
                <option value="new">Create a new character</option>
                <option value="remove">Remove assignment / fade out</option>
              </select>
              {a.mode === "replace" ? (
                <select
                  className="h-11 w-full rounded-md border border-border bg-raised px-3 text-sm"
                  value={a.characterId}
                  onChange={(e) => {
                    const next = [...assignments];
                    next[i] = { ...a, characterId: e.target.value };
                    setAssignments(next);
                  }}
                >
                  <option value="">Select from People</option>
                  {lib.characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {a.mode === "new" ? (
                <Input
                  placeholder="New character name"
                  value={a.newName}
                  onChange={(e) => {
                    const next = [...assignments];
                    next[i] = { ...a, newName: e.target.value };
                    setAssignments(next);
                  }}
                />
              ) : null}
              {a.mode === "replace" || a.mode === "new" ? (
                <StoryRoleFields
                  name={
                    a.mode === "replace"
                      ? lib.characters.find((c) => c.id === a.characterId)?.name || a.original
                      : a.newName.trim() || a.original
                  }
                  value={{
                    narrativeRole: a.narrativeRole,
                    evolutionPotential: a.evolutionPotential,
                  }}
                  onChange={(use) => {
                    const next = [...assignments];
                    next[i] = { ...a, ...use };
                    setAssignments(next);
                  }}
                />
              ) : null}
            </div>
          ))}
          <div className="mb-3 flex gap-2">
            <Input
              placeholder="Add a missed name"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() => {
                const n = extraName.trim();
                if (!n || names.includes(n)) return;
                setNames([...names, n]);
                setAssignments([
                  ...assignments,
                  { original: n, mode: "keep", characterId: "", newName: "", ...EMPTY_STORY_USE },
                ]);
                setExtraName("");
              }}
            >
              Add
            </Button>
          </div>
          <WeavePoints points={mustInclude} onChange={setMustInclude} />
          {blockers.length ? (
            <div className="mb-3 rounded-md border border-border bg-raised p-3 text-sm text-danger">
              {blockers.map((b) => (
                <p key={b}>{b}</p>
              ))}
            </div>
          ) : null}
          <label className="mb-3 flex items-start gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={adultOk}
              onChange={(e) => setAdultOk(e.target.checked)}
            />
            All characters used for this adaptation are consenting adults aged 18 or over. If any
            age in the original is unclear, I have checked before continuing.
          </label>
          <Button
            className="w-full"
            disabled={busy || !adultOk || blockers.length > 0}
            onClick={() => void generate()}
          >
            {busy ? progress || "Adapting… this can take a few minutes" : preview ? "Regenerate" : "Adapt story"}
          </Button>
        </>
      ) : null}

      {busy && progress ? <p className="mt-2 text-sm text-muted">{progress}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {localDraft ? (
        <p className="mt-2 text-sm text-muted">
          The live writer could not finish, so this is a local draft. Try again for the studio
          version, or edit and save this one.
        </p>
      ) : null}

      {preview ? (
        <div className="mt-5">
          <Field label={`Adapted preview — about ${countWords(preview)} words`}>
            <Textarea className="min-h-64" value={preview} onChange={(e) => setPreview(e.target.value)} />
          </Field>
          <Button className="w-full" disabled={busy} onClick={() => save("new")}>
            Save as new story
          </Button>
          <Button variant="secondary" className="mt-2 w-full" disabled={busy} onClick={() => save("replace-original")}>
            Replace original
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setPreview("")}>
            Cancel
          </Button>
        </div>
      ) : null}
    </Screen>
  );
}
