import type { PenaltyChoice } from '@/lib/penalty';

const ZONES: { value: PenaltyChoice; label: string }[] = [
  { value: 'gauche', label: 'G' },
  { value: 'centre', label: 'C' },
  { value: 'droite', label: 'D' }
];

export default function PenaltyGoal({
  mode,
  onChoose,
  disabled,
  shooterChoice,
  keeperChoice,
  scored
}: {
  mode: 'choose' | 'reveal' | 'idle';
  onChoose?: (choice: PenaltyChoice) => void;
  disabled?: boolean;
  shooterChoice?: PenaltyChoice | null;
  keeperChoice?: PenaltyChoice | null;
  scored?: boolean;
}) {
  return (
    <div className="pen-field">
      <div className="pen-goal">
        {mode === 'choose' &&
          ZONES.map((z) => (
            <button
              key={z.value}
              className="pen-zone"
              disabled={disabled}
              onClick={() => onChoose?.(z.value)}
              aria-label={z.label}
            />
          ))}
        {shooterChoice && <span className={`pen-ball pen-ball-${shooterChoice}`}>⚽</span>}
        {keeperChoice && <span className={`pen-keeper pen-keeper-${keeperChoice}`}>🧤</span>}
      </div>
      {mode === 'reveal' && (
        <p className={`pen-result ${scored ? 'pen-goal-text' : 'pen-save-text'}`}>
          {scored ? 'BUT !' : 'ARRÊTÉ !'}
        </p>
      )}
    </div>
  );
}
