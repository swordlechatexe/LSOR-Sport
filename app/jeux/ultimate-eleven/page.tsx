'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Pitch from '@/components/Pitch';
import {
  FORMATIONS,
  COUNTRIES,
  DECADES,
  computeTeamScore,
  type Formation,
  type Slot,
  type PlayerOption
} from '@/lib/ultimateEleven';

type Phase = 'choose_formation' | 'rolling' | 'listing' | 'assign_slot' | 'result';

function randomCountry() {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}
function randomDecade() {
  return DECADES[Math.floor(Math.random() * DECADES.length)];
}

export default function UltimateElevenPage() {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>('choose_formation');
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [team, setTeam] = useState<Record<string, PlayerOption>>({});

  const [country, setCountry] = useState('');
  const [decade, setDecade] = useState(0);
  const [countryRerolls, setCountryRerolls] = useState(1);
  const [decadeRerolls, setDecadeRerolls] = useState(1);

  const [candidates, setCandidates] = useState<PlayerOption[]>([]);
  const [pendingPlayer, setPendingPlayer] = useState<PlayerOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; avgRating: number; cohesionBonus: number } | null>(
    null
  );

  const allSlots = FORMATIONS[formation];
  const emptySlots = useMemo(() => allSlots.filter((s) => !team[s.key]), [allSlots, team]);
  const filledCount = allSlots.length - emptySlots.length;

  // Union de tous les postes encore ouverts : sert à la recherche de
  // candidats (on ne montre que des joueurs utiles pour au moins un
  // poste encore vide).
  const openPositions = useMemo(
    () => Array.from(new Set(emptySlots.flatMap((s) => s.accepts))),
    [emptySlots]
  );

  function eligibleSlotsFor(player: PlayerOption) {
    return emptySlots.filter((s) => s.accepts.some((pos) => player.positions.includes(pos)));
  }

  function startDraft() {
    setTeam({});
    setResult(null);
    setSaveMessage(null);
    setPendingPlayer(null);
    setPhase('rolling');
    setCountry(randomCountry());
    setDecade(randomDecade());
    setCountryRerolls(1);
    setDecadeRerolls(1);
  }

  function rerollCountry() {
    if (countryRerolls <= 0) return;
    setCountry(randomCountry());
    setCountryRerolls((n) => n - 1);
  }

  function rerollDecade() {
    if (decadeRerolls <= 0) return;
    setDecade(randomDecade());
    setDecadeRerolls((n) => n - 1);
  }

  // Recherche de candidats parmi TOUS les postes encore libres, avec
  // élargissement progressif si trop peu de résultats :
  //   1) décennie exacte  2) +/-10 ans  3) +/-20 ans
  //   4) même pays, toutes décennies  5) (dernier recours) tous pays confondus
  async function fetchCandidates(positions: string[], forCountry: string, forDecade: number, usedIds: string[]) {
    setLoading(true);
    setPhase('listing');

    async function queryBy(nationalityFilter: string | null, decadeWindow: number[] | null) {
      let query = supabase
        .from('players')
        .select('id, name, nationality, positions, decades, rating, active_years')
        .overlaps('positions', positions);
      if (nationalityFilter) query = query.eq('nationality', nationalityFilter);
      if (decadeWindow) query = query.overlaps('decades', decadeWindow);
      const { data } = await query;
      return ((data as PlayerOption[]) ?? [])
        .filter((p) => !usedIds.includes(p.id))
        .sort((a, b) => b.rating - a.rating);
    }

    const attempts: Array<[string | null, number[] | null]> = [
      [forCountry, [forDecade]],
      [forCountry, [forDecade - 10, forDecade, forDecade + 10]],
      [forCountry, [forDecade - 20, forDecade - 10, forDecade, forDecade + 10, forDecade + 20]],
      [forCountry, null],
      [null, null]
    ];

    let found: PlayerOption[] = [];
    for (const [nat, window] of attempts) {
      found = await queryBy(nat, window);
      if (found.length >= 2) break;
    }

    setCandidates(found.slice(0, 6));
    setLoading(false);
  }

  function draft() {
    fetchCandidates(openPositions, country, decade, Object.values(team).map((p) => p.id));
  }

  function skipEmptyDraw() {
    setCountry(randomCountry());
    setDecade(randomDecade());
    setCandidates([]);
    setPhase('rolling');
  }

  function chooseCandidate(player: PlayerOption) {
    const eligible = eligibleSlotsFor(player);
    if (eligible.length === 1) {
      assignPlayer(player, eligible[0]);
    } else {
      setPendingPlayer(player);
      setPhase('assign_slot');
    }
  }

  async function assignPlayer(player: PlayerOption, slot: Slot) {
    const nextTeam = { ...team, [slot.key]: player };
    setTeam(nextTeam);
    setPendingPlayer(null);

    if (Object.keys(nextTeam).length >= allSlots.length) {
      const finalTeam = Object.values(nextTeam);
      const scoreResult = computeTeamScore(finalTeam);
      setResult(scoreResult);
      setPhase('result');

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        setSaving(true);
        const teamPayload: Record<string, string> = {};
        Object.entries(nextTeam).forEach(([key, p]) => (teamPayload[key] = p.id));

        const { error } = await supabase.from('ultimate_eleven_results').insert({
          user_id: user.id,
          formation,
          score: scoreResult.score,
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
    setCountry(randomCountry());
    setDecade(randomDecade());
  }

  function playAgain() {
    setPhase('choose_formation');
    setTeam({});
    setResult(null);
    setSaveMessage(null);
  }

  return (
    <div className="wordle-wrap">
      <div className="section-head">
        <div>
          <h2>Ultimate Eleven</h2>
          <p className="sub">Tu choisis toi-même à quel poste aligner chaque joueur.</p>
        </div>
        <Link href="/jeux">← Retour</Link>
      </div>

      {phase === 'choose_formation' && (
        <div className="card wordle-card">
          <p>Choisis ta formation :</p>
          <div className="filter-row">
            {(Object.keys(FORMATIONS) as Formation[]).map((f) => (
              <button key={f} className={formation === f ? 'active' : ''} onClick={() => setFormation(f)}>
                {f}
              </button>
            ))}
          </div>
          <button className="cta" style={{ marginTop: 16 }} onClick={startDraft}>
            Commencer le tirage
          </button>
        </div>
      )}

      {(phase === 'rolling' || phase === 'listing' || phase === 'assign_slot') && (
        <div className="card wordle-card">
          <div className="ue-progress">
            <span>
              Round {filledCount + 1} / {allSlots.length}
            </span>
            <strong>{emptySlots.length} poste(s) restant(s)</strong>
          </div>

          {phase !== 'assign_slot' && (
            <div className="ue-reels">
              <div className="ue-reel">
                <small>PAYS</small>
                <strong>{country}</strong>
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
                <button className="ghost" onClick={rerollCountry} disabled={countryRerolls <= 0}>
                  🔄 Relancer pays ({countryRerolls} restant)
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
                  <p style={{ color: 'var(--muted)' }}>Aucun joueur dispo pour {country} · {decade}s.</p>
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
                          {p.positions.join('/')} · {p.nationality} · {p.active_years}
                        </small>
                      </div>
                      <span className="elo">{p.rating}</span>
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
                {Array.from(
                  new Map(eligibleSlotsFor(pendingPlayer).map((s) => [s.label, s])).values()
                ).map((slot) => (
                  <button
                    key={slot.key}
                    className="ue-candidate"
                    onClick={() => assignPlayer(pendingPlayer, slot)}
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
            <h3>Équipe en cours</h3>
          </div>
          <Pitch formation={formation} slots={allSlots} team={team} />
          <div className="ue-team-list">
            {allSlots.map((s) => (
              <div className="ue-team-row" key={s.key}>
                <span>{s.label}</span>
                <strong>{team[s.key]?.name ?? '—'}</strong>
                <span className="elo">{team[s.key]?.rating ?? ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="card wordle-card">
          <h3>Équipe complète !</h3>
          <p style={{ fontSize: 32, fontWeight: 800 }}>{result.score}</p>
          <p className="sub">
            Note moyenne {result.avgRating} · Bonus de cohésion +{result.cohesionBonus}
          </p>
          <Pitch formation={formation} slots={allSlots} team={team} />
          <div className="ue-team-list">
            {allSlots.map((s) => (
              <div className="ue-team-row" key={s.key}>
                <span>{s.label}</span>
                <strong>{team[s.key]?.name}</strong>
                <span className="elo">{team[s.key]?.rating}</span>
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
