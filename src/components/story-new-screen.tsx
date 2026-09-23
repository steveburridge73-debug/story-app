import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { proposeCharactersFn } from "@/lib/generation/api";
import type { ProposedCastMember } from "@/lib/generation/api";
import { proposeLocalCast } from "@/lib/generation/fallback";
import { progressLabel, runStoryGeneration } from "@/lib/generation/run";
import { clashNotes } from "@/lib/library/clashes";
import { AUTHOR_ME, formatDynamicOption } from "@/lib/library/types";
import type { Character, DynamicKind, DynamicOption, TriState } from "@/lib/library/types";
import { characterProfile, generationBlockers, useApp } from "@/lib/store";
import { countWords, uid } from "@/lib/utils";
import { Screen } from "./chrome";
import { TRI_LEGEND, TriStateList, splitTri } from "./tri-state";
import { Button, Field, Input, Textarea } from "./ui";
import { EMPTY_STORY_USE, StoryRoleFields, type StoryCastUse } from "./story-cast";

type ExtraPerson = ProposedCastMember & {
  id: string;
  role: "main" | "incidental";
};

function optionsOf(list: DynamicOption[], kind: DynamicKind) {
  return list.filter((o) => o.kind === kind).sort((a, b) => a.order - b.order);
}

function extraProfile(p: ExtraPerson) {
  return [
    `Gender: ${p.gender}`,
    p.physique && `Physique: ${p.physique}`,
    p.physicalTraits && `Physical traits: ${p.physicalTraits}`,
    p.mentalTraits && `Mental traits: ${p.mentalTraits}`,
    p.background && `Background: ${p.background}`,
    p.quirks && `Quirks: ${p.quirks}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function CountStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`Fewer ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus className="size-4" />
        </Button>
        <span className="min-w-8 text-center text-base font-medium tabular-nums">{value}</span>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`More ${label}`}
          onClick={() => onChange(Math.min(6, value + 1))}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </Field>
  );
}

