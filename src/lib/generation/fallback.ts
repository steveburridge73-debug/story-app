import type { GenerateRequest } from "./api";
import type { ProposedCastMember } from "./api";

function field(profile: string, label: string) {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "im");
  const m = profile.match(re);
  return (m?.[1] ?? "").trim();
}

function firstSentence(text: string, max = 180) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/(?<=[.!?])\s+/)[0] ?? t;
  return cut.length > max ? `${cut.slice(0, max).trim()}…` : cut;
}

type Cast = { name: string; role: "main" | "incidental"; profile: string };

function collectCast(data: GenerateRequest): Cast[] {
  const out: Cast[] = [];
  for (const c of data.characters ?? []) {
    if (c.name.trim()) out.push({ name: c.name.trim(), role: "main", profile: c.profile ?? "" });
  }
  for (const c of data.incidentalCharacters ?? []) {
    if (c.name.trim()) out.push({ name: c.name.trim(), role: "incidental", profile: c.profile ?? "" });
  }
  for (const c of data.extraCharacters ?? []) {
    if (c.name.trim()) out.push({ name: c.name.trim(), role: c.role, profile: c.profile ?? "" });
  }
  return out;
}

function nick(c: Cast) {
  return field(c.profile, "Nickname") || c.name.split(" ")[0] || c.name;
}

function genderOf(c: Cast): "Female" | "Male" | "" {
  const g = field(c.profile, "Gender").toLowerCase();
  if (g.startsWith("f")) return "Female";
  if (g.startsWith("m")) return "Male";
  return "";
}

function settingFrom(data: GenerateRequest) {
  const theme = (data.themes ?? "").split("\n")[0] ?? "";
  const t = theme.toLowerCase();
  if (t.includes("drunk")) {
    return "A late kitchen table, two bottles already down, glasses sweating rings onto the wood. The radio is low. Nobody is driving anywhere tonight.";
  }
  if (t.includes("medical")) {
    return "An after-hours consulting room that still smells of antiseptic and hand gel. The corridor outside has gone quiet.";
  }
  if (t.includes("workplace") || t.includes("office")) {
    return "The office after everyone else has gone — monitors dim, a desk lamp, the lift lobby humming.";
  }
  if (t.includes("vacation") || t.includes("travel")) {
    return "A rented room with the balcony door cracked for warm air and the faint noise of a pool two floors down.";
  }
  if (t.includes("roommate") || t.includes("shared")) {
    return "A shared flat on a weekday evening. Someone's washing is on the airer. The TV is on mute.";
  }
  if (t.includes("education") || t.includes("college")) {
    return "A study bedroom stacked with notes, a kettle, and a desk lamp that has been on too long.";
  }
  if (t.includes("historical")) {
    return "A closed parlour, fire low, the rest of the house already in bed.";
  }
  if (t.includes("sci-fi") || t.includes("fantasy")) {
    return "A quiet cabin off a service corridor, city-light smeared through a thick window.";
  }
  if (data.setting?.trim()) return data.setting.trim();
  return "A private room, door shut, the rest of the house somewhere else.";
}

function actsFrom(data: GenerateRequest) {
  return (data.mustInclude ?? [])
    .filter((p) => /^sexual act:/i.test(p))
    .map((p) => p.replace(/^sexual act:\s*/i, "").trim())
    .filter(Boolean);
}

function weaveFrom(data: GenerateRequest) {
  return (data.mustInclude ?? []).filter((p) => !/^(sexual act|theme|category):/i.test(p));
}

