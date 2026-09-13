'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function SyncProsButton(){
  const [busy,setBusy]=useState(false); const router=useRouter();
  async function sync(){
    setBusy(true);
    const r=await fetch('/api/pronos/sync',{method:'POST'});
    const d=await r.json();
    setBusy(false);
    if (!r.ok) { alert(d.error ?? 'Erreur'); return; }
    const received = d.received && d.received.length ? `\n\nReçu de l'API :\n- ${d.received.join('\n- ')}` : '';
    const detail = d.errors && d.errors.length ? `\n\nErreurs :\n- ${d.errors.join('\n- ')}` : '';
    alert(`Synchronisation terminée : ${d.total} matchs.${received}${detail}`);
    router.refresh();
  }
  return <button className="ghost" onClick={sync} disabled={busy}>{busy?'Sync…':'↻ Sync API'}</button>;
}
