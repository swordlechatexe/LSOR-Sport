-- =========================================================
-- LSOR-SPORT — ULTIMATE ELEVEN (v2, base de joueurs enrichie)
-- =========================================================
-- Si tu as déjà exécuté une version précédente de ce fichier, tu peux
-- réexécuter celui-ci sans risque de doublons (index unique sur
-- nom+nationalité + "on conflict do nothing").
--
-- ~190 vrais joueurs (vrai nom, vraie nationalité, vrai(s) poste(s)),
-- 10 nations, décennies 1970 à 2020. La recherche de candidats en jeu
-- tolère +/-10 ans autour de la décennie tirée, pour garantir un vrai
-- choix (au moins 2 joueurs la plupart du temps) plutôt qu'un tirage trop
-- strict qui bloque la partie.
--
-- La "note" (rating sur 100) est une estimation LSOR, pas une statistique
-- officielle.
--
-- positions possibles : GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF
-- =========================================================

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nationality text not null,
  positions text[] not null,
  decades int[] not null,
  rating int not null check (rating between 1 and 99),
  active_years text,
  created_at timestamptz default now()
);

alter table public.players enable row level security;

drop policy if exists "Players are viewable by everyone" on public.players;
create policy "Players are viewable by everyone"
on public.players for select using (true);

create unique index if not exists players_name_nationality_idx
on public.players (name, nationality);

-- =========================================================
-- SEED — joueurs réels
-- =========================================================

