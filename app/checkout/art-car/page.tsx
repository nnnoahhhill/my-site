'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const ITEMS = [
  { id: 'name', mass: 15 },
  { id: 'email', mass: 15 },
  { id: 'address', mass: 20 },
  { id: 'city', mass: 15 },
  { id: 'state', mass: 15 },
  { id: 'zip', mass: 15 },
  { id: 'desc1', label: 'delivery to playa', mass: 20 },
  { id: 'desc2', label: '24/7 on-call support at Black Rock City', mass: 25 },
  { id: 'desc3', label: 'delivery after', mass: 20 },
  { id: 'summary', mass: 25 },
  { id: 'wallet', mass: 25 },
  { id: 'card', mass: 30 },
  { id: 'pay', mass: 20 },
];

const BASE_PRICE = 28500;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { randomMode, brightness, getColorFromHomePalette } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);

  const borderColor = brightness > 0 ? '#000' : '#fff';
  const textColor = brightness > 0 ? '#000' : '#fff';

  const isValid = 
    formData.name.length > 0 &&
    formData.email.includes('@') &&
    formData.address.length > 0 &&
    formData.city.length > 0 &&
    formData.state.length > 0 &&
    formData.zip.length >= 5 &&
    cardComplete &&
    stripe &&
    elements;

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label || item.id,
      mass: item.mass
    }));
    items.push({
      id: 'back-button',
      label: '←',
      mass: Infinity,
      static: true,
      x: 12,
      y: undefined,
    });
    return items;
  }, []);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach((item, index) => {
      colors[item.id] = getColorFromHomePalette(`${item.id}-${index}`);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette]);

  // Set up Payment Request (Apple Pay, Google Pay, etc.)
  useEffect(() => {
    if (!stripe || !elements) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Art Car Commission',
        amount: BASE_PRICE * 100,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setWalletAvailable(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        const intentRes = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: 'art-car' }),
        });

        if (!intentRes.ok) throw new Error('Failed to create payment intent');
        const { clientSecret } = await intentRes.json();

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          throw new Error(confirmError.message);
        }

        const customerName = ev.payerName || '';
        const customerEmail = ev.payerEmail || formData.email || '';

        await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent!.id,
            customerEmail,
            customerName,
            shippingAddress: {
              address: (ev.shippingAddress as any)?.line1 || formData.address,
              city: ev.shippingAddress?.city || formData.city,
              state: ev.shippingAddress?.state || formData.state,
              zip: ev.shippingAddress?.postal_code || formData.zip,
            },
          }),
        });

        ev.complete('success');
        router.push(`/checkout/confirm?orderId=${paymentIntent!.id}`);
      } catch (error: any) {
        console.error('Wallet payment error:', error);
        ev.complete('fail');
        alert(error.message || 'Payment failed. Please try again.');
      }
    });
  }, [stripe, elements, formData.email, formData.address, formData.city, formData.state, formData.zip, router]);

  const handleSubmit = async () => {
    if (!isValid || processing) return;
    setProcessing(true);

    try {
      const intentRes = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'art-car' }),
      });

      if (!intentRes.ok) throw new Error('Failed to create payment intent');
      const { clientSecret } = await intentRes.json();

      const cardElement = elements!.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.name,
            email: formData.email,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip,
              country: 'US',
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent!.id,
          customerEmail: formData.email,
          customerName: formData.name,
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      });

      router.push(`/checkout/confirm?orderId=${paymentIntent!.id}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const inputStyle = {
    background: 'transparent',
    border: `3px solid ${borderColor}`,
    color: textColor,
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
    pointerEvents: 'auto' as const,
    width: 'clamp(200px, 70vw, 300px)',
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
        color: textColor,
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: textColor,
          opacity: 0.6,
        },
      },
      invalid: {
        color: '#fa755a',
      },
    },
    hidePostalCode: false,
  };

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div
        ref={registerRef('back-button')}
        style={{
          position: 'absolute',
          fontSize: '1.5rem',
          padding: '0.5rem',
          lineHeight: 1,
          width: '2.5rem',
          height: '2.5rem',
          pointerEvents: 'none',
          opacity: 0,
        }}
        aria-hidden="true"
      >
        ←
      </div>
      <style>{`
        input::placeholder,
        textarea::placeholder {
          color: ${textColor};
          opacity: 0.6;
        }
        .StripeElement {
          background: transparent !important;
          border: 3px solid ${borderColor} !important;
          padding: 0.5rem !important;
          width: clamp(200px, 70vw, 300px) !important;
          border-radius: 0 !important;
        }
        .StripeElement--focus {
          border-color: ${borderColor} !important;
        }
        input, select, textarea {
          border: 3px solid ${borderColor} !important;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: ${borderColor} !important;
        }
      `}</style>
      {ITEMS.filter(item => {
        if (item.id === 'wallet' && !walletAvailable) return false;
        return true;
      }).map(item => {
        const color = itemColors[item.id];
        const style = { color };

        let content;
        if (item.id === 'name') {
          content = (
            <input
              type="text"
              placeholder="Name"
              style={inputStyle}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          );
        } else if (item.id === 'email') {
          content = (
            <input
              type="email"
              placeholder="Email"
              style={inputStyle}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          );
        } else if (item.id === 'address') {
          content = (
            <input
              type="text"
              placeholder="Street Address"
              style={inputStyle}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          );
        } else if (item.id === 'city') {
          content = (
            <input
              type="text"
              placeholder="City"
              style={{...inputStyle, width: 'clamp(150px, 50vw, 200px)'}}
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          );
        } else if (item.id === 'state') {
          content = (
            <input
              type="text"
              placeholder="State"
              style={{...inputStyle, width: 'clamp(100px, 30vw, 150px)'}}
              value={formData.state}
              onChange={e => setFormData({...formData, state: e.target.value})}
            />
          );
        } else if (item.id === 'zip') {
          content = (
            <input
              type="text"
              placeholder="ZIP"
              style={{...inputStyle, width: 'clamp(100px, 30vw, 150px)'}}
              value={formData.zip}
              onChange={e => setFormData({...formData, zip: e.target.value})}
            />
          );
        } else if (item.id === 'desc1' || item.id === 'desc2' || item.id === 'desc3') {
          content = <span style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)' }}>{item.label}</span>;
        } else if (item.id === 'summary') {
          content = (
            <div style={{ width: 'clamp(250px, 70vw, 400px)', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)' }}>
              <div style={{ fontWeight: 'bold' }}>
                Total: ${BASE_PRICE.toLocaleString()}
              </div>
            </div>
          );
        } else if (item.id === 'wallet') {
          content = (
            <div style={{ width: 'clamp(200px, 70vw, 300px)' }}>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: 'light',
                      height: '48px',
                    },
                  },
                }}
              />
            </div>
          );
        } else if (item.id === 'card') {
          content = (
            <div style={{ width: 'clamp(200px, 70vw, 300px)' }}>
              <div style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)', marginBottom: '0.5rem', color: textColor }}>
                or enter card details:
              </div>
              <CardElement
                options={cardElementOptions}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </div>
          );
        } else if (item.id === 'pay') {
          content = (
            <button
              disabled={!isValid || processing}
              onClick={handleSubmit}
              style={{
                ...inputStyle,
                cursor: isValid && !processing ? 'pointer' : 'not-allowed',
                opacity: isValid && !processing ? 1 : 0.5,
                fontWeight: 'bold',
              }}
            >
              {processing ? 'Processing...' : `Pay $${BASE_PRICE.toLocaleString()}`}
            </button>
          );
        }

        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            style={style}
          >
            {content}
          </FloatingItem>
        );
      })}
    </main>
  );
}

export default function ArtCarCheckoutPage() {
  if (!stripePromise) {
    return (
      <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Stripe not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</div>
      </main>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
