import type { Category, DynamicKind, DynamicOption, LibraryData, Settings } from "./types";
import { DEFAULT_PASSCODE_HASH } from "./hash";
import { ensureBidirectionalRelationships } from "./relationships";
import { seedCharacters, seedRelationships } from "./seed-people";
import { seedPornMagLinks } from "./seed-links";
import { uid } from "@/lib/utils";

export const DEFAULT_GENERATION_RULES = `CENTRAL STORY GENERATION RULES
These rules apply automatically to Auto Generation, Character Replacement, Story Adaptation, Story continuation, Story Series generation, Story rewriting, and generated variations.

CHARACTERS
- All characters in newly generated or adapted stories must be consenting adults aged 18 or over.
- Do not generate characters under 18.
- If an imported or reference story contains an ambiguous age, do not assume the character is an adult. Stop and ask for clarification before using that character as generation material.

CHARACTER PROFILES
When a stored person is used in writing or character replacement, every completed field of their template must affect the result — identity, physical attributes, personality, life details, sexuality, relationships, and rounding-out notes.
- Personality and mental characteristics must change how they speak, decide, move, and react. If they are timid, they hesitate, speak softly, and avoid confrontation. Do not write them as bold. Show the trait; do not list it.
- Sexual quirks and sexual deviances must change behaviour. Someone highly sexually active pushes heat, initiates, and steers scenes toward sex. Someone sexually timid or inexperienced is led, hesitates, and does not suddenly become bold. Someone playful or naughty drives the narrative — games, dares, and talking others into things they should not.
- Physical description must stay consistent: hair length and style (including variations such as sometimes worn up or straightened), face, eye colour, physique, clothing, and for women breast size/shape, nipples, and pubic hair where a scene would naturally notice them.
- Occupation, background, likes, dislikes, habits, relationships, sexual nature, mentioned people, and notes should appear only where they make the scene more natural.

NARRATIVE ROLE AND EVOLUTION
When a person is given a narrative role or evolution potential for a particular story, those apply to that story only. Honour the role (heroine, sidekick, catalyst, and so on) and the requested arc. Do not treat them as permanent changes to the stored person.

STORY ISOLATION
A standalone story does not inherit events from any other story. First times, sexual history, and relationship changes that happened in another standalone story have not happened here. If two people have sex for the first time in one story, they have not had sex when they appear together in a different standalone story. Treat each standalone story as fresh continuity.

MENTIONED, NOT INVOLVED
A person record may list people who can be mentioned but must not take part.
- They may appear only as passing life context (for example a woman dropping her child at nursery before a hospital appointment).
- They must not take part in the plot, be present during intimate scenes, speak as scene partners, or be sexualised.
- If a mentioned person is a child or anyone under 18, they are strictly off-screen background and never appear in a sexual, romantic, or suggestive scene.

MUST WEAVE IN
When the user lists points that must be woven into the story, those points are required. Honour every item. Do not drop, reverse, or forget them.

CONTENT TO EXCLUDE
Newly generated or adapted content must exclude:
- Anal sex or anal sexual activity/play
- Urination / wet-play
- Defecation / scatological content
- Vomiting-related sexual content
- BDSM
- Sexual violence
- Non-consensual sexual activity. Non-consent means a person has not freely and willingly agreed to a sexual act. Reluctance means hesitation, doubt, or a lack of enthusiastic willingness. Generated writing may show nerves, shyness, or hesitation that becomes willing participation. It must not depict a sexual act that someone has not agreed to, and must not continue a scene after a clear refusal.

A small amount of non-explicit physical teasing, such as light tapping on the bottom, may be permitted where appropriate.

EXPLICIT SEXUAL WRITING
This is a private adult erotic library. When the brief includes sexual acts, those acts must happen on the page.
- Write sex in direct, graphic language. Do not fade to black, skip the encounter, or summarise it in one sentence.
- Use the named acts (kissing, breast touching/licking/sucking, tit wank, vaginal sex, oral, manual, and so on) as real scene work, not as a checklist.
- Anatomical and sexual words are expected where the scene would use them.
- Personality still governs how they have sex: timid people hesitate; highly sexual people push heat.
- The exclusions above still apply.

LENGTH
Honour the requested length. A short story is about 1,000 words, medium about 2,000, long about 4,000. Do not stop at a few hundred words when a long piece was asked for. Use buildup, the encounter itself, talk in between, and an aftermath. If you are continuing a draft, do not restart — keep writing until the length is met.

IMPORTED STORIES
Imported stories remain exactly as imported. Do not automatically rewrite them. These rules apply only when the user subsequently asks to rewrite, adapt, continue, generate, modify, or create a variation.

WRITING QUALITY
The writing must read naturally, as human-authored fiction, not as obvious machine text.
- Natural language and varied sentence lengths
- Natural, realistic dialogue
- Consistent character personalities and emotional realism
- Natural pacing and descriptions
- Avoid repetitive wording, unnecessary summaries, excessive exposition
- Avoid generic AI phrases and repetitive sentence structures
- Maintain continuity of characters, relationships, events, locations, and established facts
- Do not make every sentence perfectly polished or unnaturally formal. Natural variation is desirable.

STYLE WHEN REFERENCES ARE PROVIDED
Analyse the reference stories for tone, pacing, narrative approach, sentence style, dialogue style, and level of description. Guide new writing with those characteristics. Do not copy passages verbatim. The result must be original writing.

CHARACTER REPLACEMENT
Do not perform a naive global find-and-replace. When replacing a character, use their stored information (name, age, personality, physical description, occupation, background, habits, relationships, traits) so the replacement fits naturally. Change names, pronouns, descriptions, dialogue, background, occupation, interactions, and relationships where needed. If two replacement characters already have a stored relationship, use that only where it makes the narrative more natural. Do not insert relationship information unnecessarily.

SERIES CONTINUITY
When generating in an existing series, maintain continuity of characters, relationships, events, locations, character development, ongoing storylines, important previous events, established facts, first times, and sexual history from earlier stories in that series. Isolation does not apply inside a series — remember everything that happened in the series so far.
`;

