// =========================================================
// LSOR-SPORT — DESTINY ELEVEN (logique de carrière v3)
// =========================================================
// Simulation narrative de carrière de footballeur (16 ans -> retraite),
// inspirée des mécaniques réelles de Destiny Eleven :
//  - création en 6 étapes (nationalité, poste, origine, adolescence,
//    entourage, club de départ), chacune avec de vrais effets ;
//  - forme + moral = ressources pilotables qui conditionnent la saison ;
//  - cote / valeur marchande ;
//  - temps de jeu réel (titulaire/rotation/remplaçant) ;
//  - mercato NON forcé : on reste par défaut, une offre arrive parfois ;
//  - beaucoup d'évènements filtrés par âge/statut/poste => parties uniques ;
//  - asymétrie risque/récompense (les choix risqués paient plus... ou cassent) ;
//  - note finale plafonnée à 97.
//
// Déterministe via une seed (mode 1v1 équitable).
// =========================================================

export type Position = 'GK' | 'DEF' | 'MID' | 'ATT';
export type Foot = 'Gauche' | 'Droit' | 'Ambidextre';
export type ClubTier = 'Régional' | 'D2' | 'D1' | 'Élite';
export type PlaytimeStatus = 'Titulaire' | 'Rotation' | 'Remplaçant';

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'GK', label: 'Gardien' },
  { value: 'DEF', label: 'Défenseur' },
  { value: 'MID', label: 'Milieu' },
  { value: 'ATT', label: 'Attaquant' }
];
export const FEET: Foot[] = ['Gauche', 'Droit', 'Ambidextre'];
export const NATIONS = [
  'France','Brésil','Argentine','Espagne','Allemagne',
  'Angleterre','Italie','Portugal','Belgique','Pays-Bas'
];

// Force de la sélection nationale : influence le plafond du palmarès international.
const NATION_STRENGTH: Record<string, number> = {
  'France': 0.95, 'Brésil': 0.95, 'Argentine': 0.92, 'Espagne': 0.9, 'Allemagne': 0.9,
  'Angleterre': 0.88, 'Italie': 0.85, 'Portugal': 0.83, 'Belgique': 0.78, 'Pays-Bas': 0.8
};

export const START_AGE = 16;
export const MIN_RETIRE_AGE = 35;
export const MAX_RETIRE_AGE = 40;
export const MAX_FINAL_SCORE = 97;

// Cycle de la Coupe du Monde (tous les 4 ans) : âges auxquels le tournoi a lieu.
export const WORLD_CUP_AGES = [18, 22, 26, 30, 34, 38];

// Nombre d'évènements récents à éviter de retirer immédiatement (variété).
const RECENT_EVENT_MEMORY = 4;

// -------- Étapes de création (au-delà de nationalité + poste) --------
export interface CreationStepOption {
  value: string;
  label: string;
  desc: string;
  overall?: number;
  potential?: number;
  reputation?: number;
  morale?: number;
  money?: number;
  wildness?: number; // tendance aux évènements "dérapage" (adolescence/entourage)
  offerQuality?: number; // qualité des offres de transfert (entourage)
}

export interface CreationStep {
  key: 'origin' | 'teenage' | 'entourage';
  title: string;
  options: CreationStepOption[];
}

export const CREATION_STEPS: CreationStep[] = [
  {
    key: 'origin',
    title: 'Origine',
    options: [
      { value: 'quartier', label: 'Quartier populaire', desc: 'Débrouille et mental d\u2019acier.', overall: 1, morale: 2, potential: 2 },
      { value: 'campagne', label: 'Petit club de campagne', desc: 'Bases techniques solides, discret.', overall: 2, potential: 1 },
      { value: 'academie', label: 'Académie renommée', desc: 'Formation d\u2019élite, déjà repéré.', overall: 3, reputation: 4, potential: 3 },
      { value: 'tardif', label: 'Révélation tardive', desc: 'Parti de loin, gros potentiel brut.', overall: -1, potential: 6 }
    ]
  },
  {
    key: 'teenage',
    title: 'Adolescence',
    options: [
      { value: 'serieux', label: 'Discipline exemplaire', desc: 'Travailleur, moral stable.', overall: 1, morale: 4 },
      { value: 'fetard', label: 'Talent fêtard', desc: 'Doué mais tête brûlée.', overall: 2, potential: 2, wildness: 0.5, morale: -2 },
      { value: 'studieux', label: 'Studieux, tête sur les épaules', desc: 'Réputation propre, peu de dérapages.', reputation: 3, morale: 2, wildness: -0.4 },
      { value: 'rebelle', label: 'Rebelle incompris', desc: 'Fort caractère, imprévisible.', overall: 1, reputation: -2, wildness: 0.6 }
    ]
  },
  {
    key: 'entourage',
    title: 'Entourage',
    options: [
      { value: 'agent_star', label: 'Agent star', desc: 'Grosses offres, négocie fort.', offerQuality: 0.5, money: 200 },
      { value: 'famille', label: 'Famille soudée', desc: 'Moral protégé, décisions saines.', morale: 5, wildness: -0.3 },
      { value: 'mentor', label: 'Ancien pro devenu mentor', desc: 'Progression accélérée jeune.', overall: 1, potential: 3 },
      { value: 'seul', label: 'Se débrouille seul', desc: 'Moins d\u2019offres, mais gros mental.', offerQuality: -0.3, morale: 3, potential: 2 }
    ]
  }
];

