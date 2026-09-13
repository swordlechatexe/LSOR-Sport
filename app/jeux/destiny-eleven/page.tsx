'use client';

import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  POSITIONS,
  FEET,
  NATIONS,
  CREATION_STEPS,
  MAX_RETIRE_AGE,
  createCareer,
  nextEvent,
  playSeason,
  maybeGenerateOffer,
  signWith,
  stayAtClub,
  computeFinalScore,
  formatMoney,
  makeSeed,
  type CreationChoice,
  type CareerState,
  type Position,
  type Foot,
  type ClubTier,
  type SeasonEvent,
  type FinalCareerScore,
  type ClubOffer
} from '@/lib/destinyEleven';

type Phase = 'creation' | 'season' | 'offer' | 'result';

const START_TIER_CHOICES: { tier: ClubTier; label: string; desc: string }[] = [
  { tier: 'Régional', label: 'Club régional', desc: 'Titulaire direct, progression rapide, faible salaire.' },
  { tier: 'D2', label: 'Club de D2', desc: 'Plus relevé : du temps de jeu si tu es prêt, sinon la lutte.' }
];

function DestinyElevenInner() {
  const supabase = createClient();
  const params = useSearchParams();

  const duelSeedParam = params.get('duel');
  const [seed] = useState<number>(() => (duelSeedParam ? Number(duelSeedParam) : makeSeed()));
  const isDuel = Boolean(duelSeedParam);
  const seedRef = useMemo(() => ({ s: seed }), [seed]);

  const [phase, setPhase] = useState<Phase>('creation');
  const [step, setStep] = useState(0); // étape de création (0..4)

  const [choice, setChoice] = useState<CreationChoice>({
    name: '',
    position: 'ATT',
    nation: 'France',
    foot: 'Droit',
    origin: CREATION_STEPS[0].options[0].value,
    teenage: CREATION_STEPS[1].options[0].value,
    entourage: CREATION_STEPS[2].options[0].value,
    startClubTier: 'Régional'
  });

  const [career, setCareer] = useState<CareerState | null>(null);
  const [peak, setPeak] = useState(0);
  const [event, setEvent] = useState<SeasonEvent | null>(null);
  const [offer, setOffer] = useState<ClubOffer | null>(null);
  const [finalScore, setFinalScore] = useState<FinalCareerScore | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // total d'étapes de création : nom+poste (0), nationalité+pied (1), origine (2), ado (3), entourage (4), club (5)
  const CREATION_TOTAL = 6;

  function startCareer() {
    const c = createCareer(choice, seedRef);
    setPeak(c.overall);
    const { event: e, state: withHistory } = nextEvent(c, seedRef);
    setCareer(withHistory);
    setEvent(e);
    setPhase('season');
  }

  function afterSeason(next: CareerState, newPeak: number) {
    setPeak(newPeak);
    if (next.retired) {
      setCareer(next);
      finishCareer(next, newPeak);
      return;
    }
    // une offre arrive-t-elle ? (non forcé)
    const maybe = maybeGenerateOffer(next, seedRef);
    if (maybe) {
      setCareer(next);
      setOffer(maybe);
      setPhase('offer');
    } else {
      // pas d'offre : on reste, saison suivante
      const stayed = stayAtClub(next);
      const { event: e, state: withHistory } = nextEvent(stayed, seedRef);
      setCareer(withHistory);
      setEvent(e);
      setPhase('season');
    }
  }

  function chooseOption(optionIndex: number) {
    if (!career || !event) return;
    const option = event.options[optionIndex];
    const next = playSeason(career, option, seedRef);
    afterSeason(next, Math.max(peak, next.overall));
  }

  function acceptOffer() {
    if (!career || !offer) return;
    const signed = signWith(career, offer);
    setOffer(null);
    const { event: e, state: withHistory } = nextEvent(signed, seedRef);
    setCareer(withHistory);
    setEvent(e);
    setPhase('season');
  }
  function declineOffer() {
    if (!career) return;
    const stayed = stayAtClub(career);
    setOffer(null);
    const { event: e, state: withHistory } = nextEvent(stayed, seedRef);
    setCareer(withHistory);
    setEvent(e);
    setPhase('season');
  }

  async function finishCareer(finalState: CareerState, peakOverall: number) {
    const fs = computeFinalScore(finalState, peakOverall);
    setFinalScore(fs);
    setPhase('result');

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveMessage('Connecte-toi pour que ce score compte dans le classement !');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('destiny_eleven_results').insert({
      user_id: user.id,
      player_name: finalState.name,
      position: finalState.position,
      nation: finalState.nation,
      score: fs.score,
      peak_overall: fs.peakOverall,
      trophies: fs.trophies,
      caps: fs.caps,
      seasons: fs.seasons,
      money_k: Math.round(fs.money),
      duel_seed: isDuel ? seed : null
    });
    setSaving(false);
    setSaveMessage(
      error ? `Erreur d'enregistrement : ${error.message}` : 'Carrière enregistrée, ELO mis à jour.'
    );
  }

  function playAgain() {
    window.location.href = '/jeux/destiny-eleven';
  }

  function tierClass(t: ClubTier) {
    return t === 'Élite' ? 'elite' : t === 'D1' ? 'd1' : t === 'D2' ? 'd2' : 'reg';
  }
  function statusClass(s: string) {
    return s === 'Titulaire' ? 'start' : s === 'Rotation' ? 'rot' : 'bench';
  }

  return (
    <div className="wordle-wrap">
      <div className="section-head">
        <div>
          <h2>Destiny Eleven</h2>
          <p className="sub">
            {isDuel
              ? 'Duel : même destin de départ, seuls tes choix font la différence.'
              : 'Vis une carrière complète et vise le meilleur palmarès (/97).'}
          </p>
        </div>
        <Link href="/jeux">← Retour</Link>
      </div>

      {phase === 'creation' && (
        <div className="card wordle-card">
          <div className="de-progress">
            <span>Création</span>
            <strong>
              {step + 1} / {CREATION_TOTAL}
            </strong>
          </div>

          {step === 0 && (
            <>
              <h3>Identité</h3>
              <div className="field">
                <label>Nom du joueur</label>
                <input
                  value={choice.name}
                  maxLength={24}
                  placeholder="Ex : Zinedine Junior"
                  onChange={(e) => setChoice({ ...choice, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Poste</label>
                <div className="de-chips">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.value}
                      className={`de-chip ${choice.position === p.value ? 'active' : ''}`}
                      onClick={() => setChoice({ ...choice, position: p.value as Position })}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3>Nationalité & pied</h3>
              <div className="field">
                <label>Nationalité (influence la sélection et les titres internationaux)</label>
                <select
                  className="de-select"
                  value={choice.nation}
                  onChange={(e) => setChoice({ ...choice, nation: e.target.value })}
                >
                  {NATIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Pied fort</label>
                <div className="de-chips">
                  {FEET.map((f) => (
                    <button
                      key={f}
                      className={`de-chip ${choice.foot === f ? 'active' : ''}`}
                      onClick={() => setChoice({ ...choice, foot: f as Foot })}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step >= 2 && step <= 4 && (
            <>
              <h3>{CREATION_STEPS[step - 2].title}</h3>
              <div className="ue-candidates">
                {CREATION_STEPS[step - 2].options.map((o) => {
                  const key = CREATION_STEPS[step - 2].key;
                  const selected = (choice as any)[key] === o.value;
                  return (
                    <button
                      key={o.value}
                      className={`de-offer ${selected ? 'de-offer-sel' : ''}`}
                      onClick={() => setChoice({ ...choice, [key]: o.value } as CreationChoice)}
                    >
                      <div className="de-offer-top">
                        <strong>{o.label}</strong>
                      </div>
                      <div className="de-offer-sub">
                        <span>{o.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h3>Club de départ</h3>
              <p className="sub">À 16 ans, le temps de jeu prime souvent sur le prestige.</p>
              <div className="ue-candidates">
                {START_TIER_CHOICES.map((c) => (
                  <button
                    key={c.tier}
                    className={`de-offer ${choice.startClubTier === c.tier ? 'de-offer-sel' : ''}`}
                    onClick={() => setChoice({ ...choice, startClubTier: c.tier })}
                  >
                    <div className="de-offer-top">
                      <strong>{c.label}</strong>
                    </div>
                    <div className="de-offer-sub">
                      <span>{c.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="de-nav">
            {step > 0 && (
              <button className="ghost" onClick={() => setStep(step - 1)}>
                ← Retour
              </button>
            )}
            {step < CREATION_TOTAL - 1 ? (
              <button className="cta" onClick={() => setStep(step + 1)}>
                Suivant →
              </button>
            ) : (
              <button className="cta" onClick={startCareer}>
                Commencer la carrière →
              </button>
            )}
          </div>
        </div>
      )}

      {(phase === 'season' || phase === 'offer') && career && (
        <div className="card wordle-card">
          <div className="de-hud">
            <div className="de-hud-item">
              <small>ÂGE</small>
              <strong>{career.age}</strong>
            </div>
            <div className="de-hud-item">
              <small>NIVEAU</small>
              <strong>{career.overall}</strong>
            </div>
            <div className="de-hud-item">
              <small>FORME</small>
              <strong>{career.form}</strong>
            </div>
            <div className="de-hud-item">
              <small>MORAL</small>
              <strong>{career.morale}</strong>
            </div>
          </div>

          <div className="de-meta">
            <span>
              {career.name} · {career.club}
            </span>
            <span>
              🏆 {career.trophies} · 🌍 {career.intlTrophies} · 🎽 {career.capsNational}
            </span>
          </div>
          <div className="de-status-row">
            <span className={`de-badge tier-${tierClass(career.tier)}`}>{career.tier}</span>
            <span className={`de-badge status-${statusClass(career.status)}`}>{career.status}</span>
            <span className="de-badge wage">{formatMoney(career.wage)}/an</span>
            <span className="de-badge value">Valeur {formatMoney(career.marketValue)}</span>
          </div>

          {phase === 'season' && event && (
            <div className="de-event">
              <h3>{event.title}</h3>
              <p className="sub">{event.text}</p>
              <div className="ue-candidates">
                {event.options.map((opt, i) => (
                  <button key={i} className="ue-candidate" onClick={() => chooseOption(i)}>
                    <strong>{opt.label}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'offer' && offer && (
            <div className="de-event">
              <h3>Offre de transfert</h3>
              <p className="sub">
                {offer.name} ({offer.tier}) te veut. Statut probable là-bas :{' '}
                <strong>{offer.expectedStatus}</strong>. Salaire : {formatMoney(offer.wage)}/an.
                {offer.expectedStatus === 'Remplaçant'
                  ? ' Attention : tu risques le banc.'
                  : ''}
              </p>
              <div className="ue-candidates">
                <button className="ue-candidate" onClick={acceptOffer}>
                  <strong>Accepter et signer</strong>
                </button>
                <button className="ue-candidate" onClick={declineOffer}>
                  <strong>Rester à {career.club}</strong>
                </button>
              </div>
            </div>
          )}

          {career.log.length > 0 && (
            <div className="de-log">
              <small>Dernière saison</small>
              <p>{career.log[career.log.length - 1]}</p>
            </div>
          )}
          <p className="wordle-note">
            La carrière se termine automatiquement entre 35 et {MAX_RETIRE_AGE} ans.
          </p>
        </div>
      )}

      {phase === 'result' && finalScore && career && (
        <div className="card wordle-card">
          <h3>Carrière terminée</h3>
          <p style={{ fontSize: 40, fontWeight: 800, margin: '6px 0' }}>
            {finalScore.score}
            <span style={{ fontSize: 18, color: 'var(--muted)' }}> /97</span>
          </p>
          <p className="sub">
            {career.name} · {career.nation} · niveau max {finalScore.peakOverall} ·{' '}
            {formatMoney(finalScore.money)} gagnés
          </p>

          <div className="de-breakdown">
            {finalScore.breakdown.map((b) => (
              <div className="de-team-row" key={b.label}>
                <span>{b.label}</span>
                <strong className="elo">+{b.value}</strong>
              </div>
            ))}
          </div>

          <div className="de-meta" style={{ marginTop: 10 }}>
            <span>🏆 {finalScore.trophies}</span>
            <span>🌍 {finalScore.intlTrophies}</span>
            <span>🎽 {finalScore.caps}</span>
            <span>📅 {finalScore.seasons} saisons</span>
          </div>

          {isDuel && (
            <p className="wordle-note" style={{ marginTop: 10 }}>
              Duel : envoie ce lien à ton adversaire pour le même destin → <code>?duel={seed}</code>
            </p>
          )}
          {saving && <p className="wordle-note">Enregistrement…</p>}
          {saveMessage && <p className="wordle-note">{saveMessage}</p>}

          <button className="cta" style={{ width: '100%', marginTop: 12 }} onClick={playAgain}>
            Nouvelle carrière
          </button>
        </div>
      )}
    </div>
  );
}

export default function DestinyElevenPage() {
  return (
    <Suspense fallback={<div className="wordle-wrap" />}>
      <DestinyElevenInner />
    </Suspense>
  );
}
