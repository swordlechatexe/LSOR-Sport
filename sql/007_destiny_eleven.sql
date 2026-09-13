-- =========================================================
-- LSOR-SPORT — DESTINY ELEVEN
-- =========================================================
-- Simulation de carrière. Deux modes :
--   * SOLO   : score de carrière /97, ELO ajusté par percentile
--              (comme Ultimate Eleven — impossible de tricher côté client).
--   * DUEL 1v1 : deux joueurs jouent la MÊME seed (même destin de départ,
--              mêmes évènements) ; celui qui fait les meilleurs choix a le
--              meilleur score. Quand les deux résultats d'une même seed
--              existent, le duel est résolu (+/- ELO fixe).
--
-- À exécuter dans le SQL Editor Supabase, après les fichiers précédents.
-- Ré-exécutable sans risque.
-- =========================================================

create table if not exists public.destiny_eleven_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  player_name text not null,
  position text not null,
  nation text not null,
  score numeric not null,
  peak_overall int not null,
  trophies int not null default 0,
  caps int not null default 0,
  seasons int not null default 0,
  money_k bigint not null default 0,   -- total gagné sur la carrière, en k€
  duel_seed bigint,               -- null = partie solo ; sinon identifiant de duel
  duel_resolved boolean not null default false,
  created_at timestamptz default now()
);

alter table public.destiny_eleven_results enable row level security;

-- Si la table existait déjà (ancienne version de ce fichier), on s'assure
-- que la colonne money_k est présente.
alter table public.destiny_eleven_results
  add column if not exists money_k bigint not null default 0;

drop policy if exists "DE results viewable by everyone" on public.destiny_eleven_results;
create policy "DE results viewable by everyone"
on public.destiny_eleven_results for select using (true);

drop policy if exists "Users can insert their own DE result" on public.destiny_eleven_results;
create policy "Users can insert their own DE result"
on public.destiny_eleven_results for insert
with check (auth.uid() = user_id);

-- =========================================================
-- SOLO — conversion de performance par percentile
-- =========================================================
create or replace function public.handle_destiny_eleven_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_percentile numeric;
  v_percentile_delta integer;
  v_absolute_delta integer;
  v_delta integer;
  v_new_general_elo integer;
  v_opponent record;
  v_opponent_found boolean := false;
  v_win boolean;
begin
  select id into v_game_id from public.games where code = 'destiny_eleven';

  -- ------------------------------------------------------------------
  -- CAS 1 : partie solo (pas de duel)
  -- ------------------------------------------------------------------
  if new.duel_seed is null then
    select
      (count(*) filter (where score <= new.score))::numeric
      / greatest(count(*), 1)::numeric * 100
    into v_percentile
    from public.destiny_eleven_results
    where duel_seed is null;

    -- Delta = moyenne d'un delta "relatif aux autres joueurs" (percentile) et
    -- d'un delta "absolu" ancré sur le score lui-même (score neutre ~48, soit
    -- environ la moitié du score max 97). Ça évite qu'un score correct rafle
    -- l'ELO max juste parce qu'il n'y a presque aucun résultat à battre.
    v_percentile_delta := round((v_percentile - 50) / 100 * 30); -- -15..+15
    v_absolute_delta := round(least(15, greatest(-15, (new.score - 48) / 49.0 * 15)));
    v_delta := round((v_percentile_delta + v_absolute_delta) / 2.0);

    update public.player_ratings
    set
      games_played = games_played + 1,
      wins = wins + (case when v_delta >= 0 then 1 else 0 end),
      losses = losses + (case when v_delta < 0 then 1 else 0 end),
      elo = greatest(0, elo + v_delta),
      updated_at = now()
    where user_id = new.user_id and game_id = v_game_id;

  -- ------------------------------------------------------------------
  -- CAS 2 : duel 1v1 (même duel_seed). On cherche l'adversaire.
  -- ------------------------------------------------------------------
  else
    select * into v_opponent
    from public.destiny_eleven_results
    where duel_seed = new.duel_seed
      and user_id <> new.user_id
      and duel_resolved = false
    order by created_at asc
    limit 1;

    if found then
      v_opponent_found := true;
      -- résultat du duel : le score le plus haut gagne (égalité = nul)
      if new.score > v_opponent.score then
        -- le nouveau joueur gagne
        update public.player_ratings set games_played = games_played + 1,
          wins = wins + 1, elo = greatest(0, elo + 20), updated_at = now()
          where user_id = new.user_id and game_id = v_game_id;
        update public.player_ratings set games_played = games_played + 1,
          losses = losses + 1, elo = greatest(0, elo - 15), updated_at = now()
          where user_id = v_opponent.user_id and game_id = v_game_id;
      elsif new.score < v_opponent.score then
        -- l'adversaire gagne
        update public.player_ratings set games_played = games_played + 1,
          losses = losses + 1, elo = greatest(0, elo - 15), updated_at = now()
          where user_id = new.user_id and game_id = v_game_id;
        update public.player_ratings set games_played = games_played + 1,
          wins = wins + 1, elo = greatest(0, elo + 20), updated_at = now()
          where user_id = v_opponent.user_id and game_id = v_game_id;
      else
        -- match nul
        update public.player_ratings set games_played = games_played + 1,
          draws = draws + 1, elo = elo + 2, updated_at = now()
          where user_id in (new.user_id, v_opponent.user_id) and game_id = v_game_id;
      end if;

      -- on marque les deux résultats comme résolus
      update public.destiny_eleven_results
      set duel_resolved = true
      where id in (new.id, v_opponent.id);
    end if;
    -- si pas d'adversaire encore : on attend son résultat, aucun ELO bougé pour l'instant.
  end if;

  -- ------------------------------------------------------------------
  -- Recalcul de l'ELO général (moyenne des ELO par jeu) pour ce joueur
  -- (et l'adversaire s'il y en a un)
  -- ------------------------------------------------------------------
  select round(avg(elo)) into v_new_general_elo
  from public.player_ratings
  where user_id = new.user_id and game_id is not null;
  update public.player_ratings
  set elo = coalesce(v_new_general_elo, elo), updated_at = now()
  where user_id = new.user_id and game_id is null;

  if v_opponent_found then
    select round(avg(elo)) into v_new_general_elo
    from public.player_ratings
    where user_id = v_opponent.user_id and game_id is not null;
    update public.player_ratings
    set elo = coalesce(v_new_general_elo, elo), updated_at = now()
    where user_id = v_opponent.user_id and game_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_destiny_eleven_result_created on public.destiny_eleven_results;

create trigger on_destiny_eleven_result_created
after insert on public.destiny_eleven_results
for each row
execute procedure public.handle_destiny_eleven_result();

-- Marque le jeu comme actif (au cas où)
update public.games set is_active = true where code = 'destiny_eleven';
