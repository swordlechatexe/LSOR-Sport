-- =========================================================
-- LSOR-SPORT — 82-0 : complément de roster 2020s
-- =========================================================
-- sql/009_82_0.sql ne contenait que 6-9 joueurs par équipe répartis sur les
-- 7 décennies (1960-2020). Résultat concret : pour beaucoup de tirages
-- équipe+décennie il n'y avait quasi aucun joueur, donc l'élargissement
-- progressif de lib/eightyTwoO.ts (voir fetchCandidates) finissait par
-- proposer des joueurs d'une autre décennie ou d'une autre franchise.
--
-- Ce fichier ajoute des joueurs réels des années 2020 pour combler les
-- postes manquants de chaque équipe sur cette décennie, afin qu'un cinq
-- complet 2020s existe pour chaque franchise sans élargissement. Mêmes
-- disclaimers que sql/009 : stats approximatives de bonne foi, pas des
-- statistiques officielles garanties exactes.
--
-- Ré-exécutable sans risque (on conflict do nothing sur name+team).
-- =========================================================

insert into public.nba_players (name, team, positions, decades, ppg, rpg, apg, spg, bpg, active_years) values
-- ATLANTA HAWKS
('Dejounte Murray','ATL', array['PG','SG'], array[2020], 20.5, 5.3, 6.4, 2.0, 0.4, '2022-2024'),
('De''Andre Hunter','ATL', array['SF','PF'], array[2020], 12.5, 4.0, 1.5, 0.7, 0.4, '2019-2024'),
('John Collins','ATL', array['PF','C'], array[2020], 15.5, 8.0, 1.3, 0.6, 0.7, '2017-2024'),
('Clint Capela','ATL', array['C'], array[2020], 11.0, 10.5, 1.0, 0.7, 1.0, '2020-2024'),
-- BOSTON CELTICS
('Marcus Smart','BOS', array['PG','SG'], array[2020], 12.5, 3.0, 5.5, 1.5, 0.3, '2020-2023'),
('Al Horford','BOS', array['PF','C'], array[2020], 8.5, 6.5, 2.5, 0.6, 1.0, '2021-2024'),
('Robert Williams III','BOS', array['C'], array[2020], 8.0, 8.0, 1.5, 0.9, 1.5, '2018-2023'),
-- BROOKLYN NETS
('Cam Thomas','BKN', array['SG'], array[2020], 20.0, 2.5, 3.0, 0.8, 0.2, '2021-2024'),
('Royce O''Neale','BKN', array['SF','PF'], array[2020], 9.0, 5.0, 2.0, 1.0, 0.5, '2020-2023'),
('Nic Claxton','BKN', array['C'], array[2020], 9.5, 8.0, 2.0, 0.9, 2.1, '2019-2024'),
-- CHARLOTTE HORNETS
('Mark Williams','CHA', array['C'], array[2020], 12.0, 8.0, 1.5, 0.6, 1.2, '2022-2024'),
-- CHICAGO BULLS
('Ayo Dosunmu','CHI', array['PG','SG'], array[2020], 9.0, 3.0, 3.0, 1.0, 0.2, '2021-2024'),
('Patrick Williams','CHI', array['PF','SF'], array[2020], 10.0, 4.0, 1.5, 0.7, 0.5, '2020-2024'),
('Nikola Vucevic','CHI', array['C'], array[2020], 18.0, 11.0, 3.5, 0.8, 0.6, '2021-2024'),
-- CLEVELAND CAVALIERS
('Isaac Okoro','CLE', array['SF','SG'], array[2020], 8.0, 3.0, 1.5, 0.9, 0.4, '2020-2024'),
('Evan Mobley','CLE', array['PF','C'], array[2020], 15.0, 9.0, 3.0, 0.6, 1.5, '2021-2024'),
('Jarrett Allen','CLE', array['C'], array[2020], 14.5, 10.0, 1.5, 0.8, 1.1, '2019-2024'),
-- DALLAS MAVERICKS
('P.J. Washington','DAL', array['PF','SF'], array[2020], 12.5, 5.0, 1.8, 0.8, 0.6, '2024-2024'),
-- DENVER NUGGETS
('Kentavious Caldwell-Pope','DEN', array['SG'], array[2020], 10.0, 3.0, 2.0, 1.0, 0.2, '2023-2024'),
('Michael Porter Jr.','DEN', array['SF','PF'], array[2020], 17.0, 7.0, 1.5, 0.9, 0.6, '2019-2024'),
('Aaron Gordon','DEN', array['PF','SF'], array[2020], 14.0, 6.5, 3.0, 0.8, 0.6, '2020-2024'),
-- DETROIT PISTONS
('Jaden Ivey','DET', array['SG','PG'], array[2020], 11.0, 3.0, 4.0, 0.8, 0.3, '2022-2024'),
('Saddiq Bey','DET', array['SF','PF'], array[2020], 13.0, 4.9, 1.9, 0.9, 0.3, '2020-2023'),
('Isaiah Stewart','DET', array['PF','C'], array[2020], 9.0, 7.0, 1.0, 0.6, 1.0, '2020-2024'),
('Jalen Duren','DET', array['C'], array[2020], 10.0, 9.0, 1.5, 0.6, 0.8, '2022-2024'),
-- GOLDEN STATE WARRIORS
('Andrew Wiggins','GSW', array['SF','PF'], array[2020], 17.0, 4.5, 2.0, 0.9, 0.5, '2020-2024'),
('Kevon Looney','GSW', array['C'], array[2020], 5.0, 6.5, 1.5, 0.5, 0.4, '2020-2024'),
-- HOUSTON ROCKETS
('Fred VanVleet','HOU', array['PG'], array[2020], 17.4, 3.8, 8.1, 1.2, 0.5, '2023-2024'),
('Jae''Sean Tate','HOU', array['SF','PF'], array[2020], 9.0, 4.0, 2.0, 1.0, 0.5, '2020-2024'),
('Jabari Smith Jr.','HOU', array['PF'], array[2020], 12.0, 7.0, 1.3, 0.7, 0.9, '2022-2024'),
('Alperen Sengun','HOU', array['C'], array[2020], 15.0, 8.5, 4.5, 1.1, 0.6, '2021-2024'),
-- INDIANA PACERS
('Bennedict Mathurin','IND', array['SG','SF'], array[2020], 14.5, 4.0, 1.7, 0.7, 0.2, '2022-2024'),
('Aaron Nesmith','IND', array['SF'], array[2020], 11.0, 4.0, 1.5, 1.0, 0.3, '2023-2024'),
('Myles Turner','IND', array['C','PF'], array[2020], 17.0, 7.0, 1.5, 0.7, 2.0, '2015-2024'),
('Obi Toppin','IND', array['PF'], array[2020], 10.0, 4.0, 1.5, 0.6, 0.5, '2023-2024'),
-- LA CLIPPERS
('James Harden','LAC', array['PG','SG'], array[2020], 16.6, 4.0, 8.5, 1.1, 0.5, '2023-2024'),
('Nicolas Batum','LAC', array['PF','SF'], array[2020], 5.0, 3.0, 2.0, 0.8, 0.5, '2023-2024'),
('Ivica Zubac','LAC', array['C'], array[2020], 10.5, 8.5, 1.5, 0.5, 1.0, '2019-2024'),
-- LOS ANGELES LAKERS
('D''Angelo Russell','LAL', array['PG'], array[2020], 17.7, 2.9, 6.3, 0.7, 0.3, '2023-2024'),
('Austin Reaves','LAL', array['SG','PG'], array[2020], 15.0, 4.0, 5.5, 0.7, 0.3, '2021-2024'),
-- MEMPHIS GRIZZLIES
('Desmond Bane','MEM', array['SG','SF'], array[2020], 21.0, 4.4, 5.0, 1.1, 0.3, '2020-2024'),
('Dillon Brooks','MEM', array['SF','SG'], array[2020], 14.0, 3.7, 1.7, 1.0, 0.5, '2018-2023'),
('Steven Adams','MEM', array['C'], array[2020], 8.0, 10.0, 2.0, 0.8, 0.7, '2021-2024'),
-- MIAMI HEAT
('Kyle Lowry','MIA', array['PG'], array[2020], 10.0, 3.5, 5.5, 0.9, 0.2, '2021-2024'),
('Tyler Herro','MIA', array['SG','PG'], array[2020], 20.0, 5.0, 4.5, 0.6, 0.2, '2019-2024'),
('Kevin Love','MIA', array['PF','C'], array[2020], 7.0, 5.0, 1.5, 0.4, 0.3, '2023-2024'),
-- MILWAUKEE BUCKS
('Grayson Allen','MIL', array['SG','SF'], array[2020], 12.0, 3.0, 2.5, 1.0, 0.2, '2022-2024'),
('Brook Lopez','MIL', array['C'], array[2020], 13.0, 4.5, 1.5, 0.6, 2.3, '2019-2024'),
-- MINNESOTA TIMBERWOLVES
('Mike Conley','MIN', array['PG'], array[2020], 11.5, 2.5, 5.5, 1.0, 0.2, '2023-2024'),
('Jaden McDaniels','MIN', array['SF','PF'], array[2020], 10.5, 3.5, 1.5, 0.9, 0.6, '2020-2024'),
('Naz Reid','MIN', array['PF','C'], array[2020], 11.0, 5.0, 1.5, 0.5, 0.6, '2020-2024'),
-- NEW ORLEANS PELICANS
('Dejounte Murray','NOP', array['PG','SG'], array[2020], 20.0, 5.3, 6.0, 2.0, 0.4, '2024-2024'),
('CJ McCollum','NOP', array['SG'], array[2020], 20.0, 3.9, 4.6, 0.8, 0.2, '2022-2024'),
('Brandon Ingram','NOP', array['SF','PF'], array[2020], 23.0, 5.3, 5.3, 0.8, 0.6, '2019-2024'),
('Jonas Valanciunas','NOP', array['C'], array[2020], 13.5, 9.5, 1.7, 0.6, 0.6, '2019-2024'),
-- NEW YORK KNICKS
('RJ Barrett','NYK', array['SG','SF'], array[2020], 18.0, 5.0, 3.0, 0.7, 0.3, '2019-2024'),
('Josh Hart','NYK', array['SF','SG'], array[2020], 9.5, 8.0, 4.0, 1.0, 0.3, '2023-2024'),
('Mitchell Robinson','NYK', array['C'], array[2020], 7.0, 9.0, 0.8, 0.7, 1.7, '2018-2024'),
-- OKLAHOMA CITY THUNDER
('Jalen Williams','OKC', array['SF','SG'], array[2020], 19.0, 4.0, 4.5, 1.1, 0.5, '2022-2024'),
('Chet Holmgren','OKC', array['PF','C'], array[2020], 16.5, 7.9, 2.4, 0.6, 2.3, '2023-2024'),
-- ORLANDO MAGIC
('Jalen Suggs','ORL', array['PG','SG'], array[2020], 12.0, 3.0, 3.0, 1.2, 0.4, '2021-2024'),
('Gary Harris','ORL', array['SG'], array[2020], 10.0, 2.5, 2.0, 1.0, 0.2, '2020-2024'),
('Wendell Carter Jr.','ORL', array['C','PF'], array[2020], 11.0, 8.0, 2.5, 0.7, 0.6, '2021-2024'),
-- PHILADELPHIA 76ERS
('Tyrese Maxey','PHI', array['SG','PG'], array[2020], 20.0, 3.0, 6.0, 1.0, 0.2, '2020-2024'),
('Tobias Harris','PHI', array['SF','PF'], array[2020], 17.0, 6.5, 3.0, 0.7, 0.4, '2019-2024'),
('Paul George','PHI', array['PF','SF'], array[2020], 22.0, 5.2, 3.5, 1.5, 0.4, '2024-2024'),
-- PHOENIX SUNS
('Kevin Durant','PHX', array['SF','PF'], array[2020], 27.0, 6.6, 5.0, 0.9, 1.2, '2023-2024'),
('Jusuf Nurkic','PHX', array['C'], array[2020], 10.0, 9.9, 3.5, 0.6, 0.6, '2023-2024'),
-- PORTLAND TRAIL BLAZERS
('Jerami Grant','POR', array['PF','SF'], array[2020], 21.0, 3.5, 2.5, 0.7, 0.5, '2023-2024'),
('Deandre Ayton','POR', array['C'], array[2020], 16.0, 10.5, 1.6, 0.6, 0.6, '2023-2024'),
-- SACRAMENTO KINGS
('Malik Monk','SAC', array['SG','PG'], array[2020], 14.5, 3.0, 4.0, 0.8, 0.2, '2022-2024'),
('Harrison Barnes','SAC', array['SF','PF'], array[2020], 13.0, 4.5, 1.5, 0.6, 0.4, '2019-2024'),
-- SAN ANTONIO SPURS
('Tre Jones','SAS', array['PG'], array[2020], 9.5, 3.0, 5.0, 1.3, 0.1, '2020-2024'),
('Devin Vassell','SAS', array['SG','SF'], array[2020], 15.0, 3.5, 3.0, 1.1, 0.5, '2020-2024'),
('Keldon Johnson','SAS', array['SF','SG'], array[2020], 15.0, 5.0, 2.0, 0.8, 0.3, '2019-2024'),
('Jeremy Sochan','SAS', array['PF','SF'], array[2020], 11.0, 6.0, 2.5, 0.9, 0.5, '2022-2024'),
-- TORONTO RAPTORS
('Gary Trent Jr.','TOR', array['SG'], array[2020], 16.0, 3.0, 1.5, 1.2, 0.2, '2020-2024'),
('Jakob Poeltl','TOR', array['C'], array[2020], 11.0, 9.0, 2.5, 0.6, 1.2, '2022-2024'),
-- UTAH JAZZ
('Collin Sexton','UTA', array['PG','SG'], array[2020], 18.0, 3.0, 4.5, 0.9, 0.2, '2022-2024'),
('Lauri Markkanen','UTA', array['SF','PF'], array[2020], 24.0, 8.2, 1.9, 0.9, 0.5, '2022-2024'),
-- WASHINGTON WIZARDS
('Tyus Jones','WAS', array['PG'], array[2020], 12.0, 3.0, 7.3, 1.3, 0.1, '2024-2024'),
('Kyle Kuzma','WAS', array['SF','PF'], array[2020], 20.0, 6.5, 4.0, 0.9, 0.4, '2021-2024'),
('Daniel Gafford','WAS', array['C'], array[2020], 10.0, 6.0, 0.8, 0.6, 1.3, '2021-2024')
on conflict (name, team) do nothing;
