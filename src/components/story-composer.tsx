import { useMemo, useState } from "react";
import { Camera, FileText, Type } from "lucide-react";
import { readScreenshotFn } from "@/lib/generation/api";
import { extractStoryPages, guessTitle } from "@/lib/library/import-file";
import { joinStoryPages, pagesFromStory } from "@/lib/library/pages";
import type { Story, StorySource } from "@/lib/library/types";
import { currentView, useApp } from "@/lib/store";
import { prepareImage } from "@/lib/utils";
import { Screen } from "./chrome";
import { Button, Field, Input, Textarea } from "./ui";

type Method = "type" | "shot" | "file";

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(file.name);
}

export function StoryComposer() {
  const frame = useApp((s) => currentView(s.nav));
  const existing = useApp((s) => s.lib.stories.find((x) => x.id === frame.id) ?? null);
  const series = useApp((s) => s.lib.series.find((x) => x.id === frame.seriesId) ?? null);
  const newStory = useApp((s) => s.newStory);
  const upsertStory = useApp((s) => s.upsertStory);
  const upsertSeries = useApp((s) => s.upsertSeries);
  const replace = useApp((s) => s.replace);
  const back = useApp((s) => s.back);

  const appending = Boolean(existing);
  const [storyId, setStoryId] = useState(existing?.id ?? "");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [author, setAuthor] = useState(existing?.author ?? "");
  const [pages, setPages] = useState<string[]>(() => (existing ? pagesFromStory(existing) : []));
  const [draft, setDraft] = useState("");
  const [method, setMethod] = useState<Method>("type");
  const [source, setSource] = useState<StorySource>(existing?.source ?? "created");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [linkedSeries, setLinkedSeries] = useState(false);

  const pageNumber = pages.length + 1;
  const joinedPreview = useMemo(() => joinStoryPages(pages), [pages]);

  function persist(nextPages: string[], id: string, extra?: Partial<Story>) {
    const base =
      useApp.getState().lib.stories.find((s) => s.id === id) ??
      existing ??
      newStory({ id, source, origin: "original" });
    const nextTitle =
      (extra?.title ?? title).trim() ||
      base.title ||
      guessTitle("", nextPages[0] ?? "") ||
      "Untitled story";
    upsertStory({
      ...base,
      title: nextTitle,
      author: extra?.author ?? author,
      pages: nextPages,
      source: extra?.source ?? source,
      originalContent:
        (extra?.source ?? source) === "imported"
          ? joinStoryPages(nextPages)
          : (base.originalContent ?? null),
    });
    if (series && !linkedSeries) {
      const live = useApp.getState().lib.series.find((s) => s.id === series.id) ?? series;
      const already = live.stories.some((s) => s.storyId === id);
      if (!already) {
        upsertSeries({
          ...live,
          stories: [...live.stories, { storyId: id, order: live.stories.length + 1 }],
        });
      }
      setLinkedSeries(true);
    }
    return nextTitle;
  }

  function ensureId() {
    if (storyId) return storyId;
    const created = newStory({
      title: title.trim(),
      author,
      source,
      origin: "original",
    });
    setStoryId(created.id);
    return created.id;
  }

  function savePage() {
    const text = draft.trim();
    if (!text) {
      setError("Add this page first — type it, upload a screenshot, or choose a file.");
      return;
    }
    setError("");
    const nextPages = [...pages, text];
    const id = ensureId();
    persist(nextPages, id);
    setPages(nextPages);
    setDraft("");
  }

  function finish() {
    const trailing = draft.trim();
    const nextPages = trailing ? [...pages, trailing] : pages;
    if (!nextPages.length) {
      setError("Add at least one page before finishing.");
      return;
    }
    setError("");
    const id = ensureId();
    const nextTitle = persist(nextPages, id);
    setPages(nextPages);
    setDraft("");
    replace({ view: "story", id, title: nextTitle });
  }

  async function ingestFiles(list: FileList | File[], asShot: boolean) {
    const files = [...list];
    if (!files.length) return;
    setError("");
    const added: string[] = [];
    let lastError = "";
    let importUsed = asShot || files.some((f) => !isImageFile(f));
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      setBusy(
        files.length === 1
          ? asShot || isImageFile(file)
            ? "Reading screenshot…"
            : "Reading file…"
          : `Reading ${i + 1} of ${files.length}…`,
      );
      try {
        if (asShot || isImageFile(file)) {
          const dataUrl = await prepareImage(file, 1800);
          const result = await readScreenshotFn({ data: { imageDataUrl: dataUrl } });
          if (!result.ok) {
            lastError = result.error;
            continue;
          }
          if (result.text.trim()) added.push(result.text.trim());
        } else {
          const parts = await extractStoryPages(file);
          added.push(...parts);
          if (!title.trim()) setTitle(guessTitle(file.name, parts[0] ?? ""));
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Could not read that file.";
      }
    }
    setBusy("");
    if (!added.length) {
      setError(lastError || "No text could be read. Try another screenshot, a file, or type the page.");
      return;
    }
    if (importUsed) setSource("imported");
    const nextPages = [...pages, ...added];
    const id = ensureId();
    persist(nextPages, id, { source: importUsed ? "imported" : source });
    setPages(nextPages);
    setDraft("");
  }

  return (
    <Screen title={appending ? "Add pages" : series ? "Add story to series" : "Add story"}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Add page {pageNumber} by screenshot, file, or typing. Save each page, then add the next.
        Reading, listening and analysis use every page as one story, in order.
      </p>

      {!appending ? (
        <>
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional until you finish"
            />
          </Field>
          <Field label="Author">
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </Field>
        </>
      ) : (
        <p className="mb-3 text-sm text-subtle">{title || "Untitled story"} · {pages.length} page{pages.length === 1 ? "" : "s"} already saved</p>
      )}

      <div className="mb-3 grid grid-cols-3 gap-2">
        {(
          [
            ["type", "Type", Type],
            ["shot", "Screenshot", Camera],
            ["file", "File", FileText],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            className={
              method === id
                ? "flex h-12 items-center justify-center gap-1.5 rounded-md bg-accent text-sm font-medium text-accent-fg"
                : "flex h-12 items-center justify-center gap-1.5 rounded-md border border-border bg-raised text-sm font-medium"
            }
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {method === "type" ? (
        <Field label={`Page ${pageNumber}`}>
          <Textarea
            className="min-h-48"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type or paste this page. Save it, then you can add the next."
          />
        </Field>
      ) : null}

      {method === "shot" ? (
        <div className="mb-3">
          <p className="mb-2 text-sm text-muted">
            Upload one screenshot per page, or several at once. They become page {pageNumber}
            {pageNumber === 1 ? " onward." : " and the pages after."}
          </p>
          <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-raised text-sm font-medium">
            Upload screenshot
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                e.currentTarget.value = "";
                if (files?.length) void ingestFiles(files, true);
              }}
            />
          </label>
        </div>
      ) : null}

      {method === "file" ? (
        <div className="mb-3">
          <p className="mb-2 text-sm text-muted">
            TXT, DOCX or PDF. A multi-page PDF is split into story pages automatically.
          </p>
          <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-raised text-sm font-medium">
            Upload file
            <input
              type="file"
              accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                e.currentTarget.value = "";
                if (files?.length) void ingestFiles(files, false);
              }}
            />
          </label>
        </div>
      ) : null}

      {busy ? <p className="mb-3 text-sm text-muted">{busy}</p> : null}
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      {pages.length ? (
        <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
          <p className="text-xs font-medium text-subtle">
            {pages.length} page{pages.length === 1 ? "" : "s"} saved
          </p>
          <ol className="mt-1 list-decimal pl-4 text-sm text-muted">
            {pages.map((p, i) => (
              <li key={i} className="truncate">
                {p.replace(/\s+/g, " ").slice(0, 80) || `Page ${i + 1}`}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <Button className="w-full" disabled={Boolean(busy)} onClick={savePage}>
        Save page {pageNumber}
      </Button>
      <Button
        className="mt-2 w-full"
        variant="secondary"
        disabled={Boolean(busy)}
        onClick={finish}
      >
        Finish & save
      </Button>
      <Button variant="quiet" className="mt-2 w-full" onClick={back}>
        {pages.length ? "Close — pages already saved" : "Cancel"}
      </Button>

      {joinedPreview ? (
        <p className="mt-4 text-xs leading-relaxed text-subtle">
          Preview as one story ({joinedPreview.length.toLocaleString()} characters). Page 1 is followed
          by page 2, then 3, and so on.
        </p>
      ) : null}
    </Screen>
  );
}
