-- LSOR-SPORT — pool Wordle alimenté depuis l'archive publique Wordle Global

create table if not exists public.wordle_word_pool (
  id uuid primary key default gen_random_uuid(),
  archive_index integer,
  word text not null unique,
  source text not null default 'wordle.global',
  imported_at timestamptz not null default now()
);

alter table public.wordle_word_pool enable row level security;
drop policy if exists "Wordle pool viewable by everyone" on public.wordle_word_pool;
create policy "Wordle pool viewable by everyone"
on public.wordle_word_pool for select using (true);

-- Fonction serveur : prend un mot non utilisé récemment et le programme
-- pour la date demandée. Les mots sont issus de wordle.global via le job
-- d'import/synchronisation fourni dans le projet.
create or replace function public.ensure_wordle_day_from_pool(p_date date)
returns public.wordle_days
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day public.wordle_days;
  v_word text;
begin
  select * into v_day from public.wordle_days where game_date = p_date;
  if found then return v_day; end if;

  select w.word into v_word
  from public.wordle_word_pool w
  where length(w.word) = 5
    and not exists (
      select 1 from public.wordle_days d where lower(d.word) = lower(w.word)
    )
  order by random()
  limit 1;

  if v_word is null then
    raise exception 'Aucun mot Wordle disponible dans le pool';
  end if;

  insert into public.wordle_days(game_date, word) values (p_date, v_word) returning * into v_day;
  return v_day;
end;
$$;

-- Désormais le mot n'a pas besoin d'être saisi manuellement chaque jour.
