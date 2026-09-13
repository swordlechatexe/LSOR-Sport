-- LSOR-SPORT — champs nécessaires à la synchronisation API des Pronos

alter table public.pronos_matches add column if not exists external_id text;
alter table public.pronos_matches add column if not exists source text;
alter table public.pronos_matches add column if not exists league_name text;
alter table public.pronos_matches add column if not exists api_status text;

create unique index if not exists pronos_matches_source_external_idx
on public.pronos_matches(source, external_id)
where external_id is not null and source is not null;

-- Les correspondances API sont techniques et ne changent pas la logique du jeu :
-- on prédit toujours uniquement A / B / nul et le verrouillage reste côté DB.