export function defaultSettings(): Settings {
  return {
    passcodeHash: DEFAULT_PASSCODE_HASH,
    theme: "dark",
    autoLock: "never",
    readerFontSize: 19,
    readerTheme: "follow",
    generationRules: DEFAULT_GENERATION_RULES,
    ttsRate: 1,
  };
}

export function defaultCategories(): Category[] {
  const top = (
    id: string,
    name: string,
    order: number,
  ): Category => ({ id, name, parentId: null, order });
  const sub = (
    id: string,
    name: string,
    parentId: string,
    order: number,
  ): Category => ({ id, name, parentId, order });
  return [
    top("cat-medical", "Medical", 0),
    top("cat-massage", "Massage", 1),
    top("cat-sport", "Sport", 2),
    top("cat-holiday-travel", "Holiday & Travel", 3),
    sub("cat-holiday", "Holiday", "cat-holiday-travel", 0),
    sub("cat-travel", "Travel", "cat-holiday-travel", 1),
    top("cat-mind-control", "Mind Control", 4),
    top("cat-woman-in-charge", "Woman in Charge", 5),
    top("cat-shopping", "Shopping", 6),
    top("cat-art", "Art", 7),
    sub("cat-photography", "Photography", "cat-art", 0),
    sub("cat-drawing-painting", "Drawing & Painting", "cat-art", 1),
  ];
}

