-- =========================================================
-- LSOR-SPORT — 82-0 (basket)
-- =========================================================
-- Même principe qu'Ultimate Eleven (sql/005) : tirage franchise + décennie,
-- draft de vrais joueurs par poste (PG/SG/SF/PF/C). La différence : la note
-- finale n'est PAS une moyenne de notes. On simule une saison NBA de 82
-- matchs à partir des stats réelles cumulées de l'équipe (points, rebonds,
-- passes, interceptions, contres) pour voir si tu peux finir invaincu,
-- comme le vrai jeu 82-0.com. Le calcul (poids des stats, courbe de
-- victoires, grades) vit dans lib/eightyTwoO.ts ; ce fichier ne fait que
-- stocker le résultat et calculer l'ELO, comme pour les autres jeux.
--
-- Les stats des joueurs sont des approximations de bonne foi (mêmes
-- disclaimers que sql/005 pour les notes Ultimate Eleven) : ce ne sont pas
-- des statistiques officielles garanties exactes, et les interceptions /
-- contres d'avant 1973-74 (non trackés à l'époque par la NBA) sont estimés.
--
-- Ré-exécutable sans risque. À exécuter après les fichiers précédents.
-- =========================================================

create table if not exists public.nba_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team text not null,
  positions text[] not null,
  decades int[] not null,
  ppg numeric not null,
  rpg numeric not null,
  apg numeric not null,
  spg numeric not null,
  bpg numeric not null,
  active_years text,
  created_at timestamptz default now()
);

alter table public.nba_players enable row level security;

drop policy if exists "NBA players are viewable by everyone" on public.nba_players;
create policy "NBA players are viewable by everyone"
on public.nba_players for select using (true);

create unique index if not exists nba_players_name_team_idx
on public.nba_players (name, team);

-- =========================================================
-- SEED — joueurs réels
-- =========================================================

