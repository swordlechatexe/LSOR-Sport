'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Winner = 'A' | 'B' | 'draw';

export default function PredictionPicker({
  matchId,
  teamA,
  teamB,
  sport,
  matchDate
}: {
  matchId: string;
  teamA: string;
  teamB: string;
  sport: 'football' | 'nba' | 'nfl';
  matchDate: string;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [current, setCurrent] = useState<Winner | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const locked = new Date(matchDate).getTime() <= Date.now();

  useEffect(() => {
    async function load() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      if (user) {
        const { data } = await supabase
          .from('pronos_predictions')
          .select('predicted_winner')
          .eq('match_id', matchId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) setCurrent(data.predicted_winner as Winner);
      }
      setLoading(false);
    }
    load();
  }, [matchId]);

  async function pick(winner: Winner) {
    if (!userId || locked) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from('pronos_predictions')
      .upsert(
        { match_id: matchId, user_id: userId, predicted_winner: winner },
        { onConflict: 'match_id,user_id' }
      );
    setSaving(false);
    if (error) {
      setMessage(
        error.message.includes('policy')
          ? 'Trop tard, le match a déjà commencé.'
          : "Erreur d'enregistrement."
      );
      return;
    }
    setCurrent(winner);
  }

  if (loading) return null;

  if (!userId) {
    return <p className="wordle-note" style={{ margin: '8px 0 0' }}>Connecte-toi pour pronostiquer.</p>;
  }

  if (locked) {
    return (
      <p className="wordle-note" style={{ margin: '8px 0 0' }}>
        {current ? `Ton pronostic : ${current === 'A' ? teamA : current === 'B' ? teamB : 'Match nul'}` : 'Pronostics fermés.'}
      </p>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div className="filter-row" style={{ padding: '0' }}>
        <button className={current === 'A' ? 'active' : ''} onClick={() => pick('A')} disabled={saving}>
          {teamA}
        </button>
        {sport === 'football' && (
          <button className={current === 'draw' ? 'active' : ''} onClick={() => pick('draw')} disabled={saving}>
            Nul
          </button>
        )}
        <button className={current === 'B' ? 'active' : ''} onClick={() => pick('B')} disabled={saving}>
          {teamB}
        </button>
      </div>
      {message && <p className="wordle-note">{message}</p>}
    </div>
  );
}
