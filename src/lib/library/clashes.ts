import type { Character, DynamicOption } from "./types";
import { normalizeGender } from "./types";

function hay(opt: DynamicOption) {
  return `${opt.name} ${opt.description}`.toLowerCase();
}

export function actNeedsMale(opt: DynamicOption) {
  return /penile|fellatio|vaginal intercourse|coitus|intercrural|\bhandjob\b|tit wank|tit-wank|titfuck/.test(
    hay(opt),
  );
}

export function actNeedsFemale(opt: DynamicOption) {
  return /cunnilingus|vulva|clitoris|breast play|breast touching|tit wank|tit-wank|fingering/.test(
    hay(opt),
  );
}

export function sexualCast(people: Pick<Character, "gender">[]) {
  const genders = people.map((p) => normalizeGender(p.gender));
  return {
    male: genders.some((g) => g === "Male"),
    female: genders.some((g) => g === "Female"),
  };
}

export function clashNotes(opts: {
  includeActs: DynamicOption[];
  includeThemes: DynamicOption[];
  mains: Pick<Character, "name" | "gender">[];
}): string[] {
  const notes: string[] = [];
  const { male, female } = sexualCast(opts.mains);
  if (!opts.mains.length) return notes;
  for (const a of opts.includeActs) {
    if (!male && actNeedsMale(a)) {
      notes.push(
        `${a.name} needs a male among the main (sexual) cast — omit it if the cast stays as set.`,
      );
    }
    if (!female && actNeedsFemale(a)) {
      notes.push(
        `${a.name} needs a female among the main (sexual) cast — omit it if the cast stays as set.`,
      );
    }
  }
  const themeNames = opts.includeThemes.map((t) => t.name.toLowerCase());
  if (themeNames.includes("medical") && themeNames.includes("education")) {
    notes.push(
      "Medical + Education together can work as a medical school or training placement; use that if both stay in.",
    );
  }
  return notes;
}