insert into public.nba_players (name, team, positions, decades, ppg, rpg, apg, spg, bpg, active_years) values
-- ATLANTA HAWKS
('Bob Pettit','ATL', array['PF','C'], array[1960], 26.4, 16.2, 3.0, 1.2, 1.5, '1954-1965'),
('Lou Hudson','ATL', array['SF','SG'], array[1960,1970], 20.2, 5.0, 3.0, 1.0, 0.3, '1966-1977'),
('Dominique Wilkins','ATL', array['SF','SG'], array[1980,1990], 24.8, 6.7, 2.5, 1.3, 0.4, '1982-1999'),
('Steve Smith','ATL', array['SG'], array[1990], 16.5, 3.9, 4.3, 1.1, 0.3, '1991-1999'),
('Dikembe Mutombo','ATL', array['C'], array[1990,2000], 13.5, 10.5, 1.0, 0.5, 3.3, '1996-2001'),
('Joe Johnson','ATL', array['SG','SF'], array[2000,2010], 18.5, 4.5, 4.4, 1.1, 0.2, '2005-2012'),
('Trae Young','ATL', array['PG'], array[2020], 25.3, 3.9, 9.5, 0.9, 0.1, '2018-2024'),
-- BOSTON CELTICS
('Bill Russell','BOS', array['C'], array[1960], 15.1, 22.5, 4.3, 1.8, 4.3, '1956-1969'),
('Bob Cousy','BOS', array['PG'], array[1960], 18.4, 5.2, 7.5, 2.0, 0.2, '1950-1963'),
('John Havlicek','BOS', array['SG','SF'], array[1960,1970], 20.8, 6.3, 4.8, 1.5, 0.3, '1962-1978'),
('Larry Bird','BOS', array['SF','PF'], array[1980,1990], 24.3, 10.0, 6.3, 1.7, 0.6, '1979-1992'),
('Kevin McHale','BOS', array['PF','C'], array[1980,1990], 17.9, 7.3, 1.7, 0.7, 1.7, '1980-1993'),
('Paul Pierce','BOS', array['SF'], array[2000,2010], 19.7, 5.6, 3.5, 1.4, 0.4, '1998-2013'),
('Kevin Garnett','BOS', array['PF','C'], array[2000,2010], 17.4, 9.2, 3.0, 1.0, 1.2, '2007-2013'),
('Jayson Tatum','BOS', array['SF'], array[2020], 24.9, 7.5, 4.2, 1.0, 0.6, '2017-2024'),
('Jaylen Brown','BOS', array['SG','SF'], array[2020], 21.5, 6.1, 3.0, 1.1, 0.4, '2016-2024'),
-- BROOKLYN NETS
('Julius Erving','BKN', array['SF'], array[1970], 24.2, 8.5, 4.5, 2.2, 1.5, '1973-1976'),
('Buck Williams','BKN', array['PF'], array[1980], 12.7, 10.8, 1.6, 0.9, 0.8, '1981-1989'),
('Jason Kidd','BKN', array['PG'], array[2000], 12.7, 6.8, 8.9, 1.9, 0.2, '2001-2008'),
('Vince Carter','BKN', array['SG','SF'], array[2000], 20.5, 5.6, 4.0, 1.0, 0.6, '2004-2009'),
('Kenyon Martin','BKN', array['PF'], array[2000], 14.0, 7.7, 1.3, 0.8, 1.2, '2001-2004'),
('Deron Williams','BKN', array['PG'], array[2010], 16.9, 3.1, 8.2, 1.1, 0.1, '2011-2015'),
('Kyrie Irving','BKN', array['PG'], array[2020], 26.9, 4.5, 5.7, 1.2, 0.4, '2019-2023'),
('Mikal Bridges','BKN', array['SF','SG'], array[2020], 20.1, 4.5, 3.6, 1.0, 0.5, '2023-2024'),
-- CHARLOTTE HORNETS
('Kemba Walker','CHA', array['PG'], array[2010], 19.3, 3.8, 5.4, 1.1, 0.3, '2011-2019'),
('Gerald Wallace','CHA', array['SF','PF'], array[2000,2010], 14.7, 8.1, 2.4, 1.6, 0.9, '2004-2011'),
('Al Jefferson','CHA', array['C','PF'], array[2010], 17.5, 9.2, 1.7, 0.7, 1.2, '2013-2015'),
('Miles Bridges','CHA', array['SF','PF'], array[2020], 16.0, 6.6, 2.8, 0.8, 0.5, '2018-2023'),
('P.J. Washington','CHA', array['PF'], array[2020], 12.5, 5.8, 1.8, 0.8, 0.6, '2019-2024'),
('Terry Rozier','CHA', array['SG','PG'], array[2020], 18.0, 4.0, 4.5, 1.2, 0.3, '2021-2024'),
('LaMelo Ball','CHA', array['PG'], array[2020], 21.0, 6.2, 7.5, 1.4, 0.3, '2020-2024'),
-- CHICAGO BULLS
('Michael Jordan','CHI', array['SG','SF'], array[1980,1990], 30.1, 6.2, 5.3, 2.3, 0.8, '1984-1998'),
('Scottie Pippen','CHI', array['SF'], array[1980,1990], 16.1, 6.4, 5.2, 1.8, 0.8, '1987-1998'),
('Dennis Rodman','CHI', array['PF'], array[1990], 5.7, 13.1, 1.8, 0.7, 0.3, '1995-1998'),
('Bob Love','CHI', array['SF'], array[1960,1970], 21.3, 6.4, 1.9, 1.3, 0.5, '1968-1976'),
('Artis Gilmore','CHI', array['C'], array[1970,1980], 17.1, 10.1, 2.3, 0.7, 2.3, '1976-1987'),
('Derrick Rose','CHI', array['PG'], array[2000,2010], 20.1, 3.4, 6.5, 1.0, 0.2, '2008-2016'),
('DeMar DeRozan','CHI', array['SG','SF'], array[2020], 21.6, 4.5, 4.3, 0.9, 0.2, '2021-2024'),
('Zach LaVine','CHI', array['SG'], array[2010,2020], 24.0, 4.4, 4.1, 0.8, 0.3, '2017-2024'),
-- CLEVELAND CAVALIERS
('Mark Price','CLE', array['PG'], array[1980,1990], 15.2, 3.0, 6.7, 1.4, 0.1, '1986-1995'),
('Brad Daugherty','CLE', array['C'], array[1980,1990], 19.0, 9.5, 3.7, 0.7, 0.8, '1986-1994'),
('Zydrunas Ilgauskas','CLE', array['C'], array[1990,2000,2010], 13.0, 8.5, 1.1, 0.4, 1.5, '1997-2010'),
('LeBron James','CLE', array['SF'], array[2000,2010,2020], 27.2, 7.4, 7.2, 1.5, 0.7, '2003-2018'),
('Kyrie Irving','CLE', array['PG'], array[2010], 21.9, 3.7, 5.8, 1.1, 0.3, '2011-2017'),
('Kevin Love','CLE', array['PF','C'], array[2010], 17.5, 11.2, 2.0, 0.6, 0.4, '2014-2018'),
('Donovan Mitchell','CLE', array['SG'], array[2020], 25.0, 4.3, 4.5, 1.3, 0.3, '2022-2024'),
('Darius Garland','CLE', array['PG'], array[2020], 18.5, 2.7, 7.0, 0.9, 0.1, '2019-2024'),
-- DALLAS MAVERICKS
('Rolando Blackman','DAL', array['SG'], array[1980], 19.2, 3.0, 3.3, 1.0, 0.2, '1981-1992'),
('Jason Kidd','DAL', array['PG'], array[1990,2000,2010], 16.7, 6.8, 9.0, 2.0, 0.2, '1994-2012'),
('Steve Nash','DAL', array['PG'], array[1990,2000], 14.3, 3.0, 7.1, 0.6, 0.1, '1998-2004'),
('Michael Finley','DAL', array['SG','SF'], array[1990,2000], 19.6, 4.8, 3.6, 1.2, 0.4, '1996-2005'),
('Dirk Nowitzki','DAL', array['PF'], array[1990,2000,2010], 20.7, 7.5, 2.4, 0.8, 0.8, '1998-2019'),
('Luka Doncic','DAL', array['PG','SG'], array[2010,2020], 28.5, 8.6, 8.2, 1.3, 0.5, '2018-2024'),
('Kristaps Porzingis','DAL', array['PF','C'], array[2010,2020], 20.0, 7.5, 2.0, 0.6, 2.1, '2019-2022'),
-- DENVER NUGGETS
('Dan Issel','DEN', array['C','PF'], array[1970,1980], 22.6, 9.1, 2.4, 1.0, 1.0, '1975-1985'),
('David Thompson','DEN', array['SG'], array[1970,1980], 22.7, 4.1, 3.3, 1.4, 0.5, '1975-1982'),
('Alex English','DEN', array['SF'], array[1980], 25.9, 5.5, 3.6, 1.3, 0.4, '1980-1990'),
('Fat Lever','DEN', array['PG','SG'], array[1980], 15.8, 6.6, 7.0, 2.2, 0.4, '1984-1990'),
('Carmelo Anthony','DEN', array['SF'], array[2000,2010], 24.8, 6.2, 3.0, 1.2, 0.5, '2003-2011'),
('Nikola Jokic','DEN', array['C'], array[2010,2020], 26.6, 12.1, 8.5, 1.3, 0.7, '2015-2024'),
('Jamal Murray','DEN', array['PG'], array[2010,2020], 18.0, 4.0, 4.5, 0.8, 0.3, '2016-2024'),
-- DETROIT PISTONS
('Dave Bing','DET', array['PG','SG'], array[1960,1970], 20.3, 3.7, 6.0, 1.5, 0.2, '1966-1975'),
('Bob Lanier','DET', array['C'], array[1970], 22.7, 10.1, 3.3, 1.0, 2.0, '1970-1980'),
('Isiah Thomas','DET', array['PG'], array[1980,1990], 19.2, 3.6, 9.3, 1.9, 0.2, '1981-1994'),
('Joe Dumars','DET', array['SG'], array[1980,1990], 16.1, 2.2, 4.5, 1.1, 0.2, '1985-1999'),
('Bill Laimbeer','DET', array['C','PF'], array[1980,1990], 12.9, 9.7, 1.9, 0.6, 0.5, '1982-1993'),
('Grant Hill','DET', array['SF'], array[1990], 21.6, 7.9, 6.3, 1.8, 0.4, '1994-2000'),
('Chauncey Billups','DET', array['PG'], array[2000], 16.6, 3.1, 5.8, 1.1, 0.2, '2002-2008'),
('Cade Cunningham','DET', array['PG'], array[2020], 20.0, 5.5, 7.5, 0.9, 0.5, '2021-2024'),
-- GOLDEN STATE WARRIORS
('Wilt Chamberlain','GSW', array['C'], array[1960], 41.5, 25.1, 3.6, 1.0, 3.5, '1959-1965'),
('Nate Thurmond','GSW', array['C'], array[1960,1970], 15.0, 15.0, 2.7, 1.0, 2.5, '1963-1974'),
('Rick Barry','GSW', array['SF'], array[1960,1970], 24.8, 6.5, 4.9, 1.5, 0.5, '1965-1978'),
('Chris Mullin','GSW', array['SF','SG'], array[1980,1990], 20.1, 4.6, 3.5, 1.5, 0.3, '1985-1997'),
('Stephen Curry','GSW', array['PG'], array[2000,2010,2020], 24.8, 4.6, 6.4, 1.5, 0.2, '2009-2024'),
('Klay Thompson','GSW', array['SG'], array[2010,2020], 19.5, 3.5, 2.3, 0.7, 0.5, '2011-2024'),
('Draymond Green','GSW', array['PF'], array[2010,2020], 8.6, 7.3, 6.0, 1.3, 1.0, '2012-2024'),
('Kevin Durant','GSW', array['SF','PF'], array[2010], 26.0, 7.1, 5.2, 1.1, 1.1, '2016-2019'),
-- HOUSTON ROCKETS
('Calvin Murphy','HOU', array['PG'], array[1970,1980], 17.9, 2.6, 4.4, 1.7, 0.1, '1970-1983'),
('Elvin Hayes','HOU', array['PF','C'], array[1960,1970,1980], 21.0, 12.5, 1.8, 1.0, 1.5, '1968-1984'),
('Moses Malone','HOU', array['C'], array[1970,1980], 20.3, 12.8, 1.4, 0.9, 1.3, '1976-1982'),
('Hakeem Olajuwon','HOU', array['C'], array[1980,1990,2000], 21.8, 11.1, 2.5, 1.7, 3.1, '1984-2001'),
('Yao Ming','HOU', array['C'], array[2000,2010], 19.0, 9.2, 1.6, 0.4, 1.9, '2002-2011'),
('Tracy McGrady','HOU', array['SG','SF'], array[2000,2010], 21.6, 5.6, 4.4, 1.2, 0.6, '2004-2010'),
('James Harden','HOU', array['SG','PG'], array[2010,2020], 27.8, 5.7, 7.4, 1.7, 0.5, '2012-2020'),
-- INDIANA PACERS
('Mel Daniels','IND', array['C'], array[1960,1970], 18.7, 15.6, 1.9, 1.0, 2.5, '1968-1977'),
('Reggie Miller','IND', array['SG'], array[1980,1990,2000], 18.2, 3.0, 3.0, 1.1, 0.2, '1987-2005'),
('Rik Smits','IND', array['C'], array[1980,1990,2000], 14.8, 6.1, 1.1, 0.4, 1.5, '1988-2000'),
('Jermaine O''Neal','IND', array['PF','C'], array[2000], 18.6, 9.6, 2.1, 0.9, 2.3, '2000-2008'),
('Paul George','IND', array['SF'], array[2010], 19.9, 6.3, 3.3, 1.8, 0.4, '2010-2017'),
('Victor Oladipo','IND', array['SG'], array[2010], 19.9, 4.3, 4.0, 1.7, 0.5, '2016-2020'),
('Tyrese Haliburton','IND', array['PG'], array[2020], 20.1, 3.8, 10.4, 1.2, 0.6, '2022-2024'),
-- LA CLIPPERS
('Bob McAdoo','LAC', array['C','PF'], array[1970], 30.6, 12.4, 2.2, 0.8, 1.5, '1972-1976'),
('Randy Smith','LAC', array['SG','PG'], array[1970], 16.7, 3.8, 4.6, 1.5, 0.3, '1971-1979'),
('World B. Free','LAC', array['SG'], array[1980], 20.3, 3.0, 4.0, 0.9, 0.2, '1980-1986'),
('Blake Griffin','LAC', array['PF'], array[2010], 21.4, 8.7, 3.9, 0.8, 0.5, '2009-2018'),
('Chris Paul','LAC', array['PG'], array[2010], 18.5, 4.4, 9.9, 2.3, 0.1, '2011-2017'),
('DeAndre Jordan','LAC', array['C'], array[2000,2010], 8.6, 12.5, 1.0, 0.6, 1.9, '2008-2018'),
('Kawhi Leonard','LAC', array['SF'], array[2010,2020], 21.0, 6.0, 3.5, 1.6, 0.5, '2019-2024'),
('Paul George','LAC', array['SF','SG'], array[2010,2020], 22.5, 5.7, 3.5, 1.5, 0.4, '2019-2024'),
-- LOS ANGELES LAKERS
('Elgin Baylor','LAL', array['SF','PF'], array[1960,1970], 27.4, 13.5, 4.3, 1.5, 0.8, '1958-1971'),
('Jerry West','LAL', array['SG','PG'], array[1960,1970], 27.0, 5.8, 6.7, 2.6, 0.2, '1960-1974'),
('Wilt Chamberlain','LAL', array['C'], array[1960,1970], 17.7, 19.2, 4.0, 0.8, 3.0, '1968-1973'),
('Kareem Abdul-Jabbar','LAL', array['C'], array[1970,1980], 24.6, 11.2, 3.6, 0.9, 2.6, '1975-1989'),
('Magic Johnson','LAL', array['PG'], array[1980,1990], 19.5, 7.2, 11.2, 1.9, 0.4, '1979-1996'),
('James Worthy','LAL', array['SF','PF'], array[1980,1990], 17.6, 5.1, 3.0, 1.0, 0.6, '1982-1994'),
('Shaquille O''Neal','LAL', array['C'], array[1990,2000], 27.0, 11.9, 3.0, 0.6, 2.4, '1996-2004'),
('Kobe Bryant','LAL', array['SG'], array[1990,2000,2010], 25.0, 5.2, 4.7, 1.4, 0.5, '1996-2016'),
('Pau Gasol','LAL', array['PF','C'], array[2000,2010], 18.6, 9.9, 3.3, 0.6, 1.5, '2008-2014'),
('LeBron James','LAL', array['SF','PF'], array[2010,2020], 25.5, 7.5, 8.0, 1.1, 0.5, '2018-2024'),
('Anthony Davis','LAL', array['PF','C'], array[2010,2020], 24.7, 10.5, 2.6, 1.2, 2.3, '2019-2024'),
-- MEMPHIS GRIZZLIES
('Mike Bibby','MEM', array['PG'], array[1990,2000], 14.9, 2.9, 6.6, 1.1, 0.1, '1998-2001'),
('Pau Gasol','MEM', array['PF','C'], array[2000], 19.4, 8.8, 3.4, 0.7, 2.0, '2001-2008'),
('Marc Gasol','MEM', array['C'], array[2000,2010], 14.5, 7.7, 3.3, 0.9, 1.3, '2008-2019'),
('Mike Conley','MEM', array['PG'], array[2000,2010], 14.6, 3.3, 5.6, 1.3, 0.2, '2007-2019'),
('Zach Randolph','MEM', array['PF'], array[2000,2010], 17.3, 10.1, 2.0, 0.7, 0.3, '2009-2017'),
('Ja Morant','MEM', array['PG'], array[2010,2020], 23.5, 5.6, 7.6, 1.1, 0.3, '2019-2024'),
('Jaren Jackson Jr.','MEM', array['PF','C'], array[2010,2020], 17.5, 5.5, 1.2, 1.0, 2.3, '2018-2024'),
-- MIAMI HEAT
('Alonzo Mourning','MIA', array['C'], array[1990,2000], 17.1, 8.5, 1.2, 0.6, 2.8, '1995-2008'),
('Tim Hardaway','MIA', array['PG'], array[1990,2000], 16.6, 3.4, 7.3, 1.4, 0.1, '1996-2001'),
('Dwyane Wade','MIA', array['SG'], array[2000,2010], 22.0, 4.7, 5.4, 1.5, 0.8, '2003-2019'),
('Shaquille O''Neal','MIA', array['C'], array[2000], 20.3, 9.8, 2.6, 0.6, 1.8, '2004-2008'),
('Chris Bosh','MIA', array['PF','C'], array[2010], 18.0, 7.3, 2.0, 0.7, 0.9, '2010-2016'),
('Bam Adebayo','MIA', array['C','PF'], array[2010,2020], 17.5, 9.8, 3.5, 1.1, 0.8, '2017-2024'),
('Jimmy Butler','MIA', array['SF'], array[2010,2020], 20.5, 5.5, 4.8, 1.7, 0.4, '2019-2024'),
-- MILWAUKEE BUCKS
('Kareem Abdul-Jabbar','MIL', array['C'], array[1960,1970], 30.4, 15.3, 4.3, 1.0, 3.0, '1969-1975'),
('Oscar Robertson','MIL', array['PG'], array[1970], 22.3, 6.4, 8.2, 1.8, 0.3, '1970-1974'),
('Sidney Moncrief','MIL', array['SG'], array[1980], 16.3, 4.6, 3.5, 1.4, 0.3, '1979-1990'),
('Ray Allen','MIL', array['SG'], array[1990,2000], 20.2, 4.5, 3.8, 1.2, 0.2, '1996-2003'),
('Giannis Antetokounmpo','MIL', array['PF'], array[2010,2020], 26.4, 11.3, 5.7, 1.1, 1.2, '2013-2024'),
('Khris Middleton','MIL', array['SF'], array[2010,2020], 17.5, 5.4, 4.3, 1.1, 0.2, '2013-2024'),
('Jrue Holiday','MIL', array['PG'], array[2020], 13.5, 4.8, 6.3, 1.4, 0.5, '2020-2024'),
-- MINNESOTA TIMBERWOLVES
('Kevin Garnett','MIN', array['PF','C'], array[1990,2000], 20.0, 11.3, 4.1, 1.4, 1.6, '1995-2007'),
('Stephon Marbury','MIN', array['PG'], array[1990], 20.7, 3.4, 8.0, 1.4, 0.1, '1996-1999'),
('Sam Cassell','MIN', array['PG'], array[2000], 14.7, 3.2, 6.4, 1.1, 0.1, '2003-2005'),
('Kevin Love','MIN', array['PF','C'], array[2000,2010], 19.0, 12.4, 2.1, 0.8, 0.4, '2008-2014'),
('Karl-Anthony Towns','MIN', array['C'], array[2010,2020], 23.0, 11.0, 3.0, 0.8, 1.1, '2015-2024'),
('Anthony Edwards','MIN', array['SG'], array[2020], 22.0, 5.2, 4.0, 1.2, 0.5, '2020-2024'),
('Rudy Gobert','MIN', array['C'], array[2020], 13.5, 12.9, 1.5, 0.7, 2.1, '2023-2024'),
-- NEW ORLEANS PELICANS
('Larry Johnson','NOP', array['PF'], array[1990], 19.0, 9.9, 4.2, 1.0, 0.3, '1991-1996'),
('Alonzo Mourning','NOP', array['C'], array[1990], 21.0, 10.2, 1.4, 0.7, 2.9, '1992-1995'),
('Muggsy Bogues','NOP', array['PG'], array[1980,1990], 7.7, 2.6, 7.6, 1.5, 0.1, '1988-1997'),
('Baron Davis','NOP', array['PG'], array[1990,2000], 16.1, 4.7, 7.2, 2.1, 0.2, '1999-2004'),
('David West','NOP', array['PF'], array[2000,2010], 18.2, 7.7, 2.6, 1.1, 0.7, '2003-2011'),
('Chris Paul','NOP', array['PG'], array[2000,2010], 18.8, 4.5, 10.7, 2.4, 0.1, '2005-2011'),
('Anthony Davis','NOP', array['PF','C'], array[2010], 23.7, 10.4, 2.2, 1.4, 2.5, '2012-2019'),
('Zion Williamson','NOP', array['PF'], array[2010,2020], 24.0, 6.8, 3.5, 1.1, 0.6, '2019-2024'),
-- NEW YORK KNICKS
('Willis Reed','NYK', array['C'], array[1960,1970], 18.7, 12.9, 1.8, 1.0, 1.8, '1964-1974'),
('Walt Frazier','NYK', array['PG'], array[1960,1970], 18.9, 5.9, 6.1, 2.0, 0.2, '1967-1977'),
('Earl Monroe','NYK', array['SG'], array[1970], 18.8, 3.0, 3.9, 1.4, 0.2, '1971-1980'),
('Bernard King','NYK', array['SF'], array[1980], 22.5, 5.8, 3.3, 1.0, 0.3, '1982-1987'),
('Patrick Ewing','NYK', array['C'], array[1980,1990], 21.0, 9.8, 2.4, 1.0, 2.4, '1985-2000'),
('Latrell Sprewell','NYK', array['SG','SF'], array[1990,2000], 17.6, 4.4, 4.1, 1.4, 0.2, '1999-2003'),
('Carmelo Anthony','NYK', array['SF'], array[2010], 24.7, 6.9, 3.1, 0.9, 0.5, '2011-2017'),
('Julius Randle','NYK', array['PF'], array[2010,2020], 22.5, 9.8, 4.5, 0.7, 0.3, '2019-2024'),
('Jalen Brunson','NYK', array['PG'], array[2020], 24.5, 3.6, 6.5, 0.9, 0.2, '2022-2024'),
-- OKLAHOMA CITY THUNDER
('Gary Payton','OKC', array['PG'], array[1990,2000], 16.3, 3.9, 7.0, 2.2, 0.2, '1990-2003'),
('Shawn Kemp','OKC', array['PF'], array[1980,1990], 15.6, 8.4, 1.6, 0.9, 1.1, '1989-1997'),
('Nate McMillan','OKC', array['PG'], array[1980,1990], 5.9, 3.2, 5.6, 1.6, 0.2, '1986-1998'),
('Kevin Durant','OKC', array['SF','PF'], array[2000,2010], 27.4, 6.9, 4.0, 1.1, 0.9, '2007-2016'),
('Russell Westbrook','OKC', array['PG'], array[2000,2010], 23.7, 7.4, 8.3, 1.7, 0.3, '2008-2019'),
('James Harden','OKC', array['SG'], array[2000,2010], 16.8, 4.1, 3.8, 1.3, 0.4, '2009-2012'),
('Shai Gilgeous-Alexander','OKC', array['PG','SG'], array[2010,2020], 27.5, 5.3, 5.9, 1.3, 0.7, '2019-2024'),
-- ORLANDO MAGIC
('Shaquille O''Neal','ORL', array['C'], array[1990], 27.2, 12.5, 2.8, 0.7, 2.7, '1992-1996'),
('Penny Hardaway','ORL', array['PG','SG'], array[1990], 19.1, 4.1, 6.1, 1.8, 0.4, '1993-1999'),
('Nick Anderson','ORL', array['SG','SF'], array[1980,1990], 14.8, 4.3, 2.9, 1.6, 0.5, '1989-1999'),
('Tracy McGrady','ORL', array['SG','SF'], array[2000], 28.0, 6.5, 5.1, 1.4, 0.7, '2000-2004'),
('Dwight Howard','ORL', array['C'], array[2000,2010], 18.4, 13.0, 1.4, 0.9, 2.1, '2004-2012'),
('Paolo Banchero','ORL', array['PF','SF'], array[2020], 21.0, 6.9, 4.5, 0.8, 0.5, '2022-2024'),
('Franz Wagner','ORL', array['SF'], array[2020], 18.5, 5.0, 3.5, 0.9, 0.3, '2021-2024'),
-- PHILADELPHIA 76ERS
('Dolph Schayes','PHI', array['PF','C'], array[1960], 18.2, 12.1, 3.1, 1.0, 1.5, '1949-1964'),
('Wilt Chamberlain','PHI', array['C'], array[1960], 33.5, 22.9, 5.2, 1.0, 3.5, '1965-1968'),
('Julius Erving','PHI', array['SF'], array[1970,1980], 24.2, 8.5, 4.5, 1.8, 1.5, '1976-1987'),
('Moses Malone','PHI', array['C'], array[1980], 23.5, 12.2, 1.5, 0.9, 1.3, '1982-1986'),
('Charles Barkley','PHI', array['PF'], array[1980,1990], 23.1, 11.7, 3.9, 1.6, 0.7, '1984-1992'),
('Allen Iverson','PHI', array['PG','SG'], array[1990,2000], 26.7, 3.7, 6.2, 2.2, 0.2, '1996-2006'),
('Joel Embiid','PHI', array['C'], array[2010,2020], 27.9, 11.1, 3.5, 0.9, 1.5, '2016-2024'),
('Ben Simmons','PHI', array['PG','SF'], array[2010,2020], 15.9, 8.1, 7.7, 1.6, 0.6, '2017-2022'),
-- PHOENIX SUNS
('Charles Barkley','PHX', array['PF'], array[1990], 23.3, 11.6, 4.6, 1.5, 0.6, '1992-1996'),
('Kevin Johnson','PHX', array['PG'], array[1980,1990], 18.1, 3.7, 9.1, 1.5, 0.2, '1988-1998'),
('Shawn Marion','PHX', array['SF','PF'], array[1990,2000], 18.4, 9.6, 2.1, 1.7, 1.3, '1999-2008'),
('Steve Nash','PHX', array['PG'], array[2000,2010], 16.5, 3.0, 10.5, 0.6, 0.1, '2004-2012'),
('Amar''e Stoudemire','PHX', array['PF','C'], array[2000,2010], 21.4, 8.9, 1.6, 0.9, 1.0, '2002-2010'),
('Devin Booker','PHX', array['SG'], array[2010,2020], 24.5, 4.3, 4.8, 1.0, 0.3, '2015-2024'),
('Chris Paul','PHX', array['PG'], array[2020], 14.7, 4.2, 8.9, 1.5, 0.1, '2020-2023'),
-- PORTLAND TRAIL BLAZERS
('Bill Walton','POR', array['C'], array[1970], 13.3, 10.5, 3.7, 1.1, 2.5, '1974-1978'),
('Clyde Drexler','POR', array['SG','SF'], array[1980,1990], 20.4, 6.1, 5.6, 1.8, 0.7, '1983-1995'),
('Terry Porter','POR', array['PG'], array[1980,1990], 14.9, 3.3, 6.1, 1.1, 0.2, '1985-1995'),
('Rasheed Wallace','POR', array['PF','C'], array[1990,2000], 15.8, 6.9, 1.9, 0.7, 1.4, '1996-2004'),
('LaMarcus Aldridge','POR', array['PF','C'], array[2000,2010], 19.4, 8.7, 1.8, 0.6, 1.0, '2006-2015'),
('Damian Lillard','POR', array['PG'], array[2010,2020], 25.2, 4.2, 6.7, 1.0, 0.3, '2012-2023'),
('CJ McCollum','POR', array['SG'], array[2010,2020], 20.1, 3.4, 3.7, 0.8, 0.2, '2013-2022'),
-- SACRAMENTO KINGS
('Oscar Robertson','SAC', array['PG'], array[1960,1970], 27.0, 7.7, 9.5, 2.0, 0.3, '1960-1970'),
('Jack Twyman','SAC', array['SF'], array[1960], 19.2, 6.6, 2.2, 1.0, 0.3, '1955-1966'),
('Nate Archibald','SAC', array['PG'], array[1970], 26.5, 2.3, 6.8, 1.5, 0.1, '1970-1976'),
('Mitch Richmond','SAC', array['SG'], array[1990], 22.1, 3.9, 3.5, 1.4, 0.2, '1991-1998'),
('Chris Webber','SAC', array['PF','C'], array[1990,2000], 20.7, 9.8, 4.2, 1.4, 1.4, '1998-2005'),
('Vlade Divac','SAC', array['C'], array[1990,2000], 11.8, 8.2, 3.1, 1.0, 1.4, '1998-2004'),
('Peja Stojakovic','SAC', array['SF'], array[2000], 17.9, 4.9, 1.9, 0.8, 0.2, '1998-2006'),
('De''Aaron Fox','SAC', array['PG'], array[2010,2020], 21.5, 3.9, 6.2, 1.4, 0.3, '2017-2024'),
('Domantas Sabonis','SAC', array['C','PF'], array[2020], 18.5, 12.5, 6.5, 0.9, 0.5, '2022-2024'),
-- SAN ANTONIO SPURS
('George Gervin','SAS', array['SG','SF'], array[1970,1980], 26.2, 5.3, 2.6, 1.2, 0.6, '1974-1985'),
('David Robinson','SAS', array['C'], array[1990,2000], 21.1, 10.6, 2.5, 1.4, 3.0, '1989-2003'),
('Tim Duncan','SAS', array['PF','C'], array[1990,2000,2010], 19.0, 10.8, 3.0, 0.7, 2.2, '1997-2016'),
('Tony Parker','SAS', array['PG'], array[2000,2010], 15.5, 2.7, 5.6, 0.9, 0.2, '2001-2018'),
('Manu Ginobili','SAS', array['SG'], array[2000,2010], 13.3, 3.5, 3.8, 1.3, 0.4, '2002-2018'),
('Kawhi Leonard','SAS', array['SF'], array[2010], 16.3, 6.2, 2.0, 1.8, 0.7, '2011-2018'),
('Victor Wembanyama','SAS', array['C'], array[2020], 21.0, 10.5, 3.5, 1.2, 3.5, '2023-2024'),
-- TORONTO RAPTORS
('Vince Carter','TOR', array['SG','SF'], array[1990,2000], 23.4, 5.1, 3.9, 1.1, 0.9, '1998-2004'),
('Chris Bosh','TOR', array['PF','C'], array[2000], 20.2, 9.4, 2.5, 0.8, 1.1, '2003-2010'),
('DeMar DeRozan','TOR', array['SG'], array[2010], 21.9, 4.2, 3.5, 0.9, 0.2, '2009-2018'),
('Kyle Lowry','TOR', array['PG'], array[2010,2020], 15.9, 4.4, 6.4, 1.4, 0.2, '2012-2021'),
('Kawhi Leonard','TOR', array['SF'], array[2010], 26.6, 7.3, 3.3, 1.8, 0.4, '2018-2019'),
('Pascal Siakam','TOR', array['PF'], array[2010,2020], 19.5, 7.1, 3.5, 0.9, 0.5, '2016-2024'),
('Scottie Barnes','TOR', array['SF','PF'], array[2020], 15.5, 7.5, 4.5, 1.1, 0.6, '2021-2024'),
-- UTAH JAZZ
('Pete Maravich','UTA', array['PG','SG'], array[1970], 24.2, 4.2, 5.4, 2.0, 0.2, '1974-1980'),
('Adrian Dantley','UTA', array['SF'], array[1970,1980], 25.3, 5.7, 2.9, 1.1, 0.2, '1979-1986'),
('John Stockton','UTA', array['PG'], array[1980,1990,2000], 13.1, 2.7, 10.5, 2.2, 0.2, '1984-2003'),
('Karl Malone','UTA', array['PF'], array[1980,1990,2000], 25.0, 10.1, 3.6, 1.4, 0.7, '1985-2003'),
('Deron Williams','UTA', array['PG'], array[2000,2010], 18.0, 3.2, 9.7, 1.0, 0.1, '2005-2011'),
('Rudy Gobert','UTA', array['C'], array[2010,2020], 12.5, 12.9, 1.2, 0.7, 2.2, '2013-2022'),
('Donovan Mitchell','UTA', array['SG'], array[2010,2020], 23.9, 4.0, 4.0, 1.3, 0.3, '2017-2022'),
-- WASHINGTON WIZARDS
('Wes Unseld','WAS', array['C'], array[1960,1970,1980], 10.8, 14.0, 3.9, 0.8, 1.5, '1968-1981'),
('Elvin Hayes','WAS', array['PF','C'], array[1970,1980], 21.0, 12.6, 1.8, 1.1, 1.7, '1972-1981'),
('Bernard King','WAS', array['SF'], array[1970], 20.5, 6.6, 2.7, 1.0, 0.3, '1977-1980'),
('Gilbert Arenas','WAS', array['PG','SG'], array[2000], 22.6, 3.9, 5.8, 1.6, 0.2, '2003-2010'),
('Antawn Jamison','WAS', array['SF','PF'], array[2000], 20.2, 8.6, 1.9, 1.1, 0.4, '2004-2010'),
('John Wall','WAS', array['PG'], array[2010], 19.0, 4.3, 9.2, 1.6, 0.4, '2010-2019'),
('Bradley Beal','WAS', array['SG'], array[2010,2020], 23.1, 4.2, 4.4, 1.1, 0.4, '2012-2023')
on conflict (name, team) do nothing;

