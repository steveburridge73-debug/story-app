import type { Character, Relationship } from "./types";
import { hydrateCharacter } from "./dossier";
import { normalizeRelType } from "./relationships";

const T = "2024-01-01T12:00:00.000Z";

function person(
  id: string,
  name: string,
  gender: "Female" | "Male",
  extras: Partial<Character> & { dossier: Record<string, string> },
): Character {
  return hydrateCharacter({
    id,
    name,
    nickname: extras.nickname ?? "",
    age: extras.age ?? "",
    dateOfBirth: extras.dateOfBirth ?? "",
    gender,
    breastSize: extras.breastSize ?? "",
    occupation: "",
    relationshipStatus: "",
    personality: "",
    mentalCharacteristics: "",
    physicalDescription: "",
    clothingStyle: "",
    background: "",
    likes: "",
    dislikes: "",
    habits: "",
    mentionedPeople: extras.mentionedPeople ?? "",
    sexualQuirks: "",
    sexualDeviances: "",
    notes: "",
    dossier: extras.dossier,
    favourite: extras.favourite ?? false,
    primaryImageId: null,
    createdAt: T,
    modifiedAt: T,
  });
}

const STEVE = person("ch-steve", "Stephen Burridge", "Male", {
  nickname: "Steve",
  age: "52",
  dateOfBirth: "31st January",
  dossier: {
    height: "5ft 6",
    weight: "17st 4",
    build: "Paunchy, overweight, carrying weight around the belly",
    skinTone: "Slight freckles on arms and face",
    eyeColor: "Grey-blue",
    hairColor: "White",
    hairstyle: "Short and straight, thinning on top, pushed back and to the left slightly",
    hairLength: "Short",
    facialHair: "Slight stubble",
    distinguishingFeatures:
      "Slight freckles on arms and face; wears black-rimmed plastic glasses but does not need them",
    handFeatures: "Small hands, fat fingers",
    genitalDescription:
      "Penis medium sized when flaccid, grows when erect with impressive girth and a shape that hits the G-spot during sex; greying thick pubic hair",
    otherPhysical: "Always trying to lose weight; wears a sports watch; snores; no disabilities",
    corePersonality: "Introverted, thoughtful, caring, strong, intelligent, and organised",
    strengths:
      "Thoughtful, caring, strong, intelligent, organised; loves Becca and Steph unconditionally and will do anything for them; considered a good friend",
    weaknesses:
      "Slightly self-loathing, often feeling like a let-down; fragile after the break-up of two marriages; not good in a big group dynamic, slipping into the background",
    humorStyle: "Playful; uses lines from sci-fi films (Alien, Predator, Terminator) for comic effect",
    emotionalTendencies:
      "Empathetic and caring; fragile emotionally after two divorces; able to repress attractions he considers inappropriate",
    socialBehavior: "Quiet observer, introverted, slips into the background in big groups; a good friend",
    quirksHabits:
      "Taps along with music using feet or fingers, often annoying others; bites his nails; picks his nose",
    intelligenceType: "Book-smart and analytical (Business Analyst)",
    otherPersonality:
      "Becomes more aware of Becca and her body as she has aged, and controls and represses that as inappropriate. Harbours some distant sexual attraction to Laura while seeing her as almost a third daughter.",
    hopesDreams:
      "Values his relationships with his step-daughters above all; loves travel and is planning a trip to Sicily",
    fearsAnxieties:
      "Fragile after two failed marriages; self-loathing and feeling like a let-down; fear of crossing lines he has drawn for himself",
    aspirations: "Learning Italian; always trying to lose weight; passionate about gardening for relaxation",
    occupationDetails:
      "Business Analyst with Government lending schemes at Santander, working out of St Paul's Square, Liverpool",
    vehicle: "Ford Focus, a few years old, dark blue — the exact same colour as Becca's",
    dressSense:
      "Black jeans, cream chinos, or smart shorts; signature checked shirt (short or long sleeve depending on weather); always wears Skechers for comfort",
    personalItems: "Sports watch; does not own sex toys",
    hobbies:
      "Travel (cruises or semi-adventurous trips); TV and films, especially Marvel and DC, with a real love of sci-fi (Alien, Predator, Terminator); gardening; used to be a DJ — music is a big part of his life. Prefers explicit stories over images or movies when masturbating.",
    kryptonite:
      "Loves big breasts; fragile after divorces; self-loathing; represses obsession with Becca's body; masturbates at least once a day",
    livingSituation:
      "Lives with Steph; they own a cat, Maisy, together. Born in Birmingham; has lived in the Isle of Man and now the Liverpool area.",
    dailyRoutine: "Masturbates at least once a day",
    otherLife:
      "Currently learning Italian and drops odd words into dialogue. Next trip is Sicily. Has visited America, Australia, parts of South America, the Caribbean, and Europe (loves Italy and Croatia / the Dalmatian Coast).",
    orientation: "Heterosexual",
    romanticPreferences:
      "Attracted to women with big breasts. Distant attraction to Laura; repressed awareness of Becca's body. Learned a lot sexually from an affair with a highly sexed married woman.",
    turnOns:
      "Big breasts; tit-wank; G-spot stimulation during sex; explicit stories for arousal. Once drawn to masturbate after seeing Becca topless and stopped himself.",
    dealBreakers:
      "Does not like blow jobs (gets nothing from them). Does not like anything near his anus. Does not like anal sex, BDSM, coprophilia, or urolagnia.",
    sexualQuirks:
      "Voyeuristic tendencies (has incidentally seen Becca in the shower and topless sunbathing). Loves tit-wanks. No BDSM.",
    secretRevelation:
      "Has seen Becca naked once (in the shower, stood gobsmacked at her body) and topless a few times (sunbathing; a brief bikini change). Represses obsession with her body. Had a two-year affair with a married woman named Steph who was highly sexed, and learned a lot from her.",
    experienceLevel:
      "Experienced (two marriages and an affair where he learned a lot sexually). Not many relationships outside of those.",
    intimacyApproach: "Able to hit the G-spot during sex; represses desires he considers inappropriate",
    favoriteScenarios: "Prefers explicit stories for arousal; voyeuristic watching; tit-wanks",
    otherSexuality:
      "Masturbates a lot, at least once a day. Has seen Steph naked incidentally (shower, pyjamas gaping). Fragile after break-ups.",
    relationshipHistory:
      "Married twice: first to Celine at 26, divorced after 4 years; second to Karen (Becca and Steph's mum), divorced after 10 years. Between marriages, a 2-year affair with a married woman named Steph. Single since the second divorce; no serious relationships since.",
    maritalStatus: "Divorced (twice)",
    currentRelationship: "Single",
    connections:
      "Becca / step-daughter: stepfather; calls her \"beautiful\"; loves unconditionally; has seen her naked/topless incidentally and represses becoming obsessed with her body as inappropriate.\nSteph / step-daughter: stepfather; calls her Steph, Stefie, or Stefo; loves unconditionally; lives together; has seen her naked incidentally (shower, pyjamas gaping).\nLaura / family friend: sees her as almost a third daughter but harbours distant sexual attraction; calls her Laura or occasionally \"Gorgeous Girl\" if dressed up.\nKaren / ex-wife: second wife, Becca and Steph's mum; divorced after 10 years.\nCeline / ex-wife: first wife; married at 26, divorced after 4 years; moved to the Isle of Man with her.",
    familyBackground:
      "Stepfather to Becca and Steph after marrying their mum Karen. Moved to the Isle of Man with his first wife, stayed after that divorce, then back to the UK with Karen and the girls when they were young.",
    friendshipCircle: "Considered a good friend; introverted; not good in big groups",
    romanticStyle:
      "Affectionate and caring (unconditional love for his step-daughters); fragile after break-ups; had a passionate affair; represses attractions he considers off-limits",
    otherRelationships: "Sees Laura as near a third daughter",
    backstory:
      "Born in Birmingham on 31st January. Married Celine at 26, moved to the Isle of Man, divorced after 4 years and stayed. Had a 2-year affair with a married woman named Steph. Met Karen, returned to the UK to live with her, Becca and Steph when the girls were young. Divorced Karen after 10 years. Single since, fragile. Over time developed a repressed awareness of Becca's body; incidental voyeuristic moments with his adult step-daughters.",
    moralCompass:
      "Strong boundaries against crossing lines (represses attractions to Becca and Laura as inappropriate); unconditional love for family; grey area in a past affair with a married woman",
    culturalBackground: "British (Birmingham birthplace; lived in the Isle of Man and the UK); loves Italy and is learning Italian",
    education: "Intelligent; works as a Business Analyst",
    skills: "Used to be a DJ; gardening; quotes films comically",
    petPeeves: "His tapping along to music annoys others",
    favoriteFoods: "Loves savoury food over sweet, especially crisps and Indian takeaway",
    travel:
      "Loves to travel (cruises or semi-adventurous). Visited America, Australia, parts of South America, the Caribbean, Europe (loves Italy and Croatia / Dalmatian Coast). Next trip Sicily.",
    healthWellness: "Always trying to lose weight; snores",
    signatureQuote: "Quotes lines from sci-fi films (Alien, Predator, Terminator) for comic effect",
    otherMisc: "Owns cat Maisy with Steph; drops Italian words in dialogue as he is learning",
  },
});

