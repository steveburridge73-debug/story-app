import { createServerFn } from "@tanstack/react-start";
import { proposeLocalCast } from "./fallback";

export type GenerateMode =
  | "auto"
  | "adapt"
  | "continue"
  | "rewrite";

export interface GenerateRequest {
  mode: GenerateMode;
  rules: string;
  title?: string;
  instructions?: string;
  setting?: string;
  themes?: string;
  categories?: string;
  length?: string;
  direction?: string;
  continuationKind?: string;
  originalStory?: string;
  originalTitle?: string;
  replacements?: Array<{
    from: string;
    toName: string;
    profile: string;
  }>;
  relationships?: string;
  referenceStories?: Array<{ title: string; content: string }>;
  characters?: Array<{ name: string; profile: string }>;
  scenario?: string;
  mustInclude?: string[];
  mustExclude?: string[];
  optionalUse?: string[];
  incidentalCharacters?: Array<{ name: string; profile: string }>;
  extraCharacters?: Array<{ name: string; role: "main" | "incidental"; profile: string }>;
  omitFooter?: boolean;
  seriesMode?: boolean;
  previousText?: string;
}

export interface PageMetaRequest {
  url: string;
}

function cap(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[truncated for length]`;
}

function grokError(status: number, raw: string) {
  let code = "";
  let detail = "";
  try {
    const parsed = JSON.parse(raw) as { code?: string; error?: string; message?: string };
    code = String(parsed.code ?? "");
    detail = String(parsed.error ?? parsed.message ?? "");
  } catch {
    detail = raw.slice(0, 240);
  }
  const blocked =
    status === 402 ||
    status === 403 ||
    status === 429 ||
    /spending-limit|credits|subscription|quota|rate.?limit/i.test(`${code} ${detail}`);
  return { blocked, code, detail };
}

function extractMessageText(raw: string) {
  try {
    const body = JSON.parse(raw) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part) {
            return String((part as { text?: string }).text ?? "");
          }
          return "";
        })
        .join("")
        .trim();
    }
  } catch {
    return "";
  }
  return "";
}

async function grokComplete(
  messages: Array<{ role: string; content: unknown }>,
  opts?: {
    maxTokens?: number;
    temperature?: number;
    timeoutMs?: number;
    reasoningEffort?: "low" | "medium" | "high";
  },
) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, blocked: true, error: "AI is not available in this environment." };
  }
  const models = ["grok-4.5", "grok-4.6"];
  let last = "Writing service is unavailable.";
  for (const model of models) {
    for (const withReasoning of [true, false]) {
      try {
        const payload: Record<string, unknown> = {
          model,
          messages,
          max_tokens: opts?.maxTokens ?? 4000,
          temperature: opts?.temperature ?? 0.9,
        };
        if (withReasoning) payload.reasoning_effort = opts?.reasoningEffort ?? "low";
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(opts?.timeoutMs ?? 25000),
        });
        const raw = await res.text();
        if (!res.ok) {
          const err = grokError(res.status, raw);
          last = err.detail || `Writing service returned ${res.status}.`;
          if (withReasoning && (res.status === 400 || /reasoning/i.test(`${err.code} ${err.detail}`))) {
            continue;
          }
          if (err.blocked) {
            return { ok: false as const, blocked: true, error: last };
          }
          break;
        }
        const text = extractMessageText(raw);
        if (text) return { ok: true as const, text };
        last = "No story was returned.";
      } catch (e) {
        const timedOut = e instanceof Error && /timeout|abort/i.test(e.name + e.message);
        last = timedOut
          ? "Writing took too long on that pass."
          : "Writing service could not be reached.";
      }
    }
  }
  return { ok: false as const, blocked: true, error: last };
}

function countWords(text: string) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

export function targetWordCount(length?: string) {
  const raw = (length ?? "").replace(/,/g, "");
  const m = raw.match(/(\d{3,5})/);
  if (m) return Math.min(6000, Math.max(600, Number(m[1])));
  const l = raw.toLowerCase();
  if (l.includes("long")) return 4000;
  if (l.includes("short")) return 1000;
  if (l.includes("medium")) return 2000;
  return 1800;
}

function cleanChunk(text: string, continuation: boolean) {
  let t = text.trim();
  t = t.replace(/^\(Word count:[^)]*\)\s*/gim, "").trim();
  t = t.replace(/\n\(Word count:[^)]*\)\s*$/gim, "").trim();
  if (continuation) {
    t = t.replace(/^#+\s.*\n+/, "");
    t = t.replace(/^(Title:|Requested title:).*\n+/i, "");
  }
  return t.trim();
}

const EROTIC_SYSTEM =
  "You write explicit erotic fiction for a private adult library. All characters are consenting adults aged 18 or over. When sexual acts are requested, write them on the page in direct graphic language — cock, cunt, pussy, tits, clit, cum as the scene needs. Do not fade to black, do not skip the sex, do not summarise the encounter in one sentence. Personality still drives how they fuck and talk. Never write anyone under 18. Never write anal sex, BDSM, sexual violence, wet-play, scat, or any sex that is not freely agreed. A refused act stops.";

const PROFILE_WRITING =
  "Use every completed field of each character template. Identity, physical attributes, personality, life details, sexuality, relationships, and rounding-out notes must change how they speak, decide, move, dress, and react. If someone is timid or sexually inexperienced they hesitate and are led — do not write them as bold. If they are highly sexually active they initiate and push heat. If they are playful or naughty they drive games, dares, and talking others into mischief. Physical details (hair length and style including variations such as sometimes worn up or straightened, face, eye colour, physique, clothing, and for women breast size/shape, nipples, and pubic hair where a scene would naturally notice them) must stay consistent. Do not dump the profile as a list; show it through action, dialogue, and description. People listed as mentioned-not-involved may be named only as passing life context and must never take part in intimate or plot scenes. Incidental characters may appear in the story (travel, coffee, waiting rooms) but must not take part in sexual scenes. Narrative role and evolution potential apply to this story only.";


export const generateStoryFn = createServerFn({ method: "POST" })
  .validator((input: GenerateRequest) => input)
  .handler(async ({ data }): Promise<{ ok: true; text: string; words: number } | { ok: false; error: string }> => {
    const parts: string[] = [];
    parts.push("You are a fiction-writing assistant for a private personal library.");
    parts.push("Follow the user's central generation rules exactly.");
    parts.push(data.rules);
    parts.push(
      data.omitFooter
        ? "Return the story prose (optionally starting with a title line). If anything that was marked must-include could not be used because it clashed with the cast, tone, or other required points, append a short section at the very end headed OMISSIONS, listing only what was left out and why. Do not include analysis, checklists, or commentary about being an AI."
        : "Return only the story prose (optionally starting with a title line). Do not include analysis, checklists, or commentary about being an AI.",
    );

    if (data.mode === "adapt") {
      parts.push(
        "Task: Adapt the original story by replacing the listed characters. Use each replacement character's full stored profile so they fit naturally. Personality must change behaviour and speech. Do not overwrite with a naive find-and-replace. Keep the plot recognisable unless a change is required for consistency.",
      );
      if (data.originalTitle) parts.push(`Original title: ${data.originalTitle}`);
      if (data.originalStory) parts.push(`ORIGINAL STORY:\n${cap(data.originalStory, 24000)}`);
      if (data.replacements?.length) {
        parts.push(
          "REPLACEMENTS:\n" +
            data.replacements
              .map((r) => `- "${r.from}" → ${r.toName}\n${r.profile}`)
              .join("\n\n"),
        );
      }
      if (data.relationships) parts.push(`KNOWN RELATIONSHIPS:\n${data.relationships}`);
    } else if (data.mode === "continue") {
      parts.push(
        `Task: Write a ${data.continuationKind || "direct continuation"} that maintains continuity with the previous material.`,
      );
      if (data.originalStory) parts.push(`PREVIOUS STORY:\n${cap(data.originalStory, 18000)}`);
      if (data.referenceStories?.length) {
        parts.push(
          "EARLIER SERIES STORIES:\n" +
            data.referenceStories
              .map((s) => `### ${s.title}\n${cap(s.content, 6000)}`)
              .join("\n\n"),
        );
      }
    } else if (data.mode === "rewrite") {
      parts.push("Task: Rewrite the story according to the instructions while keeping it original and natural.");
      if (data.originalStory) parts.push(`STORY:\n${cap(data.originalStory, 24000)}`);
    } else {
      parts.push(
        data.referenceStories?.length
          ? "Task: Write an original story inspired by the reference material. Analyse style, tone, pacing, structure, and point of view, then write something new. Do not concatenate or reproduce the references."
          : "Task: Write an original story from the brief below. Do not invent a different brief.",
      );
      if (data.referenceStories?.length) {
        parts.push(
          "REFERENCE STORIES:\n" +
            data.referenceStories
              .map((s) => `### ${s.title}\n${cap(s.content, 5000)}`)
              .join("\n\n"),
        );
      }
    }

    if (data.title) parts.push(`Requested title: ${data.title}`);
    if (data.characters?.length) {
      parts.push(
        "CHARACTERS TO FEATURE:\n" +
          data.characters.map((c) => `- ${c.name}\n${c.profile}`).join("\n\n"),
      );
    }
    if (data.incidentalCharacters?.length) {
      parts.push(
        "INCIDENTAL CHARACTERS — they may appear in the story (travel, waiting, coffee, small talk) but must not take part in sexual scenes:\n" +
          data.incidentalCharacters.map((c) => `- ${c.name}\n${c.profile}`).join("\n\n"),
      );
    }
    if (data.extraCharacters?.length) {
      parts.push(
        "EXTRA CHARACTERS CREATED FOR THIS STORY:\n" +
          data.extraCharacters
            .map(
              (c) =>
                `- ${c.name} (${c.role === "incidental" ? "incidental — not in sexual scenes" : "main — involved in sexual scenes"})\n${c.profile}`,
            )
            .join("\n\n"),
      );
    }
    if (
      data.characters?.length ||
      data.replacements?.length ||
      data.incidentalCharacters?.length ||
      data.extraCharacters?.length
    ) {
      parts.push(PROFILE_WRITING);
    }
    if (data.scenario) parts.push(`SCENARIO:\n${data.scenario}`);
    if (data.setting) parts.push(`Setting: ${data.setting}`);
    if (data.themes) parts.push(`Themes: ${data.themes}`);
    if (data.categories) parts.push(`STORY CATEGORIES / TROPES:\n${data.categories}`);
    if (data.length) parts.push(`Approximate length: ${data.length}`);
    if (data.direction) parts.push(`General direction: ${data.direction}`);
    if (data.mustInclude?.length) {
      parts.push(
        "MUST WEAVE INTO THE STORY — required, not optional. Honour every point unless it is impossible given the cast. If impossible, omit it and list it under OMISSIONS:\n" +
          data.mustInclude.map((p, i) => `${i + 1}. ${p}`).join("\n"),
      );
    }
    if (data.mustExclude?.length) {
      parts.push(
        "MUST NOT INCLUDE — do not use these at all:\n" +
          data.mustExclude.map((p, i) => `${i + 1}. ${p}`).join("\n"),
      );
    }
    if (data.optionalUse?.length) {
      parts.push(
        "OPTIONAL — use only if they fit naturally:\n" +
          data.optionalUse.map((p, i) => `${i + 1}. ${p}`).join("\n"),
      );
    }
    if (data.instructions) parts.push(`Additional instructions: ${data.instructions}`);
    if (data.relationships && data.mode !== "adapt") {
      parts.push(`KNOWN RELATIONSHIPS:\n${data.relationships}`);
    }

    if (data.mode === "continue" || data.seriesMode) {
      parts.push(
        "SERIES CONTINUITY: This story is part of a Story Series. Remember everything that happened in earlier stories of this series — events, first times, sexual history, relationship changes, and established facts. Isolation does not apply.",
      );
    } else if (data.mode === "auto" || data.mode === "rewrite") {
      parts.push(
        "STORY ISOLATION: This is a standalone story. Do not inherit events, first-times, sexual history, or relationship changes from any other stored story. If these people have been intimate in another standalone story, they have not been intimate in this one unless this brief says so. Treat this as fresh continuity.",
      );
    }

    if (data.length) {
      const target = targetWordCount(data.length);
      parts.push(
        `LENGTH IS MANDATORY: write about ${target} words, not a sketch. Approximate label: ${data.length}. Keep going through buildup, the sexual encounter on the page, and aftermath until that length is met.`,
      );
    }

    const wantsSex =
      (data.mustInclude ?? []).some((p) => /sexual act:/i.test(p)) ||
      /sexual act|vaginal|fellatio|cunnilingus|tit[- ]?wank|breast|kissing|snogging|flashing|teasing|sensual touch|coitus|oral sex|handjob|fingering|masturbat/i.test(
        `${data.direction ?? ""} ${data.instructions ?? ""} ${data.themes ?? ""} ${data.categories ?? ""} ${data.scenario ?? ""}`,
      );
    if (wantsSex) {
      parts.push(
        "SEX ON THE PAGE: the requested sexual acts must be written explicitly, in scene, with bodies, sensation, and talk. Use direct words. Do not fade to black. Do not summarise the sex in one sentence.",
      );
    }

    const target = targetWordCount(data.length);
    const previous = (data.previousText ?? "").trim();
    const have = countWords(previous);
    const remaining = Math.max(700, target - have);
    const aim = Math.min(1200, remaining);
    const brief = parts.join("\n\n");
    const compact = [
      data.title && `Title: ${data.title}`,
      `Target length: ${target} words. Already written: ${have}.`,
      wantsSex ? "Keep the requested sexual acts explicit and on the page. Do not fade to black." : "",
      data.mustInclude?.length ? `Must include: ${data.mustInclude.join("; ")}` : "",
      data.mustExclude?.length ? `Must not include: ${data.mustExclude.join("; ")}` : "",
      (data.characters ?? []).length
        ? `People: ${(data.characters ?? []).map((c) => c.name).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const user = previous
      ? `${compact}\n\nCONTINUE the story. Do not restart, recap, or retitle. Write the next ${aim} words in the same voice and continuity. If sex is underway or due, keep it explicit on the page. Current words: ${have}. Target: ${target}.\n\nSTORY SO FAR:\n${previous.slice(-10000)}`
      : `${brief}\n\nWrite the opening, about ${aim} words. Begin the scene. If sexual acts are required, move toward them — do not spend the whole opening on small talk. Finished target is ${target} words; this is only the first stretch.`;

    const written = await grokComplete(
      [
        { role: "system", content: EROTIC_SYSTEM },
        { role: "user", content: user },
      ],
      {
        maxTokens: Math.round(aim * 2.2) + 1400,
        temperature: 0.92,
        timeoutMs: 90000,
        reasoningEffort: "low",
      },
    );
    if (!written.ok) {
      return { ok: false as const, error: written.error };
    }
    const piece = cleanChunk(written.text, Boolean(previous));
    if (!piece) {
      return { ok: false as const, error: "No story was returned." };
    }
    const story = previous ? `${previous.trim()}\n\n${piece}` : piece;
    return { ok: true as const, text: story.trim(), words: countWords(story) };
  });

export interface ProposedCastMember {
  name: string;
  gender: "Female" | "Male";
  physique: string;
  background: string;
  quirks: string;
  physicalTraits: string;
  mentalTraits: string;
}

export const proposeCharactersFn = createServerFn({ method: "POST" })
  .validator(
    (input: {
      role: "main" | "incidental";
      count: number;
      avoidNames: string[];
      brief: string;
      rules: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<
    | { ok: true; people: ProposedCastMember[]; local?: boolean }
    | { ok: false; error: string }
  > => {
    const count = Math.max(1, Math.min(6, Math.floor(data.count) || 1));
    const local = () => ({
      ok: true as const,
      people: proposeLocalCast({
        role: data.role,
        count,
        avoidNames: data.avoidNames ?? [],
      }),
      local: true as const,
    });
    const written = await grokComplete(
      [
        {
          role: "system",
          content: "Invent adult (18+) fictional people for a private story. Reply with JSON only.",
        },
        {
          role: "user",
          content: [
            `Invent ${count} ${data.role === "incidental" ? "incidental (present in scenes but not sexual)" : "main (involved in sexual scenes)"} adult character(s).`,
            "Keep each field to one or two short sentences. Not a full biography. All 18+.",
            data.avoidNames.length ? `Do not reuse these names: ${data.avoidNames.join(", ")}.` : "",
            data.brief ? `Story brief:\n${data.brief}` : "",
            'Return a JSON array of objects with keys: name, gender ("Female" or "Male"), physique, background, quirks, physicalTraits, mentalTraits.',
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      { maxTokens: 1800, temperature: 0.95 },
    );
    if (!written.ok) return local();
    const raw = written.text;
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start < 0 || end <= start) return local();
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as ProposedCastMember[];
      const people = (Array.isArray(parsed) ? parsed : [])
        .slice(0, count)
        .map((p) => ({
          name: String(p.name || "Unnamed").trim() || "Unnamed",
          gender: p.gender === "Male" ? ("Male" as const) : ("Female" as const),
          physique: String(p.physique || "").trim(),
          background: String(p.background || "").trim(),
          quirks: String(p.quirks || "").trim(),
          physicalTraits: String(p.physicalTraits || "").trim(),
          mentalTraits: String(p.mentalTraits || "").trim(),
        }));
      if (!people.length) return local();
      return { ok: true as const, people };
    } catch {
      return local();
    }
  });

export const readScreenshotFn = createServerFn({ method: "POST" })
  .validator((input: { imageDataUrl: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Screenshot reading is not available here. Type or paste this page, or upload a TXT, DOCX or PDF file.",
      };
    }
    const image = data.imageDataUrl.trim();
    if (!image.startsWith("data:image/")) {
      return { ok: false as const, error: "That does not look like an image." };
    }
    if (image.length > 8_000_000) {
      return { ok: false as const, error: "That screenshot is too large. Crop closer and try again." };
    }
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: [
          {
            role: "system",
            content:
              "You transcribe story text from screenshots. Return only the transcribed prose. Preserve paragraph breaks and dialogue. Do not summarise, translate, caption, or add notes. If there is no readable story text, return an empty response.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the story text from this screenshot exactly as written.",
              },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 4000,
        temperature: 0,
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `Could not read that screenshot (${res.status}).` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "No text could be read from that screenshot." };
    return { ok: true as const, text };
  });

export const analysePersonPhotosFn = createServerFn({ method: "POST" })
  .validator((input: { images: string[] }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Photo analysis is not available here. You can still type the physical description.",
      };
    }
    const images = data.images
      .filter((img) => img.startsWith("data:image/") && img.length <= 8_000_000)
      .slice(0, 3);
    if (!images.length) {
      return { ok: false as const, error: "No usable photos to analyse." };
    }
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: `These photos are of one consenting adult (18+) fictional character for a private writing library. If any person appears under 18, return only {"underage":true}.

Otherwise return JSON only:
{
  "underage": false,
  "gender": "Female" or "Male",
  "breastSize": "UK/US bra size such as 36DD or 28B if Female and estimable, else empty string",
  "physicalDescription": "A natural paragraph covering visible appearance. If a detail is not visible, omit it rather than inventing. Observational, not pornographic.",
  "fields": {
    "height": "",
    "weight": "",
    "build": "",
    "skinTone": "",
    "eyeColor": "",
    "hairColor": "",
    "hairstyle": "Most common style. If photos show different styles, say so (sometimes worn up, sometimes straightened).",
    "hairLength": "",
    "facialHair": "Male only, else empty",
    "breastDescription": "Female only if visible: shape, size, how they sit. Else empty",
    "faceShape": "",
    "distinguishingFeatures": "Freckles, tattoos, piercings, moles, scars, glasses",
    "handFeatures": "",
    "genitalDescription": "Only if visible. Female: labia/pubic hair. Male: size/shape/pubic hair. Else empty",
    "postureGait": "",
    "otherPhysical": "Fitness, unique visible traits"
  }
}
Leave a field as an empty string if it cannot be seen. Do not invent.`,
      },
      ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ];
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        messages: [
          {
            role: "system",
            content:
              "You catalogue adult (18+) character appearance from reference photos for a private fiction library. Describe visible anatomy factually, including breasts, nipples, and pubic hair when they are visible. Return JSON only.",
          },
          { role: "user", content },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `Could not analyse those photos (${res.status}).` };
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content?.trim() ?? "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return { ok: false as const, error: "No description could be read from those photos." };
    }
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as {
        underage?: boolean;
        gender?: string;
        breastSize?: string;
        physicalDescription?: string;
        fields?: Record<string, string>;
      };
      if (parsed.underage) {
        return {
          ok: false as const,
          error: "Those photos look like they may include someone under 18. Description was not saved.",
        };
      }
      const gender =
        parsed.gender === "Female" || parsed.gender === "Male" ? parsed.gender : "";
      const breastSize = gender === "Female" ? (parsed.breastSize ?? "").trim() : "";
      const physicalDescription = (parsed.physicalDescription ?? "").trim();
      const fields: Record<string, string> = {};
      if (parsed.fields && typeof parsed.fields === "object") {
        for (const [k, v] of Object.entries(parsed.fields)) {
          if (typeof v === "string" && v.trim()) fields[k] = v.trim();
        }
      }
      if (breastSize && !fields.breastSize) fields.breastSize = breastSize;
      if (!physicalDescription && !Object.keys(fields).length) {
        return { ok: false as const, error: "No physical description could be written from those photos." };
      }
      return {
        ok: true as const,
        gender,
        breastSize,
        physicalDescription,
        fields,
      };
    } catch {
      return { ok: false as const, error: "No description could be read from those photos." };
    }
  });

export const narrateStoryFn = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Studio narration is not available in this environment." };
    }
    const text = data.text.replace(/\s+/g, " ").trim().slice(0, 3500);
    if (!text) return { ok: false as const, error: "Nothing to narrate." };
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text, voice_id: "eve" }),
    });
    if (!res.ok) {
      return { ok: false as const, error: `Narration service returned ${res.status}.` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "audio/mpeg";
    return {
      ok: true as const,
      dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
      mimeType: mime,
    };
  });

export const fetchPageMetaFn = createServerFn({ method: "POST" })
  .validator((input: PageMetaRequest) => input)
  .handler(async ({ data }) => {
    try {
      let url = data.url.trim();
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      const parsed = new URL(url);
      const res = await fetch(parsed.toString(), {
        headers: { "User-Agent": "TopShelfLibrary/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        return {
          ok: true as const,
          title: parsed.hostname,
          websiteName: parsed.hostname.replace(/^www\./, ""),
          url: parsed.toString(),
        };
      }
      const html = cap(await res.text(), 200000);
      const ogTitle =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
      const siteName =
        html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)?.[1] ||
        parsed.hostname.replace(/^www\./, "");
      const decode = (s: string) =>
        s
          .replace(/&/g, "&")
          .replace(/</g, "<")
          .replace(/>/g, ">")
          .replace(/"/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/'/g, "'")
          .trim();
      return {
        ok: true as const,
        title: decode(ogTitle || titleTag || parsed.hostname),
        websiteName: decode(siteName),
        url: parsed.toString(),
      };
    } catch {
      return { ok: false as const, error: "Could not read that page. Enter the title manually." };
    }
  });