insert into public.players (name, nationality, positions, decades, rating, active_years) values
-- FRANCE
('Zinédine Zidane','France', array['CAM','CM'], array[1990,2000], 96, '1990-2006'),
('Thierry Henry','France', array['ST','LW'], array[2000,2010], 95, '1998-2014'),
('Michel Platini','France', array['CAM'], array[1980], 94, '1976-1987'),
('Kylian Mbappé','France', array['ST','LW'], array[2010,2020], 96, '2015-'),
('Antoine Griezmann','France', array['CAM','ST'], array[2010,2020], 90, '2009-'),
('N''Golo Kanté','France', array['CDM','CM'], array[2010,2020], 89, '2012-'),
('Lilian Thuram','France', array['CB','RB'], array[1990,2000], 90, '1991-2008'),
('Marcel Desailly','France', array['CB','CDM'], array[1990,2000], 89, '1986-2004'),
('Bixente Lizarazu','France', array['LB'], array[1990,2000], 87, '1989-2006'),
('Patrick Vieira','France', array['CDM','CM'], array[1990,2000], 89, '1993-2011'),
('Didier Deschamps','France', array['CDM','CM'], array[1990], 85, '1983-2001'),
('Youri Djorkaeff','France', array['CAM'], array[1990,2000], 87, '1986-2006'),
('David Trezeguet','France', array['ST'], array[2000], 88, '1994-2013'),
('Franck Ribéry','France', array['LW','LM'], array[2000,2010], 91, '2000-2019'),
('Karim Benzema','France', array['ST','CF'], array[2000,2010,2020], 93, '2004-'),
('Paul Pogba','France', array['CM'], array[2010,2020], 87, '2011-'),
('Raphaël Varane','France', array['CB'], array[2010,2020], 87, '2010-'),
('Hugo Lloris','France', array['GK'], array[2010,2020], 87, '2007-'),
('Fabien Barthez','France', array['GK'], array[1990,2000], 88, '1990-2007'),
('Laurent Blanc','France', array['CB'], array[1990,2000], 89, '1983-2003'),
('William Gallas','France', array['CB'], array[2000,2010], 85, '1997-2013'),
('Éric Abidal','France', array['LB','CB'], array[2000,2010], 84, '1999-2014'),
('Willy Sagnol','France', array['RB'], array[2000], 82, '1995-2009'),
('Samir Nasri','France', array['CAM','CM'], array[2010], 85, '2004-2017'),
('Olivier Giroud','France', array['ST','CF'], array[2010,2020], 85, '2005-'),
('Steve Mandanda','France', array['GK'], array[2010,2020], 84, '2003-'),
('Mike Maignan','France', array['GK'], array[2020], 87, '2015-'),
('Théo Hernández','France', array['LB'], array[2020], 86, '2015-'),
('Jules Koundé','France', array['CB','RB'], array[2020], 85, '2017-'),
('Aurélien Tchouaméni','France', array['CDM'], array[2020], 85, '2018-'),
-- BRÉSIL
('Pelé','Brésil', array['ST'], array[1970], 98, '1956-1977'),
('Zico','Brésil', array['CAM'], array[1970,1980], 92, '1971-1994'),
('Sócrates','Brésil', array['CAM'], array[1980], 90, '1974-1989'),
('Romário','Brésil', array['ST'], array[1990], 94, '1985-2007'),
('Ronaldo Nazário','Brésil', array['ST'], array[1990,2000], 97, '1993-2011'),
('Ronaldinho','Brésil', array['RW','CAM'], array[2000,2010], 95, '1998-2015'),
('Rivaldo','Brésil', array['LW','CAM'], array[1990,2000], 92, '1993-2015'),
('Cafu','Brésil', array['RB'], array[1990,2000], 90, '1989-2008'),
('Roberto Carlos','Brésil', array['LB'], array[1990,2000], 91, '1991-2015'),
('Kaká','Brésil', array['CAM'], array[2000,2010], 92, '2001-2017'),
('Neymar','Brésil', array['LW','ST'], array[2010,2020], 94, '2009-'),
('Casemiro','Brésil', array['CDM'], array[2010,2020], 89, '2010-'),
('Marcelo','Brésil', array['LB'], array[2010,2020], 88, '2006-'),
('Thiago Silva','Brésil', array['CB'], array[2010,2020], 89, '2004-'),
('Taffarel','Brésil', array['GK'], array[1990], 86, '1985-2001'),
('Dida','Brésil', array['GK'], array[2000], 85, '1995-2015'),
('Alisson Becker','Brésil', array['GK'], array[2010,2020], 89, '2013-'),
('Vinícius Júnior','Brésil', array['LW'], array[2020], 90, '2018-'),
('Aldair','Brésil', array['CB'], array[1990,2000], 87, '1984-2003'),
('Lúcio','Brésil', array['CB'], array[2000,2010], 88, '1995-2012'),
('Dani Alves','Brésil', array['RB'], array[2000,2010,2020], 90, '2001-'),
('Maicon','Brésil', array['RB'], array[2000,2010], 86, '2001-2016'),
('Éder Militão','Brésil', array['CB'], array[2020], 85, '2017-'),
('Ederson','Brésil', array['GK'], array[2010,2020], 88, '2014-'),
('Gilberto Silva','Brésil', array['CDM'], array[2000,2010], 85, '1996-2013'),
('Raí','Brésil', array['CAM'], array[1980,1990], 86, '1985-2000'),
('Bebeto','Brésil', array['ST'], array[1990], 88, '1983-2004'),
('Adriano','Brésil', array['ST'], array[2000], 87, '2000-2016'),
-- ARGENTINE
('Diego Maradona','Argentine', array['CAM'], array[1980,1990], 97, '1976-1997'),
('Lionel Messi','Argentine', array['RW','CF'], array[2000,2010,2020], 97, '2004-'),
('Gabriel Batistuta','Argentine', array['ST'], array[1990,2000], 92, '1988-2005'),
('Juan Román Riquelme','Argentine', array['CAM'], array[2000], 89, '1996-2014'),
('Javier Zanetti','Argentine', array['RB'], array[1990,2000,2010], 88, '1993-2014'),
('Ángel Di María','Argentine', array['RW'], array[2010,2020], 88, '2005-'),
('Sergio Agüero','Argentine', array['ST'], array[2010,2020], 90, '2003-2021'),
('Javier Mascherano','Argentine', array['CDM','CB'], array[2000,2010], 87, '2001-2020'),
('Fernando Redondo','Argentine', array['CDM'], array[1990], 89, '1985-2004'),
('Hernán Crespo','Argentine', array['ST'], array[2000], 88, '1993-2012'),
('Emiliano Martínez','Argentine', array['GK'], array[2020], 87, '2009-'),
('Daniel Passarella','Argentine', array['CB'], array[1970,1980], 90, '1974-1989'),
('Oscar Ruggeri','Argentine', array['CB'], array[1980,1990], 86, '1979-1997'),
('Roberto Ayala','Argentine', array['CB'], array[1990,2000], 87, '1990-2007'),
('Walter Samuel','Argentine', array['CB'], array[2000,2010], 86, '1996-2014'),
('Nicolás Otamendi','Argentine', array['CB'], array[2010,2020], 84, '2007-'),
('Marcos Rojo','Argentine', array['CB','LB'], array[2010,2020], 82, '2008-'),
('Ubaldo Fillol','Argentine', array['GK'], array[1970,1980], 86, '1968-1988'),
('Sergio Goycochea','Argentine', array['GK'], array[1990], 84, '1985-1999'),
-- ALLEMAGNE
('Franz Beckenbauer','Allemagne', array['CB'], array[1970,1980], 94, '1964-1983'),
('Lothar Matthäus','Allemagne', array['CM'], array[1980,1990], 93, '1979-2000'),
('Jürgen Klinsmann','Allemagne', array['ST'], array[1990], 90, '1981-1998'),
('Oliver Kahn','Allemagne', array['GK'], array[1990,2000], 92, '1987-2008'),
('Michael Ballack','Allemagne', array['CM'], array[2000], 90, '1995-2012'),
('Philipp Lahm','Allemagne', array['RB','LB'], array[2000,2010], 90, '2002-2017'),
('Bastian Schweinsteiger','Allemagne', array['CM'], array[2000,2010], 88, '2002-2019'),
('Miroslav Klose','Allemagne', array['ST'], array[2000,2010], 88, '1998-2016'),
('Manuel Neuer','Allemagne', array['GK'], array[2010,2020], 92, '2006-'),
('Toni Kroos','Allemagne', array['CM'], array[2010,2020], 90, '2007-2024'),
('Thomas Müller','Allemagne', array['CAM','ST'], array[2010,2020], 88, '2008-'),
('Andreas Brehme','Allemagne', array['LB'], array[1980,1990], 88, '1978-1998'),
('Paul Breitner','Allemagne', array['LB','CB'], array[1970,1980], 89, '1970-1983'),
('Jürgen Kohler','Allemagne', array['CB'], array[1990], 87, '1983-2000'),
('Matthias Sammer','Allemagne', array['CB','CDM'], array[1990], 88, '1985-1999'),
('Mats Hummels','Allemagne', array['CB'], array[2010,2020], 87, '2006-'),
('Jérôme Boateng','Allemagne', array['CB'], array[2010,2020], 86, '2007-'),
('Joshua Kimmich','Allemagne', array['RB','CM'], array[2010,2020], 88, '2013-'),
('Antonio Rüdiger','Allemagne', array['CB'], array[2010,2020], 85, '2011-'),
('Sepp Maier','Allemagne', array['GK'], array[1970,1980], 90, '1962-1979'),
-- ANGLETERRE
('Bobby Moore','Angleterre', array['CB'], array[1970], 90, '1958-1977'),
('Gary Lineker','Angleterre', array['ST'], array[1980], 89, '1978-1994'),
('Paul Gascoigne','Angleterre', array['CAM'], array[1990], 88, '1984-2004'),
('Alan Shearer','Angleterre', array['ST'], array[1990,2000], 91, '1988-2006'),
('David Beckham','Angleterre', array['RM','RW'], array[1990,2000], 89, '1992-2013'),
('Steven Gerrard','Angleterre', array['CM'], array[2000,2010], 90, '1998-2016'),
('Frank Lampard','Angleterre', array['CM'], array[2000,2010], 89, '1995-2015'),
('Rio Ferdinand','Angleterre', array['CB'], array[2000,2010], 88, '1996-2015'),
('John Terry','Angleterre', array['CB'], array[2000,2010], 88, '1998-2018'),
('Wayne Rooney','Angleterre', array['ST','CAM'], array[2000,2010], 89, '2002-2018'),
('Harry Kane','Angleterre', array['ST'], array[2010,2020], 91, '2011-'),
('Raheem Sterling','Angleterre', array['LW','RW'], array[2010,2020], 87, '2010-'),
('Jordan Pickford','Angleterre', array['GK'], array[2020], 84, '2011-'),
('Peter Shilton','Angleterre', array['GK'], array[1970,1980,1990], 89, '1966-1997'),
('David Seaman','Angleterre', array['GK'], array[1990], 86, '1982-2004'),
('Ashley Cole','Angleterre', array['LB'], array[2000,2010], 88, '1999-2019'),
('Gary Neville','Angleterre', array['RB'], array[1990,2000], 85, '1992-2011'),
('Sol Campbell','Angleterre', array['CB'], array[1990,2000], 86, '1992-2011'),
('Kyle Walker','Angleterre', array['RB'], array[2010,2020], 85, '2007-'),
('Declan Rice','Angleterre', array['CDM'], array[2020], 86, '2017-'),
('Jude Bellingham','Angleterre', array['CM','CAM'], array[2020], 90, '2019-'),
('Marcus Rashford','Angleterre', array['LW'], array[2020], 84, '2016-'),
('Bukayo Saka','Angleterre', array['RW'], array[2020], 86, '2018-'),
-- ITALIE
('Paolo Maldini','Italie', array['CB','LB'], array[1990,2000], 93, '1984-2009'),
('Franco Baresi','Italie', array['CB'], array[1980,1990], 92, '1977-1997'),
('Roberto Baggio','Italie', array['CAM'], array[1990], 91, '1982-2004'),
('Alessandro Del Piero','Italie', array['ST','CAM'], array[1990,2000], 90, '1991-2014'),
('Francesco Totti','Italie', array['CAM','ST'], array[2000,2010], 91, '1992-2017'),
('Andrea Pirlo','Italie', array['CM'], array[2000,2010], 91, '1994-2017'),
('Gianluigi Buffon','Italie', array['GK'], array[2000,2010,2020], 93, '1995-2021'),
('Fabio Cannavaro','Italie', array['CB'], array[2000], 90, '1992-2011'),
('Andrea Barzagli','Italie', array['CB'], array[2010], 85, '1999-2017'),
('Giorgio Chiellini','Italie', array['CB'], array[2010,2020], 88, '2000-2023'),
('Dino Zoff','Italie', array['GK'], array[1970,1980], 90, '1961-1983'),
('Walter Zenga','Italie', array['GK'], array[1980,1990], 85, '1979-1996'),
('Alessandro Nesta','Italie', array['CB'], array[1990,2000], 91, '1993-2012'),
('Gaetano Scirea','Italie', array['CB'], array[1970,1980], 88, '1972-1988'),
('Christian Vieri','Italie', array['ST'], array[1990,2000], 89, '1991-2009'),
('Leonardo Bonucci','Italie', array['CB'], array[2010,2020], 87, '2005-'),
('Marco Verratti','Italie', array['CM'], array[2010,2020], 87, '2008-'),
('Gianluigi Donnarumma','Italie', array['GK'], array[2020], 87, '2015-'),
-- ESPAGNE
('Andrés Iniesta','Espagne', array['CAM','CM'], array[2000,2010], 92, '2002-2018'),
('Xavi','Espagne', array['CM'], array[2000,2010], 92, '1998-2015'),
('Iker Casillas','Espagne', array['GK'], array[2000,2010], 91, '1999-2020'),
('Sergio Ramos','Espagne', array['CB'], array[2000,2010,2020], 91, '2004-'),
('David Villa','Espagne', array['ST'], array[2000,2010], 89, '2001-2019'),
('Fernando Torres','Espagne', array['ST'], array[2000,2010], 88, '2001-2018'),
('Gerard Piqué','Espagne', array['CB'], array[2000,2010,2020], 87, '2004-2022'),
('Sergio Busquets','Espagne', array['CDM'], array[2010,2020], 87, '2008-'),
('Raúl González','Espagne', array['ST'], array[1990,2000], 90, '1994-2015'),
('Carles Puyol','Espagne', array['CB'], array[2000,2010], 90, '1999-2014'),
('José Antonio Camacho','Espagne', array['LB'], array[1980], 85, '1973-1989'),
('Míchel','Espagne', array['CAM'], array[1980,1990], 86, '1982-1998'),
('Emilio Butragueño','Espagne', array['ST'], array[1980], 87, '1983-1995'),
('Andoni Zubizarreta','Espagne', array['GK'], array[1980,1990], 86, '1981-1998'),
('Xabi Alonso','Espagne', array['CM'], array[2000,2010], 90, '1999-2017'),
('Dani Carvajal','Espagne', array['RB'], array[2010,2020], 85, '2010-'),
('Jordi Alba','Espagne', array['LB'], array[2010,2020], 86, '2009-'),
('Pedri','Espagne', array['CM'], array[2020], 87, '2019-'),
('Unai Simón','Espagne', array['GK'], array[2020], 83, '2017-'),
-- PORTUGAL
('Eusébio','Portugal', array['ST'], array[1970], 92, '1957-1979'),
('Luís Figo','Portugal', array['RW'], array[1990,2000], 91, '1989-2009'),
('Cristiano Ronaldo','Portugal', array['RW','ST'], array[2000,2010,2020], 97, '2002-'),
('Rui Costa','Portugal', array['CAM'], array[1990,2000], 89, '1990-2008'),
('Pepe','Portugal', array['CB'], array[2000,2010,2020], 86, '2001-'),
('Bruno Fernandes','Portugal', array['CAM'], array[2020], 87, '2012-'),
('Bernardo Silva','Portugal', array['CAM','RW'], array[2010,2020], 87, '2012-'),
('Fernando Couto','Portugal', array['CB'], array[1990,2000], 86, '1988-2006'),
('Vítor Baía','Portugal', array['GK'], array[1990,2000], 87, '1987-2007'),
('Nuno Gomes','Portugal', array['ST'], array[2000], 85, '1994-2013'),
('Ricardo Carvalho','Portugal', array['CB'], array[2000,2010], 87, '1997-2018'),
('João Cancelo','Portugal', array['RB','LB'], array[2010,2020], 86, '2012-'),
('Rúben Dias','Portugal', array['CB'], array[2020], 88, '2017-'),
('Diogo Costa','Portugal', array['GK'], array[2020], 84, '2019-'),
-- PAYS-BAS
('Johan Cruyff','Pays-Bas', array['CF','CAM'], array[1970,1980], 96, '1964-1984'),
('Marco van Basten','Pays-Bas', array['ST'], array[1980,1990], 93, '1981-1995'),
('Ruud Gullit','Pays-Bas', array['CAM','ST'], array[1980,1990], 92, '1978-1998'),
('Dennis Bergkamp','Pays-Bas', array['CF','CAM'], array[1990,2000], 91, '1986-2006'),
('Clarence Seedorf','Pays-Bas', array['CM'], array[1990,2000,2010], 88, '1992-2014'),
('Edwin van der Sar','Pays-Bas', array['GK'], array[1990,2000,2010], 90, '1990-2011'),
('Robin van Persie','Pays-Bas', array['ST'], array[2000,2010], 89, '2001-2019'),
('Arjen Robben','Pays-Bas', array['RW'], array[2000,2010], 90, '2000-2021'),
('Virgil van Dijk','Pays-Bas', array['CB'], array[2010,2020], 90, '2011-'),
('Frank Rijkaard','Pays-Bas', array['CDM','CB'], array[1980,1990], 90, '1980-1995'),
('Ronald Koeman','Pays-Bas', array['CB'], array[1980,1990], 88, '1979-1997'),
('Jaap Stam','Pays-Bas', array['CB'], array[1990,2000], 90, '1992-2007'),
('Giovanni van Bronckhorst','Pays-Bas', array['LB'], array[1990,2000,2010], 85, '1993-2010'),
('Wesley Sneijder','Pays-Bas', array['CAM'], array[2000,2010], 89, '2002-2017'),
('Nigel de Jong','Pays-Bas', array['CDM'], array[2000,2010], 84, '2002-2019'),
('Matthijs de Ligt','Pays-Bas', array['CB'], array[2020], 86, '2016-'),
-- BELGIQUE
('Kevin De Bruyne','Belgique', array['CAM','CM'], array[2010,2020], 92, '2008-'),
('Eden Hazard','Belgique', array['LW'], array[2010,2020], 90, '2007-2023'),
('Romelu Lukaku','Belgique', array['ST'], array[2010,2020], 87, '2009-'),
('Thibaut Courtois','Belgique', array['GK'], array[2010,2020], 90, '2009-'),
('Vincent Kompany','Belgique', array['CB'], array[2010], 86, '2003-2020'),
('Jan Ceulemans','Belgique', array['ST','CAM'], array[1980], 85, '1975-1992'),
('Enzo Scifo','Belgique', array['CAM'], array[1980,1990], 87, '1982-2002'),
('Toby Alderweireld','Belgique', array['CB'], array[2010,2020], 85, '2007-'),
('Jan Vertonghen','Belgique', array['CB'], array[2010,2020], 85, '2006-'),
('Youri Tielemans','Belgique', array['CM'], array[2020], 84, '2013-'),
('Axel Witsel','Belgique', array['CDM'], array[2010,2020], 85, '2006-'),
('Thomas Meunier','Belgique', array['RB'], array[2010,2020], 82, '2012-'),
('Yannick Carrasco','Belgique', array['LW'], array[2010,2020], 83, '2013-'),
-- AILIERS / LATÉRAUX SUPPLÉMENTAIRES (postes les plus rares)
('Robert Pirès','France', array['LM','LW'], array[1990,2000], 88, '1993-2011'),
('Kingsley Coman','France', array['LW'], array[2010,2020], 85, '2013-'),
('Ousmane Dembélé','France', array['RW'], array[2010,2020], 84, '2015-'),
('Bacary Sagna','France', array['RB'], array[2000,2010], 83, '2002-2018'),
('John Barnes','Angleterre', array['LW','LM'], array[1980,1990], 85, '1981-1999'),
('Chris Waddle','Angleterre', array['RW','RM'], array[1980,1990], 84, '1980-2000'),
('Jack Grealish','Angleterre', array['LW'], array[2020], 83, '2013-'),
('Phil Foden','Angleterre', array['RW','CAM'], array[2020], 86, '2017-'),
('Leighton Baines','Angleterre', array['LB'], array[2010], 82, '2000-2020'),
('Kieran Trippier','Angleterre', array['RB'], array[2010,2020], 83, '2004-'),
('Douglas Costa','Brésil', array['RW'], array[2010], 84, '2007-'),
('Willian','Brésil', array['RW'], array[2010,2020], 83, '2007-'),
('Danilo','Brésil', array['RB'], array[2010,2020], 83, '2011-'),
('Patrick Kluivert','Pays-Bas', array['ST'], array[1990,2000], 88, '1994-2008'),
('Memphis Depay','Pays-Bas', array['LW','ST'], array[2010,2020], 85, '2011-'),
('Denzel Dumfries','Pays-Bas', array['RB'], array[2020], 83, '2016-'),
('Michael Reiziger','Pays-Bas', array['RB'], array[1990,2000], 82, '1990-2007'),
('Serge Gnabry','Allemagne', array['RW'], array[2010,2020], 85, '2011-'),
('Leroy Sané','Allemagne', array['LW'], array[2010,2020], 85, '2011-'),
('Jonas Hector','Allemagne', array['LB'], array[2010], 81, '2010-2021'),
('Federico Chiesa','Italie', array['RW'], array[2010,2020], 85, '2016-'),
('Lorenzo Insigne','Italie', array['LW'], array[2010,2020], 84, '2009-'),
('Fabio Grosso','Italie', array['LB'], array[2000], 82, '1997-2012'),
('Gianluca Zambrotta','Italie', array['RB','LB'], array[1990,2000], 85, '1993-2010'),
('Jesús Navas','Espagne', array['RW'], array[2000,2010], 82, '2003-2022'),
('Pedro Rodríguez','Espagne', array['RW'], array[2010], 84, '2007-'),
('Ferran Torres','Espagne', array['RW'], array[2020], 82, '2017-'),
('Álvaro Arbeloa','Espagne', array['RB'], array[2000,2010], 81, '2002-2017'),
('Ricardo Quaresma','Portugal', array['RW'], array[2000,2010], 83, '1999-2020'),
('Nani','Portugal', array['RW','LW'], array[2000,2010], 84, '2005-2021'),
('Rafael Leão','Portugal', array['LW'], array[2020], 85, '2018-'),
('Miguel','Portugal', array['RB'], array[2000,2010], 81, '2000-2013'),
('Gabriel Heinze','Argentine', array['LB'], array[2000], 84, '1995-2013'),
('Ezequiel Lavezzi','Argentine', array['LW'], array[2010], 83, '2004-2018')
on conflict (name, nationality) do nothing;

