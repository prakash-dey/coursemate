# CourseMate

CourseMate turns a learner’s own PDFs and notes into private, source-grounded courses. Create a course, upload material, follow ingestion status, ask questions against only that course, inspect the supporting sources, and generate quizzes from the same evidence.

See the [system design](docs/system-design.md) for the complete architecture, data model, security boundaries, and ingestion/RAG sequence diagrams.

## Stack

- Next.js 16, React 19, and TypeScript
- Supabase Auth, Postgres, private Storage, row-level security, and pgvector
- NVIDIA NIM Nemotron generation and embeddings
- Zod boundary validation and Vitest ingestion tests

## Local setup

1. Create or obtain access to a Supabase project. No external project is provisioned by this repository.
2. Apply `supabase/migrations/20260801140000_course_platform.sql` using the Supabase CLI or SQL editor.
3. Copy `.env.example` to `.env.local` and provide:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NVIDIA_API_KEY=
```

4. Install and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure that address as an allowed Auth site/redirect URL in Supabase.

## Validate

```bash
npm test
npm run lint
npm run build
```

## Current ingestion model

PDF, Markdown, and text uploads are limited to 10 MB. The server validates and stores the private original, extracts text, creates overlapping semantic chunks, embeds them with NVIDIA NIM, and persists them in pgvector. The document becomes searchable only after every chunk is stored successfully.

For higher ingestion volume, move parsing and embedding into a durable worker queue; the database status model already supports queued, processing, ready, and failed states.
