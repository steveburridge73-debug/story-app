import type { Character, Relationship } from "./types";
import { normalizeGender } from "./types";

export const RELATIONSHIP_GROUPS: { label: string; types: string[] }[] = [
  {
    label: "Friends",
    types: ["friend of", "close friend of", "best friend of", "acquaintance of"],
  },
  {
    label: "Romantic",
    types: ["partner of", "girlfriend of", "boyfriend of", "wife of", "husband of"],
  },
  {
    label: "Family",
    types: [
      "sister of",
      "brother of",
      "sibling of",
      "mother of",
      "father of",
      "parent of",
      "daughter of",
      "son of",
      "child of",
      "cousin of",
      "aunt of",
      "uncle of",
      "niece of",
      "nephew of",
    ],
  },
  {
    label: "Step family",
    types: [
      "stepsister of",
      "stepbrother of",
      "step-sibling of",
      "stepmother of",
      "stepfather of",
      "step-parent of",
      "stepdaughter of",
      "stepson of",
      "step-child of",
    ],
  },
  {
    label: "Other",
    types: ["colleague of", "knows"],
  },
];

export const RELATIONSHIP_SUGGESTIONS = RELATIONSHIP_GROUPS.flatMap((g) => g.types);

export function normalizeRelType(type: string): string {
  return type.trim().toLowerCase().replace(/\s+/g, " ");
}

function roleFor(
  gender: string,
  female: string,
  male: string,
  fallback: string,
): string {
  const g = normalizeGender(gender);
  if (g === "Female") return female;
  if (g === "Male") return male;
  return fallback;
}

