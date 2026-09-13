import { createClient } from '@/lib/supabase/server';
import type { IrlMatchRow } from '@/lib/types';
import CreateMatchForm from '@/components/CreateMatchForm';
import MatchResultForm from '@/components/MatchResultForm';
import DeleteMatchButton from '@/components/DeleteMatchButton';

export const dynamic = 'force-dynamic';

function MatchCard({ match, isAdmin }: { match: IrlMatchRow; isAdmin: boolean }) {
  const d = new Date(match.match_date);
  const hasScore = match.team_a_score !== null && match.team_b_score !== null;

  return (
    <div className="match-card">
      <div className="date-box">
        <span>{d.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}</span>
        <strong>{d.getDate()}</strong>
      </div>
      <div className="match-info">
        <h4>{match.title}</h4>
        <p>
          {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {match.location ? ` · ${match.location}` : ''}
        </p>
        {(match.team_a_name || match.team_b_name) && (
          <span className="tag">
            {match.team_a_name ?? 'Équipe A'} vs {match.team_b_name ?? 'Équipe B'}
          </span>
        )}
        {hasScore && (
          <span className="tag" style={{ marginLeft: 6 }}>
            Résultat : {match.team_a_score} – {match.team_b_score}
          </span>
        )}
        {isAdmin && match.status === 'scheduled' && !hasScore && (
          <MatchResultForm matchId={match.id} />
        )}
        {isAdmin && <DeleteMatchButton table="irl_matches" matchId={match.id} />}
      </div>
    </div>
  );
}

export default async function CalendrierPage() {
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
    .from('irl_matches')
    .select('*')
    .eq('status', 'scheduled')
    .order('match_date', { ascending: true });

  const { data: past } = await supabase
    .from('irl_matches')
    .select('*')
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(20);

  return (
    <section>
      <h1 className="page-title">Calendrier</h1>
      <p className="sub">Les matchs organisés dans la vraie vie.</p>

      <div className="section-head">
        <h2>Prochains matchs</h2>
        {isAdmin && <CreateMatchForm />}
      </div>
      <div className="calendar-panel card">
        {upcoming && upcoming.length > 0 ? (
          (upcoming as IrlMatchRow[]).map((m) => <MatchCard key={m.id} match={m} isAdmin={isAdmin} />)
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Aucun match à venir pour l'instant.</p>
        )}
      </div>

      <div className="section-head">
        <h2>Historique</h2>
      </div>
      <div className="calendar-panel card">
        {past && past.length > 0 ? (
          (past as IrlMatchRow[]).map((m) => <MatchCard key={m.id} match={m} isAdmin={isAdmin} />)
        ) : (
          <p style={{ color: 'var(--muted)', margin: 0 }}>Aucun match passé enregistré.</p>
        )}
      </div>
    </section>
  );
}
