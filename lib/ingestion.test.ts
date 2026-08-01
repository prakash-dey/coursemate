import { describe, expect, it } from "vitest";
import { chunkText, validateUpload } from "./ingestion";

describe("document ingestion", () => {
  it("keeps short semantic paragraphs together", () => expect(chunkText("First idea.\n\nSecond idea.", 100)).toEqual(["First idea.\n\nSecond idea."]));
  it("splits long content into bounded overlapping chunks", () => {
    const chunks = chunkText("A".repeat(240), 100, 20); expect(chunks.length).toBe(3); expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
  });
  it("rejects disguised PDFs", () => expect(validateUpload({ name: "notes.pdf", size: 20, type: "application/pdf" }, new TextEncoder().encode("hello"))).toContain("PDF header"));
});
