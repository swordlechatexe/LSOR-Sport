-- =========================================================
-- LSOR-SPORT — PÉNALTY 1V1
-- =========================================================
-- Duel asynchrone (chacun joue quand il veut, pas besoin d'être connectés
-- en même temps) mais avec un vrai face-à-face : à chaque tir, le tireur
-- choisit gauche/centre/droite et l'adversaire (qui joue le gardien) choisit
-- où plonger, en aveugle l'un de l'autre. Le tir n'est résolu (but ou arrêt)
-- que lorsque les DEUX choix sont soumis.
--
-- Format : 5 tirs chacun (on alterne à chaque tir, comme une vraie séance de
-- tirs au but), puis mort subite si égalité.
--
-- Sécurité : les choix en attente ne doivent JAMAIS être lisibles par le
-- camp adverse avant résolution, sinon le "gardien" pourrait tricher en
-- attendant de voir le tir. La table n'a donc AUCUNE policy de lecture/
-- écriture directe : tout passe par les fonctions SECURITY DEFINER
-- ci-dessous, qui masquent le choix de l'adversaire tant qu'il n'est pas
-- révélé.
--
-- À exécuter dans le SQL Editor Supabase, après les fichiers précédents.
-- Ré-exécutable sans risque.
-- =========================================================

create table if not exists public.penalty_matches (
  id uuid primary key default gen_random_uuid(),
  player_a uuid references public.profiles(id) on delete cascade not null,
  player_b uuid references public.profiles(id) on delete cascade,
  status text not null default 'waiting_opponent'
    check (status in ('waiting_opponent', 'in_progress', 'finished')),
  round int not null default 1,
  half text not null default 'a' check (half in ('a', 'b')), -- qui tire ce coup-ci
  sudden_death boolean not null default false,
  score_a int not null default 0,
  score_b int not null default 0,
  kicks_a int not null default 0,
  kicks_b int not null default 0,
  pending_shooter_choice text
    check (pending_shooter_choice is null or pending_shooter_choice in ('gauche', 'centre', 'droite')),
  pending_keeper_choice text
    check (pending_keeper_choice is null or pending_keeper_choice in ('gauche', 'centre', 'droite')),
  history jsonb not null default '[]'::jsonb, -- tirs déjà résolus (publics)
  winner uuid references public.profiles(id),
  created_at timestamptz default now(),
  finished_at timestamptz
);

alter table public.penalty_matches enable row level security;
-- Volontairement AUCUNE policy select/insert/update ici : tout se fait via
-- les fonctions ci-dessous, propriétaire = rôle avec bypass RLS, comme les
-- autres triggers ELO du projet.

