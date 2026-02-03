import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })
  : null;

const FOOTGLOVE_BASE_PRICE = 13000; // $130 in cents
const ART_CAR_PRICE = 2850000; // $28,500 in cents
const EXPRESS_SHIPPING = 1000; // $10 in cents
const RUSH_SHIPPING = 2500; // $25 in cents

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured. Please set STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { shippingOption, product = 'footglove', couponCode } = body;

    let amount: number;
    let metadata: Record<string, string> = { product };

    if (product === 'art-car') {
      amount = ART_CAR_PRICE;
    } else {
      // footglove
      if (!['standard', 'express', 'rush'].includes(shippingOption)) {
        return NextResponse.json({ error: 'Invalid shipping option' }, { status: 400 });
      }
      amount = FOOTGLOVE_BASE_PRICE;
      if (shippingOption === 'express') {
        amount += EXPRESS_SHIPPING;
      } else if (shippingOption === 'rush') {
        amount += RUSH_SHIPPING;
      }
      metadata.shippingOption = shippingOption;
    }

    // Apply coupon discount if provided
    if (couponCode) {
      try {
        // Look up promotion code in Stripe
        const promotionCodes = await stripe.promotionCodes.list({
          code: couponCode.toUpperCase(),
          limit: 1,
          expand: ['data.coupon'],
        });

        if (promotionCodes.data.length > 0) {
          const promotionCode = promotionCodes.data[0];
          const couponId = (promotionCode as any).coupon;
          
          if (couponId) {
            const coupon = typeof couponId === 'string'
              ? await stripe.coupons.retrieve(couponId)
              : couponId;

            // Check if coupon is valid
            if (coupon && coupon.valid !== false) {
              // Check redemption limits
              const timesRedeemed = (promotionCode as any).times_redeemed || 0;
              if (!coupon.max_redemptions || timesRedeemed < coupon.max_redemptions) {
                let discountAmount: number;
                if (coupon.percent_off) {
                  discountAmount = (amount * coupon.percent_off) / 100;
                } else if (coupon.amount_off) {
                  discountAmount = coupon.amount_off; // Already in cents
                } else {
                  discountAmount = 0;
                }
                
                amount = Math.max(0, amount - discountAmount);
                metadata.couponCode = couponCode.toUpperCase();
                metadata.promotionCodeId = promotionCode.id;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error applying coupon:', error);
        // Continue without coupon if there's an error
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata,
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
