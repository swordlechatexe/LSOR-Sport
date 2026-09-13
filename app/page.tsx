import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import GameCard from '@/components/GameCard';
import type { GameRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: games } = await supabase
    .from('games')
    .select('id, code, name, description, is_active')
    .eq('is_active', true)
    .order('name');

  const { data: ranking } = await supabase
    .from('player_ratings')
    .select('elo, profiles(username)')
    .is('game_id', null)
    .order('elo', { ascending: false })
    .limit(8);

  const { data: nextMatch } = await supabase
    .from('irl_matches')
    .select('id, title, sport, match_date, location')
    .eq('status', 'scheduled')
    .order('match_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  let profile: { username: string } | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    profile = data;
  }

  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <div className="eyebrow">LSOR-SPORT · ENTRE POTES</div>
          <h1>
            La compétition
            <br />
            <span>entre potes</span>
          </h1>
          <p>
            Des jeux, des classements, des défis et des matchs IRL. Tout pour savoir qui est
            vraiment le meilleur du groupe.
          </p>
          <Link href="/jeux" className="cta">
            JOUER MAINTENANT
          </Link>
        </div>
        <div className="hero-side">
          <div className="quick-rank">
            <h3>♛ Classement général · ELO</h3>
            {ranking && ranking.length > 0 ? (
              ranking.map((r: any, i: number) => (
                <div className="rank-row" key={i}>
                  <span>{i + 1}</span>
                  <strong>{r.profiles?.username ?? '—'}</strong>
                  <span className="elo">{r.elo}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>
                Personne n'a encore de classement. Sois le premier à jouer !
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>Les jeux</h2>
        <Link href="/jeux">Voir tous les jeux →</Link>
      </div>
      <div className="game-grid">
        {(games as GameRow[] | null)?.map((g) => <GameCard key={g.id} game={g} />)}
      </div>

      <div className="section-head">
        <h2>À venir</h2>
        <Link href="/calendrier">Voir le calendrier →</Link>
      </div>
      <div className="two-col">
        {nextMatch ? (
          <div className="card match-card">
            <div className="date-box">
              <span>{new Date(nextMatch.match_date).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}</span>
              <strong>{new Date(nextMatch.match_date).getDate()}</strong>
            </div>
            <div className="match-info">
              <h4>{nextMatch.title}</h4>
              <p>
                {new Date(nextMatch.match_date).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}{' '}
                {nextMatch.location ? `· ${nextMatch.location}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="card match-card">
            <p style={{ color: 'var(--muted)', margin: 0 }}>Aucun match IRL prévu pour l'instant.</p>
          </div>
        )}

        <div className="card profile-panel">
          {user && profile ? (
            <div className="profile-head">
              <div className="big-avatar">{profile.username.slice(0, 2).toUpperCase()}</div>
              <div>
                <h2>{profile.username}</h2>
                <Link href="/profil">Voir mon profil →</Link>
              </div>
            </div>
          ) : (
            <div className="profile-head">
              <div>
                <h2>Pas encore connecté</h2>
                <p style={{ color: 'var(--muted)', margin: '4px 0 12px' }}>
                  Crée ton compte pour apparaître dans les classements.
                </p>
                <Link href="/inscription" className="cta">
                  Créer mon compte
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
