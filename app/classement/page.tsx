'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { GameRow } from '@/lib/types';

type RankRow = { username: string; elo: number };

export default function ClassementPage() {
  const supabase = createClient();
  const [games, setGames] = useState<GameRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // null = général
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('games')
      .select('id, code, name, description, is_active')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setGames((data as GameRow[]) ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from('player_ratings')
      .select('elo, profiles(username)')
      .order('elo', { ascending: false })
      .limit(50);

    query = selected ? query.eq('game_id', selected) : query.is('game_id', null);

    query.then(({ data }) => {
      const mapped = ((data as any[]) ?? []).map((r) => ({
        username: r.profiles?.username ?? '—',
        elo: r.elo
      }));
      setRows(mapped);
      setLoading(false);
    });
  }, [selected]);

  return (
    <section>
      <h1 className="page-title">Classements</h1>
      <p className="sub">Le général et les classements individuels sont indépendants.</p>

      <div className="filter-row">
        <button className={selected === null ? 'active' : ''} onClick={() => setSelected(null)}>
          Général
        </button>
        {games.map((g) => (
          <button
            key={g.id}
            className={selected === g.id ? 'active' : ''}
            onClick={() => setSelected(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      <div className="rank-panel">
        <h3>{selected ? games.find((g) => g.id === selected)?.name : 'Classement général'} · ELO</h3>
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Chargement…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Personne n'a encore de score ici.</p>
        ) : (
          <div className="ranking-list">
            {rows.map((r, i) => (
              <div className="rank-line" key={i}>
                <span>{i + 1}</span>
                <strong>{r.username}</strong>
                <span className="elo">{r.elo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
