'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const KEY_ROWS = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN'];

function normalize(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

type TileState = 'good' | 'close' | 'bad';
type Row = { letter: string; state: TileState }[];

function evaluateGuess(guess: string, answer: string): Row {
  const g = normalize(guess).split('');
  const a = normalize(answer).split('');
  const result: TileState[] = new Array(WORD_LENGTH).fill('bad');
  const used = new Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i] = 'good';
      used[i] = true;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'good') continue;
    const idx = a.findIndex((l, j) => l === g[i] && !used[j]);
    if (idx !== -1) {
      result[i] = 'close';
      used[idx] = true;
    }
  }

  return g.map((letter, i) => ({ letter, state: result[i] }));
}

export default function WordlePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [wordleDayId, setWordleDayId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null); // seulement connu côté client une fois la partie finie
  const [noWordToday, setNoWordToday] = useState(false);

  const [guesses, setGuesses] = useState<Row[]>([]);
  const [current, setCurrent] = useState('');
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const today = new Date().toISOString().slice(0, 10);
      const { data: day } = await supabase
        .from('wordle_days')
        .select('id, word')
        .eq('game_date', today)
        .maybeSingle();

      if (!day) {
        setNoWordToday(true);
        setLoading(false);
        return;
      }

      setWordleDayId(day.id);

      if (user) {
        const { data: existing } = await supabase
          .from('wordle_results')
          .select('guesses, won')
          .eq('wordle_day_id', day.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          setAlreadyPlayed(true);
          setWon(existing.won);
          setFinished(true);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  async function submitResult(finalGuesses: number, didWin: boolean) {
    if (!userId || !wordleDayId) return;
    await supabase.from('wordle_results').insert({
      wordle_day_id: wordleDayId,
      user_id: userId,
      guesses: finalGuesses,
      won: didWin
    });
  }

  function handleKey(key: string) {
    if (finished || !wordleDayId) return;

    if (key === 'ENTER') {
      if (current.length !== WORD_LENGTH) {
        setMessage('Il faut un mot de 5 lettres.');
        return;
      }
      submitGuess();
      return;
    }
    if (key === 'BACK') {
      setCurrent((c) => c.slice(0, -1));
      return;
    }
    if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent((c) => c + key);
    }
  }

  async function submitGuess() {
    if (!wordleDayId) return;
    setMessage(null);

    // Le mot n'est chargé dans le state qu'une fois la partie terminée
    // (on le récupère ici à chaque essai plutôt que de le garder en mémoire).
    const { data: day } = await supabase.from('wordle_days').select('word').eq('id', wordleDayId).single();
    if (!day) return;

    const row = evaluateGuess(current, day.word);
    const isWin = row.every((t) => t.state === 'good');
    const nextGuesses = [...guesses, row];
    setGuesses(nextGuesses);
    setCurrent('');

    if (isWin || nextGuesses.length >= MAX_GUESSES) {
      setFinished(true);
      setWon(isWin);
      if (isWin) setAnswer(day.word);
      else setAnswer(day.word);
      if (userId) await submitResult(nextGuesses.length, isWin);
      else setMessage('Connecte-toi pour que ta partie compte dans le classement !');
    }
  }

  const displayRows = useMemo(() => {
    const rows: (Row | null)[] = [...guesses];
    while (rows.length < MAX_GUESSES) rows.push(null);
    return rows;
  }, [guesses]);

  if (loading) {
    return (
      <div className="wordle-wrap">
        <p className="sub">Chargement…</p>
      </div>
    );
  }

  if (noWordToday) {
    return (
      <div className="wordle-wrap">
        <div className="section-head">
          <h2>Wordle</h2>
          <Link href="/jeux">← Retour</Link>
        </div>
        <div className="card wordle-card">
          <p>Le mot du jour n'a pas encore été configuré par un admin. Reviens plus tard !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wordle-wrap">
      <div className="section-head">
        <div>
          <h2>Wordle</h2>
          <p className="sub">Le mot du jour · 6 essais</p>
        </div>
        <Link href="/jeux">← Retour</Link>
      </div>
      <div className="card wordle-card">
        <div className="board">
          {displayRows.map((row, r) =>
            row
              ? row.map((tile, c) => (
                  <div className={`tile ${tile.state}`} key={`${r}-${c}`}>
                    {tile.letter}
                  </div>
                ))
              : Array.from({ length: WORD_LENGTH }).map((_, c) => (
                  <div className="tile" key={`${r}-${c}`}>
                    {r === guesses.length ? current[c] ?? '' : ''}
                  </div>
                ))
          )}
        </div>

        {alreadyPlayed && (
          <p className="wordle-note">Tu as déjà joué aujourd'hui : {won ? 'gagné 🎉' : 'perdu'}. Reviens demain !</p>
        )}
        {!alreadyPlayed && finished && (
          <p className="wordle-note">
            {won ? 'Bien joué ! 🎉' : `Perdu, le mot était ${answer ?? '???'}.`} Reviens demain pour un nouveau mot.
          </p>
        )}
        {message && <p className="wordle-note">{message}</p>}

        {!finished && (
          <div className="keyboard">
            {KEY_ROWS.map((row, i) => (
              <div className="key-row" key={i}>
                {row.split('').map((k) => (
                  <button key={k} className="key" onClick={() => handleKey(k)}>
                    {k}
                  </button>
                ))}
                {i === 2 && (
                  <>
                    <button className="key wide" onClick={() => handleKey('BACK')}>
                      ⌫
                    </button>
                    <button className="key wide" onClick={() => handleKey('ENTER')}>
                      ENTRÉE
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
