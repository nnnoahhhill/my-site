import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mood, text, timestamp } = body;

    if (!mood || !['sad', 'neutral', 'happy', 'obscure'].includes(mood)) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 });
    }

    const entry = {
      mood,
      text: text || null,
      timestamp: timestamp || Date.now(),
    };

    // Store in KV list (or log if KV not configured)
    if (process.env.KV_REST_API_URL) {
      await kv.lpush('moods', JSON.stringify(entry));
    } else {
      console.log('Mood entry (KV not configured):', entry);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mood API error:', error);
    return NextResponse.json({ error: 'Failed to log mood' }, { status: 500 });
  }
}
