import { useEffect, useState, useSyncExternalStore } from "react";
import { Headphones, Pause, Play, SkipBack, SkipForward, Trash2 } from "lucide-react";
import { narrateStoryFn } from "@/lib/generation/api";
import {
  getEngine,
  MAX_AUDIO_BYTES,
  NARRATE_CHAR_LIMIT,
  playFile,
  playVoice,
  seekRatio,
  setRate,
  skip,
  stopAll,
  subscribeEngine,
  togglePlay,
} from "@/lib/audiobook/engine";
import type { Audiobook, Story } from "@/lib/library/types";
import { useApp } from "@/lib/store";
import { fileToDataUrl, formatDate, nowIso, uid } from "@/lib/utils";
import { Screen } from "./chrome";
import { Button, EmptyState, Field, ListRow } from "./ui";

function useEngine() {
  return useSyncExternalStore(subscribeEngine, getEngine, getEngine);
}

function fmtTime(n: number) {
  if (!Number.isFinite(n) || n < 0) return "0:00";
  const s = Math.floor(n);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudiobookDock() {
  const snap = useEngine();
  const setAudiobookPosition = useApp((s) => s.setAudiobookPosition);
  const setSpeechOffset = useApp((s) => s.setSpeechOffset);
  const patchSettings = useApp((s) => s.patchSettings);

  useEffect(() => {
    const onProg = () => {
      const s = getEngine();
      if (s.mode === "file" && s.audiobookId) {
        setAudiobookPosition(s.audiobookId, s.currentTime, s.duration);
      }
      if (s.mode === "voice" && s.storyId) {
        setSpeechOffset(s.storyId, s.speechOffset);
      }
    };
    window.addEventListener("tsc-audiobook-progress", onProg);
    return () => window.removeEventListener("tsc-audiobook-progress", onProg);
  }, [setAudiobookPosition, setSpeechOffset]);

  if (snap.mode === "idle") return null;

  const duration = snap.mode === "file" ? snap.duration : Math.max(1, snap.duration);
  const ratio = duration > 0 ? Math.min(1, snap.currentTime / duration) : 0;

  return (
    <div className="border-t border-border bg-surface px-3 py-2">
      <p className="truncate text-xs text-muted">
        {snap.mode === "voice" ? "Listening" : "Audiobook"} · {snap.title || "Untitled"}
      </p>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(ratio * 1000)}
        aria-label="Playback position"
        className="mt-1 w-full accent-accent"
        onChange={(e) => seekRatio(Number(e.target.value) / 1000)}
        disabled={snap.mode !== "file"}
      />
      <div className="mt-1 flex items-center gap-1">
        <span className="w-10 text-[11px] text-subtle">
          {snap.mode === "file" ? fmtTime(snap.currentTime) : `${Math.round(ratio * 100)}%`}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Skip back" onClick={() => skip(-15)}>
          <SkipBack className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={snap.playing ? "Pause" : "Play"} onClick={togglePlay}>
          {snap.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Skip forward" onClick={() => skip(15)}>
          <SkipForward className="size-4" />
        </Button>
        <select
          className="ml-auto h-9 rounded-sm border border-border bg-raised px-2 text-xs text-fg"
          value={String(snap.rate)}
          aria-label="Playback speed"
          onChange={(e) => {
            const rate = Number(e.target.value);
            setRate(rate);
            patchSettings({ ttsRate: rate });
          }}
        >
          {["0.8", "1", "1.2", "1.5"].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
        <Button variant="quiet" size="sm" onClick={stopAll}>
          Stop
        </Button>
      </div>
      {snap.error ? <p className="mt-1 text-xs text-danger">{snap.error}</p> : null}
    </div>
  );
}

export function AudiobooksList() {
  const books = useApp((s) => s.lib.audiobooks);
  const stories = useApp((s) => s.lib.stories);
  const push = useApp((s) => s.push);
  const rate = useApp((s) => s.lib.settings.ttsRate ?? 1);

  return (
    <Screen title="Audiobooks">
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Attach an audio file to any story, listen with the device voice, or create a studio
        narration. Playback is private to this device.
      </p>
      <Button
        className="mb-3 w-full"
        variant="secondary"
        onClick={() => push({ view: "stories-list", title: "Amend a story" })}
      >
        Choose a story
      </Button>
      {books.length === 0 ? (
        <EmptyState
          title="No audio files yet"
          body="Open a story and attach MP3, M4A or AAC, or tap Listen to hear it read aloud."
        />
      ) : (
        books.map((b) => {
          const story = stories.find((s) => s.id === b.storyId);
          return (
            <ListRow
              key={b.id}
              title={b.title || story?.title || "Untitled"}
              subtitle={story?.title ? `${story.title} · ${b.source === "narrated" ? "Narrated" : "Imported"}` : "Story missing"}
              onClick={() => {
                playFile({
                  storyId: b.storyId,
                  audiobookId: b.id,
                  title: b.title || story?.title || "Audiobook",
                  dataUrl: b.dataUrl,
                  position: b.position,
                  rate,
                });
                if (story) push({ view: "story", id: story.id, title: story.title });
              }}
              trailing={<Headphones className="size-4 text-muted" />}
            />
          );
        })
      )}
    </Screen>
  );
}

export function StoryAudioPanel({ story }: { story: Story }) {
  const allBooks = useApp((s) => s.lib.audiobooks);
  const books = allBooks.filter((a) => a.storyId === story.id);
  const upsert = useApp((s) => s.upsertAudiobook);
  const remove = useApp((s) => s.deleteAudiobook);
  const rate = useApp((s) => s.lib.settings.ttsRate ?? 1);
  const askConfirm = useApp((s) => s.askConfirm);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const snap = useEngine();

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    for (const file of [...list]) {
      if (file.size > MAX_AUDIO_BYTES) {
        setError("One file is larger than 28 MB. Split it or compress it first.");
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      const book: Audiobook = {
        id: uid("ab"),
        storyId: story.id,
        title: file.name.replace(/\.[^.]+$/, ""),
        dataUrl,
        mimeType: file.type || "audio/mpeg",
        duration: 0,
        position: 0,
        source: "imported",
        createdAt: nowIso(),
      };
      upsert(book);
    }
  }

  async function narrate() {
    setBusy(true);
    setError("");
    const result = await narrateStoryFn({ data: { text: story.content } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    upsert({
      id: uid("ab"),
      storyId: story.id,
      title: `${story.title || "Story"} — narration`,
      dataUrl: result.dataUrl,
      mimeType: result.mimeType,
      duration: 0,
      position: 0,
      source: "narrated",
      createdAt: nowIso(),
    });
  }

  const listeningHere = snap.storyId === story.id && snap.playing;

  return (
    <div className="mt-5 rounded-lg border border-border bg-surface p-3">
      <h2 className="font-display text-lg">Audiobook</h2>
      <p className="mt-1 mb-3 text-sm text-muted">
        Listen now, attach audio files, or create a studio narration
        {story.content.length > NARRATE_CHAR_LIMIT
          ? ` (studio voice covers the first ${NARRATE_CHAR_LIMIT.toLocaleString()} characters).`
          : "."}
      </p>
      <div className="flex flex-col gap-2">
        <Button
          onClick={() =>
            playVoice({
              storyId: story.id,
              title: story.title || "Untitled",
              text: story.content,
              offset: story.speechOffset ?? 0,
              rate,
            })
          }
        >
          <Headphones className="size-4" />
          {listeningHere && snap.mode === "voice" ? "Restart listen" : "Listen to this story"}
        </Button>
        <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-border bg-raised text-sm font-medium">
          Attach audio files
          <input
            type="file"
            accept="audio/*,.mp3,.m4a,.aac,.ogg,.wav"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <Button variant="secondary" disabled={busy || !story.content.trim()} onClick={() => void narrate()}>
          {busy ? "Narrating…" : "Create studio narration"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {books.length ? (
        <ul className="mt-3">
          {books.map((b) => (
            <li key={b.id} className="flex items-center gap-2 border-t border-border py-2">
              <button
                type="button"
                className="min-w-0 flex-1 text-left text-sm"
                onClick={() =>
                  playFile({
                    storyId: story.id,
                    audiobookId: b.id,
                    title: b.title || story.title,
                    dataUrl: b.dataUrl,
                    position: b.position,
                    rate,
                  })
                }
              >
                <span className="block truncate font-medium">{b.title || "Audio"}</span>
                <span className="text-xs text-subtle">
                  {b.source === "narrated" ? "Narrated" : "Imported"}
                  {b.duration ? ` · ${fmtTime(b.duration)}` : ""}
                  {b.createdAt ? ` · ${formatDate(b.createdAt)}` : ""}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete audio"
                onClick={() =>
                  askConfirm({
                    title: "Remove this audio?",
                    body: "The story text is not deleted.",
                    confirmLabel: "Remove",
                    danger: true,
                    onConfirm: () => {
                      if (getEngine().audiobookId === b.id) stopAll();
                      remove(b.id);
                      closeConfirm();
                    },
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
