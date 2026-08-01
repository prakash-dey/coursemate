"use client";

import { FormEvent, useState } from "react";
import { course } from "@/data/course";
import type { ChatResponse, QuizQuestion } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string; result?: ChatResponse };

const starterQuestions = ["Why does chunk size matter?", "When should a RAG system abstain?", "How do I evaluate retrieval quality?"];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [module, setModule] = useState(course.modules[0]);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizBusy, setQuizBusy] = useState(false);

  async function ask(text = question) {
    const clean = text.trim();
    if (clean.length < 3 || busy) return;
    setQuestion(""); setError(""); setBusy(true);
    setMessages((current) => [...current, { role: "user", text: clean }]);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: clean }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The tutor could not answer right now.");
      setMessages((current) => [...current, { role: "assistant", text: data.answer, result: data }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The tutor could not answer right now."); }
    finally { setBusy(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(); }

  async function makeQuiz() {
    setQuizBusy(true); setError(""); setQuiz(null); setAnswers({});
    try {
      const response = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Quiz generation failed.");
      setQuiz(data.quiz);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Quiz generation failed."); }
    finally { setQuizBusy(false); }
  }

  return (
    <main className="shell">
      <aside className="course-panel">
        <div className="brand"><span className="brand-mark">C</span><span>CourseMate</span></div>
        <div className="course-eyebrow">CURRENT COURSE</div>
        <h1>{course.title}</h1>
        <div className="course-meta"><span>{course.level}</span><span>{course.duration}</span></div>
        <nav aria-label="Course modules">
          {course.modules.map((item, index) => <button key={item} className={module === item ? "module active" : "module"} onClick={() => setModule(item)}><span>0{index + 1}</span>{item.split(" · ")[1]}</button>)}
        </nav>
        <div className="quiz-callout"><div className="quiz-icon">?</div><div><strong>Check your recall</strong><p>Two questions, grounded in this module.</p></div><button onClick={makeQuiz} disabled={quizBusy}>{quizBusy ? "Building quiz…" : "Quiz me on this module"}</button></div>
      </aside>

      <section className="workspace">
        <header><div><span className="live-dot" />COURSE TUTOR · ONLINE</div><span>8 curated sources</span></header>
        <div className="conversation" aria-live="polite">
          {!messages.length && !quiz && <div className="welcome"><div className="spark">✦</div><p className="overline">SOURCE-GROUNDED LEARNING</p><h2>Ask the course.<br />Trace the answer.</h2><p>CourseMate retrieves the most relevant lesson notes before answering, so every explanation comes with evidence you can inspect.</p><div className="starters">{starterQuestions.map((item) => <button key={item} onClick={() => ask(item)}>{item}<span>↗</span></button>)}</div></div>}
          {messages.map((message, index) => <article key={index} className={`message ${message.role}`}><div className="message-label">{message.role === "user" ? "YOU" : "COURSEMATE"}</div><div className="message-body"><p>{message.text}</p>{message.result && <><div className={`grounding ${message.result.grounded ? "found" : "missing"}`}>{message.result.grounded ? `✓ Grounded in ${message.result.sources.length} course source${message.result.sources.length === 1 ? "" : "s"}` : "No supporting evidence found"}<span>{message.result.mode === "nim" ? "NVIDIA NIM" : "LOCAL DEMO"}</span></div>{message.result.sources.map((source) => <details className="source" key={source.id}><summary><span><small>{source.module}</small>{source.title}</span><b>{source.score}% match</b></summary><p>{source.snippet}</p></details>)}</>}</div></article>)}
          {busy && <div className="thinking"><span /><span /><span /> Retrieving course evidence…</div>}
          {quiz && <section className="quiz-sheet"><p className="overline">MODULE QUIZ</p><h2>{module.split(" · ")[1]}</h2>{quiz.map((item, qi) => <fieldset key={item.question}><legend>{qi + 1}. {item.question}</legend>{item.options.map((option, oi) => { const selected = answers[qi] === oi; const revealed = answers[qi] !== undefined; return <button className={revealed && oi === item.answerIndex ? "correct" : selected ? "wrong" : ""} key={option} onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))} disabled={revealed}>{String.fromCharCode(65 + oi)}. {option}</button>; })}{answers[qi] !== undefined && <p className="explanation">{item.explanation}</p>}</fieldset>)}</section>}
          {error && <div className="error" role="alert">{error}</div>}
        </div>
        <form className="composer" onSubmit={submit}><label htmlFor="question" className="sr-only">Ask a course question</label><textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(); } }} placeholder="Ask about retrieval, chunking, grounding…" maxLength={500} /><button aria-label="Send question" disabled={busy || question.trim().length < 3}>↑</button><div className="composer-meta"><span>Answers use course material only</span><span>{question.length}/500 · Enter to send</span></div></form>
      </section>
    </main>
  );
}