const BECCA = person("ch-becca", "Rebecca Joan Birch", "Female", {
  nickname: "Becca",
  age: "31",
  dateOfBirth: "26th January",
  breastSize: "36GG",
  dossier: {
    height: "5ft 7",
    build: "Curvaceous with a larger bottom and thighs",
    eyeColor: "Brown",
    hairColor: "Brown",
    hairstyle: "Thick wavy, worn down and loose; curls when wet",
    hairLength: "Long",
    breastSize: "36GG",
    breastDescription: "36GG, ample and cleavage-revealing",
    faceShape: "Cute button nose",
    distinguishingFeatures: "Wears glasses to drive; wears a sports watch",
    handFeatures: "Runs her hand through her hair regularly",
    genitalDescription: "Brown thick-haired vagina",
    otherPhysical:
      "Always trying to lose weight; bites her lip when nervous (cute); no disabilities",
    corePersonality: "Introverted, a little unsure of herself, confident but slightly shy",
    strengths:
      "Very funny and humorous (sometimes as a double act with Steve); defensive and protective of Steve, Steph and Laura; organised; strong moral code",
    weaknesses:
      "A bit lazy and scatterbrained at times; not punctual, leaves things till the last minute; jealous of Laura, thinking she is better looking; fragile after the breakup of her marriage",
    humorStyle: "Very funny; often in a double act with Steve; playful around him",
    emotionalTendencies:
      "Sensitive and fragile after divorce; playful but not with many others — shows who she is comfortable with",
    socialBehavior: "Selective with friends, introverted; playful around Steve because she is comfortable with him",
    quirksHabits:
      "Bites her lip when nervous; runs her hand through her hair regularly; looks at her phone too much when bored; shares a \"Belly Bounce\" with Steve where she bumps her belly, bottom or breasts against him and shouts \"Belly Bounce\"",
    intelligenceType: "Organised yet scatterbrained",
    otherPersonality:
      "Holds her relationship with Steve and Steph as the most precious thing in life; does not want to cross moral lines",
    hopesDreams: "Values precious relationships highly; wants stable, loving connections",
    fearsAnxieties:
      "Fragile after marriage breakup; jealous of Laura's looks; protective of key relationships, implying fear of loss",
    aspirations: "Always trying to lose weight",
    occupationDetails: "Admin Assistant and Receptionist at a private doctor's surgery",
    vehicle: "Ford Fiesta, a few years old, dark blue — the exact same colour as Steve's",
    dressSense:
      "Loves a floral flowy dress, the English Rose look, long to the ankles but sometimes low cut to short with plenty of cleavage; jeans and t-shirt at times; can dress to impress with hair and makeup when going out; loves flowery underwear, usually black and lacy",
    personalItems:
      "Owns a black vibrator visible on her bedroom side table (uses it regularly); sports watch; owns a black cat named Luna",
    hobbies:
      "Loves TV, especially the Jurassic Park films and Marvel and DC movies; loves takeaways (Indian, Chinese, kebab or pizza); loves Japanese cherry trees",
    kryptonite: "Fragile after divorce; jealous of Laura; looks at her phone too much; scatterbrained and lazy at times",
    livingSituation: "Has her own home space; owns a cat, Luna. Birthplace: Wirral.",
    financialStatus: "Has been through money problems with Laura",
    dailyRoutine: "Leaves things till the last minute; looks at her phone when bored",
    otherLife: "Highly sexed but with a strong moral code",
    orientation: "Heterosexual",
    romanticPreferences:
      "Attracted to men. No romantic or sexual feelings for Steve or Steph.",
    turnOns:
      "Highly sexed; owns and regularly uses a black vibrator; gives a good blow job. Once marvelled at Steve's semi-erect penis inquisitively, wanting to touch it, and did not.",
    dealBreakers:
      "Strong moral code; does not want to cross lines with family. No feelings for Steve or Steph.",
    sexualQuirks:
      "Has kissed Laura in public for dares or reactions; Laura has touched her breast for games or reactions",
    secretRevelation:
      "Has seen Steve naked once and marvelled at his semi-erect penis, almost wanting to touch it. Shares a secret story with Steve about injuring her knee during a blow job to her ex-husband Josh, lying to the doctor about it.",
    experienceLevel:
      "Confident in some acts (gives good blow jobs); has had long relationships but not many; highly sexed and uses a vibrator regularly",
    intimacyApproach: "Playful and inquisitive",
    otherSexuality:
      "Has seen Laura and Steph naked multiple times (nothing inappropriate — changing or showering). No incestuous feelings.",
    relationshipHistory:
      "Has not had many relationships, but those she has had have been long ones. Married to Josh, divorced after a couple of years; fragile after the breakup. Been through breakups, heartbreak and money problems with Laura.",
    maritalStatus: "Divorced",
    currentRelationship: "Single (after divorce)",
    connections:
      "Steph / sister: holds the relationship as most precious; have seen each other naked casually.\nSteve / step-father: eldest step-daughter; calls him Steve or Stevie; playful (Belly Bounce); shares the knee-injury secret; has seen him naked once and marvelled; no romantic/sexual feelings; highly protective of him.\nLaura / best friend: best friends since 16 at high school; breakups, heartbreak, money problems together; have kissed in public for dares; Laura has touched her breast for reactions; jealous of Laura's looks; highly protective of her.\nJosh / ex-husband: divorced after a couple of years; injured her knee giving him a blow job.",
    familyBackground: "Close ties with sister Steph and stepfather Steve — her most precious relationships",
    friendshipCircle: "Selective; best friend Laura since high school; supportive through life's challenges",
    romanticStyle: "Long-term relationships; fragile after divorce; cautious",
    otherRelationships: "Has seen family/friends naked in non-sexual contexts; protective of key people",
    backstory:
      "Born in Wirral on 26th January. Met Laura at 16 in high school. Married Josh, divorced after a couple of years, leaving her fragile. Became Steve's eldest step-daughter. Accidental sighting of Steve naked sparked innocent curiosity. Shared the knee-injury secret with Steve.",
    moralCompass:
      "Strong moral code; does not want to cross lines with family. Lied to a doctor about an injury but shares it as a fun secret with Steve.",
    culturalBackground: "English Rose style; British / Wirral",
    education: "Works as Admin Assistant / Receptionist",
    skills: "Gives good blow jobs; humorous double act with Steve",
    petPeeves: "Looks at her phone too much and knows it is a habit",
    favoriteFoods: "Takeaways — Indian, Chinese, kebab or pizza",
    philosophy: "Values relationships above all",
    healthWellness: "Always trying to lose weight; wears a sports watch; injured her knee once during intimacy",
    signatureQuote: "Shouts \"Belly Bounce\" during her quirk with Steve",
    otherMisc:
      "Owns black cat Luna; loves Japanese cherry trees; highly sexed but restrained by morals. Possible story arcs: supportive playful depth; overcoming fragility and jealousy; exploring a high sex drive within moral boundaries.",
  },
});

