'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function InscriptionPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pseudo.trim().length < 2) {
      setError('Le pseudo doit faire au moins 2 caractères.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: pseudo.trim() } }
    });

    setLoading(false);
    if (error) {
      setError(error.message.includes('already registered') ? 'Cet email est déjà utilisé.' : error.message);
      return;
    }

    // Sans confirmation d'email, signUp ne renvoie pas de session : impossible
    // de continuer directement vers /profil (qui redirige vers /connexion).
    if (!data.session) {
      setNeedsConfirmation(true);
      return;
    }
    router.push('/profil');
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="auth">
        <div className="card">
          <div className="eyebrow">LSOR-SPORT</div>
          <h1>Vérifie ta boîte mail</h1>
          <p className="sub">
            Compte créé ! Un email de confirmation vient d'être envoyé à <strong>{email}</strong>. Clique sur le
            lien qu'il contient (pense à vérifier tes spams) avant de pouvoir te connecter.
          </p>
          <div className="switch" style={{ marginTop: 16 }}>
            <Link href="/connexion">Se connecter</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="card">
        <div className="eyebrow">LSOR-SPORT</div>
        <h1>Bienvenue</h1>
        <p className="sub">Crée ton compte avec ton email et ton mot de passe.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Pseudo</label>
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ton pseudo" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@email.fr" />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 12 }}>{error}</p>}
          <button className="cta" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
        <div className="switch">
          Déjà un compte ? <Link href="/connexion">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}
