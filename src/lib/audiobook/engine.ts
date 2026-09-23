export type PlayerMode = "idle" | "file" | "voice";

export interface EngineSnapshot {
  mode: PlayerMode;
  playing: boolean;
  storyId: string | null;
  audiobookId: string | null;
  title: string;
  currentTime: number;
  duration: number;
  rate: number;
  error: string;
  speechOffset: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let snap: EngineSnapshot = {
  mode: "idle",
  playing: false,
  storyId: null,
  audiobookId: null,
  title: "",
  currentTime: 0,
  duration: 0,
  rate: 1,
  error: "",
  speechOffset: 0,
};

let audio: HTMLAudioElement | null = null;
let voiceQueue: string[] = [];
let voiceStarts: number[] = [];
let voiceIndex = 0;
let voiceText = "";
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const fn of listeners) fn();
}

function patch(p: Partial<EngineSnapshot>) {
  snap = { ...snap, ...p };
  emit();
}

export function getEngine(): EngineSnapshot {
  return snap;
}

export function subscribeEngine(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function splitSpeech(text: string): { start: number; text: string }[] {
  const chunks: { start: number; text: string }[] = [];
  const re = /[^.!?\n]+[.!?]+(?:["”')\]]+)?|\n+|[^.\n]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const piece = m[0].trim();
    if (piece) chunks.push({ start: m.index, text: piece });
  }
  return chunks.length ? chunks : [{ start: 0, text: text.trim() || " " }];
}

function stopVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.preload = "metadata";
    audio.addEventListener("timeupdate", () => {
      if (!audio) return;
      patch({ currentTime: audio.currentTime, duration: audio.duration || snap.duration });
      schedulePersist();
    });
    audio.addEventListener("ended", () => {
      patch({ playing: false, currentTime: audio?.duration || snap.currentTime });
      schedulePersist(true);
    });
    audio.addEventListener("play", () => patch({ playing: true, error: "" }));
    audio.addEventListener("pause", () => patch({ playing: false }));
    audio.addEventListener("error", () => patch({ playing: false, error: "Could not play that audio file." }));
  }
  return audio;
}

function schedulePersist(immediate = false) {
  if (persistTimer) clearTimeout(persistTimer);
  const run = () => {
    persistTimer = null;
    window.dispatchEvent(new CustomEvent("tsc-audiobook-progress"));
  };
  if (immediate) run();
  else persistTimer = setTimeout(run, 700);
}

function waitForVoices(): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve();
      return;
    }
    if (synth.getVoices().length) {
      resolve();
      return;
    }
    const done = () => {
      synth.removeEventListener("voiceschanged", done);
      resolve();
    };
    synth.addEventListener("voiceschanged", done);
    setTimeout(done, 800);
  });
}

function speakNext() {
  if (snap.mode !== "voice" || !snap.playing) return;
  const synth = window.speechSynthesis;
  if (!synth) {
    patch({ error: "This device has no spoken-voice support.", playing: false });
    return;
  }
  if (voiceIndex >= voiceQueue.length) {
    patch({ playing: false, speechOffset: voiceText.length, currentTime: snap.duration });
    schedulePersist(true);
    return;
  }
  const utter = new SpeechSynthesisUtterance(voiceQueue[voiceIndex]);
  utter.rate = snap.rate;
  const voices = synth.getVoices();
  const preferred =
    voices.find((v) => /en[-_]?GB/i.test(v.lang) && /female|woman|samantha|moira|fiona/i.test(v.name)) ||
    voices.find((v) => /en[-_]?GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));
  if (preferred) utter.voice = preferred;
  utter.onend = () => {
    voiceIndex += 1;
    const nextStart = voiceStarts[voiceIndex] ?? voiceText.length;
    patch({ speechOffset: nextStart, currentTime: nextStart });
    schedulePersist();
    speakNext();
  };
  utter.onerror = () => {
    patch({ playing: false, error: "Narration stopped." });
  };
  synth.speak(utter);
}