const STEPH = person("ch-steph", "Stephanie Alice Birch", "Female", {
  nickname: "Steph",
  age: "28",
  dateOfBirth: "30th January",
  breastSize: "32A",
  dossier: {
    height: "5ft 10",
    eyeColor: "Blue",
    hairColor: "Blonde",
    hairstyle: "Thick straight, worn down and loose; curls when wet",
    hairLength: "Long",
    breastSize: "32A",
    breastDescription: "32A, small",
    distinguishingFeatures: "Wears glasses to read; wears a sports watch",
    genitalDescription: "Blonde thinly haired vagina; tight vagina",
    voice: "Sings to herself in the shower",
    otherPhysical:
      "Always trying to lose weight; taps her feet; breaks into song or dance when in a good mood; no disabilities",
    corePersonality: "Considerate, caring and loving; kooky and unique; emotionally immature",
    strengths:
      "Intelligent; considerate, caring, loving; good with children and the elderly; opinionated and bothered by world issues",
    weaknesses:
      "Very lazy, not fully using her intelligence (annoys Steve); impulsive; spends money she does not have; emotionally immature, needing constant reassurance and ego boosting; mood swings almost bipolar in nature; gets bored easily; fragile from past abusive relationships",
    humorStyle: "Playful and expressive; breaks into song or dance when in a good mood",
    emotionalTendencies:
      "Sensitive and fragile; needs company and love and actively seeks it; mood swings; uses colouring to calm sadder times; jealous of big tits (especially Laura and Becca) and of Becca's friendship with Laura",
    socialBehavior:
      "Selective with friends, does not have many; relies on Becca and her friends, and family, to fill in for missed friendships",
    quirksHabits:
      "Taps her feet; breaks into song or dance when in a good mood; sings in the shower; looks at her phone too much when bored; gets bored easily and reaches for phone or snacks; sleeps in until 4pm when not working, stays up after 2am; impulsive about trends and clothing",
    intelligenceType: "Intelligent but lazy in application",
    otherPersonality:
      "Kooky with her own unique style; opinionated on world issues a bit too much; needs constant reassurance and self-worth boosting",
    hopesDreams:
      "Recently graduated as a nurse and is working; needs company and love; wants to change her car when she has more money",
    fearsAnxieties:
      "Fragile from past manipulative and abusive relationships; emotionally immature; mood swings; jealousy; gets bored easily; bothered by world issues",
    aspirations: "Always trying to lose weight; wants to change her car; loves buying clothes",
    occupationDetails: "Nurse at Arrowe Park Hospital in the Wirral; recently graduated. Sleeps in late when not working.",
    vehicle: "Ford Fiesta, 10 years old, brown",
    dressSense:
      "Baggy clothing at home; otherwise kooky and unique, falling in love with particular items without considering if they match; clothes similar to Laura's but not as vibrant; has loads of clothes, some never worn",
    personalItems:
      "Owns a white vibrator (hides it away, uses a few times a week when lonely); sports watch; owns cat Maisy with Steve",
    hobbies:
      "Loves TV and movies — everything, especially documentaries and dark shows like Stranger Things and Game of Thrones; loves buying clothes; loves eating out often even if not hungry, but rarely finishes; colouring to calm sad times; sings in the shower",
    kryptonite:
      "Fragile from past mental abuse; emotionally immature; mood swings; impulsive spending; laziness; jealousy; gets bored easily; needs reassurance",
    livingSituation: "Lives with Steve; they own cat Maisy together. Birthplace: Wirral.",
    financialStatus: "Spends money she does not have; cannot afford to change her car yet",
    dailyRoutine:
      "Sleeps in until 4pm when not working; stays up after 2am; looks at her phone when bored; eats out even if not hungry",
    otherLife:
      "Relies on family and Becca's friends for a social circle. Has borrowed Laura's clothing including underwear when she forgot her own.",
    orientation: "Heterosexual but bi-curious",
    romanticPreferences:
      "Strange attraction to Laura because of a similar kooky unique view of life and style, and knowing Laura is bisexual. No feelings for Becca or Steve.",
    turnOns: "Uses a vibrator a few times a week when lonely; tight vagina; bi-curious",
    dealBreakers:
      "Definite line sexually with Steve — no feelings toward each other. Past relationships involved manipulative men and mental abuse.",
    sexualQuirks: "Bi-curious; attraction to Laura; uses a vibrator when lonely",
    secretRevelation: "Bi-curious; attraction to Laura; owns and uses a vibrator when lonely",
    experienceLevel: "Has had a few relationships, but not good ones; uses a vibrator regularly",
    otherSexuality:
      "Has seen Laura and Becca naked multiple times (changing or showering, nothing inappropriate). Has not seen Steve naked. Jealous of big tits like Laura's and Becca's. No feelings for family.",
    relationshipHistory:
      "A few relationships that were not good — manipulative men and mental abuse, leaving her fragile",
    maritalStatus: "Single",
    currentRelationship: "Single",
    connections:
      "Becca / sister: calls her Beckwa; have seen each other naked casually; jealous of Becca's friendship with Laura and of her big tits; no sexual feelings.\nSteve / step-father: youngest step-daughter; lives together; calls him Steve or Stevie; own cat Maisy together; no sexual feelings, definite line; annoys him with her laziness; has not seen him naked.\nLaura / friend (desired): jealous of Becca's friendship, wants to be her friend too; strange attraction due to similar kooky style and knowing she is bisexual; has borrowed her clothing including underwear; has seen her naked casually; jealous of her big tits.",
    familyBackground: "Close ties with sister Becca and stepfather Steve; relies on family for social support",
    friendshipCircle: "Does not have many friends; relies on Becca and her friends, and family",
    romanticStyle:
      "Fragile from past abuse; needs company and love and actively seeks it; had poor relationships with manipulative partners",
    otherRelationships: "Borrowed Laura's clothing including underwear; seeks reassurance and ego boosting",
    backstory:
      "Born in Wirral on 30th January. Sister to Becca, youngest step-daughter to Steve. Recently graduated as a nurse and started at Arrowe Park Hospital. A few bad relationships with manipulative men and mental abuse, leaving her fragile. Emotionally immature with mood swings. Jealous of Becca's friendship with Laura and wants in; developed a strange attraction to Laura.",
    moralCompass: "Considerate and caring; opinionated on world issues; no inappropriate feelings for family",
    education: "Recently graduated as a nurse",
    skills: "Good with children and the elderly (as a nurse); sings in the shower; breaks into song/dance",
    petPeeves: "Looks at her phone too much; bothered by world issues a bit too much",
    favoriteFoods: "Loves eating out often, even if not hungry; rarely finishes what she starts",
    philosophy: "Opinionated and bothered by world issues a bit too much",
    healthWellness:
      "Always trying to lose weight; mood swings almost bipolar, uses colouring to calm; emotionally immature",
    otherMisc:
      "Owns cat Maisy with Steve; wants to change her car when affordable; has loads of unworn clothes",
  },
});

