// =========================================================
// LSOR-SPORT — 82-0 (basket)
// =========================================================
// Même principe qu'Ultimate Eleven (tirage franchise+décennie, draft de
// vrais joueurs par poste), mais la note finale n'est pas une moyenne : on
// simule une saison NBA de 82 matchs à partir des stats réelles cumulées de
// l'équipe, pour voir si tu peux finir invaincu (82-0), comme le vrai jeu
// 82-0.com.
//
// La formule exacte du vrai jeu est propriétaire et inconnue. On reproduit
// ici l'esprit documenté (poids points ~46% / rebonds ~25% / passes ~18% /
// interceptions ~7% / contres ~4%, courbe non-linéaire à rendements
// décroissants) avec nos propres repères, calibrés pour qu'une équipe
// "moyenne" (repère ~50/100) tourne autour de 41 victoires (saison .500).
// Simplification assumée : pas d'ajustement par époque (un 30 pts/match
// des années 60 compte comme un 30 pts/match des années 2020).
// =========================================================

export const TEAMS = [
  'ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW',
  'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK',
  'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'
];

export const DECADES = [1960, 1970, 1980, 1990, 2000, 2010, 2020];

export type NbaPosition = 'PG' | 'SG' | 'SF' | 'PF' | 'C';

export interface RosterSlot {
  key: NbaPosition;
  label: string;
}

export const ROSTER_SLOTS: RosterSlot[] = [
  { key: 'PG', label: 'Meneur' },
  { key: 'SG', label: 'Arrière' },
  { key: 'SF', label: 'Ailier' },
  { key: 'PF', label: 'Ailier fort' },
  { key: 'C', label: 'Pivot' }
];

export function rollTeamAndDecade() {
  return {
    team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
    decade: DECADES[Math.floor(Math.random() * DECADES.length)]
  };
}

export interface NbaPlayerOption {
  id: string;
  name: string;
  team: string;
  positions: NbaPosition[];
  decades: number[];
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  active_years: string | null;
}

// -------- Repères de calibration (voir le disclaimer en tête de fichier) --------
const BENCH_PPG = 100; // 5 titulaires combinant 100 pts/match = repère "grand cinq offensif"
const BENCH_RPG = 45;
const BENCH_APG = 35;
const BENCH_SPG = 8;
const BENCH_BPG = 8;

const WEIGHT_PPG = 0.46;
const WEIGHT_RPG = 0.25;
const WEIGHT_APG = 0.18;
const WEIGHT_SPG = 0.07;
const WEIGHT_BPG = 0.04;

const OVR_AVERAGE = 50; // OVR d'une équipe "moyenne" (repère, pas un plafond : une équipe de légendes peut le dépasser largement)
const CURVE_STEEPNESS = 0.0635;

export interface SeasonResult {
  wins: number;
  losses: number;
  teamOVR: number;
  grade: string;
  gradeLabel: string;
  teamPPG: number;
  teamRPG: number;
  teamAPG: number;
  teamSPG: number;
  teamBPG: number;
}

export function simulateSeason(players: NbaPlayerOption[]): SeasonResult {
  const teamPPG = players.reduce((s, p) => s + p.ppg, 0);
  const teamRPG = players.reduce((s, p) => s + p.rpg, 0);
  const teamAPG = players.reduce((s, p) => s + p.apg, 0);
  const teamSPG = players.reduce((s, p) => s + p.spg, 0);
  const teamBPG = players.reduce((s, p) => s + p.bpg, 0);

  // Pas de plafond à 100 : une équipe vraiment exceptionnelle (plusieurs
  // saisons statistiques hors normes cumulées) peut dépasser le repère et
  // viser le tier S — comme dans la vraie vie, ça doit rester extrêmement rare.
  const teamOVR =
    (teamPPG / BENCH_PPG) * WEIGHT_PPG * 100 +
    (teamRPG / BENCH_RPG) * WEIGHT_RPG * 100 +
    (teamAPG / BENCH_APG) * WEIGHT_APG * 100 +
    (teamSPG / BENCH_SPG) * WEIGHT_SPG * 100 +
    (teamBPG / BENCH_BPG) * WEIGHT_BPG * 100;

  // Courbe sigmoïde : rendements décroissants près du sommet (chaque victoire
  // en plus est plus dure à obtenir quand l'équipe est déjà très forte).
  const sigmoid = 1 / (1 + Math.exp(-CURVE_STEEPNESS * (teamOVR - OVR_AVERAGE)));
  const wins = Math.max(0, Math.min(82, Math.round(82 * sigmoid)));
  const losses = 82 - wins;

  const { grade, label } = gradeForWins(wins);

  return {
    wins,
    losses,
    teamOVR: Math.round(teamOVR * 10) / 10,
    grade,
    gradeLabel: label,
    teamPPG: Math.round(teamPPG * 10) / 10,
    teamRPG: Math.round(teamRPG * 10) / 10,
    teamAPG: Math.round(teamAPG * 10) / 10,
    teamSPG: Math.round(teamSPG * 10) / 10,
    teamBPG: Math.round(teamBPG * 10) / 10
  };
}

function gradeForWins(wins: number): { grade: string; label: string } {
  if (wins >= 80) return { grade: 'S', label: 'PARFAIT' };
  if (wins >= 72) return { grade: 'A+', label: 'HISTORIQUE' };
  if (wins >= 62) return { grade: 'A', label: 'DYNASTIE' };
  if (wins >= 57) return { grade: 'B', label: 'PRÉTENDANT' };
  if (wins >= 50) return { grade: 'C', label: 'PLAYOFFS' };
  if (wins >= 40) return { grade: 'D', label: 'LOTERIE' };
  return { grade: 'F', label: 'TANKING' };
}
