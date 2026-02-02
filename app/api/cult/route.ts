import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const entry = {
      email,
      name: name || '',
      timestamp: Date.now(),
    };

    // Store in KV list (or log if KV not configured)
    if (process.env.KV_REST_API_URL) {
      await kv.lpush('cult-signups', JSON.stringify(entry));
    } else {
      console.log('Cult signup (KV not configured):', entry);
    }

    // Send confirmation email to the signup
    await sendEmail({
      to: email,
      subject: 'u knew i was kidding right',
      html: '<p>could never leave you hanging like that, of course ima hit you with some confirmation</p>',
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Cult API error:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
