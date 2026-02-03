import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId, customerEmail, customerName, shippingAddress } = body;

    if (!paymentIntentId || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Retrieve payment intent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const product = paymentIntent.metadata.product || 'footglove';
    
    let emailHtml: string;
    let subject: string;

    if (product === 'art-car') {
      subject = 'Art Car Commission Confirmation';
      emailHtml = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Hey ${customerName || 'there'},</p>
          <p>Your art car commission has been confirmed!</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Custom art car build</li>
            <li>Delivery to playa (as early as you want)</li>
            <li>24/7 on-call support while at Black Rock City</li>
            <li>Delivery to wherever you want after</li>
            <li>Build documentation and sharing (if you're cool with that)</li>
          </ul>
          <p><strong>Order Total:</strong> $${(paymentIntent.amount / 100).toLocaleString()}</p>
          <p>I'll be in touch soon to discuss your vision and get started. Thanks for the commission!</p>
        </div>
      `;
    } else {
      const shippingOption = paymentIntent.metadata.shippingOption || 'standard';
      const shippingText = 
        shippingOption === 'rush' ? '3 days (Rush)' :
        shippingOption === 'express' ? '2 weeks (Express)' :
        '2 weeks (Standard)';
      
      subject = 'Footglove Order Confirmation';
      emailHtml = `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Confirmation</h2>
          <p>Hey ${customerName || 'there'},</p>
          <p>Your footglove order has been confirmed!</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>2 pairs of socks</li>
            <li>1 set of lights</li>
            <li>Shipping: ${shippingText}</li>
          </ul>
          <p><strong>Order Total:</strong> $${(paymentIntent.amount / 100).toFixed(2)}</p>
          <p>We'll send you tracking info once your order ships. Thanks for your order!</p>
        </div>
      `;
    }

    await sendEmail({
      to: customerEmail,
      subject,
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true,
      orderId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Order confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm order' },
      { status: 500 }
    );
  }
}
