// =========================================================
// LSOR-SPORT — PÉNALTY 1V1
// =========================================================
// Toute la logique (résolution des tirs, avancement des manches, ELO) vit
// côté serveur dans sql/008_penalty.sql (fonctions SECURITY DEFINER). Ce
// fichier ne contient que les types partagés et de quoi afficher l'état
// renvoyé par ces fonctions.

export type PenaltyChoice = 'gauche' | 'centre' | 'droite';

export const PENALTY_CHOICES: { value: PenaltyChoice; label: string }[] = [
  { value: 'gauche', label: 'Gauche' },
  { value: 'centre', label: 'Centre' },
  { value: 'droite', label: 'Droite' }
];

export type PenaltyStatus = 'waiting_opponent' | 'in_progress' | 'finished';

export interface PenaltyHistoryEntry {
  round: number;
  half: 'a' | 'b';
  shooter_choice: PenaltyChoice;
  keeper_choice: PenaltyChoice;
  scored: boolean;
  sudden_death: boolean;
}

export interface PenaltyMatchState {
  id: string;
  player_a: string;
  player_b: string | null;
  status: PenaltyStatus;
  round: number;
  half: 'a' | 'b';
  sudden_death: boolean;
  score_a: number;
  score_b: number;
  kicks_a: number;
  kicks_b: number;
  winner: string | null;
  history: PenaltyHistoryEntry[];
  shooter_id: string | null;
  keeper_id: string | null;
  shooter_submitted: boolean;
  keeper_submitted: boolean;
  my_pending_shooter_choice: PenaltyChoice | null;
  my_pending_keeper_choice: PenaltyChoice | null;
}
