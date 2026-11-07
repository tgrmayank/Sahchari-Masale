import { NextResponse } from 'next/server';

/*
 * /product/:id is rewritten to /product in next.config.mjs, so the page itself
 * never sees the id. Middleware runs BEFORE that rewrite, so we copy the real
 * path into a request header. app/(site)/product/page.jsx reads it to build the
 * product-specific title, description, canonical, Open Graph and JSON-LD.
 * (Only runs for /product/... - nothing else is touched.)
 */
export function middleware(request) {
  const headers = new Headers(request.headers);
  headers.set('x-sm-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/product/:path*'] };