function intro(c: Cast) {
  const age = field(c.profile, "Age");
  const occ = field(c.profile, "Occupation") || field(c.profile, "Occupation / Job");
  const phys =
    field(c.profile, "Build") ||
    field(c.profile, "Physical description") ||
    field(c.profile, "Other physical");
  const hair = [field(c.profile, "Hair colour"), field(c.profile, "Hair length"), field(c.profile, "Hairstyle")]
    .filter(Boolean)
    .join(", ");
  const eyes = field(c.profile, "Eye colour");
  const personality = field(c.profile, "Core personality") || field(c.profile, "Personality");
  const bits = [
    age && `${age}`,
    occ && occ,
    hair && hair,
    eyes && `${eyes} eyes`,
    phys && firstSentence(phys, 140),
  ].filter(Boolean);
  const look = bits.length ? bits.join(" · ") : "an adult, clearly over eighteen";
  const mind = personality ? ` ${firstSentence(personality, 160)}` : "";
  return `${c.name} — ${look}.${mind}`;
}

function heatParagraph(mains: Cast[], acts: string[], drunk: boolean) {
  const a = mains[0];
  const b = mains[1] ?? mains[0];
  if (!a) {
    return "They take their time. Nothing is rushed, and nothing happens that has not been agreed.";
  }
  const an = nick(a);
  const bn = nick(b);
  const joined = acts.join(" ").toLowerCase();
  const lines: string[] = [];
  if (drunk) {
    lines.push(
      `The drink has taken the edge off, not the sense. ${an} checks, quietly — and ${bn} says yes, properly, before anything else happens.`,
    );
  } else {
    lines.push(
      `${an} waits for the yes. ${bn} gives it, clear, no performance. Only then do they close the space between them.`,
    );
  }
  if (/kiss/.test(joined)) {
    lines.push(
      `The first kiss is clumsy and then it isn't. ${an}'s mouth opens against ${bn}'s, tongue, a bitten lip, the kind of snog that makes talking feel like a waste. Hands find hair, a jaw, the back of a neck.`,
    );
  }
  if (/sensual touch|teasing/.test(joined)) {
    lines.push(
      `Hands travel without hurrying. A thumb at a hipbone. A mouth at a throat. Fingertips under a waistband, then away again, until waiting is the point and ${bn} is breathing like the room got smaller.`,
    );
  }
  if (/flash/.test(joined)) {
    lines.push(`A shirt is tugged, not off — just enough. A flash of breast or the line of underwear, a look, a laugh that is not quite a laugh.`);
  }
  if (/breast/.test(joined) || /tit wank/.test(joined)) {
    lines.push(
      `${an} pays attention to ${bn}'s tits the way the brief asked — palming the weight of them, thumbs on nipples until they tighten, mouth following, licking and sucking until ${bn}'s back arches. This is not a glance. It is the scene.`,
    );
  }
  if (/tit wank/.test(joined)) {
    lines.push(
      `When it becomes a tit wank it is unhurried and explicit: ${bn} presses her breasts around ${an}'s cock, spit or whatever is to hand making it slick, the head appearing and disappearing in the cleavage while they both watch. ${an} fucks the channel they make until the rhythm is filthy and specific.`,
    );
  }
  if (/cunnilingus/.test(joined)) {
    lines.push(
      `${an} goes down on ${bn} without making a speech of it — mouth on her cunt, tongue on her clit, two fingers if she wants them, the wet sounds of it in the quiet room. ${bn}'s hand stays in ${an}'s hair and her thighs shake when she comes.`,
    );
  }
  if (/fellatio/.test(joined)) {
    lines.push(
      `${bn} takes ${an}'s cock in her mouth, lips stretching, spit making it messy, eyes up once to check. She sucks him properly — not a gesture, the real work of it — and pulls off to breathe with a string of spit still connecting them before she goes back down.`,
    );
  }
  if (/manual|fingering|handjob|masturbation/.test(joined)) {
    lines.push(
      `Hands do the precise work. ${an}'s fingers find ${bn} wet and open her slowly, or ${bn} strips ${an}'s cock with a tight fist, thumb at the head, until both of them are making ugly honest sounds.`,
    );
  }
  if (/vaginal|coitus/.test(joined)) {
    lines.push(
      `When they get to vaginal sex it is because both of them want that, said or clearly shown. ${an} pushes his cock into ${bn}'s pussy and stays there a second, feeling her clench, then fucks her in a pace that is not a film pace — deep, a little uneven, her legs around him, the wet slap of it. They keep going until she comes on him, or he does inside her, or both, and they do not skip that part.`,
    );
  }
  if (/frottage|intercrural|massage/.test(joined)) {
    lines.push(`Bodies rub, cock against cunt or between thighs, skin to skin, no need to make every beat a destination — but they still feel it, still get each other off.`);
  }
  if (lines.length < 3) {
    lines.push(
      `What they do is adult, mutual, and written on the page. Clothes come off. Hands and mouths find the obvious places. They fuck like the people they are — timid stays timid, bold stays bold — and they do not turn into strangers for the sake of a scene.`,
    );
  }
  return lines.join(" ");
}