export function StoryNewScreen() {
  const lib = useApp((s) => s.lib);
  const upsertStory = useApp((s) => s.upsertStory);
  const newStory = useApp((s) => s.newStory);
  const push = useApp((s) => s.push);

  const acts = useMemo(() => optionsOf(lib.dynamicOptions, "act"), [lib.dynamicOptions]);
  const themes = useMemo(() => optionsOf(lib.dynamicOptions, "theme"), [lib.dynamicOptions]);
  const categories = useMemo(
    () => optionsOf(lib.dynamicOptions, "category"),
    [lib.dynamicOptions],
  );
  const lengths = useMemo(() => optionsOf(lib.dynamicOptions, "length"), [lib.dynamicOptions]);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [chosen, setChosen] = useState<
    Array<{ id: string; incidental: boolean } & StoryCastUse>
  >([]);
  const [addId, setAddId] = useState("");
  const [actTri, setActTri] = useState<Record<string, TriState>>({});
  const [themeTri, setThemeTri] = useState<Record<string, TriState>>({});
  const [catTri, setCatTri] = useState<Record<string, TriState>>({});
  const [lenTri, setLenTri] = useState<Record<string, TriState>>({});
  const [freeform, setFreeform] = useState("");
  const [extraMain, setExtraMain] = useState(0);
  const [extraIncidental, setExtraIncidental] = useState(0);
  const [extras, setExtras] = useState<ExtraPerson[]>([]);
  const [proposing, setProposing] = useState("");
  const [adultOk, setAdultOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [localDraft, setLocalDraft] = useState(false);
  const [progress, setProgress] = useState("");

  const peopleById = useMemo(
    () => new Map(lib.characters.map((c) => [c.id, c])),
    [lib.characters],
  );
  const selectedPeople = chosen
    .map((c) => ({ ...c, person: peopleById.get(c.id) }))
    .filter(
      (
        c,
      ): c is {
        id: string;
        incidental: boolean;
        narrativeRole: string;
        evolutionPotential: string;
        person: Character;
      } => Boolean(c.person),
    );
  const mainPeople = selectedPeople.filter((p) => !p.incidental).map((p) => p.person);
  const incidentalPeople = selectedPeople.filter((p) => p.incidental).map((p) => p.person);
  const available = lib.characters.filter((c) => !chosen.some((x) => x.id === c.id));
  const blockers = generationBlockers(
    lib,
    selectedPeople.map((p) => p.id),
  );

  const actSplit = splitTri(acts, actTri);
  const themeSplit = splitTri(themes, themeTri);
  const catSplit = splitTri(categories, catTri);
  const lenSplit = splitTri(lengths, lenTri);
  const lengthPick = lenSplit.yes[0] ?? null;

  const extraMains = extras.filter((e) => e.role === "main");
  const clash = clashNotes({
    includeActs: actSplit.yes,
    includeThemes: themeSplit.yes,
    mains: [
      ...mainPeople,
      ...extraMains.map((e) => ({ name: e.name, gender: e.gender })),
    ],
  });

  function setAuthorFromMe() {
    setAuthor(AUTHOR_ME);
  }

  function onAuthorBlur() {
    if (author.trim().toLowerCase() === "me") setAuthor(AUTHOR_ME);
  }

  function addPerson(id: string) {
    if (!id || chosen.some((c) => c.id === id)) return;
    setChosen((cur) => [...cur, { id, incidental: false, ...EMPTY_STORY_USE }]);
    setAddId("");
  }

  function avoidNames(extra: ExtraPerson[]) {
    return [
      ...lib.characters.map((c) => c.name),
      ...extra.map((e) => e.name),
    ].filter(Boolean);
  }

  function setExtraCount(role: "main" | "incidental", next: number) {
    const count = Math.max(0, Math.min(6, next));
    if (role === "main") setExtraMain(count);
    else setExtraIncidental(count);
    setExtras((cur) => {
      const mine = cur.filter((e) => e.role === role);
      const rest = cur.filter((e) => e.role !== role);
      if (mine.length === count) return cur;
      if (mine.length > count) return [...rest, ...mine.slice(0, count)];
      const added = proposeLocalCast({
        role,
        count: count - mine.length,
        avoidNames: avoidNames(cur),
      }).map((p) => ({ ...p, id: uid("ex"), role }));
      return [...rest, ...mine, ...added];
    });
  }

  function briefForExtras() {
    return [
      title && `Title: ${title}`,
      lengthPick && `Length: ${formatDynamicOption(lengthPick)}`,
      actSplit.yes.length && `Must include acts: ${actSplit.yes.map((a) => a.name).join(", ")}`,
      themeSplit.yes.length && `Themes: ${themeSplit.yes.map((t) => t.name).join(", ")}`,
      catSplit.yes.length && `Categories: ${catSplit.yes.map((c) => c.name).join(", ")}`,
      freeform && `Notes: ${freeform}`,
      `Already in the story: ${[...selectedPeople.map((p) => p.person.name), ...extras.map((e) => e.name)].filter(Boolean).join(", ") || "none yet"}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function propose(role: "main" | "incidental", count: number, replaceId?: string) {
    if (count <= 0) return;
    setProposing(role);
    setError("");
    const avoid = [
      ...lib.characters.map((c) => c.name),
      ...extras.filter((e) => e.id !== replaceId).map((e) => e.name),
    ].filter(Boolean);
    const result = await proposeCharactersFn({
      data: {
        role,
        count,
        avoidNames: avoid,
        brief: briefForExtras(),
        rules: lib.settings.generationRules,
      },
    });
    setProposing("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const mapped: ExtraPerson[] = result.people.map((p) => ({
      ...p,
      id: uid("ex"),
      role,
    }));
    setExtras((cur) => {
      if (replaceId) {
        const i = cur.findIndex((e) => e.id === replaceId);
        if (i >= 0 && mapped[0]) {
          const next = [...cur];
          next[i] = { ...mapped[0], id: replaceId, role: cur[i]!.role };
          return next;
        }
      }
      return [...cur, ...mapped];
    });
  }

  async function proposeAll() {
    setExtras([]);
    if (extraMain > 0) await propose("main", extraMain);
    if (extraIncidental > 0) await propose("incidental", extraIncidental);
  }

  async function createStory() {
    setBusy(true);
    setError("");
    setLocalDraft(false);
    setProgress("Starting… long stories take a few minutes. The page fills as it goes.");
    const mustInclude = [
      ...actSplit.yes.map((a) => `Sexual act: ${formatDynamicOption(a)}`),
      ...themeSplit.yes.map((t) => `Theme: ${formatDynamicOption(t)}`),
      ...catSplit.yes.map((c) => `Category: ${formatDynamicOption(c)}`),
      ...freeform
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ];
    const mustExclude = [
      ...actSplit.no.map((a) => `Sexual act: ${formatDynamicOption(a)}`),
      ...themeSplit.no.map((t) => `Theme: ${formatDynamicOption(t)}`),
      ...catSplit.no.map((c) => `Category: ${formatDynamicOption(c)}`),
    ];
    const optionalUse = [
      ...actSplit.maybe.map((a) => `Sexual act: ${formatDynamicOption(a)}`),
      ...themeSplit.maybe.map((t) => `Theme: ${formatDynamicOption(t)}`),
      ...catSplit.maybe.map((c) => `Category: ${formatDynamicOption(c)}`),
    ];
    const result = await runStoryGeneration(
      {
        mode: "auto",
        rules: lib.settings.generationRules,
        title: title.trim(),
        length: lengthPick ? formatDynamicOption(lengthPick) : undefined,
        themes: themeSplit.yes.map(formatDynamicOption).join("\n") || undefined,
        categories: catSplit.yes.map(formatDynamicOption).join("\n") || undefined,
        characters: selectedPeople
          .filter((p) => !p.incidental)
          .map((p) => ({
            name: p.person.name,
            profile: characterProfile(p.person, {
              narrativeRole: p.narrativeRole,
              evolutionPotential: p.evolutionPotential,
            }),
          })),
        incidentalCharacters: selectedPeople
          .filter((p) => p.incidental)
          .map((p) => ({
            name: p.person.name,
            profile: characterProfile(p.person, {
              narrativeRole: p.narrativeRole,
              evolutionPotential: p.evolutionPotential,
            }),
          })),
        extraCharacters: extras.map((e) => ({
          name: e.name,
          role: e.role,
          profile: extraProfile(e),
        })),
        relationships: lib.relationships
          .filter((r) => selectedPeople.some((p) => p.id === r.fromId) && selectedPeople.some((p) => p.id === r.toId))
          .map((r) => {
            const a = peopleById.get(r.fromId)?.name;
            const b = peopleById.get(r.toId)?.name;
            return `${a} is ${r.type} ${b}`;
          })
          .join("\n"),
        mustInclude,
        mustExclude,
        optionalUse,
        omitFooter: true,
        seriesMode: false,
        instructions: [
          "Use logic: if the sexual cast cannot physically do a required act, omit that act and list it under OMISSIONS.",
          clash.length ? `Likely clashes to watch: ${clash.join(" ")}` : "",
          "Incidental people (from the list and extras) may be in the story but not in sexual scenes — for example they go for coffee while others pair off.",
        ]
          .filter(Boolean)
          .join(" "),
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
    <Screen title="Brand new story">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Fill the brief, propose any extra people, then create. Tick must be used, cross must not,
        blank may be used if it fits.
      </p>

      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Story title" />
      </Field>
      <Field label="Author">
        <div className="flex gap-2">
          <Input
            className="min-w-0 flex-1"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onBlur={onAuthorBlur}
            placeholder="Author, or tap Me"
          />
          <Button variant="secondary" onClick={setAuthorFromMe}>
            Me
          </Button>
        </div>
        <p className="mt-1 text-xs text-subtle">Me fills {AUTHOR_ME}.</p>
      </Field>

      <Field label="People from your list">
        <p className="mb-2 text-sm text-muted">
          Choose one or more. Tick incidental if they appear in the story but not in the sexual
          scenes. Narrative role and evolution apply to this story only. What happens here is
          forgotten in the next standalone story, unless you add it to a Story Series.
        </p>
        {selectedPeople.map((row) => (
          <div
            key={row.id}
            className="mb-2 flex items-start gap-2 rounded-md border border-border bg-raised px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{row.person.name || "Unnamed"}</p>
              <label className="mt-1 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={row.incidental}
                  onChange={(e) =>
                    setChosen((cur) =>
                      cur.map((c) =>
                        c.id === row.id ? { ...c, incidental: e.target.checked } : c,
                      ),
                    )
                  }
                />
                Incidental character
              </label>
              <StoryRoleFields
                name={row.person.name || "Unnamed"}
                value={{
                  narrativeRole: row.narrativeRole,
                  evolutionPotential: row.evolutionPotential,
                }}
                onChange={(next) =>
                  setChosen((cur) =>
                    cur.map((c) => (c.id === row.id ? { ...c, ...next } : c)),
                  )
                }
              />
            </div>
            <button
              type="button"
              className="text-xs text-danger"
              onClick={() => setChosen((cur) => cur.filter((c) => c.id !== row.id))}
            >
              Remove
            </button>
          </div>
        ))}
        {available.length ? (
          <select
            className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
            value={addId}
            onChange={(e) => addPerson(e.target.value)}
          >
            <option value="">Add a person…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Unnamed"}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-muted">
            {lib.characters.length === 0
              ? "No people in the library yet."
              : "Everyone on the list is already added."}
          </p>
        )}
      </Field>

      <p className="mb-2 text-xs text-subtle">{TRI_LEGEND}</p>

      <Field label="Sexual acts">
        <TriStateList items={acts} values={actTri} onChange={(id, next) => setActTri((s) => ({ ...s, [id]: next }))} />
      </Field>
      <Field label="Themes">
        <TriStateList
          items={themes}
          values={themeTri}
          onChange={(id, next) => setThemeTri((s) => ({ ...s, [id]: next }))}
        />
      </Field>
      <Field label="Length of story">
        <p className="mb-2 text-sm text-muted">Tick only one length.</p>
        <TriStateList
          items={lengths}
          values={lenTri}
          exclusiveYes
          onChange={(id, next) => setLenTri((s) => ({ ...s, [id]: next }))}
        />
      </Field>
      <Field label="Category">
        <TriStateList
          items={categories}
          values={catTri}
          onChange={(id, next) => setCatTri((s) => ({ ...s, [id]: next }))}
        />
      </Field>

      <Field label="Other considerations">
        <p className="mb-2 text-sm text-muted">
          Anything that must be included or must not. One point per line. If it cannot be
          honoured it will be listed under Omissions at the end of the story.
        </p>
        <Textarea
          className="min-h-28"
          value={freeform}
          onChange={(e) => setFreeform(e.target.value)}
          placeholder={"Initial hesitation about nudity\nMain woman refuses to remove her bra throughout"}
        />
      </Field>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <CountStepper
          label="Extra main characters"
          value={extraMain}
          onChange={(n) => setExtraCount("main", n)}
        />
        <CountStepper
          label="Extra incidental"
          value={extraIncidental}
          onChange={(n) => setExtraCount("incidental", n)}
        />
      </div>
      <p className="mb-3 text-sm text-muted">
        Use + to add extra people who are not on your list. They appear at once. You can edit the
        name, or tap Generate extra characters / Try again.
      </p>
      <Button
        variant="secondary"
        className="mb-4 w-full"
        disabled={extras.length === 0 || Boolean(proposing)}
        onClick={() => void proposeAll()}
      >
        {proposing ? "Proposing…" : "Propose extras again"}
      </Button>

      {extras.map((e) => (
        <div key={e.id} className="mb-3 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Input
                value={e.name}
                onChange={(ev) =>
                  setExtras((cur) =>
                    cur.map((x) => (x.id === e.id ? { ...x, name: ev.target.value } : x)),
                  )
                }
              />
              <p className="mt-1 text-xs text-subtle">
                {e.role === "incidental" ? "Incidental" : "Main"} · {e.gender}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={Boolean(proposing)}
              onClick={() => void propose(e.role, 1, e.id)}
            >
              Try again
            </Button>
          </div>
          <dl className="mt-2 space-y-1 text-sm">
            {e.physique ? (
              <div>
                <dt className="text-xs text-subtle">Physique</dt>
                <dd>{e.physique}</dd>
              </div>
            ) : null}
            {e.physicalTraits ? (
              <div>
                <dt className="text-xs text-subtle">Physical traits</dt>
                <dd>{e.physicalTraits}</dd>
              </div>
            ) : null}
            {e.mentalTraits ? (
              <div>
                <dt className="text-xs text-subtle">Mental traits</dt>
                <dd>{e.mentalTraits}</dd>
              </div>
            ) : null}
            {e.background ? (
              <div>
                <dt className="text-xs text-subtle">Background</dt>
                <dd>{e.background}</dd>
              </div>
            ) : null}
            {e.quirks ? (
              <div>
                <dt className="text-xs text-subtle">Quirks</dt>
                <dd>{e.quirks}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ))}

      {extras.map((e) => (
        <div key={e.id} className="mb-3 rounded-lg border border-border bg-surface p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{e.name}</p>
              <p className="text-xs text-subtle">
                {e.role === "incidental" ? "Incidental" : "Main"} · {e.gender}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={Boolean(proposing)}
              onClick={() => void propose(e.role, 1, e.id)}
            >
              Try again
            </Button>
          </div>
          <dl className="mt-2 space-y-1 text-sm">
            {e.physique ? (
              <div>
                <dt className="text-xs text-subtle">Physique</dt>
                <dd>{e.physique}</dd>
              </div>
            ) : null}
            {e.physicalTraits ? (
              <div>
                <dt className="text-xs text-subtle">Physical traits</dt>
                <dd>{e.physicalTraits}</dd>
              </div>
            ) : null}
            {e.mentalTraits ? (
              <div>
                <dt className="text-xs text-subtle">Mental traits</dt>
                <dd>{e.mentalTraits}</dd>
              </div>
            ) : null}
            {e.background ? (
              <div>
                <dt className="text-xs text-subtle">Background</dt>
                <dd>{e.background}</dd>
              </div>
            ) : null}
            {e.quirks ? (
              <div>
                <dt className="text-xs text-subtle">Quirks</dt>
                <dd>{e.quirks}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ))}

      {clash.length ? (
        <div className="mb-3 rounded-md border border-border bg-raised p-3 text-sm text-warn">
          <p className="font-medium">Possible clashes</p>
          {clash.map((c) => (
            <p key={c} className="mt-1 text-muted">
              {c}
            </p>
          ))}
        </div>
      ) : null}

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
        Characters in this new story are consenting adults aged 18 or over.
      </label>
      <Button
        className="w-full"
        disabled={busy || !adultOk || blockers.length > 0 || Boolean(proposing)}
        onClick={() => void createStory()}
      >
        {busy ? progress || "Writing… long stories take a few minutes" : preview ? "Create again" : "Create story"}
      </Button>
      {busy && progress ? <p className="mt-2 text-sm text-muted">{progress}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {localDraft ? (
        <p className="mt-2 text-sm text-muted">
          The live writer could not finish, so this is a local draft from your brief. Try Create
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
                title:
                  title.trim() ||
                  (preview.split("\n")[0] || "").replace(/^#+\s*/, "").slice(0, 80).trim() ||
                  "New story",
                author: author.trim().toLowerCase() === "me" ? AUTHOR_ME : author.trim(),
                content: preview,
                origin: "generated",
                source: "created",
                characterIds: selectedPeople.map((p) => p.id),
                notes: "Created as a brand new story.",
              });
              upsertStory(story);
              push({ view: "story", id: story.id, title: story.title });
            }}
          >
            Save to Stories
          </Button>
        </div>
      ) : null}
    </Screen>
  );
}
