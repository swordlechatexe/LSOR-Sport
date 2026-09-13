# LSOR-Sport

Vraie application (Next.js + TypeScript + Supabase), branchée sur ta base de données.

## Ce qui est fonctionnel dans cette version

- Comptes réels (inscription / connexion / déconnexion) via Supabase Auth
- Accueil, page Jeux, page Classement (général + par jeu), Calendrier IRL, Profil
- **Wordle jouable** de bout en bout : mot du jour, 6 essais, un seul essai par
  jour et par joueur, accents ignorés, résultat sauvegardé en base
- **Ultimate Eleven jouable** de bout en bout : choix de formation (4-4-2,
  4-3-3, 3-5-2, 4-2-4), tirage pays + décennie par round, choix libre du
  joueur ET du poste où l'aligner parmi les postes encore vides, score final
  (note moyenne + bonus de cohésion), résultat sauvegardé, terrain affiché
  façon composition TV
- **Pronos jouable** de bout en bout : un admin ajoute des matchs réels
  (football, NBA, NFL), tout le monde pronostique le vainqueur avant le
  coup d'envoi (verrouillage automatique côté base de données, pas
  seulement dans l'interface), bon pronostic = +12 ELO, faux = -8 ELO
- **Destiny Eleven jouable** de bout en bout : simulation de carrière
  (création du joueur, saisons avec évènements à choix, tiers de club
  Régional/D2/D1/Élite, sélection nationale, retraite 35-40 ans, note
  finale plafonnée à 97). Mode **solo** (ELO par percentile) et mode
  **duel 1v1** via un lien `?duel=<seed>` : les deux adversaires jouent
  le même destin de départ, seuls leurs choix les départagent.
- Calendrier des matchs IRL : visible par tous, création/résultat/suppression
  réservés aux admins
- ELO général + ELO par jeu, mis à jour automatiquement côté serveur (via des
  triggers PostgreSQL) après chaque partie — le navigateur ne peut pas
  modifier son propre ELO directement (sécurité)
- Les 4 autres jeux (Destiny Eleven, 82-0, Quiz, Pénalty 1v1) apparaissent
  dans la liste mais ne sont pas encore jouables — un jeu à la fois.

### Pronos — limite assumée : pas encore d'API sportive automatique

La conversation d'origine prévoyait une récupération automatique des vrais
matchs via une API sportive. Je n'ai pas pu construire ni tester cette
intégration depuis mon environnement (accès réseau restreint), donc pour
l'instant **un admin ajoute les matchs à la main** (adversaires + date/heure)
depuis la page Pronos, exactement comme pour le calendrier IRL. Tout le
reste (verrouillage automatique, ELO, résultats) est déjà bien réel et
fonctionnel. Brancher une vraie API (ex. API-Football pour le foot) sera
plus simple une fois le site en ligne sur Netlify, où le serveur aura un
vrai accès internet — on pourra le faire dans une prochaine étape si tu veux.

### Base de joueurs Ultimate Eleven

~234 vrais joueurs (vrai nom, vraie nationalité, vrai(s) poste(s)), répartis
sur 10 nations (France, Brésil, Argentine, Allemagne, Angleterre, Italie,
Espagne, Portugal, Pays-Bas, Belgique) et plusieurs décennies (1970 à 2020).
La "note" affichée est une estimation LSOR (comme dans n'importe quel jeu du
genre), pas une statistique officielle.

Le tirage pays/décennie reste tel que défini, mais la recherche de candidats
élargit automatiquement la fenêtre si trop peu de joueurs correspondent
exactement (décennie exacte → ±10 ans → ±20 ans → même pays toutes décennies
→ en dernier recours, meilleurs joueurs du poste toutes nations confondues) :
la partie ne se bloque donc jamais, et il y a toujours au moins 2 vrais
joueurs au choix. C'est un point de départ volontairement raisonnable plutôt
qu'une base de 600 000 joueurs — facile à enrichir plus tard avec d'autres
scripts `INSERT INTO players (...)` du même format que dans
`sql/005_ultimate_eleven.sql` (index unique sur nom+nationalité, donc
ré-exécuter le fichier est sans risque de doublons).



