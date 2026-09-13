'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PenaltyGoal from '@/components/PenaltyGoal';
import { type PenaltyChoice, type PenaltyMatchState } from '@/lib/penalty';

const POLL_MS = 2500;

function PenaltyInner() {
  const supabase = createClient();
  const params = useSearchParams();
  const matchId = params.get('match');

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [state, setState] = useState<PenaltyMatchState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setAuthChecked(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    if (!matchId) return;
    const { data, error: rpcError } = await supabase.rpc('get_penalty_match', { p_match_id: matchId });
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setState((data as PenaltyMatchState) ?? null);
  }, [matchId, supabase]);

  useEffect(() => {
    if (!matchId || !authChecked) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [matchId, authChecked, refresh]);

  useEffect(() => {
    if (!matchId) return;
    if (state?.status === 'finished') return;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [matchId, state?.status, refresh]);

  async function createChallenge() {
    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('create_penalty_match');
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    window.location.href = `/jeux/penalty?match=${data}`;
  }

  async function joinChallenge() {
    if (!matchId) return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc('join_penalty_match', { p_match_id: matchId });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await refresh();
  }

  async function submitChoice(choice: PenaltyChoice) {
    if (!matchId) return;
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc('submit_penalty_choice', {
      p_match_id: matchId,
      p_choice: choice
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    await refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage('Lien copié !');
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage('Impossible de copier — copie l’adresse manuellement.');
    }
  }

  if (!authChecked || (matchId && loading && !state)) {
    return (
      <div className="wordle-wrap">
        <div className="section-head">
          <h2>Pénalty 1v1</h2>
          <Link href="/jeux">← Retour</Link>
        </div>
        <div className="card wordle-card">
          <p style={{ color: 'var(--muted)' }}>Chargement…</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="wordle-wrap">
        <div className="section-head">
          <h2>Pénalty 1v1</h2>
          <Link href="/jeux">← Retour</Link>
        </div>
        <div className="card wordle-card">
          <p className="wordle-note">Connecte-toi pour défier un pote en tirs au but.</p>
        </div>
      </div>
    );
  }

  // -------- Pas de match en cours : écran de création --------
  if (!matchId) {
    return (
      <div className="wordle-wrap">
        <div className="section-head">
          <div>
            <h2>Pénalty 1v1</h2>
            <p className="sub">5 tirs chacun, gauche/centre/droite. Mort subite en cas d'égalité.</p>
          </div>
          <Link href="/jeux">← Retour</Link>
        </div>
        <div className="card wordle-card">
          <p>
            Tu choisis où tirer, ton adversaire choisit où plonger — en aveugle l'un de l'autre.
            Chacun peut jouer son tour quand il veut, pas besoin d'être connectés en même temps.
          </p>
          <button className="cta" style={{ marginTop: 14, width: '100%' }} onClick={createChallenge} disabled={busy}>
            Défier un ami →
          </button>
          {error && <p className="wordle-note">{error}</p>}
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="wordle-wrap">
        <div className="section-head">
          <h2>Pénalty 1v1</h2>
          <Link href="/jeux">← Retour</Link>
        </div>
        <div className="card wordle-card">
          <p className="wordle-note">{error ?? 'Défi introuvable.'}</p>
        </div>
      </div>
    );
  }

  const isPlayerA = userId === state.player_a;
  const isPlayerB = userId === state.player_b;
  const isParticipant = isPlayerA || isPlayerB;
  const myScore = isPlayerA ? state.score_a : state.score_b;
  const oppScore = isPlayerA ? state.score_b : state.score_a;
  const amShooter = isParticipant && userId === state.shooter_id;
  const amKeeper = isParticipant && userId === state.keeper_id;
  const roundLabel = state.sudden_death ? `Mort subite — manche ${state.round - 5}` : `Manche ${state.round} / 5`;
  const lastKick = state.history.length > 0 ? state.history[state.history.length - 1] : null;

  return (
    <div className="wordle-wrap">
      <div className="section-head">
        <div>
          <h2>Pénalty 1v1</h2>
          <p className="sub">{roundLabel}</p>
        </div>
        <Link href="/jeux">← Retour</Link>
      </div>

      <div className="card wordle-card">
        {/* ---------- En attente d'un adversaire ---------- */}
        {state.status === 'waiting_opponent' && isPlayerA && (
          <>
            <p>Envoie ce lien à un pote pour qu'il rejoigne le duel :</p>
            <p className="wordle-note" style={{ wordBreak: 'break-all' }}>{typeof window !== 'undefined' ? window.location.href : ''}</p>
            <button className="ghost" onClick={copyLink}>Copier le lien</button>
            {copyMessage && <p className="wordle-note">{copyMessage}</p>}
            <p style={{ marginTop: 14, color: 'var(--muted)' }}>En attente de l'adversaire…</p>
          </>
        )}

        {state.status === 'waiting_opponent' && !isPlayerA && (
          <>
            <p>Tu es invité à un duel de tirs au but.</p>
            <button className="cta" style={{ marginTop: 12, width: '100%' }} onClick={joinChallenge} disabled={busy}>
              Rejoindre le duel →
            </button>
          </>
        )}

        {/* ---------- Duel en cours ---------- */}
        {state.status === 'in_progress' && isParticipant && (
          <>
            <div className="de-hud" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="de-hud-item">
                <small>TOI</small>
                <strong>{myScore}</strong>
              </div>
              <div className="de-hud-item">
                <small>ADVERSAIRE</small>
                <strong>{oppScore}</strong>
              </div>
            </div>

            {amShooter && !state.shooter_submitted && (
              <>
                <p style={{ marginTop: 14 }}>À toi de tirer — clique une zone du but :</p>
                <PenaltyGoal mode="choose" onChoose={submitChoice} disabled={busy} />
              </>
            )}

            {amKeeper && !state.keeper_submitted && (
              <>
                <p style={{ marginTop: 14 }}>À toi de plonger — clique une zone du but :</p>
                <PenaltyGoal mode="choose" onChoose={submitChoice} disabled={busy} />
              </>
            )}

            {((amShooter && state.shooter_submitted) || (amKeeper && state.keeper_submitted)) && (
              <>
                <PenaltyGoal
                  mode="idle"
                  shooterChoice={amShooter ? state.my_pending_shooter_choice : undefined}
                  keeperChoice={amKeeper ? state.my_pending_keeper_choice : undefined}
                />
                <p style={{ marginTop: 6, color: 'var(--muted)' }}>En attente de l'adversaire…</p>
              </>
            )}

            {error && <p className="wordle-note">{error}</p>}

            {lastKick && (
              <>
                <p style={{ marginTop: 16, marginBottom: 0, color: 'var(--muted)', fontSize: 12 }}>DERNIER TIR</p>
                <PenaltyGoal
                  mode="reveal"
                  shooterChoice={lastKick.shooter_choice}
                  keeperChoice={lastKick.keeper_choice}
                  scored={lastKick.scored}
                />
              </>
            )}

            {state.history.length > 0 && (
              <div className="de-log">
                <small>HISTORIQUE</small>
                {[...state.history].reverse().map((h, i) => {
                  const shooterIsMe = (h.half === 'a' && isPlayerA) || (h.half === 'b' && isPlayerB);
                  return (
                    <p key={i}>
                      {h.sudden_death ? 'Mort subite — ' : `Manche ${h.round} — `}
                      {shooterIsMe ? 'Tu as tiré' : "L'adversaire a tiré"} à {h.shooter_choice},{' '}
                      {shooterIsMe ? "l'adversaire a plongé" : 'tu as plongé'} à {h.keeper_choice} :{' '}
                      <strong>{h.scored ? 'BUT' : 'ARRÊTÉ'}</strong>
                    </p>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---------- Terminé ---------- */}
        {state.status === 'finished' && isParticipant && (
          <>
            <h3>{state.winner === userId ? 'Tu as gagné !' : 'Tu as perdu.'}</h3>
            <p style={{ fontSize: 32, fontWeight: 800 }}>
              {myScore} - {oppScore}
            </p>
            <p className="wordle-note">Ton ELO Pénalty 1v1 a été mis à jour.</p>
            {lastKick && (
              <PenaltyGoal
                mode="reveal"
                shooterChoice={lastKick.shooter_choice}
                keeperChoice={lastKick.keeper_choice}
                scored={lastKick.scored}
              />
            )}
            <Link href="/jeux/penalty" className="cta" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
              Nouveau défi
            </Link>
          </>
        )}

        {!isParticipant && state.status !== 'waiting_opponent' && (
          <p className="wordle-note">Tu ne participes pas à ce duel.</p>
        )}
      </div>
    </div>
  );
}

export default function PenaltyPage() {
  return (
    <Suspense fallback={<div className="wordle-wrap" />}>
      <PenaltyInner />
    </Suspense>
  );
}
