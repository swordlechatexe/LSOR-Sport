import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès admin requis.' }, { status: 403 });

  const admin = createAdminClient();
  const users: any[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  const ids = users.map((u) => u.id);
  const { data: profiles } = await admin.from('profiles').select('id, username, is_admin, created_at').in('id', ids);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      username: profileMap.get(u.id)?.username ?? u.user_metadata?.username ?? 'Joueur',
      is_admin: !!profileMap.get(u.id)?.is_admin,
      created_at: u.created_at,
    })).sort((a, b) => a.username.localeCompare(b.username, 'fr')),
  });
}
