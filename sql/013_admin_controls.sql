-- LSOR-SPORT — contrôles admin + désactivation temporaire du Quiz

-- Le Quiz reste visible en base mais n'est plus proposé dans /jeux.
update public.games
set is_active = false
where code = 'quiz';

-- Un admin peut consulter/modifier les matchs IRL existants via l'interface.
drop policy if exists "Admins can update IRL matches" on public.irl_matches;
create policy "Admins can update IRL matches"
on public.irl_matches for update
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Permet de refaire les lignes ELO d'un joueur si besoin après ajout d'un nouveau jeu.
create or replace function public.backfill_player_ratings_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_ratings (user_id, game_id, elo)
  select p_user_id, g.id, 1500
  from public.games g
  where g.is_active = true
  on conflict (user_id, game_id) do nothing;

  insert into public.player_ratings (user_id, game_id, elo)
  values (p_user_id, null, 1500)
  on conflict (user_id, game_id) do nothing;
end;
$$;
