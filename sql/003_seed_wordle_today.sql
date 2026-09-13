-- Optionnel : ajoute un mot du jour pour AUJOURD'HUI afin de pouvoir
-- tester le Wordle tout de suite. À terme, il faudra une vraie liste de
-- mots français validés (un par jour) — ce script n'en ajoute qu'un.

insert into public.wordle_days (game_date, word)
values (current_date, 'TARTE')
on conflict (game_date) do nothing;
