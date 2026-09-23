export function joinStoryPages(pages: string[]): string {
  return pages
    .map((p) => p.replace(/\r\n/g, "\n").trim())
    .filter(Boolean)
    .join("\n\n");
}

export function pagesFromStory(story: { pages?: string[] | null; content?: string }): string[] {
  if (Array.isArray(story.pages) && story.pages.some((p) => String(p).trim())) {
    return story.pages.map((p) => String(p).trim()).filter(Boolean);
  }
  const content = (story.content ?? "").trim();
  return content ? [content] : [];
}

export function withJoinedContent<T extends { pages?: string[]; content: string }>(story: T): T {
  const pages = pagesFromStory(story);
  return { ...story, pages, content: joinStoryPages(pages) };
}
