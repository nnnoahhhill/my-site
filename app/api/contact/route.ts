import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

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

    // Send notification email to your personal email
    const personalEmail = process.env.PERSONAL_EMAIL || 'nnnoahhhill@gmail.com';
    await sendEmail({
      to: personalEmail,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    // Send confirmation email to the sender
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
        <p><strong>Sent to:</strong> ${email} (${name})</p>
        ${confirmationBody}
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
