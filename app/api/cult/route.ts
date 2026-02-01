import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const entry = {
      email,
      timestamp: Date.now(),
    };

    // Store in KV list (or log if KV not configured)
    if (process.env.KV_REST_API_URL) {
      await kv.lpush('cult-signups', JSON.stringify(entry));
    } else {
      console.log('Cult signup (KV not configured):', entry);
    }

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Cult API error:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
