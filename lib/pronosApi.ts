import { createAdminClient } from '@/lib/supabase/admin';

// football-data.org (v4) — plan gratuit : saison en cours incluse, 12
// compétitions, 10 requêtes/minute (pas de plafond journalier).
// Doc : https://docs.football-data.org/general/v4
// .trim() protège contre un espace ou un retour à la ligne collé par erreur
// dans .env.local, qui rendrait sinon le token invalide sans message clair.
const TOKEN = process.env.FOOTBALL_DATA_TOKEN?.trim();
const BASE = 'https://api.football-data.org/v4';

// Codes de compétition football-data.org, pas les mêmes que ceux d'API-Sports.
const COMPETITIONS = [
  ['PL', 'Premier League'],
  ['FL1', 'Ligue 1'],
  ['PD', 'LaLiga'],
  ['SA', 'Serie A'],
  ['BL1', 'Bundesliga'],
  ['CL', 'UEFA Champions League'],
] as const;

function ymd(d: Date) { return d.toISOString().slice(0, 10); }
function isFinished(status: string) { return status === 'FINISHED'; }

async function apiGet(path: string, params: Record<string, string>) {
  if (!TOKEN) throw new Error('FOOTBALL_DATA_TOKEN manquant côté serveur (process.env est vide).');
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'X-Auth-Token': TOKEN }, cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
  return data;
}

async function upsertMatches(items: any[], competitionName: string, errors: string[]) {
  const db = createAdminClient();
  let count = 0;
  for (const m of items) {
    const externalId = String(m.id);
    const a = m.homeTeam?.name;
    const b = m.awayTeam?.name;
    const date = m.utcDate;
    if (!externalId || !a || !b || !date) continue;

    const finished = isFinished(m.status);
    const { error } = await db.from('pronos_matches').upsert({
      external_id: externalId,
      source: 'football-data-org',
      sport: 'football',
      team_a: a,
      team_b: b,
      match_date: date,
      league_name: competitionName,
      status: finished ? 'finished' : 'scheduled',
      team_a_score: finished ? m.score?.fullTime?.home ?? null : null,
      team_b_score: finished ? m.score?.fullTime?.away ?? null : null,
      api_status: m.status,
    }, { onConflict: 'source,external_id' });

    if (error) errors.push(`Supabase (${competitionName}, ${a} vs ${b}) : ${error.message}`);
    else count++;
  }
  return count;
}

export async function syncPronosMatches() {
  const from = new Date(Date.now() - 24 * 3600 * 1000);
  const to = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  let total = 0;
  const errors: string[] = [];
  const received: string[] = [];

  // Un seul appel par compétition (le endpoint accepte directement une
  // plage de dates) : 6 appels au total, largement sous les 10/minute.
  for (const [code, name] of COMPETITIONS) {
    try {
      const data = await apiGet(`/competitions/${code}/matches`, {
        dateFrom: ymd(from),
        dateTo: ymd(to),
      });
      const matches = data.matches ?? [];
      received.push(`${name} : ${matches.length} match(s) reçu(s) de l'API`);
      total += await upsertMatches(matches, name, errors);
    } catch (e: any) {
      errors.push(`${name} : ${e?.message ?? e}`);
    }
  }

  return { total, errors, received };
}
