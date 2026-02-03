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

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { couponCode, product, subtotal } = body;

    if (!couponCode) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    // Look up promotion code in Stripe - try both uppercase and original case
    let promotionCodes = await stripe.promotionCodes.list({
      code: couponCode.toUpperCase(),
      limit: 10, // Get more results to check
    });

    // If not found, try original case
    if (promotionCodes.data.length === 0) {
      promotionCodes = await stripe.promotionCodes.list({
        code: couponCode,
        limit: 10,
      });
    }

    // If still not found, try lowercase
    if (promotionCodes.data.length === 0) {
      promotionCodes = await stripe.promotionCodes.list({
        code: couponCode.toLowerCase(),
        limit: 10,
      });
    }

    // Find exact match (case-insensitive)
    const exactMatch = promotionCodes.data.find(
      pc => pc.code.toLowerCase() === couponCode.toLowerCase()
    );

    if (!exactMatch) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    const promotionCode = exactMatch;
    const couponId = (promotionCode as any).coupon;
    
    if (!couponId) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }
    
    const coupon = typeof couponId === 'string' 
      ? await stripe.coupons.retrieve(couponId)
      : couponId;

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check if coupon is valid
    if (coupon.valid === false) {
      return NextResponse.json({ error: 'This coupon is no longer valid' }, { status: 400 });
    }

    // Check redemption limits
    if (coupon.max_redemptions && promotionCode.times_redeemed && promotionCode.times_redeemed >= coupon.max_redemptions) {
      return NextResponse.json({ error: 'This coupon has reached its redemption limit' }, { status: 400 });
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.percent_off) {
      discountAmount = (subtotal * coupon.percent_off) / 100;
    } else if (coupon.amount_off) {
      discountAmount = coupon.amount_off / 100; // Convert from cents to dollars
    } else {
      return NextResponse.json({ error: 'Invalid coupon configuration' }, { status: 400 });
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({ 
      discount: discountAmount,
      couponCode: couponCode.toUpperCase(),
      promotionCodeId: promotionCode.id,
    });
  } catch (error: any) {
    console.error('Coupon application error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}
