--  RUN 1st
create extension vector;

-- RUN 2nd
create table kintone (
  id bigserial primary key,
  help_title text,
  help_url text,
  content text,
  content_length bigint,
  embedding vector (1536)
);

-- RUN 3rd after running the scripts
create or replace function kintone_search (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  help_title text,
  help_url text,
  content text,
  content_length bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kintone.id,
    kintone.help_title,
    kintone.help_url,
    kintone.content,
    kintone.content_length,
    1 - (kintone.embedding <=> query_embedding) as similarity
  from kintone
  where 1 - (kintone.embedding <=> query_embedding) > similarity_threshold
  order by kintone.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RUN 4th
create index on kintone 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);