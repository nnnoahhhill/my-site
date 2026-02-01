import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const entry = {
      name,
      email,
      subject,
      message,
      timestamp: Date.now(),
    };

    // Store in KV list (or log if KV not configured)
    if (process.env.KV_REST_API_URL) {
      await kv.lpush('contact-submissions', JSON.stringify(entry));
    } else {
      console.log('Contact submission (KV not configured):', entry);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