const LAURA = person("ch-laura", "Laura Fleming", "Female", {
  nickname: "Laura",
  age: "31",
  breastSize: "34EE",
  dossier: {
    height: "5ft 7",
    build: "Fantastic body she flaunts",
    skinTone: "Slight freckles on face",
    eyeColor: "Piercing green, very alluring",
    hairColor: "Reddish",
    hairstyle: "Thick, slightly wavy, worn down and loose",
    hairLength: "Medium",
    breastSize: "34EE",
    breastDescription: "34EE, ample and flaunted with cleavage",
    distinguishingFeatures: "Slight freckles on face; wild jewellery, often self-made or designed",
    genitalDescription: "Reddish thinly haired vagina; tight vagina with large clitoris",
    otherPhysical: "Highly sexed and opportunistic in nature; no disabilities",
    corePersonality: "Extroverted, vivacious, opinionated, playful minx",
    strengths:
      "Adept at getting people to do what she wants using various tactics (appealing to better nature, daring, fake tears, convincing stories); creative in crafts and jewellery design; bold and confident in expressing opinions",
    weaknesses:
      "Sometimes does not consider how her actions affect people; seen as hard to live with or commit to long term; bothered by world issues a bit too much",
    humorStyle:
      "Playful; loves playing games and becoming playful at the spur of the moment. Steve jests with her about her concert and travel habits.",
    emotionalTendencies:
      "Passionate and opportunistic; yearns for true love beyond her surface traits; resilient through shared hardships with Becca",
    socialBehavior:
      "Social butterfly, happy to spend time with Becca's circle (like Steph); opportunistic in interactions",
    quirksHabits:
      "Loves touring the UK for concerts at the drop of a hat; takes up new crafts impulsively (crochet, knitting, sewing, book binding)",
    intelligenceType: "Clever and manipulative in social tactics to get her way",
    otherPersonality: "Kooky style; minx who plays games; highly sexed but values deep connections",
    hopesDreams:
      "Yearns for a long-term relationship where someone loves her for who she is, not her vivacious nature, money, or fantastic body",
    fearsAnxieties:
      "Seen as hard to commit to, leading to no long-term relationships; bothered by world issues too much",
    aspirations: "Creative pursuits in crafts and jewellery; travels freely for concerts and trips",
    occupationDetails: "Sells air-conditioning units for her father's company; well paid",
    vehicle: "Brand new AMG Mercedes, silver",
    dressSense:
      "Bold colours that some say do not go together but she makes work; bold logos on t-shirts showing opinions and political views; loves low-cut tops or cut-outs to show cleavage; kooky overall",
    personalItems:
      "Numerous dildos and vibrators (uses regularly to quench sexual appetite); wild jewellery, often self-made or designed",
    hobbies:
      "Concerts and travelling, touring the UK at the drop of a hat; crafts (crochet, knitting, sewing, book binding, whatever is next); bothered by world issues",
    kryptonite:
      "Impulsive actions without considering effects; opportunistic sexually but hopes not to cross lines with fatherly figures like Steve; yearns for deeper love amid one-night stands",
    livingSituation: "Birthplace Wirral; travels frequently",
    financialStatus: "Well paid and spends freely on concerts and trips; independent",
    dailyRoutine: "Engages with sex toys regularly",
    otherLife:
      "Been through breakups, heartbreak and money problems with Becca. Sees Steve as a second dad; happy with Steph as an extension of Becca.",
    orientation: "Bisexual",
    romanticPreferences:
      "Attracted to both men and women. Sees Steph as fair game. Wouldn't turn Steve out of bed if he came onto her, but hopes not to because of fatherly love. No sexual feelings towards Becca.",
    turnOns:
      "Highly sexed and opportunistic; owns and uses numerous dildos/vibrators regularly; large clitoris and tight vagina imply sensitivity",
    dealBreakers:
      "Deep down hopes not to cross lines with fatherly figures like Steve. No sexual feelings for best friend Becca.",
    sexualQuirks: "Opportunistic and playful; flaunts her body with cleavage",
    secretRevelation:
      "Yearns for love beyond physical/sexual appeal; opportunistic view of Steph and even Steve (though she hopes not to act on the latter)",
    experienceLevel:
      "Experienced, with a fair share of sexual partners and one-night stands; highly sexed",
    intimacyApproach: "Opportunistic and playful; adept at games and manipulation in social/sexual contexts",
    favoriteScenarios: "Uses toys regularly; one-night stands and opportunistic encounters",
    otherSexuality:
      "Has seen Steph and Becca naked multiple times (casual changing/showering). Has not seen Steve naked. Quenches appetite with toys.",
    relationshipHistory:
      "Fair share of sexual partners and one-night stands; no long-term relationships as she is seen as hard to live with / commit to. Been through breakups, heartbreak and money problems with Becca.",
    maritalStatus: "Single",
    currentRelationship: "Single, with one-night stands",
    connections:
      "Becca / best friend: best friends since 16 at high school; lots together (breakups, heartbreak, money problems); no sexual feelings, sees her as confidante; have seen each other naked casually.\nSteve / fatherly figure: close fatherly figure, almost a second dad; calls him Stevie all the time; wouldn't turn him out of bed if he came onto her but hopes not; jests with him about travels/concerts.\nSteph / acquaintance via Becca: Becca's sister; happy to spend time with her when around Becca or if Becca is not available; sees her as fair game sexually; has seen her naked casually.\nFather / boss: works for her father's company selling air-conditioning units.",
    familyBackground: "Works for her father's company; sees Steve as a second dad",
    friendshipCircle:
      "Close with Becca since high school; extends to Becca's family (Steph, Steve); adventurous in travels/concerts",
    romanticStyle:
      "Opportunistic and highly sexed; yearns for true long-term love; hard to commit to because of her vivacious nature",
    otherRelationships:
      "Playful minx who plays games; adept at manipulation for what she wants; sometimes inconsiderate of effects on others",
    backstory:
      "Born in Wirral. Met Becca at 16 in high school, lifelong friendship through shared hardships. Works for her father's company in sales. Many sexual partners / one-night stands but no long-term relationships. Yearns for deeper love.",
    moralCompass:
      "Opinionated on world issues; opportunistic sexually but has boundaries (hopes not to cross with Steve); uses manipulation (fake tears, stories) but values true connections",
    culturalBackground: "Bold political/opinion logos suggest activist leanings",
    skills:
      "Adept at crafts (crochet, knitting, sewing, book binding); designs jewellery; skilled in social manipulation and games",
    petPeeves: "Bothered by world issues a bit too much",
    travel: "Loves travelling and touring the UK for concerts at the drop of a hat",
    philosophy: "Opinionated and bothered by world issues; bold logos show political views",
    otherMisc:
      "Well paid and spends on concerts/trips; kooky and wild in style; large clitoris and tight vagina as physical notes",
  },
});

