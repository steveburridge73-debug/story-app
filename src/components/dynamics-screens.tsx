import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Dices, Trash2 } from "lucide-react";
import { progressLabel, runStoryGeneration } from "@/lib/generation/run";
import { ageIsAmbiguous, looksUnderEighteen } from "@/lib/library/detect";
import { DYNAMIC_KIND_LABELS, formatDynamicOption } from "@/lib/library/types";
import type { Character, DynamicKind, DynamicOption } from "@/lib/library/types";
import { characterProfile, generationBlockers, useApp } from "@/lib/store";
import { countWords, uid } from "@/lib/utils";
import { Screen } from "./chrome";
import { Button, Chip, Field, Input, Textarea } from "./ui";
import { WeavePoints } from "./weave-field";
import { StoryRolesForPeople, type StoryCastUse } from "./story-cast";

const KINDS: DynamicKind[] = ["length", "act", "theme", "category"];

const KIND_HINT: Record<DynamicKind, string> = {
  length: "Lucky Dip picks one length.",
  act: "Lucky Dip can pick more than one act.",
  theme: "Lucky Dip picks one theme.",
  category: "Lucky Dip can pick more than one category.",
};

type Draft = { name: string; description: string };

function emptyDrafts(): Record<DynamicKind, Draft> {
  return {
    length: { name: "", description: "" },
    act: { name: "", description: "" },
    theme: { name: "", description: "" },
    category: { name: "", description: "" },
  };
}

function optionsOf(list: DynamicOption[], kind: DynamicKind) {
  return list.filter((o) => o.kind === kind).sort((a, b) => a.order - b.order);
}

function splitNameDesc(raw: string, fallbackDesc = ""): Draft {
  const text = raw.trim();
  const cut = text.indexOf(":");
  if (cut > 0 && !fallbackDesc.trim()) {
    return {
      name: text.slice(0, cut).trim(),
      description: text.slice(cut + 1).trim(),
    };
  }
  return { name: text, description: fallbackDesc.trim() };
}

export function DynamicsScreen() {
  const options = useApp((s) => s.lib.dynamicOptions);
  const upsert = useApp((s) => s.upsertDynamicOption);
  const remove = useApp((s) => s.deleteDynamicOption);
  const reorder = useApp((s) => s.reorderDynamicOptions);
  const askConfirm = useApp((s) => s.askConfirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const push = useApp((s) => s.push);
  const [drafts, setDrafts] = useState<Record<DynamicKind, Draft>>(emptyDrafts);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameDesc, setRenameDesc] = useState("");

  function add(kind: DynamicKind) {
    const parsed = splitNameDesc(drafts[kind].name, drafts[kind].description);
    if (!parsed.name) return;
    const siblings = optionsOf(options, kind);
    if (siblings.some((o) => o.name.toLowerCase() === parsed.name.toLowerCase())) {
      setDrafts((d) => ({ ...d, [kind]: { name: "", description: "" } }));
      return;
    }
    upsert({
      id: uid("dyn"),
      kind,
      name: parsed.name,
      description: parsed.description,
      order: siblings.length,
    });
    setDrafts((d) => ({ ...d, [kind]: { name: "", description: "" } }));
  }

  function saveRename() {
    if (!renaming) return;
    const opt = options.find((o) => o.id === renaming);
    if (!opt) return;
    const parsed = splitNameDesc(renameName, renameDesc);
    if (parsed.name) upsert({ ...opt, name: parsed.name, description: parsed.description });
    setRenaming(null);
  }

  function move(kind: DynamicKind, id: string, dir: -1 | 1) {
    const list = optionsOf(options, kind);
    const i = list.findIndex((o) => o.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const ids = list.map((o) => o.id);
    const tmp = ids[i]!;
    ids[i] = ids[j]!;
    ids[j] = tmp;
    reorder(kind, ids);
  }

  return (
    <Screen title="Story Dynamics">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Length, sexual act, theme and category feed Lucky Dip. Tap a name to edit the title
        and the detail. Deleting an item never deletes stories.
      </p>
      {KINDS.map((kind) => {
        const list = optionsOf(options, kind);
        return (
          <section key={kind} className="mb-6 rounded-lg border border-border bg-surface p-3">
            <h2 className="font-display text-lg leading-tight">{DYNAMIC_KIND_LABELS[kind]}</h2>
            <p className="mb-3 mt-0.5 text-xs text-subtle">{KIND_HINT[kind]}</p>
            {list.length === 0 ? (
              <p className="mb-3 text-sm text-muted">Nothing in this list yet.</p>
            ) : (
              list.map((opt) => (
                <div key={opt.id} className="border-b border-border py-2 last:border-b-0">
                  {renaming === opt.id ? (
                    <div className="mb-2 space-y-2">
                      <Input
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        placeholder="Name"
                        autoFocus
                      />
                      <Textarea
                        className="min-h-20"
                        value={renameDesc}
                        onChange={(e) => setRenameDesc(e.target.value)}
                        placeholder="Detail"
                      />
                      <Button size="sm" onClick={saveRename}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        setRenaming(opt.id);
                        setRenameName(opt.name);
                        setRenameDesc(opt.description ?? "");
                      }}
                    >
                      <span className="block text-[15px] font-medium leading-snug">{opt.name}</span>
                      {opt.description ? (
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                          {opt.description}
                        </span>
                      ) : null}
                    </button>
                  )}
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move up"
                      onClick={() => move(kind, opt.id, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move down"
                      onClick={() => move(kind, opt.id, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${opt.name}`}
                      onClick={() =>
                        askConfirm({
                          title: `Delete “${opt.name}”?`,
                          body: "Stories are kept. Only this Story Dynamics item is removed.",
                          confirmLabel: "Delete",
                          danger: true,
                          onConfirm: () => {
                            remove(opt.id);
                            closeConfirm();
                          },
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <div className="mt-3 space-y-2">
              <Input
                value={drafts[kind].name}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [kind]: { ...d[kind], name: e.target.value } }))
                }
                placeholder={`Add ${DYNAMIC_KIND_LABELS[kind].toLowerCase()}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add(kind);
                }}
              />
              <Input
                value={drafts[kind].description}
                onChange={(e) =>
                  setDrafts((d) => ({
                    ...d,
                    [kind]: { ...d[kind], description: e.target.value },
                  }))
                }
                placeholder="Detail (optional)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") add(kind);
                }}
              />
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => add(kind)}
                disabled={!drafts[kind].name.trim()}
              >
                Add
              </Button>
            </div>
          </section>
        );
      })}
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => push({ view: "lucky-dip", title: "Lucky Dip" })}
      >
        <Dices className="size-4" /> Open Lucky Dip
      </Button>
    </Screen>
  );
}