## 1. Base de données Supabase

Tu as déjà exécuté le premier script SQL. Il faut maintenant exécuter, dans
l'ordre, les fichiers du dossier `sql/` (SQL Editor → New query → coller →
Run) :

1. `sql/002_policies_and_ratings.sql` — obligatoire : ajoute les droits
   admin pour le calendrier + la mise à jour automatique de l'ELO
2. `sql/003_seed_wordle_today.sql` — optionnel mais conseillé pour tester
   le Wordle tout de suite
3. `sql/004_make_me_admin.sql` — **à exécuter après** avoir créé ton compte
   sur le site, en remplaçant l'email par le tien, pour devenir admin
4. `sql/005_ultimate_eleven.sql` — obligatoire pour jouer à Ultimate Eleven :
   crée la base de joueurs réels + la table de résultats + la mise à jour
   d'ELO du jeu
5. `sql/006_pronos_and_match_delete.sql` — obligatoire pour Pronos : crée
   les matchs/pronostics + la mise à jour d'ELO, et ajoute la suppression
   de match IRL pour les admins
6. `sql/007_destiny_eleven.sql` — obligatoire pour Destiny Eleven : crée la
   table des carrières + l'ELO (solo par percentile, duel 1v1 par seed
   partagée)

## 2. Variables d'environnement

Copie `.env.local.example` en `.env.local` et remplis avec les valeurs de
**Project Settings → API** dans Supabase :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Ce sont des clés **publiques**, sans danger à mettre dans le code.

## 3. Lancer en local (optionnel, pour tester avant de mettre en ligne)

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000

## 4. Mettre en ligne (GitHub + Netlify)

1. Crée un dépôt sur GitHub, pousse ce dossier dedans.
2. Sur Netlify : "Add new site" → "Import an existing project" → connecte
   ton GitHub → choisis le dépôt.
3. Netlify détecte automatiquement Next.js. Avant de déployer, ajoute dans
   **Site settings → Environment variables** les deux mêmes variables que
   dans `.env.local` (URL + anon key).
4. Déploie. Tu auras une URL du type `lsor-sport.netlify.app`.

## 5. À savoir / prochaines étapes

- **Confirmation d'email** : par défaut, Supabase demande de confirmer
  l'email avant de pouvoir se connecter. Pour un site entre potes, tu peux
  la désactiver dans **Authentication → Providers → Email → "Confirm
  email"** pour simplifier, ou la laisser activée si tu préfères.
- La formule d'ELO pour Wordle (+15 / -10, général = moyenne) est un point
  de départ simple, à ajuster librement dans
  `sql/002_policies_and_ratings.sql` (fonction `handle_wordle_result`).
- Chaque nouveau jeu (Ultimate Eleven, 82-0, Destiny Eleven, Pronos, Quiz,
  Pénalty 1v1) sera construit un par un, avec sa propre table de résultats
  et son propre trigger de mise à jour d'ELO, sur le même principe que
  Wordle.


## Nouveautés / administration

- `/admin` : gestion des utilisateurs, suppression de comptes non-admin, reset du classement général ou d'un jeu sans SQL.
- Le Quiz est temporairement désactivé via `sql/013_admin_controls.sql`.
- Pronos : synchronisation API-SPORTS automatique (Football, NBA, NFL) via une tâche planifiée Netlify, avec bouton de sync manuel pour l'admin.
- Wordle : un pool de mots issu de l'archive Wordle Global peut être importé automatiquement et le mot du jour est ensuite choisi côté serveur depuis ce pool.

### Nouvelles étapes SQL

8. `sql/013_admin_controls.sql`
9. `sql/014_pronos_api.sql`
10. `sql/015_wordle_archive.sql`

### Nouvelles variables serveur

```
SUPABASE_SERVICE_ROLE_KEY=...
API_SPORTS_KEY=...
CRON_SECRET=...
```

La clé `SUPABASE_SERVICE_ROLE_KEY` reste strictement côté serveur. Supabase exige une clé de privilège serveur pour supprimer un utilisateur et interdit de l'exposer dans le navigateur.
