import type { Character, PersonGender } from "./types";
import { normalizeGender } from "./types";

export interface DossierField {
  key: string;
  label: string;
  hint?: string;
  area?: boolean;
  photo?: boolean;
  gender?: PersonGender;
}

export interface DossierSection {
  id: string;
  title: string;
  fields: DossierField[];
}

function field(
  key: string,
  label: string,
  opts?: Omit<DossierField, "key" | "label">,
): DossierField {
  return { key, label, ...opts };
}

export const DOSSIER_SECTIONS: DossierSection[] = [
  {
    id: "physical",
    title: "Physical attributes",
    fields: [
      field("height", "Height", { photo: true }),
      field("weight", "Weight", { photo: true }),
      field("build", "Build / body type", {
        hint: "e.g. curvaceous, athletic, petite, hourglass, muscular, slim, stocky",
        photo: true,
      }),
      field("skinTone", "Skin tone", { photo: true }),
      field("eyeColor", "Eye colour", { photo: true }),
      field("hairColor", "Hair colour (natural)", { photo: true }),
      field("hairstyle", "Hairstyle (most commonly used)", { photo: true }),
      field("hairLength", "Hair length (most commonly used)", { photo: true }),
      field("facialHair", "Facial hair", {
        hint: "e.g. beard style, moustache, clean-shaven, stubble",
        photo: true,
        gender: "Male",
      }),
      field("breastSize", "Breast size", {
        hint: "e.g. 36DD, 28B",
        photo: true,
        gender: "Male",
      }),
      field("breastDescription", "Breast size and description", {
        hint: "Cup size, shape, how they sit or are shown",
        area: true,
        photo: true,
        gender: "Female",
      }),
      field("faceShape", "Face shape", {
        hint: "e.g. heart-shaped, oval, diamond, square, round",
        photo: true,
      }),
      field("distinguishingFeatures", "Distinguishing features", {
        hint: "e.g. freckles, tattoos, piercings, moles, scars, glasses",
        area: true,
        photo: true,
      }),
      field("handFeatures", "Hand size and features", {
        hint: "e.g. delicate, manicured nails, calloused, slender",
        photo: true,
      }),
      field("genitalDescription", "Genital description", {
        hint: "Only if you want it used in writing. Overtype anything filled from photos.",
        area: true,
        photo: true,
      }),
      field("voice", "Voice description", {
        hint: "e.g. sultry, soft, deep, gravelly, accent",
      }),
      field("postureGait", "Posture and gait", {
        hint: "e.g. graceful walk, confident sway, slouched",
        photo: true,
      }),
      field("scent", "Scent", {
        hint: "Natural or perfume / cologne preference",
      }),
      field("otherPhysical", "Other physical notes", {
        hint: "Fitness, disabilities, unique traits",
        area: true,
        photo: true,
      }),
    ],
  },
  {
    id: "personality",
    title: "Personality traits",
    fields: [
      field("corePersonality", "Core personality type", {
        hint: "e.g. introverted, extroverted, nurturing, analytical",
        area: true,
      }),
      field("strengths", "Strengths", { area: true }),
      field("weaknesses", "Weaknesses", { area: true }),
      field("humorStyle", "Humor style", { area: true }),
      field("emotionalTendencies", "Emotional tendencies", { area: true }),
      field("socialBehavior", "Social behaviour", { area: true }),
      field("quirksHabits", "Quirks or habits", { area: true }),
      field("intelligenceType", "Intelligence type", { area: true }),
      field("otherPersonality", "Other personality notes", { area: true }),
    ],
  },
  {
    id: "life",
    title: "Life details and aspirations",
    fields: [
      field("hopesDreams", "Hopes and dreams", { area: true }),
      field("fearsAnxieties", "Fears and anxieties", { area: true }),
      field("aspirations", "Aspirations", { area: true }),
      field("occupationDetails", "Job / occupation details", {
        hint: "Title, workplace, daily routine, salary range",
        area: true,
      }),
      field("vehicle", "Car / vehicle details", { area: true }),
      field("dressSense", "Dress sense", { area: true }),
      field("personalItems", "Personal items owned", { area: true }),
      field("hobbies", "Hobbies and interests", { area: true }),
      field("kryptonite", "Kryptonite / weaknesses", { area: true }),
      field("livingSituation", "Living situation", { area: true }),
      field("financialStatus", "Financial status", { area: true }),
      field("dailyRoutine", "Daily routine", { area: true }),
      field("otherLife", "Other life notes", { area: true }),
    ],
  },
  {
    id: "sexuality",
    title: "Sexuality and preferences",
    fields: [
      field("orientation", "Sexual orientation"),
      field("romanticPreferences", "Romantic preferences", { area: true }),
      field("turnOns", "Loves / turn-ons", { area: true }),
      field("dealBreakers", "No-nos / deal breakers", { area: true }),
      field("sexualQuirks", "Sexual quirks, perversions and kinks", {
        hint: "How they like to play. This changes how they behave in a story.",
        area: true,
      }),
      field("secretRevelation", "Secret / revelation", {
        hint: "Something that, if revealed, would change how others see them",
        area: true,
      }),
      field("experienceLevel", "Sexual experience level"),
      field("intimacyApproach", "Approach to intimacy"),
      field("favoriteScenarios", "Favourite scenarios", { area: true }),
      field("otherSexuality", "Other sexuality notes", { area: true }),
    ],
  },
  {
    id: "relationships",
    title: "Relationships",
    fields: [
      field("relationshipHistory", "Relationship history", { area: true }),
      field("maritalStatus", "Marital status"),
      field("currentRelationship", "Current relationship status"),
      field("connections", "Connections to other characters", {
        hint: "Name / relation — description of the dynamic. One per line.",
        area: true,
      }),
      field("familyBackground", "Family background", { area: true }),
      field("friendshipCircle", "Friendship circle", { area: true }),
      field("romanticStyle", "Romantic style", { area: true }),
      field("mentionedNotInvolved", "Mentioned, not involved", {
        hint: "People in their life who can be named in a story but must not take part. One per line.",
        area: true,
      }),
      field("otherRelationships", "Other relationship notes", { area: true }),
    ],
  },
  {
    id: "rounding",
    title: "Additional character rounding",
    fields: [
      field("backstory", "Backstory summary", { area: true }),
      field("moralCompass", "Moral compass", { area: true }),
      field("culturalBackground", "Cultural / ethnic background", { area: true }),
      field("education", "Education level"),
      field("skills", "Skills and talents", { area: true }),
      field("petPeeves", "Pet peeves", { area: true }),
      field("favoriteFoods", "Favourite foods / drinks", { area: true }),
      field("travel", "Travel experiences", { area: true }),
      field("philosophy", "Philosophical beliefs", { area: true }),
      field("healthWellness", "Health and wellness", { area: true }),
      field("signatureQuote", "Signature quote or mantra", { area: true }),
      field("otherMisc", "Other miscellaneous notes", { area: true }),
    ],
  },
];