export function defaultDynamicOptions(): DynamicOption[] {
  const make = (
    kind: DynamicKind,
    items: Array<{ id: string; name: string; description: string }>,
  ): DynamicOption[] =>
    items.map((item, order) => ({
      id: `dyn-${kind}-${item.id}`,
      kind,
      name: item.name,
      description: item.description,
      order,
    }));

  return [
    ...make("length", [
      {
        id: "short",
        name: "Short (~1,000 words)",
        description:
          "A compact piece, usually one scene or a tight sequence. Enough room for setup, heat, and a complete beat without extra subplots.",
      },
      {
        id: "medium",
        name: "Medium (~2,000 words)",
        description:
          "A fuller story with a beginning, middle and end, room for dialogue, a change of beat, and a developed encounter.",
      },
      {
        id: "long",
        name: "Long (~4,000 words)",
        description:
          "A longer piece with buildup, character interiority, more than one scene, and space for the setting and relationship to breathe.",
      },
    ]),
    ...make("act", [
      {
        id: "kissing",
        name: "Kissing and snogging",
        description:
          "Mouth-to-mouth kissing, from light kisses to prolonged, hungry snogging.",
      },
      {
        id: "sensual-touch",
        name: "Sensual touch",
        description:
          "Slow, deliberate touching of skin, hair, and body that builds arousal without rushing the scene.",
      },
      {
        id: "verbal-teasing",
        name: "Verbal teasing",
        description:
          "Spoken provocation — suggestive comments, dares, or dirty talk that heightens tension.",
      },
      {
        id: "physical-teasing",
        name: "Physical teasing",
        description:
          "Hands, mouth, or body used to tease — grazing, lingering, pulling back — without immediately going further.",
      },
      {
        id: "flashing",
        name: "Flashing",
        description:
          "Briefly exposing breasts, genitals, or underwear, often in a teasing or risky moment.",
      },
      {
        id: "breast-touch",
        name: "Breast Touching / Licking / Sucking",
        description:
          "Hands, mouth, or tongue on a partner's breasts and nipples — caressing, licking, or sucking as a focus of the scene.",
      },
      {
        id: "tit-wank",
        name: "Tit Wank",
        description:
          "The penis sliding between a partner's breasts, often with oil, saliva, or pressed cleavage, until climax or as foreplay.",
      },
      {
        id: "vaginal",
        name: "Vaginal Intercourse (Coitus)",
        description: "Penile-vaginal penetration across various positions.",
      },
      {
        id: "cunnilingus",
        name: "Cunnilingus",
        description: "Oral stimulation of the vulva and clitoris.",
      },
      {
        id: "fellatio",
        name: "Fellatio",
        description: "Oral stimulation of the penis.",
      },
      {
        id: "mutual-masturbation",
        name: "Mutual Masturbation",
        description: "Simultaneous self-touch or hand stimulation between partners.",
      },
      {
        id: "manual",
        name: "Manual Stimulation (Fingering / Handjob)",
        description:
          "Direct physical touch and stimulation of a partner's genitalia using hands or fingers.",
      },
      {
        id: "frottage",
        name: "Frottage / Dry Humping",
        description:
          "Body rubbing or genitalia contact through clothes or skin-to-skin without penetration.",
      },
      {
        id: "intercrural",
        name: "Intercrural Sex",
        description: "Rubbing the penis between a partner's thighs.",
      },
      {
        id: "sensual-massage",
        name: "Sensual Massage & Body Rubbing",
        description:
          "Full-body skin-to-skin contact and physical touch to build arousal.",
      },
    ]),
    ...make("theme", [
      {
        id: "medical",
        name: "Medical",
        description:
          "Set in a doctor's surgery, hospital, clinic, dentist office, or home visit in a medical role.",
      },
      {
        id: "workplace",
        name: "Workplace / Office",
        description:
          "Set in corporate office spaces, executive suites, late-night overtime sessions, or business trips.",
      },
      {
        id: "vacation",
        name: "Vacation / Travel",
        description:
          "Set at tropical beach resorts, cruise ships, luxury hotels, or remote cabins while traveling.",
      },
      {
        id: "roommates",
        name: "Roommates / Shared Living",
        description:
          "Set in shared apartments or dormitories where close living quarters create physical proximity and tension.",
      },
      {
        id: "historical",
        name: "Historical / Period",
        description:
          "Set in past eras such as Regency England, Victorian times, or ancient civilizations.",
      },
      {
        id: "scifi-fantasy",
        name: "Sci-Fi & Fantasy",
        description:
          "Set in futuristic worlds, outer space, alien environments, or mythical realms with supernatural elements.",
      },
      {
        id: "college",
        name: "Education",
        description:
          "Set in college, university, night school, or home study — campuses, libraries, study halls, student accommodation, or lessons at home.",
      },
      {
        id: "drunk",
        name: "Drunk",
        description:
          "Alcohol is part of the scene — a night out, wine at home, or a tipsy haze. People stay consenting adults. Drink can loosen talk and nerve, not remove the ability to agree or refuse.",
      },
    ]),
    ...make("category", [
      {
        id: "exhibitionist",
        name: "Exhibitionist & Voyeur",
        description:
          "Characters who gain arousal from exposing themselves, being watched, or secretly observing others during intimate moments.",
      },
      {
        id: "celebrities",
        name: "Celebrities",
        description:
          "Public figures, celebrities, or pop-culture media characters in romantic or erotic scenarios.",
      },
      {
        id: "first-time",
        name: "First Time",
        description:
          "Characters experiencing sexual intimacy or a specific act for the first time.",
      },
      {
        id: "group",
        name: "Group Sex",
        description:
          "Three or more consenting adult participants engaging in sexual activities together.",
      },
      {
        id: "humor",
        name: "Humor & Satire",
        description:
          "Comedy, lighthearted situations, or witty dialogue woven into sexual encounters.",
      },
      {
        id: "interracial",
        name: "Interracial Love",
        description:
          "Romantic or sexual relationships between individuals of different racial or ethnic backgrounds.",
      },
      {
        id: "lesbian",
        name: "Lesbian Sex",
        description: "Romantic and sexual intimacy between women.",
      },
      {
        id: "letters",
        name: "Letters & Transcripts",
        description:
          "A format structured through written media such as personal letters, emails, text messages, or interview logs.",
      },
      {
        id: "loving-partner",
        name: "Loving Partner",
        description:
          "A devoted partner (husband, wife, girlfriend, or boyfriend) doing anything to please and satisfy their partner.",
      },
      {
        id: "mature",
        name: "Mature",
        description:
          "Middle-aged or older adult characters in romantic and sexual situations.",
      },
      {
        id: "mind-control",
        name: "Mind Control",
        description:
          "Sci-fi or fantasy scenarios involving hypnosis, telepathy, or spellwork influencing attraction or desire.",
      },
      {
        id: "romance",
        name: "Romance",
        description:
          "Emotional connection, affection, and relationship building alongside sexual intimacy.",
      },
      {
        id: "scifi-fantasy",
        name: "Sci-Fi & Fantasy",
        description:
          "Erotic encounters blended with futuristic tech, aliens, magic, or mythical creatures.",
      },
      {
        id: "taboo",
        name: "Taboo/Incest",
        description:
          "Forbidden relationship dynamics between consenting adults, such as adult step-relatives or restricted social pairings.",
      },
      {
        id: "toys",
        name: "Toys & Masturbation",
        description: "Solo intimacy, self-touch, or the use of adult sex toys.",
      },
      {
        id: "reluctance",
        name: "Non Consent & Reluctance",
        description:
          "Non-consent means a person has not freely and willingly agreed to a sexual act. Reluctance means hesitation, doubt, or a lack of enthusiastic willingness. Generated writing may use reluctance as nerves or doubt that becomes willing participation. It must not write a sexual act that has not been agreed, and must not continue after a clear refusal.",
      },
    ]),
  ];
}