interface Draw {
  length: DynamicOption | null;
  acts: DynamicOption[];
  theme: DynamicOption | null;
  categories: DynamicOption[];
  people: Character[];
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

function pickCount(n: number, min: number, max: number) {
  if (n <= 0) return 0;
  const hi = Math.min(max, n);
  const lo = Math.min(min, hi);
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function drawLucky(options: DynamicOption[], characters: Character[]): Draw {
  const lengths = optionsOf(options, "length");
  const acts = optionsOf(options, "act");
  const themes = optionsOf(options, "theme");
  const categories = optionsOf(options, "category");
  const eligible = characters.filter(
    (c) => !looksUnderEighteen(c.age) && !ageIsAmbiguous(c.age),
  );
  return {
    length: lengths.length ? shuffle(lengths)[0]! : null,
    acts: shuffle(acts).slice(0, pickCount(acts.length, 1, Math.min(3, acts.length))),
    theme: themes.length ? shuffle(themes)[0]! : null,
    categories: shuffle(categories).slice(
      0,
      pickCount(categories.length, 1, Math.min(2, categories.length)),
    ),
    people: shuffle(eligible).slice(
      0,
      pickCount(eligible.length, 1, Math.min(3, eligible.length)),
    ),
  };
}

export function LuckyDipScreen() {
  const lib = useApp((s) => s.lib);
  const upsertStory = useApp((s) => s.upsertStory);
  const newStory = useApp((s) => s.newStory);
  const push = useApp((s) => s.push);
  const [draw, setDraw] = useState<Draw | null>(null);
  const [adultOk, setAdultOk] = useState(false);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [localDraft, setLocalDraft] = useState(false);
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [castUse, setCastUse] = useState<Record<string, StoryCastUse>>({});

  const lengths = useMemo(() => optionsOf(lib.dynamicOptions, "length"), [lib.dynamicOptions]);
  const themes = useMemo(() => optionsOf(lib.dynamicOptions, "theme"), [lib.dynamicOptions]);

  useEffect(() => {
    setDraw(drawLucky(lib.dynamicOptions, lib.characters));
  }, []);

  const blockers = generationBlockers(
    lib,
    (draw?.people ?? []).map((p) => p.id),
  );
  const missingPools =
    lengths.length === 0 || themes.length === 0
      ? "Add at least one Length of Story and one Theme in Story Dynamics first."
      : "";

  function redraw() {
    setPreview("");
    setError("");
    setCastUse({});
    setDraw(drawLucky(lib.dynamicOptions, lib.characters));
  }

  async function run() {
    if (!draw?.length || !draw.theme) return;
    setBusy(true);
    setError("");
    setLocalDraft(false);
    setProgress("Starting… long stories take a few minutes. The page fills as it goes.");
    const characterIds = draw.people.map((p) => p.id);
    const people = draw.people.map((c) => ({
      name: c.name,
      profile: characterProfile(c, castUse[c.id]),
    }));
    const refs = shuffle(lib.stories).slice(0, 4);
    const result = await runStoryGeneration(
      {
        mode: "auto",
        rules: lib.settings.generationRules,
        title: "",
        length: formatDynamicOption(draw.length),
        themes: formatDynamicOption(draw.theme),
        categories: draw.categories.map(formatDynamicOption).join("\n"),
        direction: [
          `Theme: ${formatDynamicOption(draw.theme)}.`,
          draw.categories.length
            ? `Work in these categories/tropes: ${draw.categories.map(formatDynamicOption).join("; ")}.`
            : "",
          draw.acts.length
            ? `Write these sexual acts on the page, explicitly, not summarised: ${draw.acts.map(formatDynamicOption).join("; ")}.`
            : "",
          "All people are consenting adults. Follow stored relationships both ways.",
        ]
          .filter(Boolean)
          .join(" "),
        instructions: "Lucky Dip original story. Do not copy any reference passages.",
        mustInclude: [
          ...draw.acts.map((a) => `Sexual act: ${formatDynamicOption(a)}`),
          `Theme: ${formatDynamicOption(draw.theme)}`,
          ...draw.categories.map((c) => `Category: ${formatDynamicOption(c)}`),
          ...mustInclude,
        ],
        seriesMode: false,
        referenceStories: refs.map((s) => ({ title: s.title, content: s.content })),
        characters: people,
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

  const pick = draw;

  return (
    <Screen title="Lucky Dip">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        One length, one theme, one or more sexual acts, one or more categories, and one or
        more people — drawn at random from Story Dynamics and the people list. Nothing is
        saved until you confirm the preview.
      </p>

      {missingPools ? (
        <div className="mb-4 rounded-md border border-border bg-raised p-3 text-sm text-danger">
          {missingPools}
          <Button
            className="mt-3 w-full"
            variant="secondary"
            onClick={() => push({ view: "dynamics", title: "Story Dynamics" })}
          >
            Open Story Dynamics
          </Button>
        </div>
      ) : null}

      {pick ? (
        <div className="mb-4 space-y-3 rounded-lg border border-accent/35 bg-surface p-3">
          <Field label="Length of Story (1)">
            <p className="text-[15px] font-medium">{pick.length?.name ?? "—"}</p>
            {pick.length?.description ? (
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{pick.length.description}</p>
            ) : null}
          </Field>
          <Field label="Sexual Act (more than one allowed)">
            {pick.acts.length ? (
              <div className="flex flex-wrap gap-1.5">
                {pick.acts.map((a) => (
                  <Chip key={a.id} active>
                    {a.name}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">None in the list yet.</p>
            )}
            {pick.acts.some((a) => a.description) ? (
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted">
                {pick.acts.map((a) =>
                  a.description ? (
                    <li key={`${a.id}-d`}>
                      <span className="font-medium text-fg">{a.name}.</span> {a.description}
                    </li>
                  ) : null,
                )}
              </ul>
            ) : null}
          </Field>
          <Field label="Theme (1)">
            <p className="text-[15px] font-medium">{pick.theme?.name ?? "—"}</p>
            {pick.theme?.description ? (
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{pick.theme.description}</p>
            ) : null}
          </Field>
          <Field label="Category (more than one allowed)">
            {pick.categories.length ? (
              <div className="flex flex-wrap gap-1.5">
                {pick.categories.map((c) => (
                  <Chip key={c.id} active>
                    {c.name}
                  </Chip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">None in the list yet.</p>
            )}
            {pick.categories.some((c) => c.description) ? (
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-muted">
                {pick.categories.map((c) =>
                  c.description ? (
                    <li key={`${c.id}-d`}>
                      <span className="font-medium text-fg">{c.name}.</span> {c.description}
                    </li>
                  ) : null,
                )}
              </ul>
            ) : null}
          </Field>
          <Field label="People (more than one allowed)">
            {pick.people.length ? (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {pick.people.map((p) => (
                    <Chip key={p.id} active>
                      {p.name || "Unnamed"}
                    </Chip>
                  ))}
                </div>
                <StoryRolesForPeople
                  people={pick.people}
                  values={castUse}
                  onChange={(id, next) => setCastUse((cur) => ({ ...cur, [id]: next }))}
                />
              </>
            ) : (
              <p className="text-sm text-muted">
                No confirmed adult people to draw. The story can still be written without named
                people, or add 18+ records first.
              </p>
            )}
          </Field>
        </div>
      ) : null}

      <Button variant="secondary" className="mb-4 w-full" onClick={redraw}>
        <Dices className="size-4" /> Draw again
      </Button>

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
        Characters in this new story are consenting adults aged 18 or over.
      </label>
      <Button
        className="w-full"
        disabled={busy || !adultOk || blockers.length > 0 || !pick?.length || !pick.theme}
        onClick={() => void run()}
      >
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
                title:
                  (preview.split("\n")[0] || "").replace(/^#+\s*/, "").slice(0, 80).trim() ||
                  `Lucky Dip — ${pick?.theme?.name || "story"}`,
                content: preview,
                origin: "generated",
                source: "created",
                characterIds: pick?.people.map((p) => p.id) ?? [],
                notes: [
                  "Generated using Lucky Dip.",
                  pick?.length ? `Length: ${pick.length.name}.` : "",
                  pick?.theme ? `Theme: ${pick.theme.name}.` : "",
                  pick?.categories.length
                    ? `Categories: ${pick.categories.map((c) => c.name).join(", ")}.`
                    : "",
                  pick?.acts.length ? `Acts: ${pick.acts.map((a) => a.name).join(", ")}.` : "",
                ]
                  .filter(Boolean)
                  .join(" "),
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
