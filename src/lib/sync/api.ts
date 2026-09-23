import { createServerFn } from "@tanstack/react-start";
import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import type { LibraryData } from "@/lib/library/types";

// The sync code is never stored — only a salted SHA-256 of it — so the database
// row cannot be read without knowing the code. The salt is a fixed app constant
// (it only needs to make the hashes app-specific, not to be secret).
const SYNC_SALT = "top-shelf-sync-v1";
const MIN_CODE_LENGTH = 6;
const MAX_BLOB_BYTES = 40_000_000; // guard against a runaway request body

function hashCode(code: string): string {
  return createHash("sha256").update(`${SYNC_SALT}:${code}`).digest("hex");
}

function normaliseCode(code: unknown): string {
  if (typeof code !== "string") throw new Error("A sync code is required.");
  const trimmed = code.trim();
  if (trimmed.length < MIN_CODE_LENGTH) {
    throw new Error(`Sync code must be at least ${MIN_CODE_LENGTH} characters.`);
  }
  if (trimmed.length > 256) throw new Error("Sync code is too long.");
  return trimmed;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
}

export type PullResult =
  | { found: true; data: LibraryData; revision: number; updatedAt: string }
  | { found: false };

/**
 * Fetch the cloud copy for a sync code. Returns `{ found: false }` when no
 * device has ever pushed under this code yet.
 */
export const pullLibraryFn = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => input)
  .handler(async ({ data }): Promise<PullResult> => {
    const codeHash = hashCode(normaliseCode(data.code));
    const sql = await getSql();
    const rows = await sql<{
      data: LibraryData;
      revision: number;
      updated_at: unknown;
    }>`select data, revision, updated_at from library_sync where code_hash = ${codeHash}`;
    if (!rows.length) return { found: false };
    return {
      found: true,
      data: rows[0].data,
      revision: Number(rows[0].revision),
      updatedAt: toIso(rows[0].updated_at),
    };
  });

export type PushResult =
  | { ok: true; revision: number; updatedAt: string }
  | { ok: false; error: string };

/**
 * Upsert the cloud copy for a sync code, bumping the monotonic `revision` so
 * other devices can tell the cloud is newer than what they last saw.
 */
export const pushLibraryFn = createServerFn({ method: "POST" })
  .validator((input: { code: string; data: LibraryData }) => input)
  .handler(async ({ data }): Promise<PushResult> => {
    let codeHash: string;
    try {
      codeHash = hashCode(normaliseCode(data.code));
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Invalid sync code." };
    }
    if (!data.data || typeof data.data !== "object") {
      return { ok: false, error: "No library data to sync." };
    }
    const json = JSON.stringify(data.data);
    if (json.length > MAX_BLOB_BYTES) {
      return {
        ok: false,
        error: "Library is too large to sync (over 40 MB). Try removing some embedded images.",
      };
    }
    const sql = await getSql();
    const rows = await sql<{ revision: number; updated_at: unknown }>`
      insert into library_sync (code_hash, data, revision, updated_at)
      values (${codeHash}, ${json}::jsonb, 1, now())
      on conflict (code_hash) do update
        set data = excluded.data,
            revision = library_sync.revision + 1,
            updated_at = now()
      returning revision, updated_at
    `;
    return {
      ok: true,
      revision: Number(rows[0].revision),
      updatedAt: toIso(rows[0].updated_at),
    };
  });
