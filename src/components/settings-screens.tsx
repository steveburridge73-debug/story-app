import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { AUTO_LOCK_OPTIONS } from "@/lib/library/types";
import type { AutoLock, Category } from "@/lib/library/types";
import { runHealthCheck } from "@/lib/library/health";
import { libraryToJson, parseLibraryJson } from "@/lib/library/storage";
import { useApp } from "@/lib/store";
import { downloadBlob, uid } from "@/lib/utils";
import { Screen } from "./chrome";
import { Button, EmptyState, Field, Input, ListRow, Textarea } from "./ui";

export function SettingsScreen() {
  const push = useApp((s) => s.push);
  const theme = useApp((s) => s.lib.settings.theme);
  const setTheme = useApp((s) => s.setTheme);
  const autoLock = useApp((s) => s.lib.settings.autoLock);
  const patchSettings = useApp((s) => s.patchSettings);

  return (
    <Screen title="Settings">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Everything stays on this device. There is no account and nothing is shared.
      </p>

      <ListRow
        title="Passcode"
        subtitle="Change the unlock code"
        onClick={() => push({ view: "passcode", title: "Passcode" })}
      />
      <ListRow
        title="Light / dark mode"
        subtitle={theme === "dark" ? "Dark (tap to switch)" : "Light (tap to switch)"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <Field label="Auto-lock" className="mt-4">
        <select
          className="h-11 w-full rounded-md border border-border bg-raised px-3 text-base text-fg"
          value={autoLock}
          onChange={(e) => patchSettings({ autoLock: e.target.value as AutoLock })}
        >
          {AUTO_LOCK_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>

      <h2 className="mb-2 mt-6 font-display text-lg">Library</h2>
      <ListRow
        title="Manage categories"
        subtitle="Add, rename, reorder"
        onClick={() => push({ view: "categories", title: "Categories" })}
      />
      <ListRow
        title="Story Dynamics"
        subtitle="Length, sexual act, theme, category — used by Lucky Dip"
        onClick={() => push({ view: "dynamics", title: "Story Dynamics" })}
      />
      <ListRow
        title="Manage tags"
        subtitle="Rename or remove tags"
        onClick={() => push({ view: "tags", title: "Tags" })}
      />
      <ListRow
        title="Audiobooks"
        subtitle="Listen, attach files, studio narration"
        onClick={() => push({ view: "audiobooks", title: "Audiobooks" })}
      />
      <ListRow
        title="Backup"
        subtitle="Export a full library copy"
        onClick={() => push({ view: "backup", title: "Backup" })}
      />
      <ListRow
        title="Application health check"
        subtitle="Inspect and repair links"
        onClick={() => push({ view: "health", title: "Application check" })}
      />
      <ListRow
        title="Story generation rules"
        subtitle="Applied automatically to AI writing"
        onClick={() => push({ view: "rules", title: "Generation rules" })}
      />

      <h2 className="mb-2 mt-8 font-display text-lg">About</h2>
      <p className="text-sm leading-relaxed text-muted">
        Top Shelf and Under the Counter is a private personal story library and
        writing workspace. Stories, people, photos, audiobooks, and notes are stored
        locally on this device. Imported stories are kept as they were imported. AI
        writing and studio narration are only used when you ask for them.
      </p>
    </Screen>
  );
}

export function PasscodeScreen() {
  const changePasscode = useApp((s) => s.changePasscode);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  async function save() {
    setMsg("");
    setOk(false);
    if (!/^\d+$/.test(next) || next.length < 4) {
      setMsg("New passcode must be at least 4 digits.");
      return;
    }
    if (next !== confirm) {
      setMsg("New passcode and confirmation do not match.");
      return;
    }
    const success = await changePasscode(current, next);
    if (!success) {
      setMsg("Current passcode is incorrect.");
      setCurrent("");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setOk(true);
    setMsg("Passcode updated.");
  }

  return (
    <Screen title="Passcode">
      <p className="mb-4 text-sm text-muted">
        Enter the current passcode, then choose a new numeric code. The code is
        never shown in the rest of the app.
      </p>
      <Field label="Current passcode">
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={current}
          onChange={(e) => setCurrent(e.target.value.replace(/\D/g, "").slice(0, 12))}
        />
      </Field>
      <Field label="New passcode">
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={next}
          onChange={(e) => setNext(e.target.value.replace(/\D/g, "").slice(0, 12))}
        />
      </Field>
      <Field label="Confirm new passcode">
        <Input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 12))}
        />
      </Field>
      {msg ? <p className={`mb-3 text-sm ${ok ? "text-ok" : "text-danger"}`}>{msg}</p> : null}
      <Button className="w-full" onClick={() => void save()}>
        Save passcode
      </Button>
    </Screen>
  );
}