export const PHOTO_FIELD_KEYS = DOSSIER_SECTIONS[0]!.fields
  .filter((f) => f.photo)
  .map((f) => f.key);

const LEGACY_TO_DOSSIER: Array<[keyof Character, string]> = [
  ["nickname", "nickname"],
  ["breastSize", "breastSize"],
  ["occupation", "occupationDetails"],
  ["relationshipStatus", "currentRelationship"],
  ["personality", "corePersonality"],
  ["mentalCharacteristics", "otherPersonality"],
  ["physicalDescription", "otherPhysical"],
  ["clothingStyle", "dressSense"],
  ["background", "backstory"],
  ["likes", "hobbies"],
  ["dislikes", "petPeeves"],
  ["habits", "quirksHabits"],
  ["sexualQuirks", "sexualQuirks"],
  ["sexualDeviances", "otherSexuality"],
  ["mentionedPeople", "mentionedNotInvolved"],
  ["notes", "otherMisc"],
];

export function sectionsFor(gender: string): DossierSection[] {
  const g = normalizeGender(gender);
  return DOSSIER_SECTIONS.map((section) => ({
    ...section,
    fields: section.fields.filter((f) => !f.gender || f.gender === g),
  }));
}

export function dossierGet(c: Character, key: string): string {
  if (key === "breastSize") return (c.breastSize || c.dossier?.[key] || "").trim();
  if (key === "mentionedNotInvolved") {
    return (c.dossier?.[key] || c.mentionedPeople || "").trim();
  }
  return (c.dossier?.[key] || "").trim();
}

