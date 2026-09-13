'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateMatchForm() {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Foot');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date || !time) {
      setError('Titre, date et heure sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Tu dois être connecté pour créer un match.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from('irl_matches').insert({
      title,
      sport,
      match_date: new Date(`${date}T${time}`).toISOString(),
      location: location || null,
      team_a_name: teamA || null,
      team_b_name: teamB || null,
      created_by: user.id
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message.includes('policy')
          ? "Seuls les admins peuvent créer un match (vérifie que ton profil a is_admin = true)."
          : insertError.message
      );
      return;
    }

    setOpen(false);
    setTitle('');
    setLocation('');
    setTeamA('');
    setTeamB('');
    router.refresh();
  }

  if (!open) {
    return (
      <button id="adminMatch" onClick={() => setOpen(true)}>
        + Créer un match
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: 18, marginBottom: 16 }}>
      <div className="field">
        <label>Titre</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foot · 7v7" />
      </div>
      <div className="field">
        <label>Sport</label>
        <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Foot / Basket / …" />
      </div>
      <div className="field">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Heure</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="field">
        <label>Lieu (optionnel)</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Stade municipal" />
      </div>
      <div className="field">
        <label>Équipe A (optionnel)</label>
        <input value={teamA} onChange={(e) => setTeamA(e.target.value)} />
      </div>
      <div className="field">
        <label>Équipe B (optionnel)</label>
        <input value={teamB} onChange={(e) => setTeamB(e.target.value)} />
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
      <button type="submit" className="cta" disabled={saving}>
        {saving ? 'Création…' : 'Créer le match'}
      </button>
      <button type="button" className="ghost" onClick={() => setOpen(false)} style={{ marginLeft: 8 }}>
        Annuler
      </button>
    </form>
  );
}
