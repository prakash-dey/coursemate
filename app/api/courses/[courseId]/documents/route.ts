import { NextResponse } from "next/server";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { chunkText, safeStorageName, validateUpload } from "@/lib/ingestion";
import { embedPassages } from "@/lib/nvidia";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params; const { supabase, user } = await requireUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: course } = await supabase.from("courses").select("id").eq("id", courseId).single();
  if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer()); const validationError = validateUpload(file, bytes.slice(0, 5));
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  const storagePath = `${user.id}/${courseId}/${safeStorageName(file.name)}`;
  const { error: storageError } = await supabase.storage.from("course-documents").upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (storageError) return NextResponse.json({ error: "The document could not be stored." }, { status: 500 });
  const { data: document, error: rowError } = await supabase.from("documents").insert({ course_id: courseId, owner_id: user.id, title: file.name, storage_path: storagePath, mime_type: file.type, size_bytes: file.size, status: "processing" }).select("id,title,status").single();
  if (rowError || !document) { await supabase.storage.from("course-documents").remove([storagePath]); return NextResponse.json({ error: "The document record could not be created." }, { status: 500 }); }
  try {
    const text = file.type === "application/pdf" ? (await pdf(Buffer.from(bytes))).text : new TextDecoder().decode(bytes);
    const chunks = chunkText(text); if (!chunks.length) throw new Error("No readable text was found in this document.");
    const vectors: number[][] = []; for (let i = 0; i < chunks.length; i += 24) vectors.push(...await embedPassages(chunks.slice(i, i + 24)));
    const admin = createSupabaseAdminClient(); const { error: chunkError } = await admin.from("chunks").insert(chunks.map((content, ordinal) => ({ course_id: courseId, document_id: document.id, owner_id: user.id, ordinal, content, embedding: vectors[ordinal] })));
    if (chunkError) throw chunkError;
    await admin.from("documents").update({ status: "ready", chunk_count: chunks.length, processed_at: new Date().toISOString(), error_message: null }).eq("id", document.id).eq("owner_id", user.id);
    return NextResponse.json({ document: { ...document, status: "ready", chunk_count: chunks.length } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Document processing failed."; const admin = createSupabaseAdminClient();
    await admin.from("documents").update({ status: "failed", error_message: message }).eq("id", document.id).eq("owner_id", user.id);
    return NextResponse.json({ document: { ...document, status: "failed" }, error: message }, { status: 422 });
  }
}
