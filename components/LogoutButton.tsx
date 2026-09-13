'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <button
      className="cta"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
      }}
    >
      Se déconnecter
    </button>
  );
}
