import { generateStoryFn, targetWordCount, type GenerateRequest } from "./api";
import { composeFallbackStory } from "./fallback";
import { countWords } from "@/lib/utils";

export type GenProgress = {
  text: string;
  words: number;
  pass: number;
  total: number;
  target: number;
  local?: boolean;
};

export function progressLabel(p: Pick<GenProgress, "pass" | "total" | "words" | "target">) {
  return `Writing part ${p.pass} of ${p.total} · ${p.words.toLocaleString()} / ${p.target.toLocaleString()} words`;
}

function passesFor(target: number) {
  if (target >= 3500) return 5;
  if (target >= 1800) return 4;
  return 3;
}

export async function runStoryGeneration(
  data: GenerateRequest,
  onProgress?: (p: GenProgress) => void,
): Promise<{ ok: true; text: string; local?: boolean; words: number } | { ok: false; error: string }> {
  const target =
    data.length?.trim()
      ? targetWordCount(data.length)
      : data.originalStory
        ? Math.min(6000, Math.max(1000, countWords(data.originalStory)))
        : 1800;
  const request: GenerateRequest = {
    ...data,
    length: data.length?.trim() || `${target} words`,
  };
  const total = passesFor(target);
  let story = "";
  let lastError = "";

  for (let pass = 0; pass < total; pass++) {
    const have = countWords(story);
    if (have >= Math.round(target * 0.9) && pass > 0) break;
    try {
      const result = await generateStoryFn({
        data: { ...request, previousText: story || undefined },
      });
      if (!result.ok) {
        lastError = result.error;
        if (!story) break;
        continue;
      }
      const next = result.text.trim();
      const grew = countWords(next) - have;
      story = next;
      onProgress?.({
        text: story,
        words: countWords(story),
        pass: pass + 1,
        total,
        target,
      });
      if (countWords(story) >= Math.round(target * 0.9)) break;
      if (grew < 80 && pass > 0) break;
    } catch {
      lastError = "Writing was interrupted.";
      break;
    }
  }

  const words = countWords(story);
  if (words >= Math.min(400, Math.round(target * 0.2))) {
    return { ok: true as const, text: story.trim(), words };
  }

  const local = composeFallbackStory({ ...request, length: `${target} words` });
  onProgress?.({
    text: local,
    words: countWords(local),
    pass: total,
    total,
    target,
    local: true,
  });
  if (lastError && countWords(local) < 80) {
    return { ok: false as const, error: lastError };
  }
  return { ok: true as const, text: local, local: true as const, words: countWords(local) };
}
