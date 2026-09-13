export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-4';

export interface Slot {
  key: string; // identifiant unique dans la formation, ex: "CB1"
  label: string; // affiché au joueur, ex: "Défenseur central"
  accepts: string[]; // postes réels compatibles
}

export const FORMATIONS: Record<Formation, Slot[]> = {
  '4-4-2': [
    { key: 'GK', label: 'Gardien', accepts: ['GK'] },
    { key: 'RB', label: 'Arrière droit', accepts: ['RB'] },
    { key: 'CB1', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'CB2', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'LB', label: 'Arrière gauche', accepts: ['LB'] },
    { key: 'RM', label: 'Milieu droit', accepts: ['RM', 'RW'] },
    { key: 'CM1', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM2', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'LM', label: 'Milieu gauche', accepts: ['LM', 'LW'] },
    { key: 'ST1', label: 'Attaquant', accepts: ['ST', 'CF'] },
    { key: 'ST2', label: 'Attaquant', accepts: ['ST', 'CF'] }
  ],
  '4-3-3': [
    { key: 'GK', label: 'Gardien', accepts: ['GK'] },
    { key: 'RB', label: 'Arrière droit', accepts: ['RB'] },
    { key: 'CB1', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'CB2', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'LB', label: 'Arrière gauche', accepts: ['LB'] },
    { key: 'CM1', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM2', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM3', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'RW', label: 'Ailier droit', accepts: ['RW', 'RM'] },
    { key: 'ST', label: 'Attaquant', accepts: ['ST', 'CF'] },
    { key: 'LW', label: 'Ailier gauche', accepts: ['LW', 'LM'] }
  ],
  '3-5-2': [
    { key: 'GK', label: 'Gardien', accepts: ['GK'] },
    { key: 'CB1', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'CB2', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'CB3', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'RM', label: 'Milieu droit', accepts: ['RM', 'RW'] },
    { key: 'CM1', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM2', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM3', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'LM', label: 'Milieu gauche', accepts: ['LM', 'LW'] },
    { key: 'ST1', label: 'Attaquant', accepts: ['ST', 'CF'] },
    { key: 'ST2', label: 'Attaquant', accepts: ['ST', 'CF'] }
  ],
  '4-2-4': [
    { key: 'GK', label: 'Gardien', accepts: ['GK'] },
    { key: 'RB', label: 'Arrière droit', accepts: ['RB'] },
    { key: 'CB1', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'CB2', label: 'Défenseur central', accepts: ['CB'] },
    { key: 'LB', label: 'Arrière gauche', accepts: ['LB'] },
    { key: 'CM1', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'CM2', label: 'Milieu central', accepts: ['CM', 'CDM', 'CAM'] },
    { key: 'RW', label: 'Ailier droit', accepts: ['RW', 'RM'] },
    { key: 'ST1', label: 'Attaquant', accepts: ['ST', 'CF'] },
    { key: 'ST2', label: 'Attaquant', accepts: ['ST', 'CF'] },
    { key: 'LW', label: 'Ailier gauche', accepts: ['LW', 'LM'] }
  ]
};

export const COUNTRIES = [
  'France',
  'Brésil',
  'Argentine',
  'Allemagne',
  'Angleterre',
  'Italie',
  'Espagne',
  'Portugal',
  'Pays-Bas',
  'Belgique'
];

export const DECADES = [1970, 1980, 1990, 2000, 2010, 2020];

// Position de chaque poste sur le terrain (en % de largeur/hauteur), pour
// l'affichage façon "composition d'équipe". Gardien en bas, attaquants en
// haut, comme les compositions habituelles à la télé.
export const PITCH_LAYOUT: Record<Formation, Record<string, { x: number; y: number }>> = {
  '4-3-3': {
    GK: { x: 50, y: 92 },
    RB: { x: 84, y: 73 },
    CB1: { x: 61, y: 78 },
    CB2: { x: 39, y: 78 },
    LB: { x: 16, y: 73 },
    CM1: { x: 30, y: 50 },
    CM2: { x: 50, y: 55 },
    CM3: { x: 70, y: 50 },
    RW: { x: 84, y: 22 },
    ST: { x: 50, y: 14 },
    LW: { x: 16, y: 22 }
  },
  '4-4-2': {
    GK: { x: 50, y: 92 },
    RB: { x: 84, y: 73 },
    CB1: { x: 61, y: 78 },
    CB2: { x: 39, y: 78 },
    LB: { x: 16, y: 73 },
    RM: { x: 84, y: 48 },
    CM1: { x: 60, y: 51 },
    CM2: { x: 40, y: 51 },
    LM: { x: 16, y: 48 },
    ST1: { x: 38, y: 14 },
    ST2: { x: 62, y: 14 }
  },
  '3-5-2': {
    GK: { x: 50, y: 92 },
    CB1: { x: 66, y: 78 },
    CB2: { x: 50, y: 81 },
    CB3: { x: 34, y: 78 },
    RM: { x: 88, y: 50 },
    CM1: { x: 64, y: 54 },
    CM2: { x: 50, y: 58 },
    CM3: { x: 36, y: 54 },
    LM: { x: 12, y: 50 },
    ST1: { x: 38, y: 15 },
    ST2: { x: 62, y: 15 }
  },
  '4-2-4': {
    GK: { x: 50, y: 92 },
    RB: { x: 84, y: 73 },
    CB1: { x: 61, y: 78 },
    CB2: { x: 39, y: 78 },
    LB: { x: 16, y: 73 },
    CM1: { x: 62, y: 52 },
    CM2: { x: 38, y: 52 },
    RW: { x: 84, y: 20 },
    ST1: { x: 62, y: 13 },
    ST2: { x: 38, y: 13 },
    LW: { x: 16, y: 20 }
  }
};

export function rollCountryAndDecade() {
  return {
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    decade: DECADES[Math.floor(Math.random() * DECADES.length)]
  };
}

export interface PlayerOption {
  id: string;
  name: string;
  nationality: string;
  positions: string[];
  decades: number[];
  rating: number;
  active_years: string | null;
}

// Calcule le score final : note moyenne (x10) + bonus de cohésion.
// La cohésion récompense une équipe qui a du sens (mêmes nations, mêmes
// époques qui se recoupent) plutôt qu'un simple all-star random.
export function computeTeamScore(players: PlayerOption[]) {
  const n = players.length;
  const avgRating = players.reduce((sum, p) => sum + p.rating, 0) / n;

  let sameNationPairs = 0;
  let sameDecadePairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (players[i].nationality === players[j].nationality) sameNationPairs++;
      if (players[i].decades.some((d) => players[j].decades.includes(d))) sameDecadePairs++;
    }
  }

  const cohesionBonus = Math.min(60, sameNationPairs * 3 + sameDecadePairs * 1);
  const score = Math.round(avgRating * 10 + cohesionBonus);

  return { score, avgRating: Math.round(avgRating * 10) / 10, cohesionBonus };
}
