'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DeleteMatchButton({
  table,
  matchId
}: {
  table: 'irl_matches' | 'pronos_matches';
  matchId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setDeleting(true);
    setError(null);
    const { error } = await supabase.from(table).delete().eq('id', matchId);
    setDeleting(false);
    if (error) {
      setError(error.message.includes('policy') ? 'Seuls les admins peuvent supprimer.' : error.message);
      return;
    }
    router.refresh();
  }

  if (!confirming) {
    return (
      <button className="ghost" style={{ marginTop: 8, marginLeft: 8 }} onClick={() => setConfirming(true)}>
        Supprimer
      </button>
    );
  }

  return (
    <span style={{ marginTop: 8, marginLeft: 8, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>Sûr ?</span>
      <button className="ghost" onClick={confirmDelete} disabled={deleting}>
        {deleting ? '…' : 'Oui, supprimer'}
      </button>
      <button className="ghost" onClick={() => setConfirming(false)}>
        Annuler
      </button>
      {error && <span style={{ color: 'var(--red)', fontSize: 11 }}>{error}</span>}
    </span>
  );
}
