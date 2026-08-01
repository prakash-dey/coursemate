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

1. Install Docker Desktop and the Supabase CLI. CourseMate uses ports `55321–55329` so it can coexist with another default Supabase project.

2. In Google Cloud Console, create an OAuth 2.0 Client ID with application type **Web application**. Configure:

   - Authorized JavaScript origins: `http://localhost:3000` and `http://127.0.0.1:3000`
   - Authorized redirect URI: `http://127.0.0.1:55321/auth/v1/callback`

3. Put the credentials in the ignored root `.env` file. Never commit this file:

```text
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<google client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<google client secret>
```

4. Start or restart local Supabase after changing either credential so GoTrue receives the provider configuration:

```bash
npm run supabase:stop
npm run supabase:start
npm run supabase:status
```

5. Copy the local `API URL`, `anon key`, and `service_role key` from `supabase status` into `.env.local`:

```text
APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key>
NVIDIA_API_KEY=
```

6. Install and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and continue with Google. CourseMate uses Supabase Auth's PKCE callback at `/auth/callback`; provider cancellation and invalid callback responses return to the sign-in screen with a safe error message.

The migration is applied automatically on the first local start. To rebuild the local database from the checked-in migration:

```bash
npm run supabase:reset
```

This deletes only CourseMate's local Docker database contents. Stop the stack without deleting its Docker volume with `npm run supabase:stop`.

### Hosted Supabase

For production, create or obtain access to a Supabase project and apply `supabase/migrations/20260801140000_course_platform.sql` using the Supabase CLI or SQL editor. Use the hosted project URL and keys in the same environment variable names; never expose the service-role key to the browser.

In the hosted Supabase dashboard, enable Google under **Authentication → Providers**, enter the Google client ID and secret, and add the callback URL shown by Supabase (normally `https://<project-ref>.supabase.co/auth/v1/callback`) as an authorized redirect URI in the same Google Cloud OAuth client. Set the Supabase Site URL and allowed redirect URL to the deployed application origin, then set `APP_URL` to that exact HTTPS origin in the application environment. No hosted project is provisioned by this repository.

## Validate

```bash
npm test
npm run lint
npm run build
```

## Current ingestion model

PDF, Markdown, and text uploads are limited to 10 MB. The server validates and stores the private original, extracts text, creates overlapping semantic chunks, embeds them with NVIDIA NIM, and persists them in pgvector. The document becomes searchable only after every chunk is stored successfully.

For higher ingestion volume, move parsing and embedding into a durable worker queue; the database status model already supports queued, processing, ready, and failed states.