// -------- Clubs --------
const CLUB_NAMES: Record<ClubTier, string[]> = {
  'Régional': ['AS Villeneuve', 'FC Montclair', 'Olympique Rivage', 'US Bellecour', 'Étoile du Nord', 'Racing Coteaux'],
  'D2': ['Havreston FC', 'Real Sombra', 'AC Lumina', 'Sporting Baleares', 'Dynamo Verde', 'FC Ardoise'],
  'D1': ['Atlético Marena', 'FC Kaiserstadt', 'Racing Ferro', 'Norwich Athletic', 'AS Solaris', 'Leones FC'],
  'Élite': ['Real Corona', 'Milano United', 'Bayern Hohenberg', 'Paris Élysée', 'Manchester Crown', 'Ajax Amstel']
};
const TIER_BASE_WAGE: Record<ClubTier, number> = { 'Régional': 60, 'D2': 500, 'D1': 3500, 'Élite': 12000 };
const TIER_DIFFICULTY: Record<ClubTier, number> = { 'Régional': 0.85, 'D2': 1.0, 'D1': 1.18, 'Élite': 1.4 };
const TIER_STARTER_LEVEL: Record<ClubTier, number> = { 'Régional': 48, 'D2': 60, 'D1': 72, 'Élite': 82 };
const TIER_ORDER: ClubTier[] = ['Régional', 'D2', 'D1', 'Élite'];

export interface CreationChoice {
  name: string;
  position: Position;
  nation: string;
  foot: Foot;
  origin: string;
  teenage: string;
  entourage: string;
  startClubTier: ClubTier; // choix club de départ (Régional ou D2)
}