export function dossierSet(c: Character, key: string, value: string): Character {
  const dossier = { ...(c.dossier ?? {}), [key]: value };
  if (!value) delete dossier[key];
  const next: Character = { ...c, dossier };
  if (key === "breastSize") next.breastSize = value;
  return syncCharacter(next);
}

function joinFilled(parts: Array<string | false | undefined | null>): string {
  return parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join("\n");
}

export function syncCharacter(c: Character): Character {
  const d = c.dossier ?? {};
  const gender = normalizeGender(c.gender) || c.gender;
  const breastSize = gender === "Female" ? (d.breastSize || c.breastSize || "").trim() : "";
  const mental = joinFilled([
    d.strengths && `Strengths: ${d.strengths}`,
    d.weaknesses && `Weaknesses: ${d.weaknesses}`,
    d.emotionalTendencies && `Emotional: ${d.emotionalTendencies}`,
    d.intelligenceType && `Intelligence: ${d.intelligenceType}`,
    d.otherPersonality,
  ]);
  const physical = joinFilled([
    d.height && `Height: ${d.height}`,
    d.weight && `Weight: ${d.weight}`,
    d.build && `Build: ${d.build}`,
    d.skinTone && `Skin: ${d.skinTone}`,
    d.eyeColor && `Eyes: ${d.eyeColor}`,
    d.hairColor && `Hair colour: ${d.hairColor}`,
    d.hairstyle && `Hairstyle: ${d.hairstyle}`,
    d.hairLength && `Hair length: ${d.hairLength}`,
    d.facialHair && `Facial hair: ${d.facialHair}`,
    gender === "Female" && breastSize && `Breast size: ${breastSize}`,
    d.breastDescription && `Breasts: ${d.breastDescription}`,
    d.faceShape && `Face: ${d.faceShape}`,
    d.distinguishingFeatures && `Features: ${d.distinguishingFeatures}`,
    d.handFeatures && `Hands: ${d.handFeatures}`,
    d.genitalDescription && `Genital: ${d.genitalDescription}`,
    d.voice && `Voice: ${d.voice}`,
    d.postureGait && `Posture: ${d.postureGait}`,
    d.scent && `Scent: ${d.scent}`,
    d.otherPhysical,
    c.physicalDescription && !d.otherPhysical && !d.build ? c.physicalDescription : "",
  ]);
  return {
    ...c,
    gender,
    breastSize,
    occupation: (d.occupationDetails || c.occupation || "").trim(),
    relationshipStatus: (d.currentRelationship || d.maritalStatus || c.relationshipStatus || "").trim(),
    personality: (d.corePersonality || c.personality || "").trim(),
    mentalCharacteristics: mental || c.mentalCharacteristics || "",
    physicalDescription: physical || c.physicalDescription || "",
    clothingStyle: (d.dressSense || c.clothingStyle || "").trim(),
    background: (d.backstory || c.background || "").trim(),
    likes: (d.hobbies || c.likes || "").trim(),
    dislikes: (d.petPeeves || c.dislikes || "").trim(),
    habits: (d.quirksHabits || c.habits || "").trim(),
    sexualQuirks: (d.sexualQuirks || c.sexualQuirks || "").trim(),
    sexualDeviances: (d.otherSexuality || c.sexualDeviances || "").trim(),
    mentionedPeople: (d.mentionedNotInvolved || c.mentionedPeople || "").trim(),
    notes: (d.otherMisc || c.notes || "").trim(),
    dossier: d,
  };
}

export function hydrateCharacter(raw: Character): Character {
  const dossier: Record<string, string> = { ...(raw.dossier ?? {}) };
  const hasDossier = Object.values(dossier).some((v) => (v ?? "").trim());
  if (!hasDossier) {
    for (const [legacy, key] of LEGACY_TO_DOSSIER) {
      const value = String(raw[legacy] ?? "").trim();
      if (value && !dossier[key]) dossier[key] = value;
    }
  } else {
    for (const [legacy, key] of LEGACY_TO_DOSSIER) {
      const value = String(raw[legacy] ?? "").trim();
      if (value && !dossier[key]) dossier[key] = value;
    }
  }
  return syncCharacter({
    ...raw,
    dateOfBirth: raw.dateOfBirth ?? "",
    dossier,
  });
}