const OLD_DYNAMIC_SEEDS = new Set(
  [
    "Short (~1,000 words)",
    "Medium (~2,000 words)",
    "Long (~4,000 words)",
    "Kissing and touching",
    "Oral sex",
    "Vaginal sex",
    "Manual stimulation",
    "Mutual masturbation",
    "Breast play",
    "Medical",
    "Massage",
    "Holiday",
    "Sport",
    "Shopping",
    "Woman in Charge",
    "Workplace",
    "Reunion",
    "College / University / Night School / Home Study",
  ].map((n) => n.toLowerCase()),
);

function optionStem(name: string) {
  return name.split(":")[0].trim().toLowerCase();
}

export function mergeDynamicOptions(existing: DynamicOption[] | undefined): DynamicOption[] {
  const defaults = defaultDynamicOptions();
  if (!Array.isArray(existing) || existing.length === 0) return defaults;

  const defaultIds = new Set(defaults.map((d) => d.id));
  const defaultKeys = new Set(defaults.map((d) => `${d.kind}:${optionStem(d.name)}`));

  const custom = existing
    .map((o) => ({
      ...o,
      description: typeof o.description === "string" ? o.description : "",
    }))
    .filter((o) => {
      if (defaultIds.has(o.id)) return false;
      if (OLD_DYNAMIC_SEEDS.has(optionStem(o.name))) return false;
      if (defaultKeys.has(`${o.kind}:${optionStem(o.name)}`)) return false;
      return true;
    });

  const counts: Partial<Record<DynamicKind, number>> = {};
  for (const d of defaults) counts[d.kind] = (counts[d.kind] ?? 0) + 1;

  const extra = custom.map((o) => {
    const n = counts[o.kind] ?? 0;
    counts[o.kind] = n + 1;
    return { ...o, order: n };
  });

  return [...defaults, ...extra];
}

