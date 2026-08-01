import { NextResponse } from "next/server";
import { z } from "zod";
import { course } from "@/data/course";
import { generate, retrieve } from "@/lib/nvidia";
import type { QuizQuestion } from "@/lib/types";

const schema = z.object({ module: z.string().refine((value) => course.modules.includes(value), "Unknown module") });

function localQuiz(module: string): QuizQuestion[] {
  const quizzes: Record<string, QuizQuestion[]> = {
    [course.modules[0]]: [
      { question: "What happens immediately before generation in a RAG pipeline?", options: ["Relevant passages are retrieved", "The model is fine-tuned", "The corpus is deleted", "The answer is cached"], answerIndex: 0, explanation: "RAG retrieves relevant evidence and adds it to the generation prompt." },
      { question: "Why can a very large top-k hurt answer quality?", options: ["It makes vectors shorter", "Irrelevant passages can distract the model", "It disables citations", "It changes the embedding model"], answerIndex: 1, explanation: "Extra context is useful only when it is relevant." },
    ],
    [course.modules[1]]: [
      { question: "Which chunk boundary is generally preferred?", options: ["Every 100 characters", "Random token positions", "Headings and paragraphs", "One entire textbook"], answerIndex: 2, explanation: "Semantic boundaries are more likely to preserve complete ideas." },
      { question: "What is required after changing the embedding model?", options: ["Re-embed the corpus", "Delete source metadata", "Increase temperature", "Remove chunk overlap"], answerIndex: 0, explanation: "Queries and stored documents need compatible vector representations." },
    ],
    [course.modules[2]]: [
      { question: "What should the app do when no chunk clears the threshold?", options: ["Guess a likely answer", "Ask a larger model", "Abstain and return no sources", "Lower the threshold to zero"], answerIndex: 2, explanation: "Explicit abstention prevents an unsupported answer." },
      { question: "Who should select the final source records shown to users?", options: ["The model", "The application", "The browser", "The embedding vector"], answerIndex: 1, explanation: "The application owns source selection and presentation." },
    ],
    [course.modules[3]]: [
      { question: "Which metric evaluates retrieval ranking?", options: ["Mean reciprocal rank", "Temperature", "Abstention prose", "Token count"], answerIndex: 0, explanation: "Mean reciprocal rank measures where the first relevant result appears." },
      { question: "Why version the corpus and embedding model?", options: ["To make answers reproducible", "To remove citations", "To avoid logging latency", "To increase overlap"], answerIndex: 0, explanation: "Version information makes a retrieved answer traceable and reproducible." },
    ],
  };
  return quizzes[module];
}

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid course module." }, { status: 400 });
  const results = await retrieve(parsed.data.module, parsed.data.module, 2);
  if (!results.length) return NextResponse.json({ error: "No course material was found for this module." }, { status: 404 });

  if (process.env.NVIDIA_API_KEY) {
    try {
      const context = results.map(({ chunk }) => chunk.content).join("\n\n");
      const generated = await generate(
        "Create exactly 2 multiple-choice questions using only the supplied material. Return only valid JSON: an array of objects with question, options (exactly 4 strings), answerIndex (0-3), and explanation. No markdown.",
        `Module: ${parsed.data.module}\n\nMaterial:\n${context}`,
      );
      const quizSchema = z.array(z.object({ question: z.string(), options: z.array(z.string()).length(4), answerIndex: z.number().int().min(0).max(3), explanation: z.string() })).length(2);
      const quiz = quizSchema.parse(JSON.parse(generated ?? ""));
      return NextResponse.json({ quiz, mode: "nim" });
    } catch (error) { console.error("Quiz fallback:", error); }
  }
  return NextResponse.json({ quiz: localQuiz(parsed.data.module), mode: "local-demo" });
}
