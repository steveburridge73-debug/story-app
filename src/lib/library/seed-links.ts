import type { WebsiteLink } from "./types";

export const PORN_MAGS_PREFIX = "Porn Mags";

export const PORN_MAG_INCLUDED = [
  "General adult / erotic magazines",
  "Men's magazines",
  "Hardcore adult magazines",
  "Adult-film magazines",
  "Incest / family-role themes",
  "Step-family themes",
  "Interracial themes",
  "Teacher/student themes",
  "European adult magazines",
  "American adult magazines",
  "British adult magazines",
  "Historical adult-film archives",
  "Adult publishing history",
];

export const PORN_MAG_EXCLUDED = [
  "Snuff",
  "Gay / LGBTQ+",
  "BDSM",
  "Bondage",
  "Specialist fetish magazines",
];

const T = "2024-06-01T12:00:00.000Z";

function mag(
  id: string,
  group: string,
  title: string,
  url: string,
  websiteName: string,
  description: string,
  notes = "",
): WebsiteLink {
  return {
    id,
    title,
    url,
    websiteName,
    description,
    category: `${PORN_MAGS_PREFIX} · ${group}`,
    tagIds: [],
    addedAt: T,
    favourite: false,
    imageId: null,
    notes,
  };
}

export const PORN_MAG_GROUPS: Array<{
  id: string;
  label: string;
  blurb: string;
  linkIds: string[];
}> = [
  {
    id: "general",
    label: "General archives",
    blurb:
      "Large historical collections of digitised adult and adult-film magazines, 1950s–2010s. Search by title, publisher, year, country or decade.",
    linkIds: [
      "ln-mag-rialto-library",
      "ln-mag-archive-org",
      "ln-mag-archiveteam",
      "ln-mag-retromags-adult",
    ],
  },
  {
    id: "british",
    label: "British magazines",
    blurb:
      "Mayfair, Men Only, Fiesta, Club International, Escort, and UK adult-publishing history (Razzle, Knave, Playbirds, Whitehouse, Rustler, Raider).",
    linkIds: [
      "ln-mag-mayfair-index",
      "ln-mag-mayfair-pdf",
      "ln-mag-mayfair-retromags",
      "ln-mag-menonly-pdf",
      "ln-mag-fiesta-sale",
      "ln-mag-fiesta-sexy",
      "ln-mag-club-pdf",
      "ln-mag-club-wonder",
      "ln-mag-club-trash",
      "ln-mag-escort-wiki",
      "ln-mag-uk-porn-wiki",
    ],
  },
  {
    id: "american",
    label: "American magazines",
    blurb:
      "The Rialto Report is the main door onto digitised American titles: Adam Film Quarterly (1966–1969), Adam Film World (1972–1984, 1987–1988), High Society (1976–1980), Cheri (1976–1980), Flick (1975–1978), Celebrity Skin (1979–1981), Porn Stars (1980–1983), Stag (1980–1981), Starlet (1981–1982), Adult Cinema Review (1981–1984), Cinema-X Review (1980–1981), Erotic Film Guide (1982–1984), Adult Video News (1983–1988), Video X (1980–1981).",
    linkIds: ["ln-mag-rialto-library", "ln-mag-acr", "ln-mag-efg", "ln-mag-rialto-category"],
  },
  {
    id: "adult-film",
    label: "Adult-film publications",
    blurb: "Historical American adult-film magazines and newly digitised issues.",
    linkIds: ["ln-mag-acr", "ln-mag-efg", "ln-mag-rialto-category", "ln-mag-rialto-library"],
  },
  {
    id: "taboo",
    label: "Taboo / family-role",
    blurb:
      "Search these archives for historical issues covering incest, family-role, step-family, mother/father-role, brother/sister fantasy, teacher/student, authority/student, and domestic fantasy. The magazines are keyword-searchable on Rialto.",
    linkIds: [
      "ln-mag-rialto-library",
      "ln-mag-archive-org",
      "ln-mag-retromags-adult",
      "ln-mag-illinois",
    ],
  },
  {
    id: "interracial",
    label: "Interracial",
    blurb:
      "Historical research into interracial themes. Useful search terms: interracial magazine, interracial adult magazine, interracial pornography, Black and white adult magazine, interracial pulp, interracial erotic fiction.",
    linkIds: ["ln-mag-archive-org", "ln-mag-rialto-library", "ln-mag-illinois"],
  },
  {
    id: "dutch",
    label: "Dutch / Netherlands",
    blurb: "Historical Dutch titles including Candy, Chick, Pirana, Rosie, Mach and other erotic publications.",
    linkIds: ["ln-mag-zwiggelaar", "ln-mag-joop"],
  },
  {
    id: "german",
    label: "German",
    blurb:
      "German-language erotic, contact and FKK magazines, including German Playboy, Penthouse, Matador and Happy Weekend (from 1972).",
    linkIds: ["ln-mag-altezeitschriften", "ln-mag-happy-weekend", "ln-mag-mannermagazin"],
  },
  {
    id: "french",
    label: "French",
    blurb: "French men's and erotic publishing, pin-up culture, and Lui (founded 1963).",
    linkIds: ["ln-mag-lui-wiki", "ln-mag-lui-rtl", "ln-mag-memoireonline"],
  },
  {
    id: "underground",
    label: "Underground British film",
    blurb:
      "Britain's clandestine adult-film trade, particularly 1960–1979. The Under the Counter Archive currently holds about 450 titles; access is on request.",
    linkIds: ["ln-mag-utc", "ln-mag-bishopsgate-utc"],
  },
  {
    id: "academic",
    label: "Academic research",
    blurb: "Institutional collections of historical adult magazines and related publications.",
    linkIds: ["ln-mag-illinois", "ln-mag-bishopsgate-archives"],
  },
  {
    id: "reference",
    label: "Historical reference",
    blurb: "Background articles on individual titles and UK adult publishing.",
    linkIds: [
      "ln-mag-mayfair-wiki",
      "ln-mag-menonly-wiki",
      "ln-mag-escort-wiki",
      "ln-mag-lui-wiki",
      "ln-mag-uk-porn-wiki",
    ],
  },
];

