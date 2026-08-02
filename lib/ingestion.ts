export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain", "text/markdown"]);

export function validateUpload(file: Pick<File, "name" | "size" | "type">, prefix?: Uint8Array) {
  if (!file.name || file.name.length > 200) return "Use a filename between 1 and 200 characters.";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return "Upload a PDF, Markdown, or plain-text file.";
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) return "Files must be between 1 byte and 10 MB.";
  if (file.type === "application/pdf" && prefix && String.fromCharCode(...prefix.slice(0, 5)) !== "%PDF-") return "The file does not contain a valid PDF header.";
  return null;
}

export function chunkText(input: string, maxChars = 1800, overlapChars = 220) {
  const normalized = input.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];
  const paragraphs = normalized.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = []; let current = "";
  for (const paragraph of paragraphs) {
    if (`${current}\n\n${paragraph}`.trim().length <= maxChars) { current = `${current}\n\n${paragraph}`.trim(); continue; }
    if (current) chunks.push(current);
    if (paragraph.length <= maxChars) { current = paragraph; continue; }
    for (let start = 0; start < paragraph.length; start += maxChars - overlapChars) chunks.push(paragraph.slice(start, start + maxChars));
    current = "";
  }
  if (current) chunks.push(current);
  return chunks.map((chunk, index) => index === 0 ? chunk : `${chunks[index - 1].slice(-overlapChars)}\n${chunk}`.slice(-maxChars));
}

export function safeStorageName(name: string) {
  const extension = name.toLowerCase().match(/\.(pdf|txt|md)$/)?.[0] ?? ".txt";
  return `${crypto.randomUUID()}${extension}`;
}
