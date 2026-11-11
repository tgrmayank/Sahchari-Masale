import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { pushyPush, siteUrl } from '@/lib/pushy-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameSecret(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

/*
 * Called by the database (see supabase-push-setup.sql) every time a new row is
 * inserted into `orders`. The body carries the order summary and the admin device
 * tokens. Protected by a shared secret header.
 */
export async function POST(req) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  if (!secret || !process.env.PUSHY_SECRET_API_KEY) {
    return NextResponse.json({ error: 'Server is not configured' }, { status: 500 });
  }
  if (!sameSecret(req.headers.get('x-push-secret'), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); }

  const o = body.order || {};
  const items = Number(o.items || 0);
  const parts = [
    o.customer_name || 'New customer',
    items ? `${items} item${items > 1 ? 's' : ''}` : '',
    o.city || '',
    o.payment || '',
  ].filter(Boolean);

  const result = await pushyPush(body.tokens, {
    title: `New order  ${inr(o.total)}`,
    message: `${parts.join(' • ')}\nOrder ${o.id || ''}`.trim(),
    url: `${siteUrl()}/admin#orders`,
    order_id: String(o.id || ''),
  });

  return NextResponse.json({ ok: result.ok, error: result.error }, { status: result.ok ? 200 : 502 });
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
