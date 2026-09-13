-- =========================================================
-- LSOR-SPORT — SUPPRESSION DE MATCH IRL (ADMIN) + PRONOS
-- =========================================================

-- ---------------------------------------------------------
-- 1. Les admins peuvent supprimer un match IRL
-- ---------------------------------------------------------

drop policy if exists "Admins can delete IRL matches" on public.irl_matches;
create policy "Admins can delete IRL matches"
on public.irl_matches
for delete
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

-- ---------------------------------------------------------
-- 2. PRONOS — matchs réels + pronostics
-- ---------------------------------------------------------
-- Sports au lancement : football, NBA, NFL (ajout manuel par un admin
-- pour l'instant — le remplissage automatique via une API sportive est une
-- amélioration à faire une fois le site en ligne, voir le README).
-- Barème : "bon vainqueur" uniquement (pas de score exact ni de bonus).
-- Verrouillage automatique : impossible de pronostiquer après le coup
-- d'envoi (appliqué directement par les policies ci-dessous, pas par le
-- frontend, donc infalsifiable).

create table if not exists public.pronos_matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null check (sport in ('football','nba','nfl')),
  team_a text not null,
  team_b text not null,
  match_date timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','finished')),
  team_a_score integer,
  team_b_score integer,
  winner text check (winner in ('A','B','draw')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.pronos_matches enable row level security;

drop policy if exists "Pronos matches viewable by everyone" on public.pronos_matches;
create policy "Pronos matches viewable by everyone"
on public.pronos_matches for select using (true);

drop policy if exists "Admins can insert pronos matches" on public.pronos_matches;
create policy "Admins can insert pronos matches"
on public.pronos_matches for insert
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "Admins can update pronos matches" on public.pronos_matches;
create policy "Admins can update pronos matches"
on public.pronos_matches for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "Admins can delete pronos matches" on public.pronos_matches;
create policy "Admins can delete pronos matches"
on public.pronos_matches for delete
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create table if not exists public.pronos_predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.pronos_matches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  predicted_winner text not null check (predicted_winner in ('A','B','draw')),
  created_at timestamptz default now(),
  unique (match_id, user_id)
);

alter table public.pronos_predictions enable row level security;

drop policy if exists "Predictions viewable by everyone" on public.pronos_predictions;
create policy "Predictions viewable by everyone"
on public.pronos_predictions for select using (true);

-- Verrou automatique : on ne peut créer/modifier son pronostic QUE si le
-- match n'a pas encore commencé.
drop policy if exists "Users can predict before kickoff" on public.pronos_predictions;
create policy "Users can predict before kickoff"
on public.pronos_predictions for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.pronos_matches m
    where m.id = match_id and m.status = 'scheduled' and m.match_date > now()
  )
);

drop policy if exists "Users can update their prediction before kickoff" on public.pronos_predictions;
create policy "Users can update their prediction before kickoff"
on public.pronos_predictions for update
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.pronos_matches m
    where m.id = match_id and m.status = 'scheduled' and m.match_date > now()
  )
);

-- ---------------------------------------------------------
-- ELO — un pronostic juste = +12, faux = -8 (comme Wordle : binaire
-- juste/faux, pas de classement de performance continue). Se déclenche
-- quand un admin marque un match "finished" avec un score.
-- ---------------------------------------------------------

create or replace function public.handle_pronos_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_winner text;
  v_pred record;
  v_delta integer;
  v_new_general_elo integer;
begin
  if new.status <> 'finished' or old.status = 'finished' then
    return new;
  end if;
  if new.team_a_score is null or new.team_b_score is null then
    return new;
  end if;

  if new.team_a_score > new.team_b_score then
    v_winner := 'A';
  elsif new.team_b_score > new.team_a_score then
    v_winner := 'B';
  else
    v_winner := 'draw';
  end if;

  update public.pronos_matches set winner = v_winner where id = new.id;

  select id into v_game_id from public.games where code = 'pronos';

  for v_pred in select * from public.pronos_predictions where match_id = new.id loop
    v_delta := case when v_pred.predicted_winner = v_winner then 12 else -8 end;

    update public.player_ratings
    set
      games_played = games_played + 1,
      wins = wins + (case when v_delta > 0 then 1 else 0 end),
      losses = losses + (case when v_delta < 0 then 1 else 0 end),
      elo = greatest(0, elo + v_delta),
      updated_at = now()
    where user_id = v_pred.user_id and game_id = v_game_id;

    select round(avg(elo)) into v_new_general_elo
    from public.player_ratings
    where user_id = v_pred.user_id and game_id is not null;

    update public.player_ratings
    set elo = coalesce(v_new_general_elo, elo), updated_at = now()
    where user_id = v_pred.user_id and game_id is null;
  end loop;

  return new;
end;
$$;

drop trigger if exists on_pronos_match_finished on public.pronos_matches;

create trigger on_pronos_match_finished
after update on public.pronos_matches
for each row
execute procedure public.handle_pronos_result();

-- =========================================================
-- DONE — colle ce fichier dans le SQL Editor Supabase puis "Run"
-- =========================================================
