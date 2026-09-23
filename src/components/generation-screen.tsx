import { useState } from "react";
import { progressLabel, runStoryGeneration } from "@/lib/generation/run";
import { characterProfile, generationBlockers, useApp } from "@/lib/store";
import { countWords } from "@/lib/utils";
import { Screen } from "./chrome";
import { CharacterPicker } from "./pickers";
import { EMPTY_STORY_USE, StoryRolesForPeople, type StoryCastUse } from "./story-cast";
import { Button, Chip, Field, Input, Textarea } from "./ui";
import { WeavePoints } from "./weave-field";

const LENGTHS = ["Short (~1,000 words)", "Medium (~2,000 words)", "Long (~4,000 words)"];

export function GenerationScreen() {
  const lib = useApp((s) => s.lib);
  const upsertStory = useApp((s) => s.upsertStory);
  const newStory = useApp((s) => s.newStory);
  const push = useApp((s) => s.push);
  const [refs, setRefs] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [castUse, setCastUse] = useState<Record<string, StoryCastUse>>({});
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [themes, setThemes] = useState("");
  const [setting, setSetting] = useState("");
  const [length, setLength] = useState(LENGTHS[1]!);
  const [direction, setDirection] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [adultOk, setAdultOk] = useState(false);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [localDraft, setLocalDraft] = useState(false);

  const blockers = generationBlockers(lib, characterIds);

  function toggleRef(id: string) {
    setRefs((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 5) return cur;
      return [...cur, id];
    });
  }

  async function run() {
    setBusy(true);
    setError("");
    setLocalDraft(false);
    setProgress("Starting… long stories take a few minutes. The page fills as it goes.");
    const people = characterIds
      .map((id) => lib.characters.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => ({
        name: c!.name,
        profile: characterProfile(c!, castUse[c!.id]),
      }));
    const scenario = lib.scenarios.find((s) => s.id === scenarioId);
    const result = await runStoryGeneration(
      {
        mode: "auto",
        rules: lib.settings.generationRules,
        title,
        instructions,
        setting,
        themes,
        length,
        direction,
        mustInclude,
        seriesMode: false,
        referenceStories: refs
          .map((id) => lib.stories.find((s) => s.id === id))
          .filter(Boolean)
          .map((s) => ({ title: s!.title, content: s!.content })),
        characters: people,
        scenario: scenario
          ? [scenario.title, scenario.location, scenario.situation, scenario.description]
              .filter(Boolean)
              .join("\n")
          : undefined,
        relationships: lib.relationships
          .filter((r) => characterIds.includes(r.fromId) && characterIds.includes(r.toId))
          .map((r) => {
            const a = lib.characters.find((c) => c.id === r.fromId)?.name;
            const b = lib.characters.find((c) => c.id === r.toId)?.name;
            return `${a} is ${r.type} ${b}`;
          })
          .join("\n"),
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
    <Screen title="Auto Generation">
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Pick about four or five existing stories as reference for style. The new piece is original —
        it is not a mash-up of the sources. Nothing is saved until you confirm the preview.
      </p>
      <Field label={`Reference stories (${refs.length}/5)`}>
        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {lib.stories.length === 0 ? (
            <p className="text-sm text-muted">Add stories to the library first.</p>
          ) : (
            lib.stories.map((s) => (
              <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={refs.includes(s.id)}
                  onChange={() => toggleRef(s.id)}
                />
                {s.title || "Untitled"}
              </label>
            ))
          )}
        </div>
      </Field>
      <Field label="New title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <CharacterPicker
        people={lib.characters}
        selected={characterIds}
        onChange={(ids) => {
          setCharacterIds(ids);
          setCastUse((cur) => {
            const next = { ...cur };
            for (const id of ids) {
              if (!next[id]) next[id] = { ...EMPTY_STORY_USE };
            }
            return next;
          });
        }}
      />
      <StoryRolesForPeople
        people={lib.characters.filter((c) => characterIds.includes(c.id))}
        values={castUse}
        onChange={(id, next) => setCastUse((cur) => ({ ...cur, [id]: next }))}
      />
      <Field label="Scenario">
        <select
          className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
          value={scenarioId ?? ""}
          onChange={(e) => setScenarioId(e.target.value || null)}
        >
          <option value="">None</option>
          {lib.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Themes">
        <Input value={themes} onChange={(e) => setThemes(e.target.value)} />
      </Field>
      <Field label="Setting">
        <Input value={setting} onChange={(e) => setSetting(e.target.value)} />
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
      <Field label="General direction">
        <Textarea value={direction} onChange={(e) => setDirection(e.target.value)} />
      </Field>
      <Field label="Additional instructions">
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </Field>
      <WeavePoints points={mustInclude} onChange={setMustInclude} />
      {blockers.length ? (
        <div className="mb-3 rounded-md border border-border bg-raised p-3 text-sm text-danger">
          {blockers.map((b) => (
            <p key={b}>{b}</p>
          ))}
        </div>
      ) : null}
      <label className="mb-3 flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" className="mt-1" checked={adultOk} onChange={(e) => setAdultOk(e.target.checked)} />
        Characters in this new story are consenting adults aged 18 or over. Any reference story with
        an unclear age has been checked and is not being used as a minor.
      </label>
      <Button className="w-full" disabled={busy || !adultOk || blockers.length > 0} onClick={() => void run()}>
        {busy ? progress || "Writing… long stories take a few minutes" : preview ? "Regenerate" : "Generate story"}
      </Button>
      {busy && progress ? <p className="mt-2 text-sm text-muted">{progress}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {localDraft ? (
        <p className="mt-2 text-sm text-muted">
          The live writer could not finish, so this is a local draft from your brief. Try Generate
          again for the full studio version, or edit and save this one.
        </p>
      ) : null}
      {preview ? (
        <div className="mt-5">
          <Field label={`Preview — about ${countWords(preview)} words`}>
            <Textarea className="min-h-72" value={preview} onChange={(e) => setPreview(e.target.value)} />
          </Field>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => {
              const story = newStory({
                title: title.trim() || "Generated story",
                content: preview,
                origin: "generated",
                source: "created",
                characterIds,
                scenarioId,
                notes: "Generated using Auto Generation.",
              });
              upsertStory(story);
              push({ view: "story", id: story.id, title: story.title });
            }}
          >
            Save to Stories
          </Button>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setPreview("")}>
            Discard
          </Button>
        </div>
      ) : null}
    </Screen>
  );
}
