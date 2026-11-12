import { NextResponse } from 'next/server';
import { pushyPush, siteUrl } from '@/lib/pushy-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Admin-only: sends a test notification to ONE device token. The caller must be a signed-in admin. */
export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = req.headers.get('authorization') || '';
  if (!url || !anon || !/^Bearer\s+\S+/.test(auth)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ask Supabase (as that user) whether they are an admin
  let isAdmin = false;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    isAdmin = r.ok && (await r.json()) === true;
  } catch {}
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let token = '';
  let platform = 'web';
  try {
    const j = await req.json();
    token = String(j.token || '');
    platform = j.platform === 'android' ? 'android' : 'web';
  } catch {}
  if (!/^[A-Za-z0-9_\-:.]{10,300}$/.test(token)) return NextResponse.json({ error: 'Bad token' }, { status: 400 });

  const result = await pushyPush([token], {
    title: 'Notifications are ON',
    message: 'You will get an alert here for every new order.',
    url: `${siteUrl()}/admin#orders`,
  }, platform);
  return NextResponse.json({ ok: result.ok, error: result.error }, { status: result.ok ? 200 : 502 });
}
