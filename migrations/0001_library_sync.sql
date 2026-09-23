-- Cloud sync for the library.
--
-- The whole library is stored as one JSONB blob (same shape as the IndexedDB
-- copy and the JSON backup file), keyed by a SHA-256 hash of a user-chosen
-- "sync code". The raw code is never stored, only its hash, so a device proves
-- ownership of the row by presenting the code. A monotonic `revision` counter
-- lets each device tell when the cloud copy is newer than what it last saw.
create table if not exists library_sync (
  code_hash  text primary key,
  data       jsonb not null,
  revision   bigint not null default 1,
  updated_at timestamptz not null default now()
);
