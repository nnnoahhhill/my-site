import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.RESEND_FROM_EMAIL || 'noreply@nnnoahhhill.com', // Use your verified domain
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  if (!resend) {
    console.log('Resend not configured. Would send email:', { to, subject });
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}