export function CategoriesScreen() {
  const categories = useApp((s) => s.lib.categories);
  const upsert = useApp((s) => s.upsertCategory);
  const remove = useApp((s) => s.deleteCategory);
  const reorder = useApp((s) => s.reorderCategories);
  const askConfirm = useApp((s) => s.askConfirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [newName, setNewName] = useState("");
  const [subName, setSubName] = useState("");
  const [subParent, setSubParent] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveId, setMoveId] = useState("");
  const [moveParent, setMoveParent] = useState("");

  const tops = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order),
    [categories],
  );

  function siblings(parentId: string | null) {
    return categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  function move(id: string, dir: -1 | 1) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const list = siblings(cat.parentId);
    const i = list.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((c) => c.id);
    const tmp = ids[i]!;
    ids[i] = ids[j]!;
    ids[j] = tmp;
    reorder(ids);
  }

  function addTop() {
    const name = newName.trim();
    if (!name) return;
    const cat: Category = {
      id: uid("cat"),
      name,
      parentId: null,
      order: tops.length,
    };
    upsert(cat);
    setNewName("");
  }

  function addSub() {
    const name = subName.trim();
    if (!name || !subParent) return;
    const kids = siblings(subParent);
    upsert({
      id: uid("cat"),
      name,
      parentId: subParent,
      order: kids.length,
    });
    setSubName("");
  }

  function saveRename() {
    if (!renaming) return;
    const cat = categories.find((c) => c.id === renaming);
    if (!cat) return;
    const name = renameValue.trim();
    if (!name) return;
    upsert({ ...cat, name });
    setRenaming(null);
  }

  function applyMove() {
    const cat = categories.find((c) => c.id === moveId);
    if (!cat || !moveParent) return;
    if (moveParent === cat.id) return;
    const parent = moveParent === "top" ? null : moveParent;
    const kids = siblings(parent);
    upsert({ ...cat, parentId: parent, order: kids.length });
    setMoveId("");
    setMoveParent("");
  }

  function row(cat: Category, depth: number) {
    const kids = siblings(cat.id);
    return (
      <div key={cat.id} className={depth ? "ml-4" : ""}>
        <div className="flex items-center gap-1 border-b border-border py-2">
          <div className="min-w-0 flex-1">
            {renaming === cat.id ? (
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="truncate text-left text-[15px] font-medium"
                onClick={() => {
                  setRenaming(cat.id);
                  setRenameValue(cat.name);
                }}
              >
                {cat.name}
              </button>
            )}
            <p className="text-xs text-subtle">{depth ? "Subcategory" : "Category"}</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => move(cat.id, -1)}>
            <ChevronUp className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Move down" onClick={() => move(cat.id, 1)}>
            <ChevronDown className="size-4" />
          </Button>
          <button
            type="button"
            className="px-1 text-xs text-danger"
            onClick={() =>
              askConfirm({
                title: `Delete “${cat.name}”?`,
                body: "Stories are not deleted. The category is only unlinked. Subcategories become top-level.",
                confirmLabel: "Delete",
                danger: true,
                onConfirm: () => {
                  remove(cat.id);
                  closeConfirm();
                },
              })
            }
          >
            Delete
          </button>
        </div>
        {kids.map((k) => row(k, depth + 1))}
      </div>
    );
  }

  return (
    <Screen title="Manage categories">
      <p className="mb-3 text-sm text-muted">
        Tap a name to rename. Deleting a category never deletes stories.
      </p>
      {tops.map((c) => row(c, 0))}

      <Field label="Add category" className="mt-5">
        <div className="flex gap-2">
          <Input
            className="min-w-0 flex-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category"
          />
          <Button onClick={addTop} disabled={!newName.trim()}>
            Add
          </Button>
        </div>
      </Field>

      <Field label="Add subcategory">
        <select
          className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base text-fg"
          value={subParent}
          onChange={(e) => setSubParent(e.target.value)}
        >
          <option value="">Under which category?</option>
          {tops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            className="min-w-0 flex-1"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="New subcategory"
          />
          <Button onClick={addSub} disabled={!subName.trim() || !subParent}>
            Add
          </Button>
        </div>
      </Field>

      <Field label="Move a subcategory">
        <select
          className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base text-fg"
          value={moveId}
          onChange={(e) => setMoveId(e.target.value)}
        >
          <option value="">Choose subcategory</option>
          {categories
            .filter((c) => c.parentId)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
        <select
          className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base text-fg"
          value={moveParent}
          onChange={(e) => setMoveParent(e.target.value)}
        >
          <option value="">Move under…</option>
          <option value="top">Top level</option>
          {tops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button variant="secondary" className="w-full" disabled={!moveId || !moveParent} onClick={applyMove}>
          Move
        </Button>
      </Field>
    </Screen>
  );
}

export function TagsScreen() {
  const tags = useApp((s) => s.lib.tags);
  const upsert = useApp((s) => s.upsertTag);
  const remove = useApp((s) => s.deleteTag);
  const askConfirm = useApp((s) => s.askConfirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");

  return (
    <Screen title="Manage tags">
      <p className="mb-3 text-sm text-muted">
        Tags are separate from categories. Removing a tag only unlinks it.
      </p>
      <div className="mb-4 flex gap-2">
        <Input className="min-w-0 flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="New tag" />
        <Button
          onClick={() => {
            const n = name.trim();
            if (!n) return;
            if (tags.some((t) => t.name.toLowerCase() === n.toLowerCase())) {
              setName("");
              return;
            }
            upsert({ id: uid("tg"), name: n });
            setName("");
          }}
        >
          Add
        </Button>
      </div>
      {tags.length === 0 ? (
        <EmptyState title="No tags yet" body="Create tags here or while editing a story." />
      ) : (
        tags.map((t) => (
          <div key={t.id} className="flex items-center gap-2 border-b border-border py-2">
            {editing === t.id ? (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                  if (value.trim()) upsert({ ...t, name: value.trim() });
                  setEditing(null);
                }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-[15px]"
                onClick={() => {
                  setEditing(t.id);
                  setValue(t.name);
                }}
              >
                {t.name}
              </button>
            )}
            <button
              type="button"
              className="text-xs text-danger"
              onClick={() =>
                askConfirm({
                  title: `Delete tag “${t.name}”?`,
                  body: "Stories keep their text. Only the tag association is removed.",
                  confirmLabel: "Delete",
                  danger: true,
                  onConfirm: () => {
                    remove(t.id);
                    closeConfirm();
                  },
                })
              }
            >
              Delete
            </button>
          </div>
        ))
      )}
    </Screen>
  );
}

export function HealthScreen() {
  const lib = useApp((s) => s.lib);
  const repair = useApp((s) => s.repair);
  const [repaired, setRepaired] = useState<string[] | null>(null);
  const report = useMemo(() => runHealthCheck(lib), [lib]);
  const canRepair = report.items.some((i) => i.repairable && i.status !== "ok");

  return (
    <Screen title="Application check">
      <p className="mb-1 font-display text-xl">APPLICATION CHECK</p>
      <p className="mb-4 text-sm text-muted">
        This inspects the library. It never deletes stories, characters or images.
      </p>
      <ul className="space-y-2">
        {report.items.map((item) => (
          <li key={item.id} className="flex gap-2 text-sm">
            <span className={item.status === "ok" ? "text-ok" : item.status === "warn" ? "text-warn" : "text-danger"}>
              {item.status === "ok" ? "✓" : item.status === "warn" ? "!" : "×"}
            </span>
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="block text-muted">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm font-medium">
        Status: {report.ok ? "All systems OK" : "Issues found — nothing has been deleted"}
      </p>
      {canRepair ? (
        <Button
          className="mt-4 w-full"
          onClick={() => {
            const notes = repair();
            setRepaired(notes);
          }}
        >
          <ShieldCheck className="size-4" /> Repair broken links
        </Button>
      ) : null}
      {repaired ? (
        <ul className="mt-3 list-disc pl-5 text-sm text-muted">
          {repaired.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      ) : null}
    </Screen>
  );
}

export function RulesScreen() {
  const rules = useApp((s) => s.lib.settings.generationRules);
  const patch = useApp((s) => s.patchSettings);
  const [draft, setDraft] = useState(rules);

  return (
    <Screen title="Story generation rules">
      <p className="mb-3 text-sm leading-relaxed text-muted">
        These rules apply automatically to Auto Generation, Character Replacement,
        series continuation and any other AI writing. You do not need to repeat
        them each time.
      </p>
      <Textarea className="min-h-80 text-sm" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <Button
        className="mt-3 w-full"
        onClick={() => patch({ generationRules: draft })}
      >
        Save rules
      </Button>
    </Screen>
  );
}

export function BackupScreen() {
  const lib = useApp((s) => s.lib);
  const replaceLibrary = useApp((s) => s.replaceLibrary);
  const askConfirm = useApp((s) => s.askConfirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  function exportLib() {
    const blob = new Blob([libraryToJson(lib)], { type: "application/json" });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(`top-shelf-backup-${stamp}.json`, blob);
    setNote("Backup file downloaded.");
  }

  async function onFile(file: File) {
    setError("");
    setNote("");
    try {
      const raw = await file.text();
      const next = parseLibraryJson(raw);
      askConfirm({
        title: "Replace this library?",
        body: `This will replace the current library with the backup (${next.stories.length} stories, ${next.characters.length} people). This cannot be undone unless you have another backup.`,
        confirmLabel: "Restore",
        danger: true,
        onConfirm: () => {
          replaceLibrary(next);
          closeConfirm();
          setNote("Library restored from backup.");
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that backup.");
    }
  }

  return (
    <Screen title="Backup and restore">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        A backup includes stories, people, relationships, scenarios, series,
        categories, Story Dynamics, tags, website links, notes, images, audiobooks and reading
        positions. Restore never happens silently.
      </p>
      <Button className="w-full" onClick={exportLib}>
        <Download className="size-4" /> Download backup
      </Button>
      <label className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-raised text-sm font-medium">
        <Upload className="size-4" /> Choose backup to restore
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.currentTarget.value = "";
          }}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {note ? <p className="mt-3 text-sm text-ok">{note}</p> : null}
    </Screen>
  );
}
