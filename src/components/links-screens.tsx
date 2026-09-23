import { useEffect, useMemo, useState } from "react";
import { BookOpen, Copy, Newspaper, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { fetchPageMetaFn } from "@/lib/generation/api";
import type { WebsiteLink } from "@/lib/library/types";
import {
  PORN_MAG_EXCLUDED,
  PORN_MAG_GROUPS,
  PORN_MAG_INCLUDED,
  PORN_MAGS_PREFIX,
  isPornMagLink,
  pornMagGroupLabel,
} from "@/lib/library/seed-links";
import { useApp } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { BookmarkBtn, Screen } from "./chrome";
import { TagPicker } from "./pickers";
import { Button, Chip, EmptyState, Field, Input, ListRow, Textarea } from "./ui";

function openLink(url: string) {
  if (!url.trim()) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function LinksHub() {
  const push = useApp((s) => s.push);
  const links = useApp((s) => s.lib.links);
  const magCount = links.filter(isPornMagLink).length;
  const otherCount = links.filter((l) => !isPornMagLink(l)).length;

  return (
    <Screen title="Website Links">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Saved sites open in the device browser. Pages are not copied into Stories.
      </p>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => push({ view: "porn-mags", title: "Porn mags" })}
          className="flex items-center gap-3 rounded-lg border border-accent/40 bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <Newspaper className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Porn mags</span>
            <span className="block text-sm text-muted">
              Historical adult magazine archives, 1950s–2010s
              {magCount ? ` · ${magCount}` : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => push({ view: "links-list", title: "Bookmarks" })}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <BookOpen className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Your bookmarks</span>
            <span className="block text-sm text-muted">
              Sites you have added
              {otherCount ? ` · ${otherCount}` : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            const l = useApp.getState().newLink();
            useApp.getState().upsertLink(l);
            push({ view: "link-edit", id: l.id, title: "New link" });
          }}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-4 text-left"
        >
          <span className="flex size-11 items-center justify-center rounded-md bg-raised text-accent">
            <Plus className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium">Add a link</span>
            <span className="block text-sm text-muted">Save any website or page</span>
          </span>
        </button>
      </div>
    </Screen>
  );
}

