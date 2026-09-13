import { createClient } from '@/lib/supabase/server';
import type { PronosMatchRow } from '@/lib/types';
import CreateProsMatchForm from '@/components/CreateProsMatchForm';
import ProsMatchResultForm from '@/components/ProsMatchResultForm';
import DeleteMatchButton from '@/components/DeleteMatchButton';
import PredictionPicker from '@/components/PredictionPicker';
import Link from 'next/link';
import SyncProsButton from '@/components/SyncProsButton';

export const dynamic = 'force-dynamic';

const SPORT_LABEL: Record<string, string> = { football: 'Football', nba: 'NBA', nfl: 'NFL' };

export default async function ProsPage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = !!profile?.is_admin;
  }

  const { data: upcoming } = await supabase
    .from('pronos_matches')
    .select('*')
    .eq('status', 'scheduled')
    .order('match_date', { ascending: true });

  // Matchs terminés (résultats)
  const { data: pastMatches } = await supabase
    .from('pronos_matches')
    .select('*')
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(20);

  let myPastPredictions: Record<string, string> = {};
  if (user && pastMatches && pastMatches.length > 0) {
    const { data: preds } = await supabase
      .from('pronos_predictions')
      .select('match_id, predicted_winner')
      .eq('user_id', user.id)
      .in('match_id', pastMatches.map((m) => m.id));
    (preds ?? []).forEach((p: any) => (myPastPredictions[p.match_id] = p.predicted_winner));
  }

  return (
    <section>
      <div className="section-head" style={{ margin: '8px 2px 0' }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Pronos
        </h1>
        <Link href="/jeux">← Retour</Link>
      </div>
      <p className="sub">
        Pronostique le vainqueur (football, NBA, NFL). Bon vainqueur = +12 ELO, faux = -8 ELO. Verrouillé
        automatiquement au coup d'envoi.
      </p>

      <div className="section-head">
        <h2>Matchs à venir</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{isAdmin && <><SyncProsButton /><CreateProsMatchForm /></>}</div>
      </div>
      <div className="calendar-panel card">
        {upcoming && upcoming.length > 0 ? (
          (upcoming as PronosMatchRow[]).map((m) => {
            const d = new Date(m.match_date);
            return (
              <div className="match-card" key={m.id}>
                <div className="date-box">
                  <span>{d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}</span>
                  <strong>{d.getDate()}</strong>
                </div>
                <div className="match-info" style={{ flex: 1 }}>
                  <h4>
                    {m.team_a} vs {m.team_b}
                  </h4>
                  <p>
                    {SPORT_LABEL[m.sport]} ·{' '}
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <PredictionPicker
                    matchId={m.id}
                    teamA={m.team_a}
                    teamB={m.team_b}
                    sport={m.sport}
                    matchDate={m.match_date}
                  />
                  {isAdmin && (
                    <>
                      <ProsMatchResultForm matchId={m.id} />
                      <DeleteMatchButton table="pronos_matches" matchId={m.id} />
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Aucun match à pronostiquer pour l'instant.</p>
        )}
      </div>

      <div className="section-head">
        <h2>Résultats</h2>
      </div>
      <div className="calendar-panel card">
        {pastMatches && pastMatches.length > 0 ? (
          (pastMatches as PronosMatchRow[]).map((m) => {
            const mine = myPastPredictions[m.id];
            const wasCorrect = mine && m.winner ? mine === m.winner : null;
            return (
              <div className="match-card" key={m.id}>
                <div className="date-box">
                  <span>{SPORT_LABEL[m.sport].slice(0, 3).toUpperCase()}</span>
                  <strong>{m.team_a_score}-{m.team_b_score}</strong>
                </div>
                <div className="match-info">
                  <h4>
                    {m.team_a} vs {m.team_b}
                  </h4>
                  {mine && (
                    <span className="tag" style={{ background: wasCorrect ? undefined : '#4a1f28', color: wasCorrect ? undefined : '#ff9aa3' }}>
                      {wasCorrect ? '✅ Bon pronostic' : '❌ Raté'}
                    </span>
                  )}
                  {isAdmin && <DeleteMatchButton table="pronos_matches" matchId={m.id} />}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Aucun résultat pour l'instant.</p>
        )}
      </div>
    </section>
  );
}
