'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateProsMatchForm() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sport, setSport] = useState<'football' | 'nba' | 'nfl'>('football');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamA || !teamB || !date || !time) {
      setError('Équipe A, équipe B, date et heure sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from('pronos_matches').insert({
      sport,
      team_a: teamA,
      team_b: teamB,
      match_date: new Date(`${date}T${time}`).toISOString(),
      created_by: user?.id ?? null
    });

    setSaving(false);
    if (insertError) {
      setError(
        insertError.message.includes('policy')
          ? 'Seuls les admins peuvent créer un match.'
          : insertError.message
      );
      return;
    }
    setOpen(false);
    setTeamA('');
    setTeamB('');
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}>+ Ajouter un match</button>
    );
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="field">
        <label>Sport</label>
        <div className="filter-row">
          {(['football', 'nba', 'nfl'] as const).map((s) => (
            <button type="button" key={s} className={sport === s ? 'active' : ''} onClick={() => setSport(s)}>
              {s === 'football' ? 'Football' : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Équipe A</label>
        <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="PSG" />
      </div>
      <div className="field">
        <label>Équipe B</label>
        <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="OM" />
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Heure (coup d'envoi)</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
      <button type="submit" className="cta" disabled={saving}>
        {saving ? 'Création…' : 'Ajouter le match'}
      </button>
      <button type="button" className="ghost" onClick={() => setOpen(false)} style={{ marginLeft: 8 }}>
        Annuler
      </button>
    </form>
  );
}