export interface PhotoAnalysis {
  gender?: string;
  breastSize?: string;
  physicalDescription?: string;
  fields?: Record<string, string>;
}

export function applyPhotoAnalysis(
  person: Character,
  analysis: PhotoAnalysis,
  mode: "fillEmpty" | "overwrite",
): Character {
  const lockedGender = normalizeGender(person.gender);
  const gender = lockedGender || normalizeGender(analysis.gender || "") || person.gender;
  const fields = { ...(analysis.fields ?? {}) };
  if (analysis.breastSize && !fields.breastSize) fields.breastSize = analysis.breastSize;
  if (analysis.physicalDescription && !fields.otherPhysical && mode === "overwrite") {
    fields.otherPhysical = analysis.physicalDescription;
  }
  const dossier = { ...(person.dossier ?? {}) };
  for (const key of PHOTO_FIELD_KEYS) {
    const val = (fields[key] ?? "").trim();
    if (!val) continue;
    const current = (dossier[key] ?? "").trim();
    if (mode === "overwrite" || !current) dossier[key] = val;
  }
  const breastSize =
    gender === "Female"
      ? mode === "overwrite"
        ? (fields.breastSize || dossier.breastSize || person.breastSize || "").trim()
        : (person.breastSize || fields.breastSize || dossier.breastSize || "").trim()
      : "";
  if (breastSize) dossier.breastSize = breastSize;
  if (gender === "Female" && (breastSize || fields.breastDescription)) {
    const current = (dossier.breastDescription ?? "").trim();
    if (mode === "overwrite" || !current) {
      dossier.breastDescription = [breastSize, fields.breastDescription].filter(Boolean).join(" — ");
    }
  }
  const physicalDescription =
    mode === "overwrite" || !person.physicalDescription.trim()
      ? (analysis.physicalDescription || person.physicalDescription).trim()
      : person.physicalDescription;
  return syncCharacter({
    ...person,
    gender,
    breastSize,
    physicalDescription,
    dossier,
  });
}

export function formatCharacterProfile(
  c: Character,
  storyUse?: { narrativeRole?: string; evolutionPotential?: string },
): string {
  const gender = normalizeGender(c.gender) || c.gender;
  const lines: string[] = [];
  if (c.nickname) lines.push(`Nickname: ${c.nickname}`);
  if (c.age) lines.push(`Age: ${c.age}`);
  if (c.dateOfBirth) lines.push(`Date of birth: ${c.dateOfBirth}`);
  if (gender) lines.push(`Gender: ${gender}`);
  for (const section of sectionsFor(gender)) {
    const filled: string[] = [];
    for (const f of section.fields) {
      const value = dossierGet(c, f.key);
      if (!value) continue;
      filled.push(`${f.label}: ${value}`);
      if (f.key === "mentionedNotInvolved") {
        filled.push(
          "These people may be named only as passing life context. They must not take part in the plot, be present during intimate scenes, or be sexualised. If any mentioned person is a child or under 18 they are strictly off-screen and never appear in a sexual, romantic, or suggestive scene.",
        );
      }
    }
    if (filled.length) {
      lines.push("");
      lines.push(section.title.toUpperCase());
      lines.push(...filled);
    }
  }
  if (storyUse?.narrativeRole?.trim()) {
    lines.push("");
    lines.push(`Narrative role in this story only: ${storyUse.narrativeRole.trim()}`);
  }
  if (storyUse?.evolutionPotential?.trim()) {
    lines.push(`Evolution potential in this story only: ${storyUse.evolutionPotential.trim()}`);
    lines.push(
      "Narrative role and evolution apply to this story only. Do not treat them as permanent changes to the stored person.",
    );
  }
  return lines.filter((line, i, arr) => line !== "" || arr[i - 1] !== "").join("\n");
}
