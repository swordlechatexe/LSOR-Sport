export type GameCode =
  | 'wordle'
  | 'ultimate_eleven'
  | 'destiny_eleven'
  | '82_0'
  | 'pronos'
  | 'quiz'
  | 'penalty';

export interface GameRow {
  id: string;
  code: GameCode;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ProfileRow {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface PlayerRatingRow {
  id: string;
  user_id: string;
  game_id: string | null;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface IrlMatchRow {
  id: string;
  title: string;
  sport: string;
  match_date: string;
  location: string | null;
  status: 'scheduled' | 'finished' | 'cancelled';
  team_a_name: string | null;
  team_b_name: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  notes: string | null;
}

// Métadonnées d'affichage des jeux (icône/texte), en attendant que chaque
// jeu ait sa propre logique branchée. Les infos "officielles" (nom, code,
// actif ou non) viennent de la table `games` dans Supabase.
export const GAME_DISPLAY: Record<GameCode, { icon: string; blurb: string; playable: boolean }> = {
  wordle: {
    icon: '🟩',
    blurb: 'Le mot du jour en français, 6 essais, même défi pour tous.',
    playable: true
  },
  ultimate_eleven: {
    icon: '⚽',
    blurb: "Construis ton XI avec pays, décennie et joueurs classés par note.",
    playable: true
  },
  destiny_eleven: {
    icon: '⭐',
    blurb: 'Vis une carrière complète et construis le meilleur palmarès.',
    playable: true
  },
  '82_0': {
    icon: '🏀',
    blurb: 'Construis ton cinq puis tente de terminer la saison invaincu.',
    playable: true
  },
  pronos: {
    icon: '📊',
    blurb: 'Pronostique foot, NBA et NFL avant le début des matchs.',
    playable: true
  },
  quiz: {
    icon: '❓',
    blurb: 'Réponds vite aux questions sportives et grimpe au classement.',
    playable: false
  },
  penalty: {
    icon: '🥅',
    blurb: 'Affronte un pote en duel de 5 tirs au but, en temps réel.',
    playable: true
  }
};

export interface PronosMatchRow {
  id: string;
  sport: 'football' | 'nba' | 'nfl';
  team_a: string;
  team_b: string;
  match_date: string;
  status: 'scheduled' | 'finished';
  team_a_score: number | null;
  team_b_score: number | null;
  winner: 'A' | 'B' | 'draw' | null;
}
