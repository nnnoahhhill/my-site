import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (!process.env.KV_REST_API_URL) {
    console.warn("Vercel KV not configured.");
    return NextResponse.json({ status: 'mocked' });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  // Store permanent block
  await kv.set(`punish:${ip}`, 'true');
  
  return NextResponse.json({ status: 'punished' });
}
