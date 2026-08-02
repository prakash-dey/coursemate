import "server-only";
import { courseChunks, type CourseChunk } from "@/data/course";
import { cosineSimilarity, retrieveLexically } from "./retrieval";

const baseUrl = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const chatModel = process.env.NVIDIA_CHAT_MODEL ?? "nvidia/nemotron-mini-4b-instruct";
const embedModel = process.env.NVIDIA_EMBED_MODEL ?? "nvidia/nemotron-3-embed-1b";

function headers() {
  return { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" };
}

async function embed(inputs: string[], inputType: "query" | "passage") {
  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ model: embedModel, input: inputs, input_type: inputType, encoding_format: "float", truncate: "END" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`NVIDIA embeddings request failed (${response.status})`);
  const json = await response.json() as { data: Array<{ embedding: number[]; index: number }> };
  return json.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

export async function embedPassages(inputs: string[]) {
  if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is required to ingest documents.");
  return embed(inputs, "passage");
}

export async function embedQuery(input: string) {
  if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is required for semantic retrieval.");
  return (await embed([input], "query"))[0];
}

export async function retrieve(query: string, module?: string, limit = 3): Promise<Array<{ chunk: CourseChunk; score: number }>> {
  const candidates = courseChunks.filter((chunk) => !module || chunk.module === module);
  if (!process.env.NVIDIA_API_KEY) return retrieveLexically(query, module, limit);
  try {
    const [queryVector, documentVectors] = await Promise.all([
      embed([query], "query").then((items) => items[0]),
      embed(candidates.map((chunk) => `${chunk.title}\n${chunk.content}`), "passage"),
    ]);
    return candidates.map((chunk, index) => ({ chunk, score: cosineSimilarity(queryVector, documentVectors[index]) }))
      .filter((item) => item.score >= 0.3).sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error("Embedding fallback:", error);
    return retrieveLexically(query, module, limit);
  }
}

export async function generate(system: string, user: string) {
  if (!process.env.NVIDIA_API_KEY) return null;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST", headers: headers(), cache: "no-store",
    body: JSON.stringify({ model: chatModel, temperature: 0.2, top_p: 0.9, max_tokens: 500, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!response.ok) throw new Error(`NVIDIA chat request failed (${response.status})`);
  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  return json.choices[0]?.message.content?.trim() ?? null;
}
