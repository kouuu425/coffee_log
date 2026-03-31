-- Supabase の SQL Editor でこのファイルの内容を実行してください
create table coffee_logs (
  id bigint primary key generated always as identity,
  created_at timestamptz default now(),
  date date not null,
  grind_size numeric not null,
  grinder text,
  bean text,
  origin text,
  rating numeric,
  memo text
);