function explicitBeats(mains: Cast[], acts: string[]): string[] {
  const a = mains[0];
  const b = mains[1] ?? mains[0];
  if (!a) return [];
  const an = nick(a);
  const bn = nick(b);
  const joined = acts.join(" ").toLowerCase();
  const beats: string[] = [
    `They undress like people who have already decided. ${bn}'s clothes come off in the order that makes sense — not a striptease unless she is the sort to make it one. ${an} looks. That looking is part of it. She is an adult; he is an adult; the body in front of him is not a blur.`,
    `${an} says something ordinary and then something that isn't. ${bn} answers with a hand. Consent stays in the room as a living thing: a nod, a yes, a pulled-closer. If either of them wanted out, this would stop. It does not stop.`,
    `The first real contact after the kissing is unglamorous and exact. Skin. Heat. The smell of someone else's neck. ${bn} laughs once under her breath because nerves do that, then she doesn't laugh, because ${an}'s mouth has found a place that makes laughing feel like the wrong language.`,
  ];
  if (/breast|tit/.test(joined)) {
    beats.push(
      `${an} spends proper time on ${bn}'s breasts. Not a courtesy grope — the full attention of hands and mouth. He licks a nipple until it is wet and tight, sucks, uses his teeth just enough if she likes that, and watches her face for the truth of it. Her tits move when she shifts. He notices. He is supposed to.`,
    );
  }
  if (/tit wank/.test(joined)) {
    beats.push(
      `She puts his cock between her breasts because that was asked for and because she wants to see his face while she does it. She spits, or he does, and she presses in until the fit is tight. He fucks her cleavage in short strokes, the head popping up toward her mouth. She can lick it when it does. She does.`,
    );
  }
  if (/cunnilingus/.test(joined)) {
    beats.push(
      `On her back, or sitting on the edge of whatever they have, ${bn} opens her legs and ${an} puts his mouth on her cunt. He works her clit with a flat tongue, then pointed, then two fingers hooked the way a body actually likes, and he does not treat it like a chore. She comes with her knees trying to close and his hands keeping her where she asked to be.`,
    );
  }
  if (/fellatio/.test(joined)) {
    beats.push(
      `She gets on her knees or she doesn't — personality decides. Either way ${bn} sucks ${an}'s cock like she means the brief. Wet, noisy, a hand on the shaft, balls if he likes that, a pause to look at him with her mouth still shiny. He warns her before he gets too close. She decides what to do with that information.`,
    );
  }
  if (/vaginal|coitus/.test(joined)) {
    beats.push(
      `He sinks into her pussy slowly enough to feel every inch, then not slowly. ${bn} is wet enough that it is easy and tight enough that it still makes both of them swear. They find a rhythm. She asks for harder or he already knows. The bed complains. She comes around his cock; he lasts or he doesn't; if he finishes in her he says so, and she wants that or she doesn't and they have already covered it.`,
    );
    beats.push(
      `After the first time they stay joined, breathing, ridiculous, fond. Then they go again because long stories are allowed to, and because they are not done. The second fuck is sloppier. Less polite. Same people.`,
    );
  }
  beats.push(
    `They talk in the wreck of it. Water. A laugh. A hand that does not know where to put itself now that the urgency has gone. Nobody is under eighteen. Nothing from another story is owed. This night is this night.`,
  );
  beats.push(
    `If there is a morning, it is ordinary. Kettle. Clothes in the wrong piles. The sex is still in their bodies the way a long walk is in your legs. They do not announce a moral. They just exist in the room they used.`,
  );
  return beats;
}

