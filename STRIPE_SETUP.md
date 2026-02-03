# Stripe Checkout Setup - Production Checklist

## Environment Variables

Add these to your production environment (Vercel, etc.):

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Stripe Dashboard Setup

1. **Create Stripe Account** (if you haven't)
   - Go to https://stripe.com
   - Sign up / Log in

2. **Get API Keys**
   - Dashboard → Developers → API keys
   - Copy your **Publishable key** (starts with `pk_live_`)
   - Copy your **Secret key** (starts with `sk_live_`)
   - ⚠️ Keep secret key secure, never commit to git

3. **Test Mode First** (recommended)
   - Use test keys first (`pk_test_` and `sk_test_`)
   - Test the full checkout flow
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date, any CVC

4. **Webhook Setup** (optional but recommended)
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

5. **Email Configuration**
   - Ensure `RESEND_API_KEY` is set (you already have this)
   - Ensure `RESEND_FROM_EMAIL` is set to your verified domain

## Product Configuration

Current pricing:
- Base: $130 (includes 2 pairs socks, 1 set lights, standard shipping)
- Express shipping: +$10 (2 weeks max)
- Rush shipping: +$25 (3 days)

To change pricing, edit:
- `app/api/checkout/create-payment-intent/route.ts` (BASE_PRICE, EXPRESS_SHIPPING, RUSH_SHIPPING)
- `app/checkout/page.tsx` (BASE_PRICE, EXPRESS_SHIPPING, RUSH_SHIPPING)

## Testing Checklist

- [ ] Test checkout with test card numbers
- [ ] Verify order confirmation email sends
- [ ] Test all shipping options (standard, express, rush)
- [ ] Verify payment intent creation works
- [ ] Test form validation (pay button enables when all fields filled)
- [ ] Test on mobile devices
- [ ] Verify physics animations work smoothly
- [ ] Test confirmation page redirect

## Production Deployment

1. **Set environment variables in production**
   - Add `STRIPE_SECRET_KEY` (live key)
   - Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (live key)

2. **Deploy to production**
   - Push to main branch
   - Vercel will auto-deploy

3. **Test live checkout**
   - Use real card (small amount) to test
   - Verify email sends
   - Check Stripe dashboard for payment

4. **Monitor**
   - Check Stripe dashboard for payments
   - Monitor email delivery (Resend dashboard)
   - Check server logs for errors

## Security Notes

- Never commit API keys to git
- Use environment variables only
- Stripe handles PCI compliance (you don't store card data)
- All payment processing happens server-side

## Support

If issues occur:
1. Check Stripe dashboard → Payments for failed attempts
2. Check server logs for API errors
3. Verify environment variables are set correctly
4. Test with Stripe test mode first
