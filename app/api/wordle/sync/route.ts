import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function stripHtml(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' '); }

async function importArchivePages(pageCount = 3) {
  const db = createAdminClient();
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) => fetch(`https://wordle.global/fr/archive${i === 0 ? '' : `?page=${i + 1}`}`, { cache: 'no-store' }).then((r) => r.text()))
  );
  const found = new Map<number, string>();
  for (const html of pages) {
    const text = stripHtml(html);
    const re = /#(\d+)\s+([a-zA-ZÀ-ÿ]{5})(?=\s|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) found.set(Number(m[1]), m[2].toLowerCase());
  }
  let imported = 0;
  for (const [archiveIndex, word] of found) {
    const { error } = await db.from('wordle_word_pool').upsert({ archive_index: archiveIndex, word, source: 'wordle.global' }, { onConflict: 'word' });
    if (!error) imported++;
  }
  return imported;
}

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
  try {
    const url = new URL(request.url);
    const full = url.searchParams.get('full') === '1';
    const imported = await importArchivePages(full ? 64 : 3);
    const db = createAdminClient();
    const { data, error } = await db.rpc('ensure_wordle_day_from_pool', { p_date: new Date().toISOString().slice(0, 10) });
    if (error) throw error;
    return NextResponse.json({ imported, wordleDay: data?.game_date ?? null });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Erreur Wordle.' }, { status: 500 });
  }
}