export function PornMagsScreen() {
  const links = useApp((s) => s.lib.links);
  const push = useApp((s) => s.push);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const byId = useMemo(() => new Map(links.map((l) => [l.id, l])), [links]);
  const extras = links.filter(
    (l) =>
      isPornMagLink(l) &&
      !PORN_MAG_GROUPS.some((g) => g.linkIds.includes(l.id)),
  );

  const needle = q.trim().toLowerCase();
  function matches(l: WebsiteLink) {
    if (!needle) return true;
    return `${l.title} ${l.url} ${l.websiteName} ${l.description} ${l.notes} ${l.category}`
      .toLowerCase()
      .includes(needle);
  }

  const shownGroups = PORN_MAG_GROUPS.filter((g) => !group || g.id === group);

  return (
    <Screen title="Porn mags">
      <p className="mb-2 text-sm leading-relaxed text-muted">
        Historical adult, erotic and taboo magazine archives, 1950s–2010s. Tap a title to open it
        in the browser.
      </p>
      <p className="mb-2 text-xs font-medium text-subtle">Included</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PORN_MAG_INCLUDED.map((c) => (
          <span
            key={c}
            className="rounded-full border border-border bg-raised px-2.5 py-1 text-[11px] text-muted"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="mb-2 text-xs font-medium text-subtle">Excluded</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {PORN_MAG_EXCLUDED.map((c) => (
          <span
            key={c}
            className="rounded-full border border-border bg-raised px-2.5 py-1 text-[11px] text-subtle line-through"
          >
            {c}
          </span>
        ))}
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search archives"
        className="mb-2"
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip active={!group} onClick={() => setGroup("")}>
          All
        </Chip>
        {PORN_MAG_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>

      {shownGroups.map((g) => {
        const ids = group
          ? g.linkIds
          : g.linkIds.filter((id) => pornMagGroupLabel(byId.get(id)?.category ?? "") === g.label);
        const items = ids
          .map((id) => byId.get(id))
          .filter((l): l is WebsiteLink => Boolean(l && matches(l)));
        const more = extras.filter(
          (l) => pornMagGroupLabel(l.category) === g.label && matches(l),
        );
        const rows = [...items, ...more.filter((m) => !items.some((i) => i.id === m.id))];
        if (!rows.length) return null;
        return (
          <section key={g.id} className="mb-6">
            <h2 className="mb-1 font-display text-lg">{g.label}</h2>
            <p className="mb-3 text-sm leading-relaxed text-muted">{g.blurb}</p>
            {rows.map((l) => (
              <MagRow
                key={l.id}
                link={l}
                onOpen={() => {
                  useApp.getState().track("link", l.id);
                  openLink(l.url);
                }}
                onEdit={() => push({ view: "link-edit", id: l.id, title: "Edit link" })}
              />
            ))}
          </section>
        );
      })}
      {(() => {
        const known = new Set(PORN_MAG_GROUPS.flatMap((g) => g.linkIds));
        const groupLabels = new Set(PORN_MAG_GROUPS.map((g) => g.label));
        const leftover = extras.filter(
          (l) =>
            matches(l) &&
            !known.has(l.id) &&
            !groupLabels.has(pornMagGroupLabel(l.category)),
        );
        if (group || leftover.length === 0) return null;
        return (
          <section className="mb-6">
            <h2 className="mb-3 font-display text-lg">Added by you</h2>
            {leftover.map((l) => (
              <MagRow
                key={l.id}
                link={l}
                onOpen={() => {
                  useApp.getState().track("link", l.id);
                  openLink(l.url);
                }}
                onEdit={() => push({ view: "link-edit", id: l.id, title: "Edit link" })}
              />
            ))}
          </section>
        );
      })()}
    </Screen>
  );
}

function MagRow({
  link,
  onOpen,
  onEdit,
}: {
  link: WebsiteLink;
  onOpen: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="mb-2 rounded-lg border border-border bg-surface px-3 py-3">
      <button type="button" className="w-full text-left" onClick={onOpen}>
        <p className="text-[15px] font-medium leading-snug">{link.title || link.websiteName || link.url}</p>
        <p className="mt-0.5 text-xs text-subtle">{link.websiteName || link.url}</p>
        {link.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{link.description}</p>
        ) : null}
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" className="text-xs text-muted" onClick={onEdit}>
          Edit
        </button>
        {link.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
      </div>
    </div>
  );
}

export function LinksList() {
  const links = useApp((s) => s.lib.links);
  const push = useApp((s) => s.push);
  const create = useApp((s) => s.newLink);
  const upsert = useApp((s) => s.upsertLink);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const own = links.filter((l) => !isPornMagLink(l));
  const cats = [...new Set(own.map((l) => l.category).filter(Boolean))];
  const shown = own.filter((l) => {
    const t = q.trim().toLowerCase();
    const hit =
      !t ||
      `${l.title} ${l.url} ${l.websiteName} ${l.description} ${l.notes}`.toLowerCase().includes(t);
    return hit && (!filter || l.category === filter);
  });

  return (
    <Screen title="Your bookmarks">
      <Button
        className="mb-3 w-full"
        onClick={() => {
          const l = create();
          upsert(l);
          push({ view: "link-edit", id: l.id, title: "New link" });
        }}
      >
        Add link
      </Button>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search links" className="mb-2" />
      {cats.length ? (
        <select
          className="mb-3 h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : null}
      {shown.length === 0 ? (
        <EmptyState
          title="No bookmarks yet"
          body="Save websites and individual pages here. Historical magazine archives live under Porn mags."
        />
      ) : (
        shown.map((l) => (
          <ListRow
            key={l.id}
            title={l.title || l.websiteName || l.url}
            subtitle={l.websiteName || l.url}
            onClick={() => {
              useApp.getState().track("link", l.id);
              openLink(l.url);
            }}
            trailing={
              <span className="flex items-center gap-1">
                {l.favourite ? <Star className="size-4 fill-accent text-accent" /> : null}
                <button
                  type="button"
                  className="text-xs text-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    push({ view: "link-edit", id: l.id, title: "Edit link" });
                  }}
                >
                  Edit
                </button>
              </span>
            }
          />
        ))
      )}
    </Screen>
  );
}

const MAG_CATEGORIES = PORN_MAG_GROUPS.map((g) => `${PORN_MAGS_PREFIX} · ${g.label}`);

export function LinkEdit() {
  const id = useApp((s) => s.nav[s.nav.length - 1]?.id);
  const existing = useApp((s) => s.lib.links.find((l) => l.id === id));
  const lib = useApp((s) => s.lib);
  const upsert = useApp((s) => s.upsertLink);
  const upsertTag = useApp((s) => s.upsertTag);
  const toggle = useApp((s) => s.toggleLinkFav);
  const askConfirm = useApp((s) => s.askConfirm);
  const deleteLink = useApp((s) => s.deleteLink);
  const back = useApp((s) => s.back);
  const closeConfirm = useApp((s) => s.closeConfirm);
  const [draft, setDraft] = useState<WebsiteLink | null>(existing ?? null);
  const [fetching, setFetching] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(existing ?? null);
  }, [existing?.id]);

  if (!draft) {
    return (
      <Screen title="Link">
        <p className="text-sm text-muted">Link not found.</p>
      </Screen>
    );
  }

  function patch(p: Partial<WebsiteLink>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  async function lookup() {
    if (!draft?.url.trim()) return;
    setFetching(true);
    const result = await fetchPageMetaFn({ data: { url: draft.url } });
    setFetching(false);
    if (result.ok) {
      patch({
        url: result.url,
        title: draft.title || result.title,
        websiteName: draft.websiteName || result.websiteName,
      });
    }
  }

  const otherCats = [
    ...new Set(
      lib.links
        .map((l) => l.category)
        .filter((c) => c && !MAG_CATEGORIES.includes(c)),
    ),
  ];

  return (
    <Screen
      title={draft.title || "Website link"}
      actions={<BookmarkBtn on={draft.favourite} onClick={() => toggle(draft.id)} />}
    >
      <Field label="URL">
        <Input
          value={draft.url}
          onChange={(e) => patch({ url: e.target.value })}
          onBlur={() => void lookup()}
          placeholder="https://"
        />
      </Field>
      <Button variant="secondary" size="sm" className="mb-3" disabled={fetching} onClick={() => void lookup()}>
        {fetching ? "Reading page…" : "Fetch title"}
      </Button>
      <Field label="Title">
        <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="Website name">
        <Input value={draft.websiteName} onChange={(e) => patch({ websiteName: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="Category">
        <select
          className="mb-2 h-11 w-full rounded-md border border-border bg-raised px-3 text-base"
          value={MAG_CATEGORIES.includes(draft.category) ? draft.category : draft.category ? "__other__" : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__other__") patch({ category: draft.category.startsWith(PORN_MAGS_PREFIX) ? "" : draft.category });
            else patch({ category: v });
          }}
        >
          <option value="">Uncategorised</option>
          <optgroup label="Porn mags">
            {MAG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </optgroup>
          {otherCats.length ? (
            <optgroup label="Other">
              {otherCats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          ) : null}
          <option value="__other__">Custom…</option>
        </select>
        {!MAG_CATEGORIES.includes(draft.category) ? (
          <Input
            value={draft.category}
            placeholder="Custom category"
            onChange={(e) => patch({ category: e.target.value })}
          />
        ) : null}
      </Field>
      <TagPicker
        tags={lib.tags}
        selected={draft.tagIds}
        onChange={(tagIds) => patch({ tagIds })}
        onCreate={upsertTag}
      />
      <Field label="Notes">
        <Textarea value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} />
      </Field>
      <p className="mb-3 text-xs text-subtle">Added {formatDate(draft.addedAt)}</p>
      <Button
        className="w-full"
        onClick={() => {
          upsert({ ...draft, title: draft.title.trim() || draft.websiteName || draft.url });
          back();
        }}
      >
        Save
      </Button>
      <Button
        variant="secondary"
        className="mt-2 w-full"
        onClick={() => {
          if (draft.url) openLink(draft.url);
        }}
      >
        Open in browser
      </Button>
      <Button
        variant="secondary"
        className="mt-2 w-full"
        onClick={async () => {
          if (!draft.url) return;
          await navigator.clipboard.writeText(draft.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        <Copy className="size-4" /> {copied ? "Copied" : "Copy URL"}
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={back}>
        Cancel
      </Button>
      <Button
        variant="danger"
        className="mt-6 w-full"
        onClick={() =>
          askConfirm({
            title: "Delete this link?",
            body: "Stories are not affected.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => {
              deleteLink(draft.id);
              closeConfirm();
              back();
            },
          })
        }
      >
        <Trash2 className="size-4" /> Delete link
      </Button>
      <span className="hidden">
        <Pencil />
      </span>
    </Screen>
  );
}