function stem(type: string): string {
  return normalizeRelType(type)
    .replace(/^is\s+/, "")
    .replace(/\s+of$/, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Label that person B should have toward person A, given "A is {type} B".
 * Uses B's gender when the reverse is gendered (sister ↔ brother, mother ↔ son).
 */
export function inverseRelationshipType(
  type: string,
  _fromGender: string,
  toGender: string,
): string {
  const key = stem(type);
  const b = toGender;

  switch (key) {
    case "sister":
    case "brother":
    case "sibling":
      return roleFor(b, "sister of", "brother of", key === "sibling" ? "sibling of" : `${key} of`);
    case "stepsister":
    case "step sister":
    case "stepbrother":
    case "step brother":
    case "step sibling":
      return roleFor(b, "stepsister of", "stepbrother of", "step-sibling of");
    case "mother":
    case "father":
    case "parent":
      return roleFor(b, "daughter of", "son of", "child of");
    case "daughter":
    case "son":
    case "child":
      return roleFor(b, "mother of", "father of", "parent of");
    case "stepmother":
    case "step mother":
    case "stepfather":
    case "step father":
    case "step parent":
      return roleFor(b, "stepdaughter of", "stepson of", "step-child of");
    case "stepdaughter":
    case "step daughter":
    case "stepson":
    case "step son":
    case "step child":
      return roleFor(b, "stepmother of", "stepfather of", "step-parent of");
    case "girlfriend":
    case "boyfriend":
      return roleFor(b, "girlfriend of", "boyfriend of", "partner of");
    case "wife":
    case "husband":
      return roleFor(b, "wife of", "husband of", "partner of");
    case "aunt":
    case "uncle":
      return roleFor(b, "niece of", "nephew of", "niece of");
    case "niece":
    case "nephew":
      return roleFor(b, "aunt of", "uncle of", "aunt of");
    case "grandmother":
    case "grandfather":
    case "grandparent":
      return roleFor(b, "granddaughter of", "grandson of", "grandchild of");
    case "granddaughter":
    case "grandson":
    case "grandchild":
      return roleFor(b, "grandmother of", "grandfather of", "grandparent of");
    default: {
      const trimmed = type.trim();
      return trimmed || "knows";
    }
  }
}

export function formatRelationshipLabel(type: string, otherName: string): string {
  const t = type.trim();
  if (!t) return otherName;
  const pretty = t.charAt(0).toUpperCase() + t.slice(1);
  if (/\bof$/i.test(pretty)) return `${pretty} ${otherName}`.trim();
  return `${pretty} ${otherName}`.trim();
}

function sameEdge(a: Relationship, fromId: string, toId: string, type: string): boolean {
  return (
    a.fromId === fromId &&
    a.toId === toId &&
    normalizeRelType(a.type) === normalizeRelType(type)
  );
}

export function findMatchingRelationship(
  list: Relationship[],
  fromId: string,
  toId: string,
  type: string,
): Relationship | undefined {
  return list.find((r) => sameEdge(r, fromId, toId, type));
}

export function findInverseOf(
  list: Relationship[],
  rel: Relationship,
  characters: Character[],
): Relationship | undefined {
  const from = characters.find((c) => c.id === rel.fromId);
  const to = characters.find((c) => c.id === rel.toId);
  const inverse = inverseRelationshipType(rel.type, from?.gender ?? "", to?.gender ?? "");
  const exact = list.find(
    (r) => r.id !== rel.id && sameEdge(r, rel.toId, rel.fromId, inverse),
  );
  if (exact) return exact;
  return list.find((r) => {
    if (r.id === rel.id) return false;
    if (r.fromId !== rel.toId || r.toId !== rel.fromId) return false;
    const back = inverseRelationshipType(r.type, to?.gender ?? "", from?.gender ?? "");
    return normalizeRelType(back) === normalizeRelType(rel.type);
  });
}

export function ensureBidirectionalRelationships(
  relationships: Relationship[],
  characters: Character[],
  makeId: () => string,
): Relationship[] {
  const byId = new Map(characters.map((c) => [c.id, c]));
  const next = [...relationships];

  for (const rel of relationships) {
    if (!rel.fromId || !rel.toId || rel.fromId === rel.toId) continue;
    const from = byId.get(rel.fromId);
    const to = byId.get(rel.toId);
    if (!from || !to) continue;
    const inverse = inverseRelationshipType(rel.type, from.gender, to.gender);
    const exists = next.some((r) => sameEdge(r, rel.toId, rel.fromId, inverse));
    if (!exists) {
      next.push({
        id: makeId(),
        fromId: rel.toId,
        toId: rel.fromId,
        type: inverse,
      });
    }
  }
  return next;
}

export function applyRelationshipUpsert(
  list: Relationship[],
  rel: Relationship,
  characters: Character[],
  makeId: () => string,
): Relationship[] {
  if (!rel.fromId || !rel.toId || rel.fromId === rel.toId) return list;

  const from = characters.find((c) => c.id === rel.fromId);
  const to = characters.find((c) => c.id === rel.toId);
  const inverseType = inverseRelationshipType(rel.type, from?.gender ?? "", to?.gender ?? "");

  const existing = list.find((x) => x.id === rel.id);
  let next = existing
    ? list.map((x) => (x.id === rel.id ? rel : x))
    : list.some((x) => sameEdge(x, rel.fromId, rel.toId, rel.type))
      ? list
      : [...list, rel];

  if (existing) {
    const oldInverse = findInverseOf(list, existing, characters);
    if (oldInverse) {
      next = next.map((x) =>
        x.id === oldInverse.id
          ? { ...x, fromId: rel.toId, toId: rel.fromId, type: inverseType }
          : x,
      );
    } else if (!next.some((r) => sameEdge(r, rel.toId, rel.fromId, inverseType))) {
      next = [
        ...next,
        { id: makeId(), fromId: rel.toId, toId: rel.fromId, type: inverseType },
      ];
    }
    return next;
  }

  if (!next.some((r) => sameEdge(r, rel.toId, rel.fromId, inverseType))) {
    next = [
      ...next,
      { id: makeId(), fromId: rel.toId, toId: rel.fromId, type: inverseType },
    ];
  }
  return next;
}

export function removeRelationshipPair(
  list: Relationship[],
  id: string,
  characters: Character[],
): Relationship[] {
  const rel = list.find((r) => r.id === id);
  if (!rel) return list;
  const inverse = findInverseOf(list, rel, characters);
  return list.filter((r) => r.id !== id && r.id !== inverse?.id);
}