// -------- RNG déterministe --------
export function makeSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
function rng(seedRef: { s: number }): number {
  seedRef.s |= 0;
  seedRef.s = (seedRef.s + 0x6d2b79f5) | 0;
  let t = Math.imul(seedRef.s ^ (seedRef.s >>> 15), 1 | seedRef.s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export interface ClubOffer {
  name: string;
  tier: ClubTier;
  wage: number;
  expectedStatus: PlaytimeStatus;
}

export function statusFor(overall: number, tier: ClubTier): PlaytimeStatus {
  const need = TIER_STARTER_LEVEL[tier];
  if (overall >= need + 1) return 'Titulaire';
  if (overall >= need - 7) return 'Rotation';
  return 'Remplaçant';
}
function wageFor(tier: ClubTier, overall: number, seedRef: { s: number }): number {
  const base = TIER_BASE_WAGE[tier];
  const levelFactor = 0.55 + (overall / 99) * 1.0;
  const noise = 0.85 + rng(seedRef) * 0.3;
  return Math.round((base * levelFactor * noise) / 10) * 10;
}
function pickClubName(tier: ClubTier, seedRef: { s: number }, avoid?: string): string {
  const pool = CLUB_NAMES[tier].filter((n) => n !== avoid);
  return pool[Math.floor(rng(seedRef) * pool.length)];
}

// Une offre arrive-t-elle cette saison ? Dépend de la cote (valeur marchande),
// de la stagnation, et de la qualité de l'entourage. PAS chaque année.
export function maybeGenerateOffer(state: CareerState, seedRef: { s: number }): ClubOffer | null {
  const repTier = tierFromReputation(state.reputation);
  const idx = TIER_ORDER.indexOf(repTier);
  const currentIdx = TIER_ORDER.indexOf(state.tier);

  // proba de base d'une offre : plus forte si tu "mérites" mieux que ton club actuel,
  // ou si ta valeur stagne, modulée par l'entourage.
  let p = 0.22 + state.offerQuality * 0.25;
  if (idx > currentIdx) p += 0.4; // tu surclasses ton club => on te veut plus haut
  if (state.seasonsSinceMove >= 3) p += 0.15; // fidélité récompensée par des sollicitations
  if (state.marketValue > state.lastOfferValue * 1.3) p += 0.2;
  p = Math.min(0.85, p);

  if (rng(seedRef) > p) return null;

  // tier de l'offre : le plus souvent au niveau de ta cote, parfois un cran au-dessus (pari).
  let offerTier = repTier;
  if (idx < TIER_ORDER.length - 1 && rng(seedRef) < 0.4 + state.offerQuality * 0.3) {
    offerTier = TIER_ORDER[idx + 1];
  }
  // on n'offre jamais un club en dessous de ton club actuel (sauf grosse chute de cote)
  if (TIER_ORDER.indexOf(offerTier) < currentIdx && rng(seedRef) > 0.3) {
    offerTier = state.tier;
  }

  return {
    name: pickClubName(offerTier, seedRef, state.club),
    tier: offerTier,
    wage: wageFor(offerTier, state.overall, seedRef),
    expectedStatus: statusFor(state.overall, offerTier)
  };
}

// -------- Évènements de saison (riches, filtrés par contexte) --------
export interface SeasonEventOption {
  label: string;
  overall?: number;
  reputation?: number;
  morale?: number;
  form?: number;
  money?: number;
  injuryRisk?: number;
  caps?: number;
  worldCup?: boolean; // déclenche la résolution du tournoi (voir playSeason)
  note: string;
}
export interface SeasonEvent {
  id: string;
  title: string;
  text: string;
  // filtre : renvoie true si l'évènement peut apparaître dans ce contexte
  when?: (s: CareerState) => boolean;
  weight?: number;
  // évènement calé sur une échéance réelle (ex : Coupe du Monde) : dès qu'il
  // est éligible, il prime sur le tirage pondéré au lieu de juste concourir.
  priority?: boolean;
  options: SeasonEventOption[];
}

const EVENT_POOL: SeasonEvent[] = [
  // --- généraux (poids réduit : les évènements thématiques doivent dominer) ---
  {
    id: 'training', title: 'Intersaison', text: 'Comment prépares-tu la saison ?',
    weight: 0.6,
    options: [
      { label: 'Prépa physique intensive', overall: 4, form: 10, morale: -4, injuryRisk: 0.22, note: 'Tu reviens costaud — si le corps tient.' },
      { label: 'Travail technique ciblé', overall: 3, note: 'Un gain net, sans danger.' },
      { label: 'Repos et récup', form: 15, morale: 8, note: 'Tu recharges les batteries.' }
    ]
  },
  {
    id: 'coach', title: 'Nouveau coach', text: 'Son système ne colle pas à ton profil.',
    weight: 0.6,
    options: [
      { label: "M'adapter à son système", overall: 3, morale: -3, note: 'Tu ravales ta frustration, ça finit par payer.' },
      { label: 'Imposer mon style', overall: -1, reputation: 5, morale: -6, note: 'Bras de fer risqué avec le staff.' }
    ]
  },
  {
    id: 'media', title: 'Contrat de sponsoring', text: 'Une marque te propose un deal lucratif mais prenant.',
    weight: 0.6,
    options: [
      { label: 'Accepter (grosse prime)', overall: -2, reputation: 6, money: 1500, morale: 2, note: 'Le compte gonfle, le jeu en pâtit un peu.' },
      { label: 'Refuser, rester focus', overall: 2, note: 'Tête baissée sur le terrain.' }
    ]
  },
  // --- jeunesse ---
  {
    id: 'debut', title: 'Première convocation en pro', text: 'Le coach te met sur le banc pour un match important.',
    when: (s) => s.age <= 19,
    options: [
      { label: 'Entrer sans trembler', overall: 3, reputation: 4, form: -5, injuryRisk: 0.1, note: 'Tu saisis ta chance à pleines mains.' },
      { label: 'Rester prudent, assurer', overall: 1, morale: 2, note: 'Tu ne brilles pas mais tu rassures.' }
    ]
  },
  {
    id: 'academy', title: 'Tournoi de jeunes', text: 'Un tournoi réputé attire les recruteurs.',
    when: (s) => s.age <= 20,
    options: [
      { label: 'Jouer perso pour briller', overall: 2, reputation: 5, morale: -2, note: 'Tu te montres, quitte à agacer le vestiaire.' },
      { label: 'Jouer collectif', overall: 3, morale: 3, note: 'Le staff apprécie ton intelligence de jeu.' }
    ]
  },
  {
    id: 'loan', title: 'Proposition de prêt', text: 'Tu joues peu : un club plus modeste veut te prêter.',
    when: (s) => s.age <= 23 && s.status !== 'Titulaire',
    options: [
      { label: 'Accepter le prêt (jouer !)', overall: 4, form: 10, reputation: 3, note: 'Du temps de jeu : exactement ce qu\u2019il te faut.' },
      { label: 'Rester et gratter des minutes', overall: 0, morale: -3, note: 'Tu ronges ton frein sur le banc.' }
    ]
  },
  // --- dérapages (selon wildness) ---
  {
    id: 'nightlife', title: 'Vie nocturne', text: 'Une soirée arrosée la veille d\u2019un match circule sur les réseaux.',
    when: (s) => s.wildness > 0.2,
    options: [
      { label: 'Assumer et faire la fête', reputation: -5, morale: 6, form: -10, injuryRisk: 0.15, note: 'Tu t\u2019amuses, l\u2019image en prend un coup.' },
      { label: 'Présenter des excuses publiques', reputation: 2, morale: -4, note: 'Tu limites la casse médiatique.' }
    ]
  },
  {
    id: 'clash', title: 'Clash avec un cadre', text: 'Une altercation éclate à l\u2019entraînement.',
    when: (s) => s.wildness > 0.3,
    options: [
      { label: 'Ne rien lâcher', reputation: -3, morale: -2, overall: 1, note: 'Le vestiaire est tendu mais tu t\u2019imposes.' },
      { label: 'Calmer le jeu', morale: 3, reputation: 2, note: 'Tu apaises et gagnes en maturité.' }
    ]
  },
  // --- confirmation / prime ---
  {
    id: 'captain', title: 'Brassard de capitaine', text: 'Le vestiaire te voit comme un leader.',
    when: (s) => s.age >= 24 && s.reputation >= 45,
    options: [
      { label: 'Prendre le brassard', reputation: 7, morale: 5, note: 'Tu deviens un cadre du club.' },
      { label: 'Rester focus sur mon jeu', overall: 3, note: 'Tu laisses le brassard mais tu brilles.' }
    ]
  },
  {
    id: 'bigmatch', title: 'Grand match couperet', text: 'Un match décisif pour un titre approche.',
    when: (s) => (s.tier === 'D1' || s.tier === 'Élite') && s.status === 'Titulaire',
    options: [
      { label: 'Prendre les responsabilités', overall: 1, reputation: 8, form: -8, injuryRisk: 0.12, note: 'Tu veux être l\u2019homme du match.' },
      { label: 'Jouer sobre et sérieux', reputation: 3, morale: 2, note: 'Tu fais le job proprement.' }
    ]
  },
  {
    id: 'call_up_first', title: 'Première convocation en sélection', text: 'Le sélectionneur national t\u2019appelle pour la première fois.',
    when: (s) => s.reputation >= 40 && s.capsNational === 0,
    options: [
      { label: 'Saisir ma chance à fond', reputation: 5, caps: 3, form: -5, note: 'Tu portes le maillot national pour la première fois.' },
      { label: 'Rester sur ses appuis, jouer sobre', reputation: 2, caps: 2, morale: 3, note: 'Premiers pas discrets mais solides en sélection.' }
    ]
  },
  {
    id: 'call_up_regular', title: 'Rassemblement national', text: 'Le sélectionneur te convoque à nouveau.',
    when: (s) => s.capsNational >= 1 && s.reputation >= 45,
    weight: 0.8,
    options: [
      { label: 'Répondre présent, encore et encore', caps: 3, reputation: 3, form: -4, note: 'Tu deviens un habitué du rassemblement.' },
      { label: 'Profiter de la trêve pour souffler', caps: 1, morale: 5, note: 'Tu ménages ton corps entre deux échéances.' }
    ]
  },
  {
    id: 'world_cup', title: 'Coupe du Monde', text: 'L\u2019échéance suprême approche : le sélectionneur doit boucler sa liste.',
    when: (s) => WORLD_CUP_AGES.includes(s.age) && s.capsNational >= 8 && s.reputation >= 45,
    priority: true,
    options: [
      { label: 'Se battre pour une place dans le groupe', overall: 1, form: -8, injuryRisk: 0.12, worldCup: true, note: 'Tu forces ta sélection pour le Mondial.' },
      { label: 'Laisser sa chance à un autre, penser à sa forme', morale: 4, note: 'Tu regardes le Mondial depuis ton canapé, frustré mais reposé.' }
    ]
  },
  {
    id: 'bench_rival', title: 'Concurrence directe', text: 'Un coéquipier à ton poste te chauffe la place à l\u2019entraînement.',
    when: (s) => s.status !== 'Titulaire',
    options: [
      { label: 'Hausser le ton à l\u2019entraînement', overall: 3, morale: -3, note: 'Le message est passé, la hiérarchie bouge.' },
      { label: 'Rester solidaire, patienter', morale: 4, note: 'Le vestiaire apprécie ton fair-play.' }
    ]
  },
  {
    id: 'transfer_rumours', title: 'Rumeurs de transfert', text: 'La presse t\u2019envoie déjà ailleurs pour l\u2019été prochain.',
    when: (s) => s.reputation >= 40 && s.seasonsSinceMove >= 2,
    options: [
      { label: 'Laisser courir les rumeurs', reputation: 4, morale: -3, note: 'Ça agace ton club, mais ta cote grimpe.' },
      { label: 'Démentir publiquement, rester focus', morale: 3, note: 'Tu coupes court, concentré sur le terrain.' }
    ]
  },
  {
    id: 'super_sub', title: 'Entrée décisive', text: 'Rentré en fin de match, tu changes la donne.',
    when: (s) => s.status !== 'Titulaire',
    options: [
      { label: 'Savourer ce moment', reputation: 4, morale: 6, note: 'Le banc t\u2019acclame, tu prouves ta valeur.' },
      { label: 'Retour au travail dès le lendemain', overall: 2, note: 'Tu transformes l\u2019essai en habitude.' }
    ]
  },
  {
    id: 'derby', title: 'Jour de derby', text: 'Le rival historique débarque, le stade est en feu.',
    when: (s) => s.tier === 'D1' || s.tier === 'Élite',
    options: [
      { label: 'Jouer avec le couteau entre les dents', reputation: 6, form: -8, injuryRisk: 0.15, note: 'Un match à part, tu t\u2019y donnes corps et âme.' },
      { label: 'Rester dans le match, éviter la faute', morale: 3, note: 'Discipline avant tout, le résultat compte plus que le geste.' }
    ]
  },
  {
    id: 'cup_upset', title: 'Coupe : piège à éviter', text: 'Un petit club rêve de l\u2019exploit face à toi.',
    when: (s) => s.status === 'Titulaire' && s.age >= 20,
    options: [
      { label: 'Prendre le match à ton compte', overall: 2, reputation: 4, form: -6, note: 'Tu évites l\u2019exploit à toi tout seul.' },
      { label: 'Jouer collectif, sans forcer', morale: 3, note: 'L\u2019équipe gère sans trembler.' }
    ]
  },
  {
    id: 'documentary', title: 'Proposition de documentaire', text: 'Une plateforme veut raconter ta vie en série.',
    when: (s) => s.reputation >= 60,
    options: [
      { label: 'Accepter, tout montrer', money: 2500, reputation: 3, morale: -4, note: 'Ta vie privée s\u2019étale à l\u2019écran.' },
      { label: 'Refuser, protéger ton intimité', morale: 4, note: 'Tu préserves ta tranquillité.' }
    ]
  },
  {
    id: 'contract_holdout', title: 'Bras de fer contractuel', text: 'Ton contrat arrive à échéance, tu veux être revalorisé.',
    when: (s) => s.seasonsSinceMove >= 3,
    options: [
      { label: 'Hausser le ton publiquement', reputation: -3, money: 1200, note: 'Le clash est médiatisé mais tu obtiens gain de cause.' },
      { label: 'Négocier discrètement', money: 400, morale: 3, note: 'Un accord trouvé sans esclandre.' }
    ]
  },
  {
    id: 'wonderkid_threat', title: 'La pépite pousse derrière', text: 'Un crack sorti du centre de formation menace ta place.',
    when: (s) => s.age >= 27 && s.status === 'Titulaire',
    options: [
      { label: 'Hausser ton niveau pour le repousser', overall: 3, form: -6, note: 'Tu rappelles qui commande.' },
      { label: 'Accepter de partager le temps de jeu', morale: 4, note: 'Tu deviens un mentor malgré toi.' }
    ]
  },
  {
    id: 'homecoming', title: 'Retour aux sources', text: 'Un match t\u2019amène tout près de ta ville natale.',
    when: (s) => s.age >= 25,
    options: [
      { label: 'Se surpasser devant les tiens', reputation: 5, form: -5, note: 'Un match que tes proches n\u2019oublieront pas.' },
      { label: 'Rester professionnel, un match comme un autre', morale: 2, note: 'Tu gères l\u2019émotion sans t\u2019éparpiller.' }
    ]
  },
  {
    id: 'fan_pressure', title: 'Le public s\u2019impatiente', text: 'Une méforme passagère agace les supporters.',
    when: (s) => s.form < 50,
    options: [
      { label: 'Répondre par le travail', overall: 2, morale: -2, note: 'Tu ravales ta fierté et bosses en silence.' },
      { label: 'Répondre en conférence de presse', reputation: -4, morale: 4, note: 'Le coup de gueule libère la pression, au risque de crisper le club.' }
    ]
  },
  {
    id: 'title_race', title: 'Sprint final pour le titre', text: 'Une fin de saison à couteaux tirés pour le titre.',
    when: (s) => (s.tier === 'D1' || s.tier === 'Élite') && s.status === 'Titulaire' && s.age >= 22,
    options: [
      { label: 'Jouer sur les nerfs jusqu\u2019au bout', reputation: 6, form: -10, injuryRisk: 0.15, note: 'Tu donnes tout dans le money-time.' },
      { label: 'Gérer l\u2019effort intelligemment', morale: 3, note: 'Tu doses tes efforts sur la durée.' }
    ]
  },
  {
    id: 'new_family', title: 'Devenir parent', text: 'Ta vie personnelle change du tout au tout.',
    when: (s) => s.age >= 24 && s.age <= 32,
    options: [
      { label: 'Prioriser la famille, lever un peu le pied', morale: 8, overall: -1, note: 'Un nouvel équilibre, plus serein.' },
      { label: 'Rester à fond sur le foot', overall: 2, morale: -3, note: 'La carrière avant tout, pour l\u2019instant.' }
    ]
  },
  {
    id: 'agent_move', title: 'Ton agent te pousse à l\u2019étranger', text: 'Un championnat exotique propose un pont d\u2019or.',
    when: (s) => s.age >= 26 && s.reputation >= 50,
    options: [
      { label: 'Suivre l\u2019argent', reputation: -6, money: 4000, morale: 2, note: 'Le jackpot financier, loin des projecteurs.' },
      { label: 'Rester au sommet', reputation: 3, note: 'Tu restes là où ça compte pour ta légende.' }
    ]
  },
  // --- fin de carrière ---
  {
    id: 'veteran', title: 'Rôle de vétéran', text: 'Ton club te propose un rôle de mentor pour les jeunes.',
    when: (s) => s.age >= 32,
    options: [
      { label: 'Accepter, transmettre', reputation: 4, morale: 5, note: 'Tu deviens une référence du vestiaire.' },
      { label: 'Rester ambitieux, jouer', overall: 1, form: -5, injuryRisk: 0.2, note: 'Tu refuses de lâcher ta place.' }
    ]
  },
  {
    id: 'lastdance', title: 'Dernier grand contrat', text: 'Une dernière offre alléchante à l\u2019étranger se présente.',
    when: (s) => s.age >= 33,
    options: [
      { label: 'Signer pour l\u2019argent', money: 3000, reputation: -2, note: 'Un dernier gros chèque avant la fin.' },
      { label: 'Finir en beauté chez moi', reputation: 4, morale: 6, note: 'Tu choisis la légende plutôt que le billet.' }
    ]
  },
  // --- blessure ---
  {
    id: 'niggle', title: 'Douleur avant un match clé', text: 'Tu traînes une gêne physique.',
    when: (s) => s.form < 60,
    options: [
      { label: 'Serrer les dents et jouer', reputation: 5, injuryRisk: 0.5, note: 'Courageux, mais très risqué.' },
      { label: 'Me soigner, faire l\u2019impasse', form: 15, morale: 3, reputation: -2, note: 'Prudence : tu reviens à 100 %.' }
    ]
  }
];

export function eventForSeason(state: CareerState, seedRef: { s: number }): SeasonEvent {
  const eligible = EVENT_POOL.filter((e) => !e.when || e.when(state));

  // Les évènements "priority" (Coupe du Monde...) sont calés sur une échéance
  // réelle : dès qu'ils sont éligibles, ils priment sur le tirage aléatoire.
  const priorityHits = eligible.filter((e) => e.priority);
  if (priorityHits.length > 0) return priorityHits[0];

  const base = eligible.length > 0 ? eligible : EVENT_POOL;
  // on évite de retirer un évènement déjà vu récemment (variété), sauf si ça vide le pool
  const fresh = base.filter((e) => !state.recentEventIds.includes(e.id));
  const pool = fresh.length > 0 ? fresh : base;

  const totalWeight = pool.reduce((sum, e) => sum + (e.weight ?? 1), 0);
  let r = rng(seedRef) * totalWeight;
  for (const e of pool) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return pool[pool.length - 1];
}

// Choisit le prochain évènement ET met à jour l'historique anti-répétition
// (à appeler à chaque fois qu'on affiche un nouvel évènement au joueur).
export function nextEvent(
  state: CareerState,
  seedRef: { s: number }
): { event: SeasonEvent; state: CareerState } {
  const event = eventForSeason(state, seedRef);
  const recentEventIds = [...state.recentEventIds, event.id].slice(-RECENT_EVENT_MEMORY);
  return { event, state: { ...state, recentEventIds } };
}

// -------- État de carrière --------
export interface CareerState {
  name: string;
  position: Position;
  nation: string;
  foot: Foot;
  age: number;
  overall: number;
  potential: number;
  reputation: number;
  morale: number;
  form: number; // 0..100
  club: string;
  tier: ClubTier;
  status: PlaytimeStatus;
  wage: number;
  money: number;
  marketValue: number; // valeur marchande (k€)
  lastOfferValue: number;
  seasonsSinceMove: number;
  wildness: number;
  offerQuality: number;
  capsNational: number;
  seasonsPlayed: number;
  trophies: number;
  intlTrophies: number;
  retired: boolean;
  log: string[];
  recentEventIds: string[]; // anti-répétition des évènements
}

export function tierFromReputation(rep: number): ClubTier {
  if (rep >= 78) return 'Élite';
  if (rep >= 54) return 'D1';
  if (rep >= 28) return 'D2';
  return 'Régional';
}

function marketValueFor(overall: number, age: number): number {
  const ageFactor = age <= 27 ? 1 : Math.max(0.2, 1 - (age - 27) * 0.12);
  const base = Math.pow(Math.max(1, overall - 40), 2.2);
  return Math.round(base * ageFactor * 6);
}

export function createCareer(choice: CreationChoice, seedRef: { s: number }): CareerState {
  const base = 44 + Math.floor(rng(seedRef) * 6); // 44..49
  let potential = 72 + Math.floor(rng(seedRef) * 25); // 72..96
  let overall = base;
  let reputation = 8;
  let morale = 66;
  let money = 0;
  let wildness = 0;
  let offerQuality = 0;

  const apply = (o?: CreationStepOption) => {
    if (!o) return;
    overall += o.overall ?? 0;
    potential += o.potential ?? 0;
    reputation += o.reputation ?? 0;
    morale += o.morale ?? 0;
    money += o.money ?? 0;
    wildness += o.wildness ?? 0;
    offerQuality += o.offerQuality ?? 0;
  };
  apply(CREATION_STEPS[0].options.find((o) => o.value === choice.origin));
  apply(CREATION_STEPS[1].options.find((o) => o.value === choice.teenage));
  apply(CREATION_STEPS[2].options.find((o) => o.value === choice.entourage));

  potential = Math.min(97, potential);
  overall = Math.min(potential, overall);

  const startTier = choice.startClubTier;

  return {
    name: choice.name.trim() || 'Mon joueur',
    position: choice.position,
    nation: choice.nation,
    foot: choice.foot,
    age: START_AGE,
    overall,
    potential,
    reputation,
    morale: Math.max(0, Math.min(100, morale)),
    form: 75,
    club: pickClubName(startTier, seedRef),
    tier: startTier,
    status: statusFor(overall, startTier),
    wage: wageFor(startTier, overall, seedRef),
    money,
    marketValue: marketValueFor(overall, START_AGE),
    lastOfferValue: 1,
    seasonsSinceMove: 0,
    wildness,
    offerQuality,
    capsNational: 0,
    seasonsPlayed: 0,
    trophies: 0,
    intlTrophies: 0,
    retired: false,
    log: [],
    recentEventIds: []
  };
}

export function signWith(state: CareerState, offer: ClubOffer): CareerState {
  return {
    ...state,
    club: offer.name,
    tier: offer.tier,
    wage: offer.wage,
    status: statusFor(state.overall, offer.tier),
    seasonsSinceMove: 0,
    lastOfferValue: state.marketValue,
    log: [...state.log, `Transfert à ${offer.name} (${offer.tier}) — ${offer.wage} k€/an.`]
  };
}

// Reste dans son club (refuse ou pas d'offre)
export function stayAtClub(state: CareerState): CareerState {
  return { ...state, seasonsSinceMove: state.seasonsSinceMove + 1 };
}

const STATUS_GROWTH: Record<PlaytimeStatus, number> = { 'Titulaire': 1.0, 'Rotation': 0.6, 'Remplaçant': 0.28 };
const STATUS_PERF: Record<PlaytimeStatus, number> = { 'Titulaire': 1.0, 'Rotation': 0.72, 'Remplaçant': 0.45 };

// Simule UNE saison après le choix d'évènement.
export function playSeason(
  state: CareerState,
  option: SeasonEventOption,
  seedRef: { s: number }
): CareerState {
  const next: CareerState = { ...state, log: [...state.log] };

  next.status = statusFor(next.overall, next.tier);

  // effets de l'évènement
  next.overall += option.overall ?? 0;
  next.reputation += option.reputation ?? 0;
  next.morale += option.morale ?? 0;
  next.form += option.form ?? 0;
  next.capsNational += option.caps ?? 0;
  if (option.money) next.money += option.money;

  let injuryText = '';
  if (option.injuryRisk && rng(seedRef) < option.injuryRisk) {
    const dmg = 3 + Math.floor(rng(seedRef) * 5);
    next.overall -= dmg;
    next.morale -= 8;
    next.form -= 20;
    injuryText = ` Blessure : -${dmg} niveau.`;
  }

  // progression : liée à l'âge, au potentiel, au temps de jeu, forme et moral
  const gap = next.potential - next.overall;
  const moraleFactor = 0.65 + next.morale / 250;
  const formFactor = 0.7 + next.form / 300;
  const playFactor = STATUS_GROWTH[next.status];
  let growth = 0;
  if (next.age <= 21) growth = gap * 0.20;
  else if (next.age <= 26) growth = gap * 0.12;
  else if (next.age <= 30) growth = gap * 0.05;
  else if (next.age <= 32) growth = 0;
  else growth = -(1.5 + (next.age - 32) * 0.7);
  growth = growth > 0 ? Math.round(growth * moraleFactor * formFactor * playFactor) : Math.round(growth);
  next.overall += growth;

  // performance de la saison
  const difficulty = TIER_DIFFICULTY[next.tier];
  const perf =
    (next.overall * STATUS_PERF[next.status] * (0.75 + next.form / 320)) / difficulty +
    (rng(seedRef) * 10 - 5);
  const performance = Math.round(perf);

  // réputation : gain corrélé perf + niveau du club
  const tierRepMult: Record<ClubTier, number> = { 'Régional': 0.5, 'D2': 0.8, 'D1': 1.15, 'Élite': 1.45 };
  let repGain = Math.round((performance - 46) * 0.22 * tierRepMult[next.tier]);
  repGain = Math.max(-6, Math.min(9, repGain));
  next.reputation += repGain;

  // salaire encaissé
  next.money += next.wage;

  // usure de forme naturelle
  next.form -= 5;

  // trophées club : belle saison, titulaire, haut niveau
  if (performance > 62 && next.status !== 'Remplaçant') {
    if (next.tier === 'Élite' && rng(seedRef) > 0.3) next.trophies += 1;
    else if (next.tier === 'D1' && rng(seedRef) > 0.5) next.trophies += 1;
    else if (next.tier === 'D2' && rng(seedRef) > 0.8) next.trophies += 1;
  }

  // sélection nationale : petit socle de caps en plus de ceux gagnés via les
  // évènements dédiés (convocations, Coupe du Monde).
  if (next.reputation >= 48 && rng(seedRef) > 0.35) {
    next.capsNational += 2 + Math.floor(rng(seedRef) * 6);
  }

  // Coupe du Monde : résolution du tournoi si le joueur a forcé sa sélection
  // (voir l'évènement 'world_cup'). Les titres internationaux viennent
  // exclusivement d'ici, pour que ça reste un vrai évènement marquant.
  let worldCupText = '';
  if (option.worldCup) {
    const strength = NATION_STRENGTH[next.nation] ?? 0.8;
    const skill = 0.42 + next.reputation / 220 + strength / 3.2;
    const stageLabels = ['poules', 'huitièmes de finale', 'quarts de finale', 'demi-finales', 'finale'];
    let cleared = 0;
    for (let i = 0; i < stageLabels.length; i++) {
      const chance = Math.min(0.9, Math.max(0.15, skill - i * 0.08));
      if (rng(seedRef) < chance) cleared++;
      else break;
    }
    next.capsNational += 4;

    if (cleared >= stageLabels.length) {
      next.intlTrophies += 1;
      next.reputation += 22;
      next.money += 6000;
      worldCupText = ` 🏆 Coupe du Monde : ${next.nation} est CHAMPION DU MONDE, et tu y es pour beaucoup !`;
    } else if (cleared === stageLabels.length - 1) {
      next.reputation += 18;
      next.money += 4500;
      worldCupText = ` Coupe du Monde : défaite en finale, vice-champion du monde avec ${next.nation}.`;
    } else if (cleared >= 3) {
      next.reputation += 15;
      next.money += 3200;
      worldCupText = ` Coupe du Monde : ${next.nation} éliminé en ${stageLabels[cleared]}.`;
    } else if (cleared >= 1) {
      next.reputation += 8;
      next.money += 1200;
      worldCupText = ` Coupe du Monde : ${next.nation} éliminé en ${stageLabels[cleared]}.`;
    } else {
      next.reputation += 2;
      next.money += 300;
      worldCupText = ` Coupe du Monde : ${next.nation} ne sort pas des poules.`;
    }
  }

  // bornes
  next.overall = Math.max(1, Math.min(99, next.overall));
  next.reputation = Math.max(0, Math.min(100, next.reputation));
  next.morale = Math.max(0, Math.min(100, next.morale));
  next.form = Math.max(0, Math.min(100, next.form));

  // valeur marchande recalculée
  next.marketValue = marketValueFor(next.overall, next.age + 1);

  // le tier "de fait" reste celui du club actuel ; la réputation ouvre des offres
  next.status = statusFor(next.overall, next.tier);

  next.age += 1;
  next.seasonsPlayed += 1;

  next.log.push(
    `${state.age} ans — ${state.club} (${state.tier}, ${state.status}). ` +
      `Perf ${performance}. ${option.note}${injuryText}` +
      (repGain !== 0 ? ` Réput ${repGain > 0 ? '+' : ''}${repGain}.` : '') +
      worldCupText
  );

  // retraite
  if (next.age >= MAX_RETIRE_AGE) next.retired = true;
  else if (next.age >= MIN_RETIRE_AGE && next.overall < next.potential - 22) next.retired = true;

  return next;
}

// -------- Note finale /97 --------
export interface FinalCareerScore {
  score: number;
  peakOverall: number;
  trophies: number;
  intlTrophies: number;
  caps: number;
  seasons: number;
  money: number;
  breakdown: { label: string; value: number }[];
}

export function computeFinalScore(state: CareerState, peakOverall: number): FinalCareerScore {
  // Niveau max : compte au-dessus de 50, jusqu'à 92 -> plafond de la part.
  const peakPart = Math.max(0, Math.min(38, ((peakOverall - 50) / 42) * 38));
  const trophyPart = Math.min(24, state.trophies * 2.6);
  const intlPart = Math.min(15, state.intlTrophies * 5);
  const capsPart = Math.min(10, state.capsNational * 0.14);
  const repPart = (state.reputation / 100) * 9;
  const moneyPart = Math.min(6, (Math.log10(Math.max(1, state.money)) / 5.2) * 6);
  const longevityPart = Math.min(4, state.seasonsPlayed * 0.2);

  const raw = peakPart + trophyPart + intlPart + capsPart + repPart + moneyPart + longevityPart;
  const score = Math.min(MAX_FINAL_SCORE, Math.round(raw));

  return {
    score,
    peakOverall,
    trophies: state.trophies,
    intlTrophies: state.intlTrophies,
    caps: state.capsNational,
    seasons: state.seasonsPlayed,
    money: state.money,
    breakdown: [
      { label: 'Niveau max atteint', value: Math.round(peakPart) },
      { label: 'Trophées club', value: Math.round(trophyPart) },
      { label: 'Titres internationaux', value: Math.round(intlPart) },
      { label: 'Sélections', value: Math.round(capsPart) },
      { label: 'Réputation', value: Math.round(repPart) },
      { label: 'Argent gagné', value: Math.round(moneyPart) },
      { label: 'Longévité', value: Math.round(longevityPart) }
    ]
  };
}

export function formatMoney(k: number): string {
  if (k >= 1000) return `${(k / 1000).toFixed(1)} M€`;
  return `${k} k€`;
}
