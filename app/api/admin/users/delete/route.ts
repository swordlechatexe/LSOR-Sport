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
  const userId = String(body.userId ?? '');
  if (!userId) return NextResponse.json({ error: 'Utilisateur manquant.' }, { status: 400 });
  if (userId === user.id) return NextResponse.json({ error: 'Tu ne peux pas supprimer ton propre compte depuis cet écran.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('id, is_admin').eq('id', userId).maybeSingle();
  if (target?.is_admin) return NextResponse.json({ error: 'Par sécurité, un admin doit retirer les droits admin avant suppression.' }, { status: 400 });

  const { error } = await admin.auth.admin.deleteUser(userId, false);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