export function migrateGenerationRules(rules: string | undefined): string {
  const next = DEFAULT_GENERATION_RULES;
  if (!rules || !rules.trim()) return next;
  let updated = rules;
  if (!updated.includes("Reluctance means hesitation")) {
    const oldBullet = "- Non-consensual sexual activity";
    if (updated.includes(oldBullet)) {
      updated = updated.replace(
        oldBullet,
        "- Non-consensual sexual activity. Non-consent means a person has not freely and willingly agreed to a sexual act. Reluctance means hesitation, doubt, or a lack of enthusiastic willingness. Generated writing may show nerves, shyness, or hesitation that becomes willing participation. It must not depict a sexual act that someone has not agreed to, and must not continue a scene after a clear refusal.",
      );
    }
  }
  if (!updated.includes("MENTIONED, NOT INVOLVED")) {
    const block = `MENTIONED, NOT INVOLVED
A person record may list people who can be mentioned but must not take part.
- They may appear only as passing life context (for example a woman dropping her child at nursery before a hospital appointment).
- They must not take part in the plot, be present during intimate scenes, speak as scene partners, or be sexualised.
- If a mentioned person is a child or anyone under 18, they are strictly off-screen background and never appear in a sexual, romantic, or suggestive scene.

MUST WEAVE IN
When the user lists points that must be woven into the story, those points are required. Honour every item. Do not drop, reverse, or forget them.

`;
    if (updated.includes("CONTENT TO EXCLUDE")) {
      updated = updated.replace("CONTENT TO EXCLUDE", `${block}CONTENT TO EXCLUDE`);
    } else {
      updated = `${updated.trim()}\n\n${block}`;
    }
  }
  if (!updated.includes("Sexual quirks and sexual deviances must change behaviour")) {
    const behaviour =
      "- Sexual quirks and sexual deviances must change behaviour. Someone highly sexually active pushes heat, initiates, and steers scenes toward sex. Someone sexually timid or inexperienced is led, hesitates, and does not suddenly become bold. Someone playful or naughty drives the narrative — games, dares, and talking others into things they should not.\n";
    if (updated.includes("- Physical description must stay consistent")) {
      updated = updated.replace(
        "- Physical description must stay consistent",
        `${behaviour}- Physical description must stay consistent`,
      );
    }
  }
  if (!updated.includes("STORY ISOLATION")) {
    const isolation = `NARRATIVE ROLE AND EVOLUTION
When a person is given a narrative role or evolution potential for a particular story, those apply to that story only. Honour the role (heroine, sidekick, catalyst, and so on) and the requested arc. Do not treat them as permanent changes to the stored person.

STORY ISOLATION
A standalone story does not inherit events from any other story. First times, sexual history, and relationship changes that happened in another standalone story have not happened here. If two people have sex for the first time in one story, they have not had sex when they appear together in a different standalone story. Treat each standalone story as fresh continuity.

`;
    if (updated.includes("MENTIONED, NOT INVOLVED")) {
      updated = updated.replace("MENTIONED, NOT INVOLVED", `${isolation}MENTIONED, NOT INVOLVED`);
    } else if (updated.includes("CONTENT TO EXCLUDE")) {
      updated = updated.replace("CONTENT TO EXCLUDE", `${isolation}CONTENT TO EXCLUDE`);
    } else {
      updated = `${updated.trim()}\n\n${isolation}`;
    }
  }
  if (
    updated.includes("SERIES CONTINUITY") &&
    !updated.includes("Isolation does not apply inside a series")
  ) {
    updated = updated.replace(
      "and established facts.",
      "established facts, first times, and sexual history from earlier stories in that series. Isolation does not apply inside a series — remember everything that happened in the series so far.",
    );
  }
  if (!updated.includes("EXPLICIT SEXUAL WRITING")) {
    const explicit = `EXPLICIT SEXUAL WRITING
This is a private adult erotic library. When the brief includes sexual acts, those acts must happen on the page.
- Write sex in direct, graphic language. Do not fade to black, skip the encounter, or summarise it in one sentence.
- Use the named acts as real scene work, not as a checklist.
- Anatomical and sexual words are expected where the scene would use them.
- Personality still governs how they have sex.
- The exclusions above still apply.

LENGTH
Honour the requested length. A short story is about 1,000 words, medium about 2,000, long about 4,000. Do not stop at a few hundred words when a long piece was asked for.

`;
    if (updated.includes("IMPORTED STORIES")) {
      updated = updated.replace("IMPORTED STORIES", `${explicit}IMPORTED STORIES`);
    } else {
      updated = `${updated.trim()}\n\n${explicit}`;
    }
  }
  return updated;
}

export function emptyLibrary(): LibraryData {
  const characters = seedCharacters();
  return {
    version: 1,
    stories: [],
    characters,
    relationships: ensureBidirectionalRelationships(
      seedRelationships(),
      characters,
      () => uid("rel"),
    ),
    characterImages: [],
    scenarios: [],
    series: [],
    categories: defaultCategories(),
    tags: [],
    dynamicOptions: defaultDynamicOptions(),
    links: seedPornMagLinks(),
    images: [],
    audiobooks: [],
    recents: [],
    settings: { ...defaultSettings(), peopleSeeded: true, pornMagsSeeded: true },
  };
}
