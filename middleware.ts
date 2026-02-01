import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { kv } from '@vercel/kv';

export async function middleware(req: NextRequest) {
  // Only run on page requests, skip static files/api
  if (req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.startsWith('/api') ||
      req.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.next();
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
     const isPunished = await kv.get(`punish:${ip}`);
     if (isPunished) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-is-punished', 'true');
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
     }
  } catch (e) {
    console.error("KV Error", e);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
