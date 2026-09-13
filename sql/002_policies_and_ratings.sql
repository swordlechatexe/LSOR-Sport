-- =========================================================
-- LSOR-SPORT — COMPLÉMENT SQL (à exécuter après le script initial)
-- =========================================================
-- Ce script ajoute :
-- 1) Les policies manquantes pour que les ADMINS puissent créer/modifier
--    les matchs IRL (le premier script n'autorisait que la lecture).
-- 2) Un trigger qui crée automatiquement les lignes ELO (général + une
--    par jeu actif) dès qu'un nouveau joueur s'inscrit, initialisées à 1500.

-- =========================================================
-- 1. POLICIES ADMIN POUR LES MATCHS IRL
-- =========================================================

drop policy if exists "Admins can insert IRL matches" on public.irl_matches;
create policy "Admins can insert IRL matches"
on public.irl_matches
for insert
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "Admins can update IRL matches" on public.irl_matches;
create policy "Admins can update IRL matches"
on public.irl_matches
for update
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "IRL match players are viewable by everyone" on public.irl_match_players;
create policy "IRL match players are viewable by everyone"
on public.irl_match_players
for select
using (true);

drop policy if exists "Admins can manage IRL match players" on public.irl_match_players;
create policy "Admins can manage IRL match players"
on public.irl_match_players
for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- =========================================================
-- 2. CRÉATION AUTOMATIQUE DES LIGNES ELO (générale + par jeu)
-- =========================================================

create or replace function public.handle_new_profile_ratings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ligne ELO générale (game_id = null)
  insert into public.player_ratings (user_id, game_id, elo)
  values (new.id, null, 1500)
  on conflict (user_id, game_id) do nothing;

  -- Une ligne ELO par jeu actif
  insert into public.player_ratings (user_id, game_id, elo)
  select new.id, g.id, 1500
  from public.games g
  where g.is_active = true
  on conflict (user_id, game_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_profile_created_ratings on public.profiles;

create trigger on_profile_created_ratings
after insert on public.profiles
for each row
execute procedure public.handle_new_profile_ratings();

-- =========================================================
-- 3. MISE À JOUR AUTOMATIQUE DE L'ELO APRÈS UNE PARTIE DE WORDLE
-- =========================================================
-- Le client (navigateur) n'a PAS le droit de modifier player_ratings
-- directement (aucune policy update/insert pour les joueurs) : c'est fait
-- ici volontairement, via un trigger "security definer", pour empêcher
-- qu'un joueur puisse tricher sur son propre ELO depuis le navigateur.
--
-- Formule simple pour démarrer (à ajuster librement plus tard) :
--   victoire = +15 ELO sur le jeu Wordle, défaite = -10 ELO.
--   L'ELO général = moyenne arrondie des ELO de chaque jeu du joueur.

create or replace function public.handle_wordle_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wordle_game_id uuid;
  v_new_general_elo integer;
begin
  select id into v_wordle_game_id from public.games where code = 'wordle';

  update public.player_ratings
  set
    games_played = games_played + 1,
    wins = wins + (case when new.won then 1 else 0 end),
    losses = losses + (case when new.won then 0 else 1 end),
    elo = greatest(0, elo + (case when new.won then 15 else -10 end)),
    updated_at = now()
  where user_id = new.user_id and game_id = v_wordle_game_id;

  select round(avg(elo)) into v_new_general_elo
  from public.player_ratings
  where user_id = new.user_id and game_id is not null;

  update public.player_ratings
  set elo = coalesce(v_new_general_elo, elo), updated_at = now()
  where user_id = new.user_id and game_id is null;

  return new;
end;
$$;

drop trigger if exists on_wordle_result_created on public.wordle_results;

create trigger on_wordle_result_created
after insert on public.wordle_results
for each row
execute procedure public.handle_wordle_result();

-- =========================================================
-- DONE — colle ce fichier dans le SQL Editor Supabase puis "Run"
-- =========================================================
