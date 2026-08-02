import { NextResponse } from "next/server";
import { z } from "zod";
import { embedQuery, generate } from "@/lib/nvidia";
import { requireUser } from "@/lib/supabase/server";

const schema = z.object({ courseId: z.string().uuid(), question: z.string().trim().min(3).max(500) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Choose a course and enter a valid question." }, { status: 400 });
  const { supabase, user } = await requireUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: course } = await supabase.from("courses").select("id").eq("id", parsed.data.courseId).single(); if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  try {
    const vector = await embedQuery(parsed.data.question); const { data, error } = await supabase.rpc("match_course_chunks", { query_embedding: vector, target_course_id: course.id, match_threshold: 0.35, match_count: 5 });
    if (error) throw error; const matches = data ?? [];
    if (!matches.length) return NextResponse.json({ answer: "I couldn’t find enough evidence in this course to answer that. Add relevant material or rephrase your question.", sources: [], grounded: false, mode: "nim" });
    const context = matches.map((item: { title: string; content: string }, index: number) => `[S${index + 1}] ${item.title}\n${item.content}`).join("\n\n");
    const answer = await generate("You are CourseMate. Answer only from the supplied course excerpts. Be concise and cite evidence as [S1]. If insufficient, abstain.", `Question: ${parsed.data.question}\n\n${context}`);
    if (!answer) throw new Error("Generation returned no answer.");
    return NextResponse.json({ answer, grounded: true, mode: "nim", sources: matches.map((item: { document_id: string; title: string; content: string; similarity: number }) => ({ id: item.document_id, title: item.title, module: "Course material", snippet: item.content.slice(0, 220), score: Math.round(item.similarity * 100) })) });
  } catch (error) { console.error("Course chat failed", error); return NextResponse.json({ error: "Course retrieval is temporarily unavailable." }, { status: 503 }); }
}
