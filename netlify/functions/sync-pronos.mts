export default async () => {
  const base = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!base || !process.env.CRON_SECRET) throw new Error('URL/CRON_SECRET manquants.');
  const response = await fetch(`${base}/api/pronos/sync`, { method: 'POST', headers: { 'x-cron-secret': process.env.CRON_SECRET } });
  if (!response.ok) throw new Error(await response.text());
  return new Response(await response.text(), { status: 200 });
};

export const config = { schedule: '0 4 * * *' };
