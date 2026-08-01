create extension if not exists vector with schema extensions;
create type public.document_status as enum ('queued', 'processing', 'ready', 'failed');

create table public.courses (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100), description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade, title text not null check (char_length(title) between 1 and 200),
  storage_path text not null unique, mime_type text not null check (mime_type in ('application/pdf', 'text/plain', 'text/markdown')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760), status public.document_status not null default 'queued',
  error_message text, chunk_count integer not null default 0 check (chunk_count >= 0), created_at timestamptz not null default now(), processed_at timestamptz,
  unique (id, course_id), unique (id, owner_id)
);
create table public.chunks (
  id bigint generated always as identity primary key, course_id uuid not null, document_id uuid not null, owner_id uuid not null,
  ordinal integer not null check (ordinal >= 0), content text not null check (char_length(content) between 1 and 8000),
  embedding extensions.vector(2048) not null, created_at timestamptz not null default now(),
  foreign key (document_id, course_id) references public.documents(id, course_id) on delete cascade,
  foreign key (document_id, owner_id) references public.documents(id, owner_id) on delete cascade, unique (document_id, ordinal)
);
create index courses_owner_created_idx on public.courses(owner_id, created_at desc);
create index documents_course_created_idx on public.documents(course_id, created_at desc);
create index chunks_course_idx on public.chunks(course_id);
create index chunks_embedding_hnsw_idx on public.chunks using hnsw (embedding extensions.vector_cosine_ops);
alter table public.courses enable row level security; alter table public.documents enable row level security; alter table public.chunks enable row level security;
create policy "owners manage courses" on public.courses for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners read documents" on public.documents for select using (owner_id = auth.uid());
create policy "owners insert documents" on public.documents for insert with check (owner_id = auth.uid() and exists (select 1 from public.courses c where c.id = course_id and c.owner_id = auth.uid()));
create policy "owners delete documents" on public.documents for delete using (owner_id = auth.uid());
create policy "owners read chunks" on public.chunks for select using (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-documents', 'course-documents', false, 10485760, array['application/pdf', 'text/plain', 'text/markdown'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "users upload own course documents" on storage.objects for insert to authenticated with check (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users read own course documents" on storage.objects for select to authenticated using (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own course documents" on storage.objects for delete to authenticated using (bucket_id = 'course-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.match_course_chunks(query_embedding extensions.vector(2048), target_course_id uuid, match_threshold float default 0.35, match_count int default 5)
returns table (id bigint, document_id uuid, title text, content text, similarity float)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.document_id, d.title, c.content, 1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c join public.documents d on d.id = c.document_id
  where c.course_id = target_course_id and c.owner_id = auth.uid() and d.status = 'ready'
    and 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding limit least(match_count, 10);
$$;
grant execute on function public.match_course_chunks to authenticated;
