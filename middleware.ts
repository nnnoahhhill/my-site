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

  const requestHeaders = new Headers(req.headers);
  
  // Pass preview query param to metadata generation via header
  const previewParam = req.nextUrl.searchParams.get('preview');
  if (previewParam) {
    requestHeaders.set('x-preview-index', previewParam);
  } else {
    // If no preview param, use timestamp to rotate images
    const timestamp = Date.now();
    const index = Math.abs(timestamp) % 6; // 6 preview images
    requestHeaders.set('x-preview-index', index.toString());
  }

  if (!process.env.KV_REST_API_URL) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
     const isPunished = await kv.get(`punish:${ip}`);
     if (isPunished) {
        requestHeaders.set('x-is-punished', 'true');
     }
  } catch (e) {
    console.error("KV Error", e);
  }
  
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add caching headers for better performance
  // Cache static assets and pages for 1 hour, revalidate in background
  if (req.nextUrl.pathname.startsWith('/_next/static') || 
      req.nextUrl.pathname.startsWith('/api/og-image')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  } else if (!req.nextUrl.pathname.startsWith('/api')) {
    // Cache pages for 5 minutes, allow stale content for 1 hour
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
