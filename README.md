# Noah Hill Minimal Site

This is a scaffold for the floating minimalist site.

## Email & Database Setup

### Vercel KV (Database)

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **KV**
3. Create a new KV database
4. Vercel will automatically add these environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Resend (Email)

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add to Vercel environment variables:
   - `RESEND_API_KEY` - Your Resend API key
   - `PERSONAL_EMAIL` - Your personal email address (where you want to receive notifications)

**Note:** For production, you'll need to verify a domain with Resend. For development/testing, you can use `onboarding@resend.dev` as the sender (limited to test emails).

### Environment Variables Summary

Add these to your Vercel project (Settings → Environment Variables):

- `RESEND_API_KEY` - From Resend dashboard
- `PERSONAL_EMAIL` - Your email address
- `KV_REST_API_URL` - Auto-added by Vercel KV
- `KV_REST_API_TOKEN` - Auto-added by Vercel KV
- `KV_REST_API_READ_ONLY_TOKEN` - Auto-added by Vercel KV

For local development, create a `.env.local` file with these variables.