-- =========================================================
-- RÉSULTATS ULTIMATE ELEVEN
-- =========================================================

create table if not exists public.ultimate_eleven_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  formation text not null,
  score numeric not null,
  team jsonb not null,
  created_at timestamptz default now()
);

alter table public.ultimate_eleven_results enable row level security;

drop policy if exists "UE results viewable by everyone" on public.ultimate_eleven_results;
create policy "UE results viewable by everyone"
on public.ultimate_eleven_results for select using (true);

drop policy if exists "Users can insert their own UE result" on public.ultimate_eleven_results;
create policy "Users can insert their own UE result"
on public.ultimate_eleven_results for insert
with check (auth.uid() = user_id);

-- =========================================================
-- ELO — conversion de performance (pas de duel direct en solo)
-- =========================================================

create or replace function public.handle_ultimate_eleven_result()
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
  select id into v_game_id from public.games where code = 'ultimate_eleven';

  select
    (count(*) filter (where score <= new.score))::numeric
    / greatest(count(*), 1)::numeric * 100
  into v_percentile
  from public.ultimate_eleven_results;

  -- Delta = moyenne d'un delta "relatif aux autres joueurs" (percentile) et
  -- d'un delta "absolu" ancré sur le score lui-même. Le percentile seul n'a
  -- de sens qu'avec beaucoup de résultats en base ; tant que peu de monde a
  -- joué, un score correct ne doit pas rafler l'ELO max juste parce qu'il n'a
  -- presque rien à battre. Repère neutre ~880 (note ~86 sans grosse cohésion),
  -- à réajuster une fois de vraies parties enregistrées.
  v_percentile_delta := round((v_percentile - 50) / 100 * 30); -- -15..+15
  v_absolute_delta := round(least(15, greatest(-15, (new.score - 880) / 150.0 * 15)));
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

drop trigger if exists on_ultimate_eleven_result_created on public.ultimate_eleven_results;

create trigger on_ultimate_eleven_result_created
after insert on public.ultimate_eleven_results
for each row
execute procedure public.handle_ultimate_eleven_result();

-- =========================================================
-- DONE — colle ce fichier dans le SQL Editor Supabase puis "Run"
-- =========================================================
