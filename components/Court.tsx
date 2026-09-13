import { ROSTER_SLOTS, type NbaPlayerOption, type NbaPosition } from '@/lib/eightyTwoO';

// Disposition approximative d'un cinq de départ sur un demi-terrain :
// pivot/ailier fort près du panier, ailiers sur les ailes, meneur en bas.
const COURT_LAYOUT: Record<NbaPosition, { x: number; y: number }> = {
  C: { x: 40, y: 14 },
  PF: { x: 62, y: 14 },
  SF: { x: 14, y: 56 },
  SG: { x: 86, y: 56 },
  PG: { x: 50, y: 84 }
};

export default function Court({ team }: { team: Partial<Record<NbaPosition, NbaPlayerOption>> }) {
  return (
    <div className="court">
      <div className="court-arc" />
      {ROSTER_SLOTS.map((s) => {
        const pos = COURT_LAYOUT[s.key];
        const player = team[s.key];
        return (
          <div key={s.key} className="pitch-spot" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            <div className={`pitch-dot${player ? ' filled' : ''}`}>{s.key}</div>
            <div className="pitch-tag">{player?.name ?? s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