-- =========================================================
-- RÉSULTATS 82-0
-- =========================================================

create table if not exists public.results_82_0 (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  wins int not null check (wins between 0 and 82),
  losses int not null check (losses between 0 and 82),
  team_ovr numeric not null,
  grade text not null,
  team jsonb not null, -- {"PG": player_id, "SG": player_id, ...}
  created_at timestamptz default now()
);

alter table public.results_82_0 enable row level security;

drop policy if exists "82-0 results viewable by everyone" on public.results_82_0;
create policy "82-0 results viewable by everyone"
on public.results_82_0 for select using (true);

drop policy if exists "Users can insert their own 82-0 result" on public.results_82_0;
create policy "Users can insert their own 82-0 result"
on public.results_82_0 for insert
with check (auth.uid() = user_id);

-- =========================================================
-- ELO — conversion percentile + ancrage absolu (voir project memory /
-- sql/005 et sql/007 pour la même convention). Ancrage neutre = 41 victoires
-- (saison .500 exacte, 41-41) : c'est un repère naturel et propre pour ce
-- jeu, contrairement aux repères approximatifs des deux autres.
-- =========================================================

create or replace function public.handle_82_0_result()
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
begin
  select id into v_game_id from public.games where code = '82_0';

  select
    (count(*) filter (where wins <= new.wins))::numeric
    / greatest(count(*), 1)::numeric * 100
  into v_percentile
  from public.results_82_0;

  v_percentile_delta := round((v_percentile - 50) / 100 * 30); -- -15..+15
  v_absolute_delta := round(least(15, greatest(-15, (new.wins - 41) / 41.0 * 15)));
  v_delta := round((v_percentile_delta + v_absolute_delta) / 2.0);

  update public.player_ratings
  set
    games_played = games_played + 1,
    wins = wins + (case when v_delta >= 0 then 1 else 0 end),
    losses = losses + (case when v_delta < 0 then 1 else 0 end),
    elo = greatest(0, elo + v_delta),
    updated_at = now()
  where user_id = new.user_id and game_id = v_game_id;

  select round(avg(elo)) into v_new_general_elo
  from public.player_ratings
  where user_id = new.user_id and game_id is not null;

  update public.player_ratings
  set elo = coalesce(v_new_general_elo, elo), updated_at = now()
  where user_id = new.user_id and game_id is null;

  return new;
end;
$$;

drop trigger if exists on_82_0_result_created on public.results_82_0;

create trigger on_82_0_result_created
after insert on public.results_82_0
for each row
execute procedure public.handle_82_0_result();

-- =========================================================
-- Backfill : les comptes créés avant l'activation de ce jeu n'ont pas de
-- ligne player_ratings pour '82_0' (voir sql/008 pour la même remarque).
-- =========================================================
insert into public.player_ratings (user_id, game_id, elo)
select p.id, g.id, 1500
from public.profiles p, public.games g
where g.code = '82_0'
on conflict (user_id, game_id) do nothing;

update public.games set is_active = true where code = '82_0';
