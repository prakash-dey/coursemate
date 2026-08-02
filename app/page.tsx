"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { signOut } from "./auth/actions";
import type { ChatResponse, QuizQuestion } from "@/lib/types";

type Document = { id: string; title: string; status: "queued" | "processing" | "ready" | "failed"; error_message?: string; chunk_count: number };
type Course = { id: string; name: string; description: string; created_at: string; documents: Document[] };
type Message = { role: "user" | "assistant"; text: string; result?: ChatResponse };

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]); const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [creating, setCreating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]); const [question, setQuestion] = useState(""); const [asking, setAsking] = useState(false);
  const [uploading, setUploading] = useState(false); const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null); const [quizBusy, setQuizBusy] = useState(false); const [answers, setAnswers] = useState<Record<number, number>>({});
  const selected = useMemo(() => courses.find((course) => course.id === selectedId) ?? null, [courses, selectedId]);
  const readyCount = selected?.documents.filter((doc) => doc.status === "ready").length ?? 0;

  const loadCourses = useCallback(async () => {
    try { const response = await fetch("/api/courses"); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCourses(data.courses); setSelectedId((current) => current ?? data.courses[0]?.id ?? null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Courses could not be loaded."); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void loadCourses(), 0); return () => window.clearTimeout(timer); }, [loadCourses]);

  async function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCreating(true); setError(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), description: form.get("description") }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCourses((items) => [{ ...data.course, documents: [] }, ...items]); setSelectedId(data.course.id); event.currentTarget.reset(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Course creation failed."); } finally { setCreating(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return; setUploading(true); setError(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch(`/api/courses/${selected.id}/documents`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); event.currentTarget.reset(); await loadCourses(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Document upload failed."); await loadCourses(); } finally { setUploading(false); }
  }
  async function ask(event: FormEvent) {
    event.preventDefault(); if (!selected || question.trim().length < 3) return; const text = question.trim(); setQuestion(""); setAsking(true); setError(""); setMessages((items) => [...items, { role: "user", text }]);
    try { const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: selected.id, question: text }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessages((items) => [...items, { role: "assistant", text: data.answer, result: data }]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "CourseMate could not answer."); } finally { setAsking(false); }
  }
  async function makeQuiz() {
    if (!selected) return; setQuizBusy(true); setQuiz(null); setAnswers({}); setError("");
    try { const response = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: selected.id, topic: "key concepts" }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setQuiz(data.quiz); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Quiz generation failed."); } finally { setQuizBusy(false); }
  }

  if (loading) return <main className="center-state"><span className="spinner" /><h1>Opening your courses</h1><p>Checking your private workspace…</p></main>;
  return <main className="platform-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">C</span><span>CourseMate</span></div><div className="side-label">YOUR COURSES</div><nav>{courses.map((course) => <button className={course.id === selectedId ? "course-link active" : "course-link"} key={course.id} onClick={() => { setSelectedId(course.id); setMessages([]); setQuiz(null); }}><span>{course.name.slice(0, 1).toUpperCase()}</span><div><strong>{course.name}</strong><small>{course.documents.length} document{course.documents.length === 1 ? "" : "s"}</small></div></button>)}</nav><details className="new-course" open={!courses.length}><summary>＋ New course</summary><form onSubmit={createCourse}><label>Course name<input name="name" maxLength={100} required placeholder="e.g. Distributed Systems" /></label><label>Description<textarea name="description" maxLength={500} placeholder="What are you learning?" /></label><button disabled={creating}>{creating ? "Creating…" : "Create course"}</button></form></details><form action={signOut} className="sign-out"><button>Sign out</button></form></aside>
    {!selected ? <section className="empty-workspace"><div className="empty-icon">↗</div><p className="overline">START YOUR LIBRARY</p><h1>Create your first course.</h1><p>Give your learning space a name, then add the PDFs or notes you want CourseMate to use.</p></section> : <section className="course-workspace"><header><div><p className="overline">COURSE WORKSPACE</p><h1>{selected.name}</h1><p>{selected.description || "Your private, source-grounded study space."}</p></div><button className="quiz-button" disabled={!readyCount || quizBusy} onClick={makeQuiz}>{quizBusy ? "Building quiz…" : "Quiz this course"}</button></header>
      <div className="workspace-grid"><section className="study-pane"><div className="materials"><div className="section-heading"><div><h2>Course material</h2><p>{readyCount} ready · {selected.documents.length} total</p></div><form onSubmit={upload}><label className={uploading ? "upload-button busy" : "upload-button"}>＋ {uploading ? "Processing…" : "Add document"}<input type="file" name="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" required disabled={uploading} onChange={(event) => event.currentTarget.form?.requestSubmit()} /></label></form></div>{!selected.documents.length ? <div className="material-empty"><strong>No material yet</strong><p>Upload a PDF, Markdown, or text file. CourseMate will parse, chunk, and embed it for this course.</p></div> : <div className="document-list">{selected.documents.map((doc) => <div className="document-row" key={doc.id}><div className="file-icon">{doc.title.toLowerCase().endsWith(".pdf") ? "PDF" : "TXT"}</div><div><strong>{doc.title}</strong><small>{doc.status === "ready" ? `${doc.chunk_count} searchable sections` : doc.status === "failed" ? doc.error_message || "Processing failed" : "Parsing and embedding…"}</small></div><span className={`status ${doc.status}`}>{doc.status}</span></div>)}</div>}</div>
        <div className="conversation" aria-live="polite">{!messages.length && !quiz && <div className="chat-empty"><p className="overline">ASK YOUR MATERIAL</p><h2>{readyCount ? "What do you want to understand?" : "Add material to begin."}</h2><p>{readyCount ? "Answers use only the ready documents in this course and always show their sources." : "Questions and quizzes unlock when at least one document finishes processing."}</p></div>}{messages.map((message, index) => <article className={`message ${message.role}`} key={index}><div className="message-label">{message.role === "user" ? "YOU" : "COURSEMATE"}</div><div className="message-body"><p>{message.text}</p>{message.result && <><div className={`grounding ${message.result.grounded ? "found" : "missing"}`}>{message.result.grounded ? `Grounded in ${message.result.sources.length} source${message.result.sources.length === 1 ? "" : "s"}` : "No evidence found"}</div>{message.result.sources.map((source) => <details className="source" key={`${source.id}-${source.snippet}`}><summary><span>{source.title}</span><b>{source.score}% match</b></summary><p>{source.snippet}</p></details>)}</>}</div></article>)}{asking && <div className="retrieving"><span className="spinner" />Retrieving only from {selected.name}…</div>}{quiz && <div className="quiz-sheet"><p className="overline">COURSE QUIZ</p><h2>Check your understanding</h2>{quiz.map((item, qi) => <fieldset key={item.question}><legend>{qi + 1}. {item.question}</legend>{item.options.map((option, oi) => { const answered = answers[qi] !== undefined; return <button key={option} disabled={answered} className={answered && oi === item.answerIndex ? "correct" : answered && answers[qi] === oi ? "wrong" : ""} onClick={() => setAnswers((value) => ({ ...value, [qi]: oi }))}>{String.fromCharCode(65 + oi)}. {option}</button>; })}{answers[qi] !== undefined && <p>{item.explanation}</p>}</fieldset>)}</div>}{error && <div className="error" role="alert">{error}</div>}</div>
        <form className="composer" onSubmit={ask}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} disabled={!readyCount || asking} placeholder={readyCount ? `Ask ${selected.name}…` : "Waiting for course material…"} aria-label="Ask this course" /><button disabled={!readyCount || asking || question.trim().length < 3}>↑</button><small>Answers are isolated to this course · {question.length}/500</small></form></section>
      <aside className="trust-rail"><p className="overline">HOW ANSWERS WORK</p><ol><li><span>1</span>Search this course</li><li><span>2</span>Check evidence strength</li><li><span>3</span>Answer with sources</li></ol><div className="privacy-note"><strong>Private by design</strong><p>Your courses and documents are isolated to your account.</p></div></aside></div></section>}
  </main>;
}
