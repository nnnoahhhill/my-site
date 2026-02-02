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
    const personalEmail = process.env.PERSONAL_EMAIL || 'nnnoahhhill@gmail.com';
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
    const confirmationSubject = 'u knew i was kidding right';
    const confirmationBody = '<p>could never leave you hanging like that, of course ima hit you with some confirmation</p>';
    
    await sendEmail({
      to: email,
      subject: confirmationSubject,
      html: confirmationBody,
    });

    // Send a copy to personal inbox
    await sendEmail({
      to: personalEmail,
      subject: `[Copy] ${confirmationSubject}`,
      html: `
        <p><strong>Sent to:</strong> ${email}${name ? ` (${name})` : ''}</p>
        ${confirmationBody}
      `,
    });

    return NextResponse.json({ joined: true });
  } catch (error) {
    console.error('Cult API error:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
