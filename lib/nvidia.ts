import "server-only";
import { z } from "zod";

const baseUrl = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const chatModel = process.env.NVIDIA_CHAT_MODEL ?? "nvidia/nemotron-mini-4b-instruct";
const embedModel = process.env.NVIDIA_EMBED_MODEL ?? "nvidia/nemotron-3-embed-1b";
const embeddingResponseSchema = z.object({ data: z.array(z.object({ embedding: z.array(z.number().finite()).length(2048), index: z.number().int().nonnegative() })) });
const chatResponseSchema = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().max(20000) }) })).min(1) });

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
  const json = embeddingResponseSchema.parse(await response.json());
  const sorted = json.data.sort((a, b) => a.index - b.index);
  if (sorted.length !== inputs.length || sorted.some((item, index) => item.index !== index)) throw new Error("NVIDIA embeddings response was incomplete.");
  return sorted.map((item) => item.embedding);
}

export async function embedPassages(inputs: string[]) {
  if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is required to ingest documents.");
  return embed(inputs, "passage");
}

export async function embedQuery(input: string) {
  if (!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is required for semantic retrieval.");
  return (await embed([input], "query"))[0];
}

export async function generate(system: string, user: string) {
  if (!process.env.NVIDIA_API_KEY) return null;
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST", headers: headers(), cache: "no-store",
    body: JSON.stringify({ model: chatModel, temperature: 0.2, top_p: 0.9, max_tokens: 500, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!response.ok) throw new Error(`NVIDIA chat request failed (${response.status})`);
  const json = chatResponseSchema.parse(await response.json());
  return json.choices[0]?.message.content?.trim() ?? null;
}
