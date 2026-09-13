import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/connexion');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_admin, created_at')
    .eq('id', user.id)
    .single();

  const { data: generalRating } = await supabase
    .from('player_ratings')
    .select('elo, games_played, wins, losses, draws')
    .eq('user_id', user.id)
    .is('game_id', null)
    .maybeSingle();

  const { data: gameRatings } = await supabase
    .from('player_ratings')
    .select('elo, games(name, code)')
    .eq('user_id', user.id)
    .not('game_id', 'is', null);

  const { data: achievements } = await supabase
    .from('user_achievements')
    .select('achievements(name, icon, description)')
    .eq('user_id', user.id);

  return (
    <section>
      <h1 className="page-title">Profil</h1>
      <p className="sub">Tes statistiques, ton ELO et tes trophées.</p>

      <div className="card profile-panel">
        <div className="profile-head">
          <div className="big-avatar">{profile?.username?.slice(0, 2).toUpperCase()}</div>
          <div>
            <h2>{profile?.username}</h2>
            <p>{profile?.is_admin ? 'Administrateur' : 'Joueur'}</p>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <strong>{generalRating?.elo ?? 1500}</strong>
            <small>ELO général</small>
          </div>
          <div className="stat">
            <strong>{generalRating?.games_played ?? 0}</strong>
            <small>Parties</small>
          </div>
          <div className="stat">
            <strong>{generalRating?.wins ?? 0}</strong>
            <small>Victoires</small>
          </div>
          <div className="stat">
            <strong>{generalRating?.losses ?? 0}</strong>
            <small>Défaites</small>
          </div>
        </div>

        <div className="section-head">
          <h2>Tes ELO par jeu</h2>
        </div>
        {gameRatings && gameRatings.length > 0 ? (
          <div className="ranking-list">
            {(gameRatings as any[]).map((r, i) => (
              <div className="rank-line" key={i}>
                <span>·</span>
                <strong>{r.games?.name}</strong>
                <span className="elo">{r.elo}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Pas encore de partie jouée.</p>
        )}

        <div className="section-head">
          <h2>Trophées</h2>
        </div>
        {achievements && achievements.length > 0 ? (
          <div className="badge-grid">
            {(achievements as any[]).map((a, i) => (
              <div className="badge" key={i}>
                <b>{a.achievements?.icon}</b>
                <small>{a.achievements?.name}</small>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Aucun trophée débloqué pour l'instant.</p>
        )}

        {profile?.is_admin && (
          <div style={{ marginTop: 18 }}>
            <a className="ghost" href="/admin" style={{ width: '100%' }}>⚙️ Administration</a>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <LogoutButton />
        </div>
      </div>
    </section>
  );
}