export const SEED_CHARACTER_IDS = ["ch-steve", "ch-becca", "ch-steph", "ch-laura"] as const;

export function seedCharacters(): Character[] {
  return [STEVE, BECCA, STEPH, LAURA];
}

export function seedRelationships(): Relationship[] {
  return [
    { id: "rel-steve-becca", fromId: "ch-steve", toId: "ch-becca", type: "stepfather of" },
    { id: "rel-steve-steph", fromId: "ch-steve", toId: "ch-steph", type: "stepfather of" },
    { id: "rel-becca-steph", fromId: "ch-becca", toId: "ch-steph", type: "sister of" },
    { id: "rel-becca-laura", fromId: "ch-becca", toId: "ch-laura", type: "best friend of" },
    { id: "rel-steve-laura", fromId: "ch-steve", toId: "ch-laura", type: "friend of" },
    { id: "rel-steph-laura", fromId: "ch-steph", toId: "ch-laura", type: "friend of" },
  ];
}

export function ensurePeopleSeed(
  characters: Character[],
  relationships: Relationship[],
  alreadySeeded: boolean,
): { characters: Character[]; relationships: Relationship[] } {
  const hydrated = characters.map((c) => hydrateCharacter(c));
  if (alreadySeeded) return { characters: hydrated, relationships };
  const next = [...hydrated];
  for (const seed of seedCharacters()) {
    if (next.some((c) => c.id === seed.id)) continue;
    if (next.some((c) => c.name.trim().toLowerCase() === seed.name.trim().toLowerCase())) continue;
    next.push(seed);
  }
  const rels = [...relationships];
  const ids = new Set(next.map((c) => c.id));
  for (const seed of seedRelationships()) {
    if (!ids.has(seed.fromId) || !ids.has(seed.toId)) continue;
    const exists = rels.some(
      (r) =>
        r.fromId === seed.fromId &&
        r.toId === seed.toId &&
        normalizeRelType(r.type) === normalizeRelType(seed.type),
    );
    if (!exists) rels.push(seed);
  }
  return { characters: next, relationships: rels };
}
