import { PITCH_LAYOUT, type Formation, type Slot, type PlayerOption } from '@/lib/ultimateEleven';

export default function Pitch({
  formation,
  slots,
  team
}: {
  formation: Formation;
  slots: Slot[];
  team: Record<string, PlayerOption>;
}) {
  const layout = PITCH_LAYOUT[formation];

  return (
    <div className="pitch">
      {slots.map((s) => {
        const pos = layout[s.key];
        const player = team[s.key];
        if (!pos) return null;
        return (
          <div key={s.key} className="pitch-spot" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
            <div className={`pitch-dot${player ? ' filled' : ''}`}>{s.accepts[0]}</div>
            <div className="pitch-tag">{player?.name ?? s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