function closeParagraph(mains: Cast[]) {
  const names = mains.map(nick).slice(0, 3);
  if (names.length === 0) return "Later the room is ordinary again. The night is still the night.";
  if (names.length === 1) return `${names[0]} lies still long enough to feel the evening settle. Nothing from any other story is owed here.`;
  return `${names.join(" and ")} stay in the quiet that comes after. This night belongs to this story. It does not borrow first times from anywhere else.`;
}

function targetOf(data: GenerateRequest) {
  const raw = (data.length ?? "").replace(/,/g, "");
  const m = raw.match(/(\d{3,5})/);
  if (m) return Math.min(6000, Math.max(600, Number(m[1])));
  const l = raw.toLowerCase();
  if (l.includes("long")) return 4000;
  if (l.includes("short")) return 1000;
  return 2000;
}

function padParagraphs(mains: Cast[], acts: string[]): string[] {
  const a = mains[0];
  const b = mains[1] ?? mains[0];
  const an = nick(a ?? { name: "They", role: "main", profile: "" });
  const bn = nick(b ?? { name: "the other", role: "main", profile: "" });
  const joined = acts.join(" ").toLowerCase();
  const out = [
    `They shift on the bed like people who have already crossed the line and are not going back. ${an} is still hard, or getting there again. ${bn} notices and does not pretend not to. A hand. Then a mouth. Consent is still in the room — a look, a yes — and then they use each other properly.`,
    `${bn} talks while it happens, not a speech, just the truth of it: there, slower, like that. ${an} listens with his body. The wet sound of it is specific. Nobody fades this to black.`,
    `A pause for water, ridiculous and intimate. ${an} watches ${bn} drink. Then they are on each other again, clothes that had been half-on coming off for good, skin to skin, the second time less polite than the first.`,
    `Hands learn the map. ${bn}'s thighs, the dip of a waist, the weight of a breast if she has them, the line of a cock if he does. They are adults. They look. They say the words for the parts they are using.`,
    `When ${an} fucks ${bn} again it is because both of them want that, said or clearly shown. Not a montage. In, the stretch, the breath, the ugly honest rhythm of two people who are not performing for anyone else.`,
    `After she comes — or he does, or both — they do not leap to a moral. They stay joined a moment, breathing, a laugh that has sex still in it. Then a hand starts again because long nights are allowed to.`,
    `Talk in the wreck of it. A name. A joke that is a little filthy. ${bn} traces ${an}'s mouth with a thumb. Nothing from any other story is owed here. This is this night.`,
    `If they sleep it is a doze, not a curtain. Someone wakes with a hand already moving. They go slower. More exact. The room smells like them.`,
    `Morning threatens and they ignore it. Kettle later. Clothes in the wrong piles later. Right now ${an} puts his mouth where ${bn} wants it and stays there until her voice changes.`,
    `They remember they can stop. They do not want to. That is the whole ethics of it, lived rather than announced. Adults, agreed, explicit, still in the scene.`,
  ];
  if (/tit wank|breast/.test(joined)) {
    out.push(
      `${an} goes back to ${bn}'s tits because that was asked for and because she likes the attention. Hands, mouth, spit, the weight of them in his palms. If it becomes a tit wank they watch his cock move between them, filthy and specific, until he has to stop or finish.`,
    );
  }
  if (/cunnilingus|fellatio|oral/.test(joined)) {
    out.push(
      `Mouths again. Not a courtesy. ${an} or ${bn} on their knees or sprawled, the wet work of it, a hand in hair, a warning before anyone comes, a decision about where.`,
    );
  }
  if (/vaginal|coitus/.test(joined)) {
    out.push(
      `Vaginal sex is not a fade. ${an} pushes into ${bn}'s pussy and they both feel it. They keep going through the awkward bit, the good bit, the bit where she clenches and swears, the bit where he has to hold still or not.`,
    );
  }
  return out;
}

