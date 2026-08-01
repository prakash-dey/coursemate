# CourseMate

CourseMate is a source-grounded AI tutor for a curated **Production RAG Fundamentals** course. It demonstrates a complete retrieval-augmented generation vertical slice: retrieve relevant course notes, answer from evidence, expose sources, abstain when evidence is missing, and create module quizzes from retrieved material.

## Product flow

1. A learner asks a technical question.
2. The server embeds the query and curated course chunks with NVIDIA NIM.
3. The most relevant chunks above the evidence threshold are selected.
4. Nemotron produces a concise answer constrained to those chunks.
5. The UI displays the exact source titles, modules, snippets, and match scores.
6. If nothing clears the threshold, CourseMate returns an explicit no-evidence response without calling generation.

The **Quiz me on this module** flow retrieves only the selected module and produces two multiple-choice questions grounded in that material.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- NVIDIA NIM OpenAI-compatible chat and embedding APIs
- `nvidia/nemotron-mini-4b-instruct` for generation
- `nvidia/nemotron-3-embed-1b` for embeddings
- Zod request and model-output validation
- Vitest retrieval regression tests

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Default |
| --- | --- | --- |
| `NVIDIA_API_KEY` | For NIM mode | None |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_CHAT_MODEL` | No | `nvidia/nemotron-mini-4b-instruct` |
| `NVIDIA_EMBED_MODEL` | No | `nvidia/nemotron-3-embed-1b` |

The API key is read only by server modules and is never exposed through client code. Without a key, the app enters **local demo mode**: deterministic lexical retrieval, extractive grounded answers, and curated quizzes keep every interaction usable for review.

## Architecture

```text
Browser
  ├─ POST /api/chat ── validate ── retrieve ── threshold ── generate ── answer + sources
  └─ POST /api/quiz ── validate module ── retrieve module notes ── generate/validate quiz

Retrieval
  ├─ NIM configured: query/passages → Nemotron embeddings → cosine similarity
  └─ No key or NIM unavailable: weighted lexical ranking
```

The corpus is intentionally small and checked into `data/course.ts`. Each record is already split on a semantic lesson boundary and retains its title and module metadata. For a larger corpus, embeddings would be generated during ingestion and stored in a vector database instead of recomputed per request.

## Evidence and failure behavior

- Generation receives only retrieved course excerpts and a strict grounding instruction.
- Source records come from application state, not model-written citations.
- Weak retrieval returns an empty source list and a clear abstention message.
- NIM failures fall back to deterministic local behavior rather than breaking the demo.
- Quiz JSON is schema-validated before it reaches the browser.

## Validate

```bash
npm test
npm run lint
npm run build
```

Tests cover topic ranking, unrelated-question abstention, retrieval noise, and cosine similarity.

## MVP scope

CourseMate deliberately ships one excellent course experience. Authentication, payments, multi-user state, document uploads, and a vector database are excluded from this first version so the core retrieval and grounding behavior remains easy to inspect.
