'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Court from '@/components/Court';
import {
  ROSTER_SLOTS,
  TEAMS,
  DECADES,
  simulateSeason,
  type NbaPlayerOption,
  type NbaPosition,
  type SeasonResult
} from '@/lib/eightyTwoO';

type Phase = 'rolling' | 'listing' | 'assign_slot' | 'result';

function randomTeam() {
  return TEAMS[Math.floor(Math.random() * TEAMS.length)];
}
function randomDecade() {
  return DECADES[Math.floor(Math.random() * DECADES.length)];
}

export default function EightyTwoOhPage() {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>('rolling');
  const [team, setTeam] = useState<Record<NbaPosition, NbaPlayerOption>>({} as any);

  const [rollTeam, setRollTeam] = useState<string>(() => randomTeam());
  const [decade, setDecade] = useState<number>(() => randomDecade());
  // 1 relance franchise + 1 relance décennie pour TOUT le draft (pas par tour).
  const [teamRerolls, setTeamRerolls] = useState(1);
  const [decadeRerolls, setDecadeRerolls] = useState(1);

  const [candidates, setCandidates] = useState<NbaPlayerOption[]>([]);
  const [pendingPlayer, setPendingPlayer] = useState<NbaPlayerOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SeasonResult | null>(null);

  const emptySlots = useMemo(() => ROSTER_SLOTS.filter((s) => !team[s.key]), [team]);
  const filledCount = ROSTER_SLOTS.length - emptySlots.length;
  const openPositions = useMemo(() => emptySlots.map((s) => s.key), [emptySlots]);

  function eligibleSlotsFor(player: NbaPlayerOption) {
    return emptySlots.filter((s) => player.positions.includes(s.key));
  }

  function startDraft() {
    setTeam({} as any);
    setResult(null);
    setSaveMessage(null);
    setPendingPlayer(null);
    setPhase('rolling');
    setRollTeam(randomTeam());
    setDecade(randomDecade());
    setTeamRerolls(1);
    setDecadeRerolls(1);
  }
  // Note : startDraft() (rerolls remis à 1) n'est appelé qu'au lancement
  // d'un nouveau draft (playAgain). Entre deux tours, on NE remet PAS les
  // relances à zéro : elles sont valables pour tout le draft, pas par tour.

  function rerollTeam() {
    if (teamRerolls <= 0) return;
    setRollTeam(randomTeam());
    setTeamRerolls((n) => n - 1);
  }
  function rerollDecade() {
    if (decadeRerolls <= 0) return;
    setDecade(randomDecade());
    setDecadeRerolls((n) => n - 1);
  }

  // Recherche de candidats parmi tous les postes encore libres, avec
  // élargissement progressif : décennie exacte -> +/-10 -> +/-20 ->
  // même franchise toutes décennies -> (dernier recours) toutes franchises.
  async function fetchCandidates(
    positions: NbaPosition[],
    forTeam: string,
    forDecade: number,
    usedIds: string[]
  ) {
    setLoading(true);
    setPhase('listing');

    async function queryBy(teamFilter: string | null, decadeWindow: number[] | null) {
      let query = supabase
        .from('nba_players')
        .select('id, name, team, positions, decades, ppg, rpg, apg, spg, bpg, active_years')
        .overlaps('positions', positions);
      if (teamFilter) query = query.eq('team', teamFilter);
      if (decadeWindow) query = query.overlaps('decades', decadeWindow);
      const { data } = await query;
      return ((data as NbaPlayerOption[]) ?? [])
        .filter((p) => !usedIds.includes(p.id))
        .sort((a, b) => b.ppg - a.ppg);
    }

    const attempts: Array<[string | null, number[] | null]> = [
      [forTeam, [forDecade]],
      [forTeam, [forDecade - 10, forDecade, forDecade + 10]],
      [forTeam, [forDecade - 20, forDecade - 10, forDecade, forDecade + 10, forDecade + 20]],
      [forTeam, null],
      [null, null]
    ];

    let found: NbaPlayerOption[] = [];
    for (const [t, window] of attempts) {
      found = await queryBy(t, window);
      if (found.length >= 2) break;
    }

    setCandidates(found.slice(0, 6));
    setLoading(false);
  }

  function draft() {
    fetchCandidates(openPositions, rollTeam, decade, Object.values(team).map((p) => p.id));
  }

  function skipEmptyDraw() {
    setRollTeam(randomTeam());
    setDecade(randomDecade());
    setCandidates([]);
    setPhase('rolling');
  }

  function chooseCandidate(player: NbaPlayerOption) {
    const eligible = eligibleSlotsFor(player);
    if (eligible.length === 1) {
      assignPlayer(player, eligible[0].key);
    } else {
      setPendingPlayer(player);
      setPhase('assign_slot');
    }
  }

  async function assignPlayer(player: NbaPlayerOption, slotKey: NbaPosition) {
    const nextTeam = { ...team, [slotKey]: player };
    setTeam(nextTeam);
    setPendingPlayer(null);

    if (Object.keys(nextTeam).length >= ROSTER_SLOTS.length) {
      const finalTeam = Object.values(nextTeam) as NbaPlayerOption[];
      const seasonResult = simulateSeason(finalTeam);
      setResult(seasonResult);
      setPhase('result');

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setSaving(true);
        const teamPayload: Record<string, string> = {};
        Object.entries(nextTeam).forEach(([key, p]) => (teamPayload[key] = (p as NbaPlayerOption).id));

        const { error } = await supabase.from('results_82_0').insert({
          user_id: user.id,
          wins: seasonResult.wins,
          losses: seasonResult.losses,
          team_ovr: seasonResult.teamOVR,
          grade: seasonResult.grade,
          team: teamPayload
        });
        setSaving(false);
        setSaveMessage(
          error ? `Erreur d'enregistrement : ${error.message}` : "Résultat enregistré, ton ELO a été mis à jour."
        );
      } else {
        setSaveMessage('Connecte-toi pour que ce score compte dans le classement !');
      }
      return;
    }

    setCandidates([]);
    setPhase('rolling');
    setRollTeam(randomTeam());
    setDecade(randomDecade());
  }

  function playAgain() {
    setTeam({} as any);
    setResult(null);
    setSaveMessage(null);
    startDraft();
  }

  return (
    <div className="wordle-wrap">
      <div className="section-head">
        <div>
          <h2>82-0</h2>
          <p className="sub">Construis un cinq NBA et vise la saison invaincue.</p>
        </div>
        <Link href="/jeux">← Retour</Link>
      </div>

      {(phase === 'rolling' || phase === 'listing' || phase === 'assign_slot') && (
        <div className="card wordle-card">
          <div className="ue-progress">
            <span>
              Tour {filledCount + 1} / {ROSTER_SLOTS.length}
            </span>
            <strong>{emptySlots.length} poste(s) restant(s)</strong>
          </div>

          {phase !== 'assign_slot' && (
            <div className="ue-reels">
              <div className="ue-reel">
                <small>FRANCHISE</small>
                <strong>{rollTeam}</strong>
              </div>
              <div className="ue-reel">
                <small>DÉCENNIE</small>
                <strong>{decade}s</strong>
              </div>
            </div>
          )}

          {phase === 'rolling' && (
            <>
              <div className="ue-reroll-row">
                <button className="ghost" onClick={rerollTeam} disabled={teamRerolls <= 0}>
                  🔄 Relancer franchise ({teamRerolls} restant)
                </button>
                <button className="ghost" onClick={rerollDecade} disabled={decadeRerolls <= 0}>
                  🔄 Relancer décennie ({decadeRerolls} restant)
                </button>
              </div>
              <button className="cta" style={{ marginTop: 12, width: '100%' }} onClick={draft}>
                DRAFT
              </button>
            </>
          )}

          {phase === 'listing' && (
            <>
              {loading ? (
                <p style={{ color: 'var(--muted)' }}>Chargement…</p>
              ) : candidates.length === 0 ? (
                <>
                  <p style={{ color: 'var(--muted)' }}>
                    Aucun joueur dispo pour {rollTeam} · {decade}s.
                  </p>
                  <button className="ghost" onClick={skipEmptyDraw}>
                    Nouveau tirage (gratuit)
                  </button>
                </>
              ) : (
                <div className="ue-candidates">
                  {candidates.map((p) => (
                    <button key={p.id} className="ue-candidate" onClick={() => chooseCandidate(p)}>
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.positions.join('/')} · {p.team} · {p.active_years}
                        </small>
                      </div>
                      <span className="elo">{p.ppg} pts</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {phase === 'assign_slot' && pendingPlayer && (
            <>
              <p>
                <strong>{pendingPlayer.name}</strong> peut jouer à plusieurs postes encore libres. Où
                l'aligner ?
              </p>
              <div className="ue-candidates">
                {eligibleSlotsFor(pendingPlayer).map((slot) => (
                  <button
                    key={slot.key}
                    className="ue-candidate"
                    onClick={() => assignPlayer(pendingPlayer, slot.key)}
                  >
                    <strong>{slot.label}</strong>
                  </button>
                ))}
              </div>
              <button
                className="ghost"
                style={{ marginTop: 10 }}
                onClick={() => {
                  setPendingPlayer(null);
                  setPhase('listing');
                }}
              >
                ← Choisir un autre joueur
              </button>
            </>
          )}

          <div className="section-head" style={{ marginTop: 18 }}>
            <h3>Cinq en cours</h3>
          </div>
          <Court team={team} />
          <div className="ue-team-list">
            {ROSTER_SLOTS.map((s) => (
              <div className="ue-team-row" key={s.key}>
                <span>{s.label}</span>
                <strong>{team[s.key]?.name ?? '—'}</strong>
                <span className="elo">{team[s.key]?.ppg ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="card wordle-card">
          <h3>Saison simulée !</h3>
          <p style={{ fontSize: 40, fontWeight: 800, margin: '6px 0' }}>
            {result.wins}-{result.losses}
          </p>
          <p className="sub">
            {result.grade} — {result.gradeLabel} · Team OVR {result.teamOVR}
          </p>
          <div className="ue-team-list">
            <div className="ue-team-row">
              <span>Points/match</span>
              <strong>{result.teamPPG}</strong>
              <span />
            </div>
            <div className="ue-team-row">
              <span>Rebonds/match</span>
              <strong>{result.teamRPG}</strong>
              <span />
            </div>
            <div className="ue-team-row">
              <span>Passes/match</span>
              <strong>{result.teamAPG}</strong>
              <span />
            </div>
            <div className="ue-team-row">
              <span>Interceptions/match</span>
              <strong>{result.teamSPG}</strong>
              <span />
            </div>
            <div className="ue-team-row">
              <span>Contres/match</span>
              <strong>{result.teamBPG}</strong>
              <span />
            </div>
          </div>
          <div className="section-head" style={{ marginTop: 14 }}>
            <h3>Le cinq</h3>
          </div>
          <Court team={team} />
          <div className="ue-team-list">
            {ROSTER_SLOTS.map((s) => (
              <div className="ue-team-row" key={s.key}>
                <span>{s.label}</span>
                <strong>{team[s.key]?.name}</strong>
                <span className="elo">{team[s.key]?.team}</span>
              </div>
            ))}
          </div>
          {saving && <p className="wordle-note">Enregistrement…</p>}
          {saveMessage && <p className="wordle-note">{saveMessage}</p>}
          <button className="cta" style={{ marginTop: 12 }} onClick={playAgain}>
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