export function playFile(opts: {
  storyId: string;
  audiobookId: string;
  title: string;
  dataUrl: string;
  position?: number;
  rate?: number;
}) {
  stopVoice();
  const el = ensureAudio();
  if (!el) return;
  el.pause();
  el.src = opts.dataUrl;
  el.playbackRate = opts.rate ?? snap.rate ?? 1;
  const start = opts.position ?? 0;
  const onMeta = () => {
    el.removeEventListener("loadedmetadata", onMeta);
    if (start > 0 && Number.isFinite(el.duration)) {
      el.currentTime = Math.min(start, Math.max(0, el.duration - 0.25));
    }
    void el.play().catch(() => patch({ error: "Playback was blocked. Tap play again." }));
  };
  el.addEventListener("loadedmetadata", onMeta);
  patch({
    mode: "file",
    playing: true,
    storyId: opts.storyId,
    audiobookId: opts.audiobookId,
    title: opts.title,
    rate: opts.rate ?? snap.rate ?? 1,
    error: "",
    currentTime: start,
    duration: 0,
  });
  el.load();
}

export async function playVoice(opts: {
  storyId: string;
  title: string;
  text: string;
  offset?: number;
  rate?: number;
}) {
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
  stopVoice();
  await waitForVoices();
  voiceText = opts.text || "";
  const parts = splitSpeech(voiceText);
  const offset = Math.max(0, opts.offset ?? 0);
  let idx = parts.findIndex((p) => p.start + p.text.length > offset);
  if (idx < 0) idx = 0;
  voiceQueue = parts.map((p) => p.text);
  voiceStarts = parts.map((p) => p.start);
  voiceIndex = idx;
  patch({
    mode: "voice",
    playing: true,
    storyId: opts.storyId,
    audiobookId: null,
    title: opts.title,
    rate: opts.rate ?? snap.rate ?? 1,
    error: "",
    speechOffset: voiceStarts[idx] ?? 0,
    currentTime: voiceStarts[idx] ?? 0,
    duration: voiceText.length,
  });
  speakNext();
}

export function togglePlay() {
  if (snap.mode === "file" && audio) {
    if (snap.playing) audio.pause();
    else void audio.play();
    return;
  }
  if (snap.mode === "voice") {
    if (snap.playing) {
      window.speechSynthesis?.pause();
      patch({ playing: false });
    } else {
      patch({ playing: true });
      if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
      else speakNext();
    }
  }
}

export function stopAll() {
  stopVoice();
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
  }
  patch({
    mode: "idle",
    playing: false,
    storyId: null,
    audiobookId: null,
    title: "",
    currentTime: 0,
    duration: 0,
    error: "",
  });
}

export function setRate(rate: number) {
  const next = Math.min(2, Math.max(0.7, rate));
  if (audio) audio.playbackRate = next;
  patch({ rate: next });
}

export function skip(seconds: number) {
  if (snap.mode === "file" && audio && Number.isFinite(audio.duration)) {
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + seconds), audio.duration);
    patch({ currentTime: audio.currentTime });
    schedulePersist(true);
    return;
  }
  if (snap.mode === "voice") {
    const jump = seconds > 0 ? 1 : -1;
    voiceIndex = Math.min(voiceQueue.length - 1, Math.max(0, voiceIndex + jump));
    stopVoice();
    patch({ speechOffset: voiceStarts[voiceIndex] ?? 0, currentTime: voiceStarts[voiceIndex] ?? 0 });
    if (snap.playing) speakNext();
    schedulePersist();
  }
}

export function seekRatio(ratio: number) {
  const r = Math.min(1, Math.max(0, ratio));
  if (snap.mode === "file" && audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = r * audio.duration;
    patch({ currentTime: audio.currentTime });
    schedulePersist(true);
  }
}

export const MAX_AUDIO_BYTES = 28 * 1024 * 1024;
export const NARRATE_CHAR_LIMIT = 3500;
