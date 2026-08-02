import { NextResponse } from "next/server";
import { z } from "zod";
import { embedQuery, generate } from "@/lib/nvidia";
import { QUIZ_MATCH_THRESHOLD } from "@/lib/retrieval";
import { requireUser } from "@/lib/supabase/server";
const requestSchema = z.object({ courseId: z.string().uuid(), topic: z.string().trim().max(120).default("key concepts") });
const quizSchema = z.array(z.object({ question: z.string(), options: z.array(z.string()).length(4), answerIndex: z.number().int().min(0).max(3), explanation: z.string() })).length(3);
export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Choose a valid course." }, { status: 400 });
  const { supabase, user } = await requireUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: course } = await supabase.from("courses").select("id").eq("id", parsed.data.courseId).single(); if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  try {
    const vector = await embedQuery(parsed.data.topic || "key concepts"); const { data } = await supabase.rpc("match_course_chunks", { query_embedding: vector, target_course_id: course.id, match_threshold: QUIZ_MATCH_THRESHOLD, match_count: 8 });
    if (!data?.length) return NextResponse.json({ error: "This course has no ready material for a quiz yet." }, { status: 409 });
    const result = await generate("Create exactly 3 multiple-choice questions only from the material. Return only a JSON array with question, four options, answerIndex, explanation.", data.map((item: { content: string }) => item.content).join("\n\n"));
    return NextResponse.json({ quiz: quizSchema.parse(JSON.parse(result ?? "")), mode: "nim" });
  } catch (error) { console.error("Quiz generation failed", error); return NextResponse.json({ error: "Quiz generation is temporarily unavailable." }, { status: 503 }); }
}
