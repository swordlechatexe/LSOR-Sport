'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AdminUser = { id: string; email: string; username: string; is_admin: boolean; created_at: string };
const games = [
  ['wordle', 'Wordle'],
  ['ultimate_eleven', 'Ultimate Eleven'],
  ['destiny_eleven', 'Destiny Eleven'],
  ['82_0', '82-0'],
  ['pronos', 'Pronos'],
  ['penalty', 'Pénalty 1v1'],
] as const;

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    const r = await fetch('/api/admin/users', { cache: 'no-store' });
    const data = await r.json();
    if (!r.ok) { setMessage(data.error ?? 'Erreur'); setLoading(false); return; }
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function reset(gameCode?: string) {
    const label = gameCode ? games.find(([code]) => code === gameCode)?.[1] : 'tous les classements';
    if (!window.confirm(`Réinitialiser ${label} ? Cette action remet les ELO et statistiques à zéro.`)) return;
    setBusy(`reset-${gameCode ?? 'all'}`); setMessage(null);
    const r = await fetch('/api/admin/reset-rankings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameCode: gameCode ?? null }) });
    const data = await r.json();
    setBusy(null); setMessage(r.ok ? `${label} réinitialisé.` : (data.error ?? 'Erreur'));
  }

  async function syncWordle(full = false) {
    setBusy('wordle'); setMessage(null);
    const r = await fetch(`/api/wordle/sync${full ? '?full=1' : ''}`, { method: 'POST' });
    const data = await r.json();
    setBusy(null);
    setMessage(r.ok ? `Wordle synchronisé : ${data.imported ?? 0} mots importés. Mot du jour : ${data.wordleDay ?? 'créé'}.` : (data.error ?? 'Erreur'));
  }

  async function removeUser(userId: string, username: string) {
    if (!window.confirm(`Supprimer définitivement le compte de ${username} ?`)) return;
    setBusy(`delete-${userId}`); setMessage(null);
    const r = await fetch('/api/admin/users/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
    const data = await r.json();
    setBusy(null);
    if (!r.ok) { setMessage(data.error ?? 'Erreur'); return; }
    setUsers((old) => old.filter((u) => u.id !== userId));
    setMessage(`${username} a été supprimé.`);
  }

  return (
    <section>
      <div className="section-head" style={{ marginTop: 4 }}>
        <div><h1 className="page-title" style={{ margin: 0 }}>Admin</h1><p className="sub">Gestion de LSOR-Sport sans passer par la base.</p></div>
        <Link href="/profil">← Profil</Link>
      </div>

      <div className="two-col">
        <div className="card profile-panel">
          <div className="section-head"><h2>Classements</h2></div>
          <button className="cta" style={{ width: '100%', marginBottom: 8 }} disabled={!!busy} onClick={() => reset()}>Réinitialiser tous les ELO</button>
          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {games.map(([code, name]) => (
              <button key={code} className="ghost" disabled={!!busy} onClick={() => reset(code)}>{busy === `reset-${code}` ? '…' : `Reset ${name}`}</button>
            ))}
          </div>
        </div>

        <div className="card profile-panel">
          <div className="section-head"><h2>Wordle</h2></div>
          <button className="cta" style={{ width: '100%', marginBottom: 8 }} disabled={!!busy} onClick={() => syncWordle(true)}>{busy === 'wordle' ? 'Import…' : "Importer l'archive Wordle"}</button>
          <p className="sub" style={{ fontSize: 11 }}>Importe l'archive publique Wordle Global puis programme automatiquement le mot du jour depuis notre pool.</p>
        </div>

        <div className="card profile-panel">
          <div className="section-head"><h2>Utilisateurs</h2><button onClick={loadUsers} style={{ background: 'none', border: 0, color: 'var(--blue)' }}>Actualiser</button></div>
          {loading ? <p className="sub">Chargement…</p> : users.length === 0 ? <p className="sub">Aucun utilisateur.</p> : (
            <div className="ranking-list">
              {users.map((u) => (
                <div className="rank-line" key={u.id} style={{ gridTemplateColumns: '1fr auto' }}>
                  <div><strong>{u.username}</strong><div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{u.email}{u.is_admin ? ' · ADMIN' : ''}</div></div>
                  {!u.is_admin && <button className="ghost" disabled={!!busy} onClick={() => removeUser(u.id, u.username)}>{busy === `delete-${u.id}` ? '…' : 'Supprimer'}</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card profile-panel" style={{ marginTop: 12 }}>
        <div className="section-head"><h2>À venir</h2></div>
        <p className="sub" style={{ marginBottom: 0 }}>Les matchs Pronos seront bientôt synchronisés automatiquement depuis une API sportive. Le Quiz reste désactivé pour le moment.</p>
      </div>
      {message && <p className="wordle-note" style={{ marginTop: 12 }}>{message}</p>}
    </section>
  );
}