export function seedPornMagLinks(): WebsiteLink[] {
  const G = {
    general: "General archives",
    british: "British magazines",
    american: "American magazines",
    film: "Adult-film publications",
    dutch: "Dutch / Netherlands",
    german: "German",
    french: "French",
    underground: "Underground British film",
    academic: "Academic research",
    reference: "Historical reference",
  };
  return [
    mag(
      "ln-mag-rialto-library",
      G.general,
      "The Rialto Report — Magazine Library",
      "https://www.therialtoreport.com/library/",
      "The Rialto Report",
      "Large historical collection of digitised American adult-film and adult-industry magazines, especially the 1960s–1980s. Fully searchable and readable online. Runs include Adam Film Quarterly, Adam Film World, Adult Cinema Review, Adult Video News, Celebrity Skin, Cheri, Cinema Blue, Cinema-X Review, Erotic Film Guide, Flick, High Society, Porn Stars, Stag, Starlet, Video X, and Playboy-related material.",
      "Also useful for American titles, adult-film magazines, taboo/family-role keyword search, and interracial research.",
    ),
    mag(
      "ln-mag-archive-org",
      G.general,
      "Internet Archive",
      "https://archive.org/",
      "Internet Archive",
      "Search by magazine title, publisher, year, country or decade. Useful for locating historical digitised periodicals, including taboo and interracial themes.",
    ),
    mag(
      "ln-mag-archiveteam",
      G.general,
      "Internet Archive — Magazines and Periodicals",
      "https://internetarchive.archiveteam.org/index.php/Magazines_and_Periodicals",
      "Archive Team",
      "Guide to historical magazine and periodical collections on the Internet Archive.",
    ),
    mag(
      "ln-mag-retromags-adult",
      G.general,
      "Retromags — Adult Magazine Archive",
      "https://www.retromags.com/files/category/415-adult/",
      "Retromags",
      "Preserved scans including Club International (February 1977) and Mayfair (April 1970). Browse or download; a free account can be created.",
    ),
    mag(
      "ln-mag-mayfair-index",
      G.british,
      "Mayfair — historical index",
      "https://leonardasf1.narod.ru/nu/Mayfair_Magazine.html",
      "Mayfair index",
      "Issue and volume index for tracing individual Mayfair magazines.",
    ),
    mag(
      "ln-mag-mayfair-pdf",
      G.british,
      "Mayfair — PDF magazine index",
      "https://www.pdfmagaz.in/magazine/mayfair/",
      "PDF Magazines",
      "Index of Mayfair issues in PDF form.",
    ),
    mag(
      "ln-mag-mayfair-retromags",
      G.british,
      "Mayfair — Retromags Vol. 5 No. 2 (April 1970)",
      "https://www.retromags.com/files/file/6526-mayfair-volume-5-issue-2-april-1970/",
      "Retromags",
      "Preserved Mayfair Volume 5, Issue 2, April 1970.",
    ),
    mag(
      "ln-mag-menonly-pdf",
      G.british,
      "Men Only — magazine index",
      "https://www.pdfmagaz.in/magazine/men-only/",
      "PDF Magazines",
      "Index of Men Only issues.",
    ),
    mag(
      "ln-mag-fiesta-sale",
      G.british,
      "Fiesta — back-issue index",
      "https://www.mens-magazines.co.uk/magsforsale/fiestasale/",
      "Men's Magazines",
      "Back-issue listing for Fiesta.",
    ),
    mag(
      "ln-mag-fiesta-sexy",
      G.british,
      "Fiesta — magazine archive",
      "https://www.sexymagazines.com/product-category/magazines/fiesta-adult-content/",
      "Sexy Magazines",
      "Fiesta adult-magazine archive and issue index.",
    ),
    mag(
      "ln-mag-club-pdf",
      G.british,
      "Club International — magazine index",
      "https://www.pdfmagaz.in/magazine/club/",
      "PDF Magazines",
      "Index of Club International issues.",
    ),
    mag(
      "ln-mag-club-wonder",
      G.british,
      "Club International — historical issue index",
      "https://www.wonderclub.com/magazines/magsbymonth.php?month=May&title=Club+International",
      "Wonder Club",
      "Month-by-month historical issue index for Club International.",
    ),
    mag(
      "ln-mag-club-trash",
      G.british,
      "Club International — issue history",
      "https://thetrashcollector.com/eroticamagazinesclubinternational.html",
      "The Trash Collector",
      "Issue history for Club International.",
    ),
    mag(
      "ln-mag-escort-wiki",
      G.british,
      "Escort (magazine)",
      "https://en.wikipedia.org/wiki/Escort_%28magazine%29",
      "Wikipedia",
      "Background on the British adult magazine Escort.",
    ),
    mag(
      "ln-mag-uk-porn-wiki",
      G.british,
      "Pornography in the United Kingdom",
      "https://en.wikipedia.org/wiki/Pornography_in_the_United_Kingdom",
      "Wikipedia",
      "British adult-publishing history. Useful for Mayfair, Men Only, Fiesta, Club International, Escort, Razzle, Knave, Playbirds, Whitehouse, Rustler and Raider.",
    ),
    mag(
      "ln-mag-acr",
      G.film,
      "Adult Cinema Review",
      "https://www.therialtoreport.com/2020/10/11/adult-cinema-review-2/",
      "The Rialto Report",
      "Historical American adult-film publication, 1981–1984.",
    ),
    mag(
      "ln-mag-efg",
      G.film,
      "Erotic Film Guide",
      "https://www.therialtoreport.com/2020/05/24/erotic-film-guide/",
      "The Rialto Report",
      "Historical American adult-film publication, 1982–1984.",
    ),
    mag(
      "ln-mag-rialto-category",
      G.film,
      "Rialto Report — library articles",
      "https://www.therialtoreport.com/category/library/",
      "The Rialto Report",
      "Individual historical articles and newly digitised issues from the magazine library.",
    ),
    mag(
      "ln-mag-illinois",
      G.academic,
      "University of Illinois — Pornography & Erotic Magazine Collection",
      "https://www.library.illinois.edu/hpnl/guides/porn/",
      "University of Illinois",
      "Institutional research collection of historical adult magazines and related publications. Also useful for taboo/family-role and interracial historical research.",
    ),
    mag(
      "ln-mag-zwiggelaar",
      G.dutch,
      "Dutch historical magazine records",
      "https://www.zwiggelaarauctions.nl/Lot/30626",
      "Zwiggelaar Auctions",
      "Auction record useful for identifying historical Dutch titles including Candy, Chick, Pirana, Rosie and Mach.",
    ),
    mag(
      "ln-mag-joop",
      G.dutch,
      "Joop Wilhelmus / Chick",
      "https://en.wikipedia.org/wiki/Joop_Wilhelmus",
      "Wikipedia",
      "Publisher history for Joop Wilhelmus and the Dutch magazine Chick.",
    ),
    mag(
      "ln-mag-altezeitschriften",
      G.german,
      "German historical erotic-magazine archive",
      "https://www.altezeitschriften.de/10-erotik-zeitschriften",
      "Alte Zeitschriften",
      "German-language publications including German Playboy, Penthouse, Matador, erotic and contact magazines, and historical FKK titles.",
    ),
    mag(
      "ln-mag-happy-weekend",
      G.german,
      "Happy Weekend",
      "https://de.wikipedia.org/wiki/Happy_Weekend_%28Zeitschrift%29",
      "Wikipedia",
      "German erotic/contact magazine founded in 1972.",
    ),
    mag(
      "ln-mag-mannermagazin",
      G.german,
      "German men's-magazine history",
      "https://dewiki.de/Lexikon/M%C3%A4nnermagazin",
      "dewiki",
      "Background on German men's and erotic magazines.",
    ),
    mag(
      "ln-mag-lui-wiki",
      G.french,
      "Lui",
      "https://en.wikipedia.org/wiki/Lui",
      "Wikipedia",
      "Major French men's magazine founded in 1963.",
    ),
    mag(
      "ln-mag-lui-rtl",
      G.french,
      "Lui — historical article",
      "https://www.rtl.fr/culture/culture-generale/lui-histoire-d-un-magazine-erotique-7796002870",
      "RTL",
      "French historical background on Lui.",
    ),
    mag(
      "ln-mag-memoireonline",
      G.french,
      "French erotic publishing and pin-up history",
      "https://www.memoireonline.com/04/08/1047/la-pin-up-et-ses-filles-histoire-d-un-archetype-erotique.html",
      "Mémoire Online",
      "Historical discussion of French erotic publishing and pin-up culture.",
    ),
    mag(
      "ln-mag-utc",
      G.underground,
      "Under the Counter Archive",
      "https://under-the-counter.com/the-archive/",
      "Under the Counter",
      "Historical research archive of Britain's clandestine adult-film trade, particularly 1960–1979. About 450 titles, being catalogued and digitised; access on request.",
    ),
    mag(
      "ln-mag-bishopsgate-utc",
      G.underground,
      "Bishopsgate — Under the Counter Archive",
      "https://www.bishopsgate.org.uk/collections/the-under-the-counter-archive/",
      "Bishopsgate Institute",
      "Institutional archive covering Britain's underground 8mm adult-film industry.",
    ),
    mag(
      "ln-mag-bishopsgate-archives",
      G.academic,
      "Bishopsgate Institute — Special Collections",
      "https://www.bishopsgate.org.uk/archives/",
      "Bishopsgate Institute",
      "General catalogue for historical collections, including underground adult-film holdings.",
    ),
    mag(
      "ln-mag-mayfair-wiki",
      G.reference,
      "Mayfair (magazine)",
      "https://en.wikipedia.org/wiki/Mayfair_%28magazine%29",
      "Wikipedia",
      "Background on Mayfair magazine.",
    ),
    mag(
      "ln-mag-menonly-wiki",
      G.reference,
      "Men Only",
      "https://en.wikipedia.org/wiki/Men_Only",
      "Wikipedia",
      "Background on Men Only magazine.",
    ),
  ];
}

export function isPornMagLink(link: Pick<WebsiteLink, "id" | "category">): boolean {
  return link.id.startsWith("ln-mag-") || link.category.startsWith(PORN_MAGS_PREFIX);
}

export function pornMagGroupLabel(category: string): string {
  if (!category.startsWith(PORN_MAGS_PREFIX)) return "";
  const parts = category.split("·");
  return (parts[1] ?? "").trim();
}

export function ensurePornMagsSeed(links: WebsiteLink[], alreadySeeded: boolean): WebsiteLink[] {
  if (alreadySeeded) return links;
  const next = [...links];
  for (const seed of seedPornMagLinks()) {
    if (next.some((l) => l.id === seed.id)) continue;
    const url = seed.url.replace(/\/+$/, "").toLowerCase();
    if (next.some((l) => l.url.replace(/\/+$/, "").toLowerCase() === url)) continue;
    next.push(seed);
  }
  return next;
}
