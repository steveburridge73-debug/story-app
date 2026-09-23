import { joinStoryPages } from "./pages";

export async function extractStoryPages(file: File): Promise<string[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type === "text/plain") {
    const text = (await file.text()).replace(/\r\n/g, "\n");
    const byForm = text.split(/\f+/).map((p) => p.trim()).filter(Boolean);
    return byForm.length ? byForm : text.trim() ? [text.trim()] : [];
  }
  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value.replace(/\r\n/g, "\n").trim();
    const byForm = text.split(/\f+/).map((p) => p.trim()).filter(Boolean);
    return byForm.length ? byForm : text ? [text] : [];
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/[ \t]+/g, " ")
        .trim();
      if (line) parts.push(line);
    }
    return parts;
  }
  throw new Error("Unsupported file type. Use TXT, DOCX or PDF, or a screenshot.");
}

export async function extractStoryText(file: File): Promise<string> {
  return joinStoryPages(await extractStoryPages(file));
}

export function guessTitle(filename: string, content: string): string {
  const fromName = filename.replace(/\.(txt|docx|pdf)$/i, "").replace(/[_-]+/g, " ").trim();
  const firstLine = content
    .split(/\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (firstLine && firstLine.length <= 80 && !firstLine.endsWith(".")) return firstLine;
  return fromName || "Imported story";
}
