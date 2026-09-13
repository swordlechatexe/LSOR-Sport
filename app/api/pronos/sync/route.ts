import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPronosMatches } from '@/lib/pronosApi';

export async function POST(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret');
  const isCron = !!process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;
  if (!isCron) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    if (!profile?.is_admin) return NextResponse.json({ error: 'Accès admin requis.' }, { status: 403 });
  }
  try { return NextResponse.json(await syncPronosMatches()); }
  catch (error: any) { return NextResponse.json({ error: error?.message ?? 'Erreur de synchronisation API.' }, { status: 500 }); }
}
