import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

const createSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).default("") });
export async function GET() {
  const { supabase, user } = await requireUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("courses").select("id,name,description,created_at,documents(id,status)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Courses could not be loaded." }, { status: 500 }); return NextResponse.json({ courses: data });
}
export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Enter a course name up to 100 characters." }, { status: 400 });
  const { supabase, user } = await requireUser(); if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("courses").insert({ ...parsed.data, owner_id: user.id }).select("id,name,description,created_at").single();
  if (error) return NextResponse.json({ error: "Course creation failed." }, { status: 500 }); return NextResponse.json({ course: data }, { status: 201 });
}
