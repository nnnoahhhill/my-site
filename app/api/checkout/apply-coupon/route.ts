import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set');
}

// Trigger Vercel deployment

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
    
    const { couponCode, subtotal } = body;

    console.log('Apply coupon request:', { couponCode, subtotal });

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
        // Expand coupon when retrieving by ID
        promotionCode = await stripe.promotionCodes.retrieve(trimmedCode, {
          expand: ['coupon'],
        });
        console.log('Retrieved promotion code by ID:', promotionCode.id, promotionCode.code, 'active:', promotionCode.active);
        if (!promotionCode.active) {
          console.error('Promotion code not active:', promotionCode.id);
          return NextResponse.json({ error: 'This promotion code is not active' }, { status: 400 });
        }
      } catch (error: any) {
        console.error('Error retrieving promotion code by ID:', error.message);
        return NextResponse.json({ error: 'Invalid promotion code ID' }, { status: 400 });
      }
    } else {
      // Look up by customer-facing code - Stripe handles case-insensitivity
      // Just use the code as-is, Stripe will match it case-insensitively
      console.log('Looking up promotion code:', trimmedCode);
      
      // FIRST: Get ALL promotion codes (no filters) to see what exists
      const allCodesBeforeFilter = await stripe.promotionCodes.list({
        limit: 100,
        expand: ['data.coupon'],
      });
      console.log('=== ALL PROMOTION CODES FROM STRIPE (BEFORE FILTER) ===');
      console.log('Total codes:', allCodesBeforeFilter.data.length);
      console.log('Full list:', JSON.stringify(allCodesBeforeFilter.data.map(pc => ({
        id: pc.id,
        code: pc.code,
        active: pc.active,
        times_redeemed: pc.times_redeemed,
        coupon: typeof (pc as any).coupon === 'string' ? (pc as any).coupon : (pc as any).coupon?.id,
      })), null, 2));
      
      // SECOND: Filter by code (no active filter yet)
      const codesByCode = await stripe.promotionCodes.list({
        code: trimmedCode,
        limit: 100,
        expand: ['data.coupon'],
      });
      console.log('=== PROMOTION CODES FILTERED BY CODE (no active filter) ===');
      console.log('Codes matching:', trimmedCode, 'Count:', codesByCode.data.length);
      console.log('Full list:', JSON.stringify(codesByCode.data.map(pc => ({
        id: pc.id,
        code: pc.code,
        active: pc.active,
        times_redeemed: pc.times_redeemed,
        coupon: typeof (pc as any).coupon === 'string' ? (pc as any).coupon : (pc as any).coupon?.id,
      })), null, 2));
      
      // THIRD: Filter by code AND active
      const promotionCodes = await stripe.promotionCodes.list({
        code: trimmedCode,
        limit: 100,
        active: true,
        expand: ['data.coupon'], // Expand coupon in list results
      });

      console.log('=== PROMOTION CODES FILTERED BY CODE + ACTIVE ===');
      console.log('Found promotion codes:', promotionCodes.data.length);
      if (promotionCodes.data.length > 0) {
        console.log('Promotion codes found:', JSON.stringify(promotionCodes.data.map(pc => ({
          id: pc.id,
          code: pc.code,
          active: pc.active,
          times_redeemed: pc.times_redeemed,
          coupon: typeof (pc as any).coupon === 'string' ? (pc as any).coupon : (pc as any).coupon?.id,
        })), null, 2));
      }

      if (promotionCodes.data.length === 0) {
        console.error('No promotion codes found for:', trimmedCode);
        // Try case-insensitive search by listing all and filtering
        const allPromoCodes = await stripe.promotionCodes.list({
          limit: 100,
          active: true,
          expand: ['data.coupon'],
        });
        console.log('=== ALL ACTIVE PROMOTION CODES (for case-insensitive search) ===');
        console.log('Total active codes:', allPromoCodes.data.length);
        console.log('Full list:', JSON.stringify(allPromoCodes.data.map(pc => ({
          id: pc.id,
          code: pc.code,
          active: pc.active,
          times_redeemed: pc.times_redeemed,
          coupon: typeof (pc as any).coupon === 'string' ? (pc as any).coupon : (pc as any).coupon?.id,
        })), null, 2));
        const caseInsensitiveMatch = allPromoCodes.data.find(
          pc => pc.code.toLowerCase() === trimmedCode.toLowerCase()
        );
        console.log('Case-insensitive match result:', caseInsensitiveMatch ? {
          id: caseInsensitiveMatch.id,
          code: caseInsensitiveMatch.code,
          active: caseInsensitiveMatch.active,
        } : 'NO MATCH');
        if (caseInsensitiveMatch) {
          console.log('Found case-insensitive match:', caseInsensitiveMatch.id, caseInsensitiveMatch.code);
          promotionCode = caseInsensitiveMatch;
        } else {
          // Last resort: try if it's a coupon ID (not a promotion code)
          console.log('Trying as coupon ID:', trimmedCode);
          try {
            const coupon = await stripe.coupons.retrieve(trimmedCode);
            console.log('Coupon found:', { id: coupon.id, valid: coupon.valid });
            // Find a promotion code that uses this coupon
            const promoCodesForCoupon = await stripe.promotionCodes.list({
              limit: 100,
              active: true,
              expand: ['data.coupon'],
            });
            console.log('=== ALL ACTIVE PROMOTION CODES (searching for coupon match) ===');
            console.log('Total active codes:', promoCodesForCoupon.data.length);
            console.log('Full list:', JSON.stringify(promoCodesForCoupon.data.map(pc => {
              const pcCoupon = (pc as any).coupon;
              return {
                id: pc.id,
                code: pc.code,
                active: pc.active,
                coupon_id: typeof pcCoupon === 'string' ? pcCoupon : pcCoupon?.id,
                matches_target_coupon: (pcCoupon?.id === coupon.id) || (typeof pcCoupon === 'string' && pcCoupon === coupon.id),
              };
            }), null, 2));
            const promoWithCoupon = promoCodesForCoupon.data.find(
              pc => {
                const pcCoupon = (pc as any).coupon;
                return (pcCoupon?.id === coupon.id) || (typeof pcCoupon === 'string' && pcCoupon === coupon.id);
              }
            );
            if (promoWithCoupon) {
              console.log('Found promotion code via coupon ID:', promoWithCoupon.id, promoWithCoupon.code);
              promotionCode = promoWithCoupon;
            } else {
              console.error('No promotion codes found (case-insensitive search and coupon ID search also failed)');
              return NextResponse.json({ error: 'Invalid coupon code. Please use the promotion code (e.g., YEPTHATSRIGHTENTIRELYFREENICE) or promotion code ID (promo_xxx)' }, { status: 400 });
            }
          } catch (couponError) {
            console.error('No promotion codes found (all searches failed)');
            return NextResponse.json({ error: 'Invalid coupon code. Please use the promotion code (e.g., YEPTHATSRIGHTENTIRELYFREENICE) or promotion code ID (promo_xxx)' }, { status: 400 });
          }
        }
      } else {
        // Get the first match (should be exact since Stripe handles case-insensitivity)
        promotionCode = promotionCodes.data[0];
        console.log('Using promotion code:', promotionCode.id, promotionCode.code);
      }
    }
    
    // Check if promotion code is active
    if (!promotionCode.active) {
      console.error('Promotion code not active:', promotionCode.id);
      return NextResponse.json({ error: 'This promotion code is not active' }, { status: 400 });
    }
    
    // Get coupon - it might be expanded already, nested in promotion.promotion.coupon, or just an ID
    let coupon;
    let couponId = (promotionCode as any).coupon;
    
    // Check if coupon is nested in promotion.promotion.coupon (newer Stripe API structure)
    if (!couponId && (promotionCode as any).promotion) {
      const promotion = (promotionCode as any).promotion;
      if (promotion.coupon) {
        couponId = promotion.coupon;
        console.log('Found coupon ID in promotion.promotion.coupon:', couponId);
      }
    }
    
    if (!couponId) {
      console.error('No coupon ID found for promotion code:', promotionCode.id);
      console.error('Promotion code object:', JSON.stringify(promotionCode, null, 2));
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }
    
    console.log('Coupon ID type:', typeof couponId, 'value:', couponId);
    
    if (typeof couponId === 'string') {
      console.log('Retrieving coupon by ID:', couponId);
      try {
        coupon = await stripe.coupons.retrieve(couponId);
      } catch (error: any) {
        console.error('Error retrieving coupon:', error.message);
        return NextResponse.json({ error: 'Failed to retrieve coupon' }, { status: 400 });
      }
    } else {
      // Already expanded
      coupon = couponId;
      console.log('Using expanded coupon:', coupon.id);
    }

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
      couponCode: promotionCode.code, // Return the actual code from Stripe (preserves original case)
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
