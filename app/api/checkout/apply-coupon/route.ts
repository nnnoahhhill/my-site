import { NextRequest, NextResponse } from 'next/server';

// Define your coupon codes here
const COUPONS: Record<string, { discount: number; type: 'percent' | 'fixed' }> = {
  'SAVE10': { discount: 10, type: 'percent' },
  'SAVE20': { discount: 20, type: 'percent' },
  'FREESHIP': { discount: 10, type: 'fixed' }, // Example: $10 off
  'FRIEND': { discount: 15, type: 'percent' },
  // Add more coupons as needed
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { couponCode, product, subtotal } = body;

    if (!couponCode) {
      return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });
    }

    const coupon = COUPONS[couponCode.toUpperCase()];
    
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    let discountAmount: number;
    if (coupon.type === 'percent') {
      discountAmount = (subtotal * coupon.discount) / 100;
    } else {
      discountAmount = coupon.discount;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({ 
      discount: discountAmount,
      couponCode: couponCode.toUpperCase(),
    });
  } catch (error) {
    console.error('Coupon application error:', error);
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    );
  }
}
