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

    // Send notification email to your personal email
    const personalEmail = process.env.PERSONAL_EMAIL || 'your-email@example.com';
    await sendEmail({
      to: personalEmail,
      subject: `New Cult Signup: ${name || email}`,
      html: `
        <h2>New Cult Signup</h2>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    // Send confirmation email to the signup
    await sendEmail({
      to: email,
      subject: 'Welcome to the cult!',
      html: `
        <h2>Thanks for joining!</h2>
        <p>Hey ${name || 'there'},</p>
        <p>You're now part of the movement. We'll be in touch soon.</p>
        <p>Stay weird,</p>
        <p>Noah</p>
      `,
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Cult API error:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
