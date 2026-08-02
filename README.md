# CourseMate

CourseMate turns a learner’s own PDFs and notes into private, source-grounded courses. Create a course, upload material, follow ingestion status, ask questions against only that course, inspect the supporting sources, and generate quizzes from the same evidence.

See the [system design](docs/system-design.md) for the complete architecture, data model, security boundaries, and ingestion/RAG sequence diagrams.

## Stack

- Next.js 16, React 19, and TypeScript
- Supabase Auth, Postgres, private Storage, row-level security, and pgvector
- NVIDIA NIM Nemotron generation and embeddings
- Zod boundary validation and Vitest ingestion tests

## Local setup

### Local Supabase with Docker

1. Install Docker Desktop and the Supabase CLI, then start the local stack. CourseMate uses ports `55321–55329` so it can coexist with another default Supabase project:

```bash
npm run supabase:start
npm run supabase:status
```

2. Copy the local `API URL`, `anon key`, and `service_role key` from `supabase status` into `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key>
NVIDIA_API_KEY=
```

3. Install and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure that address as an allowed Auth site/redirect URL in Supabase.

The migration is applied automatically on the first local start. To rebuild the local database from the checked-in migration:

```bash
npm run supabase:reset
```

This deletes only CourseMate's local Docker database contents. Stop the stack without deleting its Docker volume with `npm run supabase:stop`.

### Hosted Supabase

For production, create or obtain access to a Supabase project and apply `supabase/migrations/20260801140000_course_platform.sql` using the Supabase CLI or SQL editor. Use the hosted project URL and keys in the same environment variable names; never expose the service-role key to the browser.

## Validate

```bash
npm test
npm run lint
npm run build
```

## Current ingestion model

PDF, Markdown, and text uploads are limited to 10 MB. The server validates and stores the private original, extracts text, creates overlapping semantic chunks, embeds them with NVIDIA NIM, and persists them in pgvector. The document becomes searchable only after every chunk is stored successfully.

For higher ingestion volume, move parsing and embedding into a durable worker queue; the database status model already supports queued, processing, ready, and failed states.
