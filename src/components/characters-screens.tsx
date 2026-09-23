import { useEffect, useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import type { Character, CharacterImage, Relationship } from "@/lib/library/types";
import { GENDERS, normalizeGender } from "@/lib/library/types";
import {
  applyPhotoAnalysis,
  dossierGet,
  dossierSet,
  sectionsFor,
  type PhotoAnalysis,
} from "@/lib/library/dossier";
import {
  RELATIONSHIP_GROUPS,
  formatRelationshipLabel,
} from "@/lib/library/relationships";
import { looksUnderEighteen } from "@/lib/library/detect";
import { analysePersonPhotosFn } from "@/lib/generation/api";
import { useApp } from "@/lib/store";
import { prepareImage, uid } from "@/lib/utils";
import { BookmarkBtn, Screen } from "./chrome";
import { Button, EmptyState, Field, Input, ListRow, Textarea } from "./ui";

function PersonPhotos({
  person,
  onAnalysed,
}: {
  person: Character;
  onAnalysed?: (next: Character, analysis: PhotoAnalysis) => void;
}) {
  const allImages = useApp((s) => s.lib.characterImages);
  const addImage = useApp((s) => s.addCharacterImage);
  const delImage = useApp((s) => s.deleteCharacterImage);
  const setPrimary = useApp((s) => s.setPrimaryCharacterImage);
  const patchImage = useApp((s) => s.patchCharacterImage);
  const upsertCharacter = useApp((s) => s.upsertCharacter);
  const gallery = allImages.filter((i) => i.characterId === person.id);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function analyse(urls: string[], mode: "fillEmpty" | "overwrite") {
    const unique = [...new Set(urls.filter(Boolean))].slice(0, 3);
    if (!unique.length) return;
    if (looksUnderEighteen(person.age)) {
      setError("Age must be 18 or over before photos can be analysed.");
      return;
    }
    setBusy("Writing physical description from photos…");
    setError("");
    const result = await analysePersonPhotosFn({ data: { images: unique } });
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const live = person;
    const analysis: PhotoAnalysis = {
      gender: result.gender,
      breastSize: result.breastSize,
      physicalDescription: result.physicalDescription,
      fields: result.fields,
    };
    const patched = applyPhotoAnalysis(live, analysis, mode);
    upsertCharacter(patched);
    onAnalysed?.(patched, analysis);
  }

  async function addFiles(files: File[]) {
    let first = gallery.length === 0;
    const added: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/") && file.type !== "") continue;
      const dataUrl = await prepareImage(file);
      addImage({
        id: uid("ci"),
        characterId: person.id,
        dataUrl,
        description: file.name.replace(/\.[^.]+$/, ""),
        isPrimary: first,
      });
      added.push(dataUrl);
      first = false;
    }
    if (added.length) {
      const existing = gallery.map((i) => i.dataUrl);
      await analyse([...added, ...existing], "fillEmpty");
    }
  }

  return (
    <div className="mb-4">
      <h2 className="mb-1 font-display text-lg">Photos</h2>
      <p className="mb-2 text-sm text-muted">
        Photos are analysed into the physical fields below. You can overtype anything the
        photos fill in.
      </p>
      {gallery.length ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {gallery.map((img: CharacterImage) => (
            <div key={img.id} className="relative shrink-0">
              <img
                src={img.dataUrl}
                alt={img.description || ""}
                className="h-36 w-28 rounded-md object-cover"
              />
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  className="min-h-8 text-[11px] text-muted"
                  onClick={() => setPrimary(person.id, img.id)}
                >
                  {img.isPrimary || person.primaryImageId === img.id ? "Primary" : "Make primary"}
                </button>
                <button
                  type="button"
                  className="min-h-8 text-[11px] text-danger"
                  onClick={() => delImage(img.id)}
                >
                  Delete
                </button>
              </div>
              <input
                className="mt-1 w-28 rounded-xs border border-border bg-raised px-1 py-0.5 text-[11px] text-fg"
                defaultValue={img.description}
                placeholder="Description"
                onBlur={(e) => patchImage(img.id, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">No photos yet.</p>
      )}
      <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-raised text-sm font-medium">
        Add photos
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = [...(e.target.files ?? [])];
            e.currentTarget.value = "";
            await addFiles(files);
          }}
        />
      </label>
      {gallery.length ? (
        <Button
          variant="secondary"
          className="mt-2 w-full"
          disabled={Boolean(busy)}
          onClick={() => void analyse(gallery.map((i) => i.dataUrl), "overwrite")}
        >
          Refresh description from photos
        </Button>
      ) : null}
      {busy ? <p className="mt-2 text-sm text-muted">{busy}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function startNewPerson(gender: "Female" | "Male") {
  const newCharacter = useApp.getState().newCharacter;
  const upsert = useApp.getState().upsertCharacter;
  const push = useApp.getState().push;
  const c = newCharacter({ gender });
  upsert(c);
  push({
    view: "character-edit",
    id: c.id,
    title: gender === "Female" ? "New female character" : "New male character",
  });
}

export function CharactersList() {
  const people = useApp((s) => s.lib.characters);
  const push = useApp((s) => s.push);
  const images = useApp((s) => s.lib.characterImages);

  return (
    <Screen title="Characters / People">
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Add a new female or male character. Each uses a matching template. Photos fill physical
        fields; you can overtype them.
      </p>
      <Button className="mb-2 w-full" onClick={() => startNewPerson("Female")}>
        New female character
      </Button>
      <Button className="mb-4 w-full" variant="secondary" onClick={() => startNewPerson("Male")}>
        New male character
      </Button>
      {people.length === 0 ? (
        <EmptyState
          title="No people yet"
          body="Characters are reusable across stories. Add someone once, then link them wherever they appear."
        />
      ) : (
        people.map((c) => {
          const imgs = images.filter((i) => i.characterId === c.id);
          const img = imgs.find((i) => i.id === c.primaryImageId) ?? imgs[0];
          return (
            <ListRow
              key={c.id}
              title={c.name || "Unnamed"}
              subtitle={
                [
                  c.nickname,
                  normalizeGender(c.gender),
                  c.occupation,
                  imgs.length ? `${imgs.length} photo${imgs.length === 1 ? "" : "s"}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")
              }
              onClick={() => push({ view: "character", id: c.id, title: c.name })}
              leading={
                img ? (
                  <img src={img.dataUrl} alt="" className="size-11 rounded-md object-cover" />
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-md bg-raised font-display text-sm text-muted">
                    {(c.name || "?").slice(0, 1)}
                  </span>
                )
              }
              trailing={c.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
            />
          );
        })
      )}
    </Screen>
  );
}

export function CharacterDetail() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const person = useApp((s) => s.lib.characters.find((c) => c.id === id));
  const lib = useApp((s) => s.lib);
  const push = useApp((s) => s.push);
  const track = useApp((s) => s.track);
  const toggle = useApp((s) => s.toggleCharacterFav);
  const askConfirm = useApp((s) => s.askConfirm);
  const deleteCharacter = useApp((s) => s.deleteCharacter);
  const deleteRel = useApp((s) => s.deleteRelationship);
  const upsertRel = useApp((s) => s.upsertRelationship);
  const back = useApp((s) => s.back);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [relType, setRelType] = useState("friend of");
  const [relTo, setRelTo] = useState("");

  useEffect(() => {
    if (person) track("character", person.id);
  }, [person?.id]);

  if (!person) {
    return (
      <Screen title="Character">
        <p className="text-sm text-muted">This character is no longer in the library.</p>
      </Screen>
    );
  }

  const rels = lib.relationships.filter((r) => r.fromId === person.id);
  const stories = lib.stories.filter((s) => s.characterIds.includes(person.id));
  const others = lib.characters.filter((c) => c.id !== person.id);
  const gender = normalizeGender(person.gender);

  return (
    <Screen
      title={person.name || "Unnamed"}
      actions={
        <>
          <BookmarkBtn on={person.favourite} onClick={() => toggle(person.id)} />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => push({ view: "character-edit", id: person.id, title: "Edit character" })}
          >
            <Pencil className="size-5" />
          </Button>
        </>
      }
    >
      <PersonPhotos person={person} />

      <div className="mb-3">
        <p className="text-xs font-medium text-subtle">Nickname</p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
          {person.nickname || "—"}
        </p>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-subtle">Age</p>
          <p className="mt-0.5 text-sm">{person.age || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-subtle">Date of birth</p>
          <p className="mt-0.5 text-sm">{person.dateOfBirth || "—"}</p>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs font-medium text-subtle">Gender</p>
        <p className="mt-0.5 text-sm">{gender || person.gender || "—"}</p>
      </div>

      {sectionsFor(person.gender).map((section) => {
        const filled = section.fields
          .map((f) => [f.label, dossierGet(person, f.key)] as const)
          .filter(([, v]) => v);
        if (!filled.length) return null;
        return (
          <details key={section.id} className="mb-3 rounded-lg border border-border bg-surface">
            <summary className="cursor-pointer px-3 py-3 font-display text-lg">
              {section.title}
            </summary>
            <div className="border-t border-border px-3 py-3">
              {filled.map(([label, value]) => (
                <div key={label} className="mb-3 last:mb-0">
                  <p className="text-xs font-medium text-subtle">{label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </details>
        );
      })}

      <h2 className="mb-2 mt-6 font-display text-lg">Relationships</h2>
      {rels.length === 0 ? (
        <p className="text-sm text-muted">No relationships recorded.</p>
      ) : (
        rels.map((r: Relationship) => {
          const other = lib.characters.find((c) => c.id === r.toId);
          const label = other?.name || "Unknown";
          return (
            <div key={r.id} className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => other && push({ view: "character", id: other.id, title: other.name })}
              >
                <span className="block truncate text-[15px] font-medium">
                  {formatRelationshipLabel(r.type, label)}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete relationship"
                onClick={() => deleteRel(r.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })
      )}
      {others.length ? (
        <div className="mt-3">
          <Field label="Add relationship">
            <select
              className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
              value={relTo}
              onChange={(e) => setRelTo(e.target.value)}
            >
              <option value="">Choose a person</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Unnamed"}
                </option>
              ))}
            </select>
            <select
              className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
            >
              {RELATIONSHIP_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mb-2 text-xs text-subtle">
              Saving also writes the matching reverse on the other person. You can add more than one.
            </p>
            <Button
              className="mt-2 w-full"
              variant="secondary"
              onClick={() => {
                if (!relTo) return;
                upsertRel({
                  id: uid("rel"),
                  fromId: person.id,
                  toId: relTo,
                  type: relType.trim() || "knows",
                });
                setRelTo("");
              }}
            >
              Add
            </Button>
          </Field>
        </div>
      ) : null}

      <h2 className="mb-2 mt-6 font-display text-lg">Stories</h2>
      {stories.length === 0 ? (
        <p className="text-sm text-muted">Not linked to a story yet.</p>
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
            title: "Delete this person?",
            body: "They will be unlinked from stories, series and scenarios. The stories themselves are kept.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => {
              deleteCharacter(person.id);
              closeConfirm();
              back();
            },
          })
        }
      >
        <Trash2 className="size-4" /> Delete character
      </Button>
    </Screen>
  );
}

export function CharacterEdit() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const existing = useApp((s) => s.lib.characters.find((c) => c.id === id));
  const upsert = useApp((s) => s.upsertCharacter);
  const back = useApp((s) => s.back);
  const [draft, setDraft] = useState<Character | null>(existing ?? null);

  useEffect(() => {
    setDraft(existing ?? null);
  }, [existing?.id]);

  if (!draft) {
    return (
      <Screen title="Edit character">
        <p className="text-sm text-muted">Character not found.</p>
      </Screen>
    );
  }

  function patch(p: Partial<Character>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function setField(key: string, value: string) {
    setDraft((d) => (d ? dossierSet(d, key, value) : d));
  }

  const gender = normalizeGender(draft.gender);
  const locked = Boolean(gender);
  const title = draft.name
    ? "Edit character"
    : gender === "Female"
      ? "New female character"
      : gender === "Male"
        ? "New male character"
        : "New character";

  return (
    <Screen title={title}>
      <PersonPhotos
        person={draft}
        onAnalysed={(next) => {
          setDraft(next);
        }}
      />
      <Field label="Name">
        <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label="Nickname or commonly known as">
        <Input value={draft.nickname} onChange={(e) => patch({ nickname: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Age">
          <Input value={draft.age} onChange={(e) => patch({ age: e.target.value })} />
        </Field>
        <Field label="Date of birth">
          <Input
            value={draft.dateOfBirth ?? ""}
            placeholder="e.g. 31st January"
            onChange={(e) => patch({ dateOfBirth: e.target.value })}
          />
        </Field>
      </div>
      {locked ? (
        <p className="mb-3 text-sm text-muted">
          {gender} character template. Gender is set when the record is created.
        </p>
      ) : (
        <Field label="Gender">
          <select
            className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
            value={gender}
            onChange={(e) => {
              const next = e.target.value as "" | "Female" | "Male";
              patch({ gender: next, breastSize: next === "Female" ? draft.breastSize : "" });
            }}
          >
            <option value="">Choose</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
      )}

      {sectionsFor(draft.gender).map((section, index) => (
        <details
          key={section.id}
          open={index === 0}
          className="mb-3 rounded-lg border border-border bg-surface"
        >
          <summary className="cursor-pointer px-3 py-3 font-display text-lg">
            {section.title}
          </summary>
          <div className="border-t border-border px-3 py-3">
            {section.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                {f.hint ? <p className="mb-2 text-sm text-muted">{f.hint}</p> : null}
                {f.area ? (
                  <Textarea
                    value={dossierGet(draft, f.key)}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                ) : (
                  <Input
                    value={dossierGet(draft, f.key)}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </details>
      ))}

      <Button
        className="w-full"
        onClick={() => {
          upsert({
            ...draft,
            name: draft.name.trim() || "Unnamed",
            gender: gender || draft.gender,
            primaryImageId: existing?.primaryImageId ?? draft.primaryImageId,
          });
          back();
        }}
      >
        Save character
      </Button>
    </Screen>
  );
}
