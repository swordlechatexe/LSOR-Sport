'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function MatchResultForm({ matchId }: { matchId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('irl_matches')
      .update({
        team_a_score: Number(scoreA),
        team_b_score: Number(scoreB),
        status: 'finished'
      })
      .eq('id', matchId);

    setSaving(false);
    if (updateError) {
      setError(
        updateError.message.includes('policy')
          ? 'Seuls les admins peuvent saisir un résultat.'
          : updateError.message
      );
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="ghost" onClick={() => setOpen(true)} style={{ marginTop: 8 }}>
        Saisir le résultat
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="number"
        value={scoreA}
        onChange={(e) => setScoreA(e.target.value)}
        placeholder="Score A"
        style={{ width: 70, background: '#06111f', border: '1px solid #21415f', color: '#fff', borderRadius: 8, padding: 6 }}
      />
      <span>–</span>
      <input
        type="number"
        value={scoreB}
        onChange={(e) => setScoreB(e.target.value)}
        placeholder="Score B"
        style={{ width: 70, background: '#06111f', border: '1px solid #21415f', color: '#fff', borderRadius: 8, padding: 6 }}
      />
      <button type="submit" className="ghost" disabled={saving}>
        {saving ? '…' : 'OK'}
      </button>
      {error && <span style={{ color: 'var(--red)', fontSize: 11 }}>{error}</span>}
    </form>
  );
}