-- =========================================================
-- Créer un défi
-- =========================================================
create or replace function public.create_penalty_match()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Connecte-toi pour créer un défi.';
  end if;

  insert into public.penalty_matches (player_a)
  values (auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

-- =========================================================
-- Rejoindre un défi existant
-- =========================================================
create or replace function public.join_penalty_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.penalty_matches;
begin
  if auth.uid() is null then
    raise exception 'Connecte-toi pour rejoindre ce défi.';
  end if;

  select * into m from public.penalty_matches where id = p_match_id for update;
  if not found then
    raise exception 'Défi introuvable.';
  end if;
  if m.status <> 'waiting_opponent' then
    raise exception 'Ce défi a déjà commencé ou est terminé.';
  end if;
  if m.player_a = auth.uid() then
    raise exception 'Tu ne peux pas rejoindre ton propre défi.';
  end if;
  if m.player_b is not null and m.player_b <> auth.uid() then
    raise exception 'Ce défi a déjà un adversaire.';
  end if;

  update public.penalty_matches
  set player_b = auth.uid(), status = 'in_progress'
  where id = p_match_id;
end;
$$;

-- =========================================================
-- Lire l'état d'un défi (masque le choix en attente de l'adversaire)
-- =========================================================
create or replace function public.get_penalty_match(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.penalty_matches;
  v_uid uuid := auth.uid();
  v_shooter_id uuid;
  v_keeper_id uuid;
begin
  select * into m from public.penalty_matches where id = p_match_id;
  if not found then
    return null;
  end if;

  if v_uid is null or v_uid not in (m.player_a, m.player_b) then
    v_uid := null; -- spectateur / non-participant : rien de caché ne lui appartient
  end if;

  v_shooter_id := case when m.half = 'a' then m.player_a else m.player_b end;
  v_keeper_id := case when m.half = 'a' then m.player_b else m.player_a end;

  return jsonb_build_object(
    'id', m.id,
    'player_a', m.player_a,
    'player_b', m.player_b,
    'status', m.status,
    'round', m.round,
    'half', m.half,
    'sudden_death', m.sudden_death,
    'score_a', m.score_a,
    'score_b', m.score_b,
    'kicks_a', m.kicks_a,
    'kicks_b', m.kicks_b,
    'winner', m.winner,
    'history', m.history,
    'shooter_id', v_shooter_id,
    'keeper_id', v_keeper_id,
    'shooter_submitted', m.pending_shooter_choice is not null,
    'keeper_submitted', m.pending_keeper_choice is not null,
    -- un joueur ne voit que SON PROPRE choix en attente, jamais celui de l'autre
    'my_pending_shooter_choice', case when v_uid = v_shooter_id then m.pending_shooter_choice else null end,
    'my_pending_keeper_choice', case when v_uid = v_keeper_id then m.pending_keeper_choice else null end
  );
end;
$$;

-- =========================================================
-- Soumettre un choix (tir ou plongeon selon le rôle du joueur)
-- =========================================================
create or replace function public.submit_penalty_choice(p_match_id uuid, p_choice text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.penalty_matches;
  v_game_id uuid;
  v_shooter_id uuid;
  v_keeper_id uuid;
  v_scored boolean;
  v_next_round int;
  v_new_general_elo integer;
begin
  if p_choice not in ('gauche', 'centre', 'droite') then
    raise exception 'Choix invalide.';
  end if;

  select * into m from public.penalty_matches where id = p_match_id for update;
  if not found then
    raise exception 'Défi introuvable.';
  end if;
  if m.status <> 'in_progress' then
    raise exception 'Ce duel n''est pas en cours.';
  end if;
  if auth.uid() is null or auth.uid() not in (m.player_a, m.player_b) then
    raise exception 'Tu ne participes pas à ce duel.';
  end if;

  v_shooter_id := case when m.half = 'a' then m.player_a else m.player_b end;
  v_keeper_id := case when m.half = 'a' then m.player_b else m.player_a end;

  if auth.uid() = v_shooter_id then
    if m.pending_shooter_choice is not null then
      raise exception 'Tu as déjà tiré ce tir.';
    end if;
    update public.penalty_matches set pending_shooter_choice = p_choice where id = p_match_id;
  elsif auth.uid() = v_keeper_id then
    if m.pending_keeper_choice is not null then
      raise exception 'Tu as déjà plongé pour ce tir.';
    end if;
    update public.penalty_matches set pending_keeper_choice = p_choice where id = p_match_id;
  else
    raise exception 'Rôle inconnu pour ce tir.';
  end if;

  select * into m from public.penalty_matches where id = p_match_id for update;

  -- les deux choix sont là : on résout le tir
  if m.pending_shooter_choice is not null and m.pending_keeper_choice is not null then
    v_scored := m.pending_shooter_choice <> m.pending_keeper_choice;

    if m.half = 'a' then
      update public.penalty_matches
      set score_a = score_a + (case when v_scored then 1 else 0 end),
          kicks_a = kicks_a + 1
      where id = p_match_id;
    else
      update public.penalty_matches
      set score_b = score_b + (case when v_scored then 1 else 0 end),
          kicks_b = kicks_b + 1
      where id = p_match_id;
    end if;

    update public.penalty_matches
    set history = history || jsonb_build_object(
          'round', round,
          'half', half,
          'shooter_choice', pending_shooter_choice,
          'keeper_choice', pending_keeper_choice,
          'scored', v_scored,
          'sudden_death', sudden_death
        ),
        pending_shooter_choice = null,
        pending_keeper_choice = null
    where id = p_match_id;

    select * into m from public.penalty_matches where id = p_match_id for update;

    if m.half = 'a' then
      -- l'autre joueur tire à son tour, même manche
      update public.penalty_matches set half = 'b' where id = p_match_id;
    else
      -- fin de manche (les deux ont tiré) : décision ou manche suivante
      if m.round >= 5 and m.score_a <> m.score_b then
        update public.penalty_matches
        set status = 'finished',
            half = 'a',
            winner = case when m.score_a > m.score_b then m.player_a else m.player_b end,
            finished_at = now()
        where id = p_match_id;
      else
        v_next_round := m.round + 1;
        update public.penalty_matches
        set round = v_next_round,
            half = 'a',
            sudden_death = (v_next_round > 5)
        where id = p_match_id;
      end if;
    end if;
  end if;

  -- ELO si le duel vient tout juste de se terminer
  select * into m from public.penalty_matches where id = p_match_id;
  if m.status = 'finished' and m.winner is not null then
    select id into v_game_id from public.games where code = 'penalty';

    update public.player_ratings
    set games_played = games_played + 1,
        wins = wins + (case when user_id = m.winner then 1 else 0 end),
        losses = losses + (case when user_id <> m.winner then 1 else 0 end),
        elo = greatest(0, elo + (case when user_id = m.winner then 20 else -15 end)),
        updated_at = now()
    where user_id in (m.player_a, m.player_b) and game_id = v_game_id;

    select round(avg(elo)) into v_new_general_elo
    from public.player_ratings where user_id = m.player_a and game_id is not null;
    update public.player_ratings set elo = coalesce(v_new_general_elo, elo), updated_at = now()
    where user_id = m.player_a and game_id is null;

    select round(avg(elo)) into v_new_general_elo
    from public.player_ratings where user_id = m.player_b and game_id is not null;
    update public.player_ratings set elo = coalesce(v_new_general_elo, elo), updated_at = now()
    where user_id = m.player_b and game_id is null;
  end if;
end;
$$;

grant execute on function public.create_penalty_match() to authenticated;
grant execute on function public.join_penalty_match(uuid) to authenticated;
grant execute on function public.get_penalty_match(uuid) to authenticated;
grant execute on function public.submit_penalty_choice(uuid, text) to authenticated;

-- =========================================================
-- Backfill : les comptes créés avant l'activation de ce jeu n'ont pas de
-- ligne player_ratings pour 'penalty' (le trigger d'inscription ne le fait
-- qu'au moment de la création du compte, pour les jeux déjà actifs à ce
-- moment-là). On la crée pour tout le monde.
-- =========================================================
insert into public.player_ratings (user_id, game_id, elo)
select p.id, g.id, 1500
from public.profiles p, public.games g
where g.code = 'penalty'
on conflict (user_id, game_id) do nothing;

update public.games set is_active = true where code = 'penalty';
