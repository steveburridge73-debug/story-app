import { useSyncExternalStore } from "react";
import type { LibraryData } from "@/lib/library/types";
import { useApp } from "@/lib/store";
import { pullLibraryFn, pushLibraryFn, type PullResult } from "./api";

const LS_KEY = "tsc-sync";
const PUSH_DEBOUNCE_MS = 1500;
const POLL_MS = 8000;

type Persisted = { code: string; revision: number };

export type SyncPhase = "idle" | "syncing" | "synced" | "error";

export interface SyncStatus {
  connected: boolean;
  code: string | null;
  phase: SyncPhase;
  revision: number;
  lastSyncedAt: number | null;
  error: string | null;
}

export interface ProbeResult {
  found: boolean;
  stories: number;
  characters: number;
}

// A cheap, stable content signature (cyrb53) so we can tell "did the library
// actually change?" without a deep compare. After we apply a remote copy, the
// local signature equals the one we just stored, so the change listener that
// fires from applying it will correctly decide there is nothing new to push —
// which is what stops the two devices from ping-ponging updates forever.
function signature(data: LibraryData): string {
  const str = JSON.stringify(data);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

class SyncManager {
  private status: SyncStatus = {
    connected: false,
    code: null,
    phase: "idle",
    revision: 0,
    lastSyncedAt: null,
    error: null,
  };

  private listeners = new Set<() => void>();
  private started = false;
  private unsubscribeStore: (() => void) | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncedSig: string | null = null;
  private inFlight: Promise<void> | null = null;

  // --- external store plumbing for useSyncExternalStore ---
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = (): SyncStatus => this.status;

  private emit(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    for (const fn of this.listeners) fn();
  }

  private loadPersisted(): Persisted | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Persisted;
      if (parsed && typeof parsed.code === "string") {
        return { code: parsed.code, revision: Number(parsed.revision) || 0 };
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  private savePersisted() {
    if (!this.status.code) {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ code: this.status.code, revision: this.status.revision } satisfies Persisted),
      );
    } catch {
      /* ignore */
    }
  }

  /** Start background sync if a code was previously saved. Idempotent. */
  init() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    const persisted = this.loadPersisted();
    if (!persisted) return;
    this.emit({ connected: true, code: persisted.code, revision: persisted.revision });
    this.attach();
    void this.syncNow();
  }

  /** Look at the cloud for a code without committing to it. */
  async probe(code: string): Promise<ProbeResult> {
    const res = (await pullLibraryFn({ data: { code } })) as PullResult;
    if (!res.found) return { found: false, stories: 0, characters: 0 };
    return {
      found: true,
      stories: res.data.stories?.length ?? 0,
      characters: res.data.characters?.length ?? 0,
    };
  }

  /**
   * Connect this device to a sync code.
   * - "pull": adopt the cloud copy (replace this device's library).
   * - "push": make the cloud match this device (create it or overwrite it).
   */
  async connect(code: string, direction: "pull" | "push"): Promise<{ ok: boolean; error?: string }> {
    this.emit({ phase: "syncing", error: null });
    try {
      if (direction === "pull") {
        const res = (await pullLibraryFn({ data: { code } })) as PullResult;
        if (res.found) {
          this.applyRemote(res.data, res.revision);
        } else {
          // Nothing in the cloud yet — seed it from this device instead.
          const pushed = await this.doPush(code, useApp.getState().lib);
          if (!pushed.ok) throw new Error(pushed.error);
        }
      } else {
        const pushed = await this.doPush(code, useApp.getState().lib);
        if (!pushed.ok) throw new Error(pushed.error);
      }
      this.emit({ connected: true, code, phase: "synced", lastSyncedAt: Date.now() });
      this.savePersisted();
      this.started = true;
      this.attach();
      return { ok: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : "Could not connect.";
      this.emit({ phase: "error", error });
      return { ok: false, error };
    }
  }

  disconnect() {
    this.detach();
    this.lastSyncedSig = null;
    this.emit({
      connected: false,
      code: null,
      phase: "idle",
      revision: 0,
      lastSyncedAt: null,
      error: null,
    });
    this.savePersisted();
  }

  /** Reconcile once: pull, adopt if newer, otherwise push local changes. */
  async syncNow(): Promise<void> {
    if (!this.status.code) return;
    if (this.inFlight) return this.inFlight;
    const run = (async () => {
      const code = this.status.code;
      if (!code) return;
      this.emit({ phase: "syncing", error: null });
      try {
        const res = (await pullLibraryFn({ data: { code } })) as PullResult;
        const localSig = signature(useApp.getState().lib);
        if (res.found && res.revision > this.status.revision && signature(res.data) !== localSig) {
          this.applyRemote(res.data, res.revision);
        } else if (this.lastSyncedSig !== localSig) {
          const pushed = await this.doPush(code, useApp.getState().lib);
          if (!pushed.ok) throw new Error(pushed.error);
        }
        this.emit({ phase: "synced", lastSyncedAt: Date.now() });
      } catch (err) {
        this.emit({ phase: "error", error: err instanceof Error ? err.message : "Sync failed." });
      }
    })();
    this.inFlight = run.finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private applyRemote(data: LibraryData, revision: number) {
    this.lastSyncedSig = signature(data);
    this.status = { ...this.status, revision };
    useApp.getState().replaceLibrary(data);
    this.savePersisted();
  }

  private async doPush(code: string, data: LibraryData): Promise<{ ok: boolean; error?: string }> {
    const sig = signature(data);
    const res = await pushLibraryFn({ data: { code, data } });
    if (!res.ok) return { ok: false, error: res.error };
    this.lastSyncedSig = sig;
    this.emit({ revision: res.revision, lastSyncedAt: Date.now() });
    this.savePersisted();
    return { ok: true };
  }

  private schedulePush() {
    if (!this.status.code) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      const code = this.status.code;
      if (!code) return;
      const lib = useApp.getState().lib;
      if (signature(lib) === this.lastSyncedSig) return; // nothing actually changed
      this.emit({ phase: "syncing", error: null });
      void this.doPush(code, lib)
        .then((r) => {
          this.emit(r.ok ? { phase: "synced" } : { phase: "error", error: r.error ?? null });
        });
    }, PUSH_DEBOUNCE_MS);
  }

  private attach() {
    this.detach();
    // Push (debounced) whenever the library changes on this device.
    this.unsubscribeStore = useApp.subscribe((state, prev) => {
      if (state.lib !== prev.lib) this.schedulePush();
    });
    // Poll the cloud so remote changes appear here, plus an immediate check
    // whenever the tab regains focus.
    this.pollTimer = setInterval(() => void this.syncNow(), POLL_MS);
    window.addEventListener("focus", this.onFocus);
    document.addEventListener("visibilitychange", this.onVisible);
  }

  private detach() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
      this.unsubscribeStore = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.pushTimer) {
      clearTimeout(this.pushTimer);
      this.pushTimer = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", this.onFocus);
      document.removeEventListener("visibilitychange", this.onVisible);
    }
  }

  private onFocus = () => void this.syncNow();
  private onVisible = () => {
    if (!document.hidden) void this.syncNow();
  };
}

export const syncManager = new SyncManager();

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    syncManager.subscribe,
    syncManager.getSnapshot,
    syncManager.getSnapshot,
  );
}