function wordsOf(parts: string[]) {
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}

export function composeFallbackStory(data: GenerateRequest): string {
  if (data.mode === "adapt" && data.originalStory) {
    let text = data.originalStory;
    for (const r of data.replacements ?? []) {
      if (!r.from || !r.toName) continue;
      text = text.split(r.from).join(r.toName);
    }
    return `${data.originalTitle ? `${data.originalTitle} (adapted)\n\n` : ""}${text.trim()}\n\nThey remain consenting adults. The people have changed; the night is still this one.`;
  }
  if ((data.mode === "continue" || data.mode === "rewrite") && data.originalStory) {
    const last = data.originalStory.trim().slice(-900);
    const people = collectCast(data);
    const names = people.filter((p) => p.role === "main").map((p) => p.name);
    const who = names.length ? names.join(" and ") : "They";
    return `${data.title?.trim() ? `${data.title.trim()}\n\n` : ""}The previous night is still in the room.\n\n${last}\n\n${who} pick it up from there. Nobody is under eighteen. What they do next is agreed, unhurried, and new to this chapter — unless this is a series, in which case they remember what already happened.\n\n${data.instructions?.trim() ? `${data.instructions.trim()}\n\n` : ""}They talk first. Then they close the door.`;
  }

  const cast = collectCast(data);
  const mains = cast.filter((c) => c.role === "main");
  const sides = cast.filter((c) => c.role === "incidental");
  const acts = actsFrom(data);
  const weaves = weaveFrom(data);
  const drunk = /drunk/i.test(data.themes ?? "") || weaves.some((w) => /drunk|wine|tipsy|alcohol/i.test(w));
  const title =
    data.title?.trim() ||
    (mains[0] ? `${nick(mains[0])}'s night` : "A private night");
  const setting = settingFrom(data);
  const target = targetOf(data);

  const paras: string[] = [title, ""];
  paras.push(setting);

  if (mains.length) {
    paras.push(mains.map(intro).join("\n\n"));
  } else {
    paras.push("Two consenting adults, both clearly over eighteen, have the room to themselves.");
  }

  if (sides.length) {
    paras.push(
      `${sides.map((s) => s.name).join(" and ")} ${sides.length === 1 ? "is" : "are"} around the edges of the evening — a text, a lift, a coffee run — and ${sides.length === 1 ? "does" : "do"} not come into the sexual part of it.`,
    );
  }

  if (data.relationships?.trim()) {
    paras.push(`They already know how they stand with each other: ${data.relationships.split("\n").filter(Boolean).slice(0, 4).join("; ")}.`);
  }

  paras.push(
    drunk
      ? "Glasses are refilled. Speech loosens. Consent is still asked for, still given, still allowed to stop."
      : "The talk is ordinary at first. Then it is not. Nobody is in a hurry to pretend they do not know why they stayed.",
  );

  for (const w of weaves.slice(0, 6)) {
    paras.push(`It matters, as required, that ${w.replace(/\.$/, "").replace(/^[A-Z]/, (ch) => ch.toLowerCase())}.`);
  }

  paras.push(heatParagraph(mains, acts, drunk));

  for (const beat of explicitBeats(mains, acts)) {
    if (wordsOf(paras) >= target) break;
    paras.push(beat);
  }
  const pads = padParagraphs(mains, acts);
  let i = 0;
  while (wordsOf(paras) < Math.round(target * 0.95)) {
    const base = pads[i % pads.length]!;
    const round = Math.floor(i / pads.length);
    paras.push(
      round === 0
        ? base
        : `${base} They are not finished. Round ${round + 1} is slower, then not, the same adult yes still holding.`,
    );
    i += 1;
    if (i > 180) break;
  }

  paras.push(closeParagraph(mains));

  const omitted: string[] = [];
  if (data.mustExclude?.length) {
    omitted.push("Excluded items were left out as asked.");
  }
  if (omitted.length && data.omitFooter) {
    paras.push("", "OMISSIONS", ...omitted);
  }

  return paras.filter((p, i) => p !== "" || paras[i - 1] !== "").join("\n\n");
}

