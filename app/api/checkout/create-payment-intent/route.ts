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
      
      // Apply coupon discount if provided
      if (couponCode) {
        const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed' }> = {
          'SAVE10': { discount: 10, type: 'percent' },
          'SAVE20': { discount: 20, type: 'percent' },
          'FREESHIP': { discount: 10, type: 'fixed' },
          'FRIEND': { discount: 15, type: 'percent' },
        };

        const coupon = COUPONS[couponCode.toUpperCase()];
        if (coupon) {
          let discountAmount: number;
          if (coupon.type === 'percent') {
            discountAmount = (amount * coupon.discount) / 100;
          } else {
            discountAmount = coupon.discount * 100; // Convert to cents
          }
          amount = Math.max(0, amount - discountAmount);
          metadata.couponCode = couponCode.toUpperCase();
        }
      }
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
      const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed' }> = {
        'SAVE10': { discount: 10, type: 'percent' },
        'SAVE20': { discount: 20, type: 'percent' },
        'FREESHIP': { discount: 10, type: 'fixed' },
        'FRIEND': { discount: 15, type: 'percent' },
      };

      const coupon = COUPONS[couponCode.toUpperCase()];
      if (coupon) {
        let discountAmount: number;
        if (coupon.type === 'percent') {
          discountAmount = (amount * coupon.discount) / 100;
        } else {
          discountAmount = coupon.discount * 100; // Convert to cents
        }
        amount = Math.max(0, amount - discountAmount);
        metadata.couponCode = couponCode.toUpperCase();
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
