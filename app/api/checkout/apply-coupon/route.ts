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
      console.error('Stripe not configured');
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { couponCode, product, subtotal } = body;

    console.log('Apply coupon request:', { couponCode, product, subtotal });

    if (!couponCode || typeof couponCode !== 'string') {
      console.error('Invalid couponCode:', couponCode);
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }
    
    if (typeof subtotal !== 'number' || subtotal < 0) {
      console.error('Invalid subtotal:', subtotal);
      return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 });
    }

    // Look up promotion code in Stripe
    // Promotion codes are case-insensitive per Stripe docs
    const trimmedCode = couponCode.trim();
    let promotionCode;
    
    // If it looks like a promotion code ID (starts with promo_), retrieve by ID
    if (trimmedCode.startsWith('promo_')) {
      try {
        promotionCode = await stripe.promotionCodes.retrieve(trimmedCode);
        if (!promotionCode.active) {
          return NextResponse.json({ error: 'This promotion code is not active' }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid promotion code ID' }, { status: 400 });
      }
    } else {
      // Look up by customer-facing code - Stripe handles case-insensitivity
      // Just use the code as-is, Stripe will match it case-insensitively
      console.log('Looking up promotion code:', trimmedCode);
      const promotionCodes = await stripe.promotionCodes.list({
        code: trimmedCode,
        limit: 100,
        active: true,
      });

      console.log('Found promotion codes:', promotionCodes.data.length);

      if (promotionCodes.data.length === 0) {
        console.error('No promotion codes found for:', trimmedCode);
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }

      // Get the first match (should be exact since Stripe handles case-insensitivity)
      promotionCode = promotionCodes.data[0];
      console.log('Using promotion code:', promotionCode.id, promotionCode.code);
    }
    
    // Check if promotion code is active
    if (!promotionCode.active) {
      console.error('Promotion code not active:', promotionCode.id);
      return NextResponse.json({ error: 'This promotion code is not active' }, { status: 400 });
    }
    
    const couponId = (promotionCode as any).coupon;
    
    if (!couponId) {
      console.error('No coupon ID found for promotion code:', promotionCode.id);
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }
    
    console.log('Retrieving coupon:', couponId);
    const coupon = typeof couponId === 'string' 
      ? await stripe.coupons.retrieve(couponId)
      : couponId;

    if (!coupon) {
      console.error('Coupon not found:', couponId);
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    console.log('Coupon details:', { 
      id: coupon.id, 
      valid: coupon.valid, 
      percent_off: coupon.percent_off, 
      amount_off: coupon.amount_off,
      max_redemptions: coupon.max_redemptions,
      times_redeemed: promotionCode.times_redeemed 
    });

    // Check if coupon is valid
    if (coupon.valid === false) {
      console.error('Coupon is not valid:', coupon.id);
      return NextResponse.json({ error: 'This coupon is no longer valid' }, { status: 400 });
    }

    // Check redemption limits
    if (coupon.max_redemptions && promotionCode.times_redeemed && promotionCode.times_redeemed >= coupon.max_redemptions) {
      console.error('Coupon redemption limit reached:', { 
        max: coupon.max_redemptions, 
        redeemed: promotionCode.times_redeemed 
      });
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

    console.log('Coupon applied successfully:', { 
      discountAmount, 
      subtotal, 
      promotionCodeId: promotionCode.id 
    });

    return NextResponse.json({ 
      discount: discountAmount,
      couponCode: couponCode.toUpperCase(),
      promotionCodeId: promotionCode.id,
    });
  } catch (error: any) {
    console.error('Coupon application error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}
