import { describe, expect, it } from "vitest";
import { cosineSimilarity, retrieveLexically } from "./retrieval";

describe("course retrieval", () => {
  it("ranks the chunking lesson for a chunk-boundary question", () => {
    const [result] = retrieveLexically("How should I choose chunk boundaries?");
    expect(result.chunk.id).toBe("chunking-1");
    expect(result.score).toBeGreaterThan(0.14);
  });

  it("does not rank unrelated chunks through auxiliary words", () => {
    const results = retrieveLexically("Why does chunk size matter?");
    expect(results.map((result) => result.chunk.id)).toEqual(["chunking-1"]);
  });

  it("returns no evidence for an unrelated question", () => {
    expect(retrieveLexically("Who won the football world cup yesterday?")).toEqual([]);
  });

  it("computes cosine similarity for normalized directions", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });
});