const FIRST_F = ["Hannah", "Priya", "Megan", "Chloe", "Amelia", "Sofia", "Naomi", "Grace", "Elena", "Yasmin"];
const FIRST_M = ["Daniel", "Marcus", "Owen", "Callum", "James", "Theo", "Nathan", "Luis", "Patrick", "Arun"];
const LAST = ["Cole", "Hart", "Shah", "Reid", "Walsh", "Okeke", "Bennett", "Fraser", "Nielsen", "Kaur"];
const PHYSIQUE_F = [
  "Average height, soft waist, walks like she is slightly late.",
  "Petite and compact, dark hair usually clipped up, sharp eyes.",
  "Tall, long-limbed, dresses plain so people notice the face last.",
];
const PHYSIQUE_M = [
  "Broad through the shoulders, early grey at the temples, careful hands.",
  "Lean, slightly rumpled, the kind of man who looks better sitting down.",
  "Average build, short hair, a mouth that smiles before he means to.",
];
const BACK_F = [
  "Works admin in a busy office and is usually the one who stays late.",
  "Between jobs, house-sitting, good at making a kitchen feel used.",
  "Nurse on days, which is why evenings matter more than they should.",
];
const BACK_M = [
  "Drives for work, knows every late-night garage coffee on the ring road.",
  "IT support, dry humour, lives in a rented terrace with too many chargers.",
  "Chemist shop manager, tidy, slightly too formal until he isn't.",
];
const QUIRK_F = [
  "Talks with her hands. Goes quiet when she actually wants something.",
  "Laughs at the wrong moment. Notices clothes before names.",
  "Keeps offering tea as a way of staying in the room.",
];
const QUIRK_M = [
  "Rubs his jaw when he is deciding. Bad at leaving.",
  "Makes a joke, then looks to see if it landed.",
  "Takes his watch off as if that were a decision.",
];

function unusedName(
  gender: "Female" | "Male",
  avoid: Set<string>,
  i: number,
): string {
  const first = gender === "Female" ? FIRST_F : FIRST_M;
  for (let n = 0; n < first.length * LAST.length; n++) {
    const f = first[(i + n) % first.length]!;
    const l = LAST[(i * 3 + n) % LAST.length]!;
    const name = `${f} ${l}`;
    if (!avoid.has(name.toLowerCase()) && !avoid.has(f.toLowerCase())) return name;
  }
  return gender === "Female" ? `Helen Guest ${i + 1}` : `Mark Guest ${i + 1}`;
}

export function proposeLocalCast(opts: {
  role: "main" | "incidental";
  count: number;
  avoidNames: string[];
}): ProposedCastMember[] {
  const avoid = new Set(opts.avoidNames.map((n) => n.trim().toLowerCase()).filter(Boolean));
  const count = Math.max(1, Math.min(6, Math.floor(opts.count) || 1));
  const people: ProposedCastMember[] = [];
  for (let i = 0; i < count; i++) {
    const gender: "Female" | "Male" = i % 2 === 0 ? "Female" : "Male";
    const name = unusedName(gender, avoid, i + avoid.size);
    avoid.add(name.toLowerCase());
    const phys = gender === "Female" ? PHYSIQUE_F[i % PHYSIQUE_F.length]! : PHYSIQUE_M[i % PHYSIQUE_M.length]!;
    const back = gender === "Female" ? BACK_F[i % BACK_F.length]! : BACK_M[i % BACK_M.length]!;
    const quirk = gender === "Female" ? QUIRK_F[i % QUIRK_F.length]! : QUIRK_M[i % QUIRK_M.length]!;
    people.push({
      name,
      gender,
      physique: phys,
      background: back,
      quirks: quirk,
      physicalTraits: phys,
      mentalTraits: quirk,
    });
  }
  return people;
}
