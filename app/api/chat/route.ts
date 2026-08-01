import { NextResponse } from "next/server";
import { z } from "zod";
import { generate, retrieve } from "@/lib/nvidia";
import type { ChatResponse, Source } from "@/lib/types";

const schema = z.object({ question: z.string().trim().min(3).max(500) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a question between 3 and 500 characters." }, { status: 400 });

  const results = await retrieve(parsed.data.question);
  if (!results.length) {
    const response: ChatResponse = {
      answer: "I couldn’t find enough evidence in this course to answer that. Try asking about retrieval, chunking, embeddings, grounding, or RAG evaluation.",
      sources: [], grounded: false, mode: process.env.NVIDIA_API_KEY ? "nim" : "local-demo",
    };
    return NextResponse.json(response);
  }

  const context = results.map(({ chunk }, index) => `[S${index + 1}] ${chunk.title}\n${chunk.content}`).join("\n\n");
  let answer: string | null = null;
  let generatedWithNim = false;
  try {
    answer = await generate(
      "You are CourseMate, a concise technical tutor. Answer only from the supplied course excerpts. Do not add facts from memory. Use 2-4 short sentences and cite supporting excerpts as [S1], [S2]. If the evidence is insufficient, say so.",
      `Question: ${parsed.data.question}\n\nCourse excerpts:\n${context}`,
    );
    generatedWithNim = Boolean(answer);
  } catch (error) {
    console.error("Generation fallback:", error);
  }
  if (!answer) answer = results.slice(0, 2).map(({ chunk }) => chunk.content).join(" ");

  const sources: Source[] = results.map(({ chunk, score }) => ({
    id: chunk.id, title: chunk.title, module: chunk.module,
    snippet: chunk.content.length > 180 ? `${chunk.content.slice(0, 177)}…` : chunk.content,
    score: Math.round(score * 100),
  }));
  return NextResponse.json({ answer, sources, grounded: true, mode: generatedWithNim ? "nim" : "local-demo" } satisfies ChatResponse);
}
