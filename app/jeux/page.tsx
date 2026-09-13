import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/GameCard';
import type { GameRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function JeuxPage() {
  const supabase = createClient();
  const { data: games } = await supabase
    .from('games')
    .select('id, code, name, description, is_active')
    .eq('is_active', true)
    .neq('code', 'quiz')
    .order('name');

  return (
    <section>
      <h1 className="page-title">Les jeux</h1>
      <p className="sub">Chaque jeu possède son propre ELO et son classement.</p>
      <div className="game-grid">
        {(games as GameRow[] | null)?.map((g) => <GameCard key={g.id} game={g} />)}
      </div>
    </section>
  );
}
