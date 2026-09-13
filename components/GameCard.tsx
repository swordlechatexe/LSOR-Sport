import Link from 'next/link';
import { GAME_DISPLAY, type GameRow } from '@/lib/types';

export default function GameCard({ game }: { game: GameRow }) {
  const display = GAME_DISPLAY[game.code];

  return (
    <article className="card game-card">
      <div className="game-icon">{display.icon}</div>
      <h3>{game.name}</h3>
      <p>{game.description}</p>
      <div className="game-meta">
        <span>{display.playable ? 'Jouable' : 'Bientôt disponible'}</span>
      </div>
      {display.playable ? (
        <Link href={`/jeux/${game.code === '82_0' ? '82-0' : game.code.replace('_', '-')}`} className="ghost">
          Jouer →
        </Link>
      ) : (
        <button className="ghost" type="button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          Bientôt →
        </button>
      )}
    </article>
  );
}
