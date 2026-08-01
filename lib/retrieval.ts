import { courseChunks, type CourseChunk } from "@/data/course";

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "was", "what", "when", "where", "which", "why", "with"]);

export function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9-]+/g)?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
}

export function lexicalScore(query: string, chunk: CourseChunk) {
  const terms = new Set(tokenize(query));
  if (!terms.size) return 0;
  const titleTerms = tokenize(`${chunk.title} ${chunk.module}`);
  const contentTerms = tokenize(chunk.content);
  let matches = 0;
  for (const term of terms) {
    if (titleTerms.includes(term)) matches += 2;
    if (contentTerms.includes(term)) matches += 1;
  }
  return matches / (terms.size * 3);
}

export function retrieveLexically(query: string, module?: string, limit = 3) {
  return courseChunks
    .filter((chunk) => !module || chunk.module === module)
    .map((chunk) => ({ chunk, score: lexicalScore(query, chunk) }))
    .filter((result) => result.score >= 0.14)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; normA += a[i] ** 2; normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
