import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès admin requis.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const gameCode = body.gameCode ? String(body.gameCode) : null;
  const admin = createAdminClient();
  let gameId: string | null = null;

  if (gameCode) {
    const { data: game, error: gameError } = await admin.from('games').select('id, code').eq('code', gameCode).maybeSingle();
    if (gameError || !game) return NextResponse.json({ error: 'Jeu introuvable.' }, { status: 404 });
    gameId = game.id;
  }

  const filter = gameId === null ? admin.from('player_ratings').update({ elo: 1500, games_played: 0, wins: 0, losses: 0, draws: 0, updated_at: new Date().toISOString() }) : admin.from('player_ratings').update({ elo: 1500, games_played: 0, wins: 0, losses: 0, draws: 0, updated_at: new Date().toISOString() }).eq('game_id', gameId);
  const { error } = gameId === null ? await filter.not('id', 'is', null) : await filter;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (gameId !== null) {
    const { data: players } = await admin.from('player_ratings').select('user_id, elo').not('game_id', 'is', null);
    const byUser = new Map<string, number[]>();
    for (const row of players ?? []) {
      const arr = byUser.get(row.user_id) ?? [];
      arr.push(row.elo);
      byUser.set(row.user_id, arr);
    }
    for (const [userId, elos] of byUser) {
      const avg = Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
      await admin.from('player_ratings').update({ elo: avg, updated_at: new Date().toISOString() }).eq('user_id', userId).is('game_id', null);
    }
  }

  return NextResponse.json({ ok: true });
}
