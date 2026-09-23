const STOP = new Set(
  [
    "The",
    "A",
    "An",
    "And",
    "But",
    "Or",
    "If",
    "When",
    "Then",
    "Than",
    "This",
    "That",
    "These",
    "Those",
    "There",
    "Here",
    "What",
    "Which",
    "Who",
    "Whom",
    "Whose",
    "Where",
    "Why",
    "How",
    "Not",
    "No",
    "Yes",
    "He",
    "She",
    "They",
    "We",
    "You",
    "His",
    "Her",
    "Their",
    "Our",
    "Your",
    "Him",
    "Them",
    "Its",
    "Mr",
    "Mrs",
    "Ms",
    "Miss",
    "Dr",
    "Sir",
    "Madam",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "Chapter",
    "Once",
    "After",
    "Before",
    "During",
    "While",
    "Into",
    "From",
    "With",
    "Without",
    "About",
    "Over",
    "Under",
    "Between",
    "Through",
    "Still",
    "Just",
    "Only",
    "Even",
    "Also",
    "Very",
    "Really",
    "Something",
    "Someone",
    "Everyone",
    "Everything",
    "Nothing",
    "Anything",
    "Maybe",
    "Perhaps",
    "However",
    "Although",
    "Because",
    "Since",
    "Until",
    "Today",
    "Tomorrow",
    "Yesterday",
    "Hello",
    "Okay",
    "Please",
    "Thanks",
    "Well",
  ].map((s) => s.toLowerCase()),
);

export function detectCharacterNames(text: string): string[] {
  const counts = new Map<string, number>();
  const re = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const name = m[1];
    if (!name) continue;
    const first = name.split(" ")[0] ?? name;
    if (STOP.has(first.toLowerCase())) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([name]) => name);
}

export function looksUnderEighteen(age: string): boolean {
  const n = Number.parseInt(age.trim(), 10);
  return Number.isFinite(n) && n < 18;
}

export function ageIsAmbiguous(age: string): boolean {
  const t = age.trim();
  if (!t) return true;
  if (looksUnderEighteen(t)) return false;
  const n = Number.parseInt(t, 10);
  return !Number.isFinite(n);
}
