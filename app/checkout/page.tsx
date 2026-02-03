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
  { id: 'shipping', mass: 20 },
  { id: 'coupon', mass: 15 },
  { id: 'summary', mass: 25 },
  { id: 'wallet', mass: 25 },
  { id: 'card', mass: 30 },
  { id: 'pay', mass: 20 },
];

const BASE_PRICE = 130;
const EXPRESS_SHIPPING = 10;
const RUSH_SHIPPING = 25;

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
  const [shippingOption, setShippingOption] = useState<'standard' | 'express' | 'rush'>('standard');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [walletAvailable, setWalletAvailable] = useState(false);

  const borderColor = brightness > 0 ? '#000' : '#fff'; // Black in light mode, white in dark mode
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const mobileXPadding = 24; // Increased padding to prevent overflow
    
    // Define mobile order: name, email, address, city, state, zip, shipping, coupon, summary, wallet, card, pay
    const mobileOrderMap: Record<string, number> = {
      'name': 1,
      'email': 2,
      'address': 3,
      'city': 4,
      'state': 5,
      'zip': 6,
      'shipping': 7,
      'coupon': 8,
      'summary': 9,
      'wallet': 10,
      'card': 11,
      'pay': 12,
    };

    const items: PhysicsItemDef[] = ITEMS.map(item => {
      const baseDef: PhysicsItemDef = {
        id: item.id,
        label: (item as any).label || item.id,
        mass: item.mass
      };
      
      if (isMobile && mobileOrderMap[item.id] !== undefined) {
        baseDef.mobileOrder = mobileOrderMap[item.id];
        baseDef.mobileX = mobileXPadding;
      }
      
      return baseDef;
    });
    
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

  const subtotal = BASE_PRICE + (shippingOption === 'express' ? EXPRESS_SHIPPING : shippingOption === 'rush' ? RUSH_SHIPPING : 0);
  const total = Math.max(0, subtotal - discount);

  // Apply coupon code
  const handleCouponApply = async () => {
    if (!couponCode.trim()) return;
    
    const currentSubtotal = BASE_PRICE + (shippingOption === 'express' ? EXPRESS_SHIPPING : shippingOption === 'rush' ? RUSH_SHIPPING : 0);
    
    try {
      const res = await fetch('/api/checkout/apply-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          couponCode: couponCode.trim().toUpperCase(),
          product: 'footglove',
          subtotal: currentSubtotal,
        }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Invalid coupon code');
        return;
      }
      
      const { discount: discountAmount } = await res.json();
      setDiscount(discountAmount);
    } catch (error) {
      console.error('Coupon error:', error);
      alert('Failed to apply coupon');
    }
  };

  // Set up Payment Request (Apple Pay, Google Pay, etc.)
  useEffect(() => {
    if (!stripe || !elements) return;

    const currentTotal = Math.max(0, subtotal - discount);

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Footglove Order',
        amount: currentTotal * 100, // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: false,
      requestShipping: false,
    });

    // Check if payment methods are available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setWalletAvailable(true);
      } else {
        setWalletAvailable(false);
      }
    });

    // Update payment request when total changes
    pr.update({
      total: {
        label: 'Footglove Order',
        amount: currentTotal * 100,
      },
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        // Create payment intent
        const intentRes = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shippingOption }),
        });

        if (!intentRes.ok) throw new Error('Failed to create payment intent');
        const { clientSecret } = await intentRes.json();

        // Confirm payment with wallet
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          throw new Error(confirmError.message);
        }

        // Get customer info from payment request
        const customerName = ev.payerName || '';
        const customerEmail = ev.payerEmail || formData.email || '';

        // Confirm order and send email
        await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent!.id,
            customerEmail,
            customerName,
            shippingAddress: {
              address: (ev.shippingAddress as any)?.line1 || formData.address,
              city: (ev.shippingAddress as any)?.city || formData.city,
              state: (ev.shippingAddress as any)?.state || formData.state,
              zip: (ev.shippingAddress as any)?.postal_code || formData.zip,
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

    return () => {
      // Cleanup
      setPaymentRequest(null);
      setWalletAvailable(false);
    };
  }, [stripe, elements, shippingOption, subtotal, discount, router]);

  const handleSubmit = async () => {
    if (!isValid || processing) return;
    setProcessing(true);

    try {
      // Create payment intent
      const intentRes = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shippingOption,
          couponCode: couponCode.trim().toUpperCase() || undefined,
        }),
      });

      if (!intentRes.ok) {
        const errorData = await intentRes.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to create payment intent');
      }
      const { clientSecret } = await intentRes.json();

      // Confirm payment
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

      // Confirm order and send email
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

      // Redirect to confirmation page
      router.push(`/checkout/confirm?orderId=${paymentIntent!.id}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  const inputStyle = {
    background: 'transparent',
    border: `3px solid ${borderColor}`,
    color: textColor,
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: isMobile ? '0.9rem' : 'clamp(0.8rem, 2.5vw, 1rem)',
    pointerEvents: 'auto' as const,
    width: isMobile ? 'calc(100vw - 48px)' : 'clamp(200px, 70vw, 300px)',
    maxWidth: isMobile ? 'calc(100vw - 48px)' : 'clamp(200px, 70vw, 300px)',
    boxSizing: 'border-box' as const,
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
    autocomplete: 'cc-number',
  };

  // On mobile, use a simpler stacked layout without physics to ensure everything is visible
  const isMobileView = typeof window !== 'undefined' && window.innerWidth <= 768;
  
  return (
    <main 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'relative', 
        overflow: isMobileView ? 'auto' : 'hidden',
        padding: isMobileView ? '20px 24px' : '0',
        boxSizing: 'border-box',
      }}
    >
      {isMobileView ? (
        // Mobile: Simple stacked layout, no physics
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          paddingBottom: '40px',
        }}>
          {/* Name and State row */}
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <input
              type="text"
              placeholder="Name"
              autoComplete="name"
              style={{...inputStyle, flex: 1}}
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="State"
              autoComplete="address-level1"
              style={{...inputStyle, width: '120px', flexShrink: 0}}
              value={formData.state}
              onChange={e => setFormData({...formData, state: e.target.value})}
            />
          </div>
          
          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            style={inputStyle}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          
          {/* Address, City, ZIP row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Street Address"
              autoComplete="street-address"
              style={inputStyle}
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                placeholder="City"
                autoComplete="address-level2"
                style={{...inputStyle, flex: 1}}
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
              />
              <input
                type="text"
                placeholder="ZIP"
                autoComplete="postal-code"
                style={{...inputStyle, width: '100px', flexShrink: 0}}
                value={formData.zip}
                onChange={e => setFormData({...formData, zip: e.target.value})}
              />
            </div>
          </div>
          
          {/* Shipping */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: textColor }}>Shipping:</label>
            <select
              value={shippingOption}
              onChange={e => setShippingOption(e.target.value as any)}
              style={{...inputStyle, cursor: 'pointer'}}
            >
              <option value="standard">Standard (2 weeks) - Free</option>
              <option value="express">Express (2 weeks) - +$10</option>
              <option value="rush">Rush (3 days) - +$25</option>
            </select>
          </div>
          
          {/* Coupon */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <input
              type="text"
              placeholder="Promo Code"
              style={{...inputStyle, flex: 1, minWidth: 0}}
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleCouponApply()}
            />
            <button
              onClick={handleCouponApply}
              disabled={!couponCode.trim()}
              style={{
                ...inputStyle,
                cursor: couponCode.trim() ? 'pointer' : 'not-allowed',
                opacity: couponCode.trim() ? 1 : 0.5,
                width: 'auto',
                padding: '0.5rem 1rem',
                flexShrink: 0,
              }}
            >
              Apply
            </button>
          </div>
          
          {/* Summary */}
          <div style={{ fontSize: '0.9rem', padding: '12px', border: `2px solid ${borderColor}` }}>
            <div style={{ marginBottom: '0.5rem' }}>Footglove: ${BASE_PRICE}</div>
            <div style={{ marginBottom: '0.5rem' }}>
              Shipping: {shippingOption === 'standard' ? 'Free' : shippingOption === 'express' ? `+$${EXPRESS_SHIPPING}` : `+$${RUSH_SHIPPING}`}
            </div>
            {discount > 0 && (
              <div style={{ marginBottom: '0.5rem', color: '#00aa00' }}>
                Discount: -${discount.toFixed(2)}
              </div>
            )}
            <div style={{ fontWeight: 'bold', borderTop: `2px solid ${borderColor}`, paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              Total: ${total.toFixed(2)}
            </div>
          </div>
          
          {/* Wallet button */}
          {walletAvailable && paymentRequest && (
            <div style={{ width: '100%' }}>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: brightness > 0 ? 'light' : 'dark',
                      height: '48px',
                      type: 'default',
                    },
                  },
                }}
              />
            </div>
          )}
          
          {/* Card input */}
          <div style={{ width: '100%' }}>
            {walletAvailable && (
              <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: textColor }}>
                or enter card details:
              </div>
            )}
            <div style={{ width: '100%' }}>
              <CardElement
                options={cardElementOptions}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </div>
          </div>
          
          {/* Pay button */}
          <button
            disabled={!isValid || processing}
            onClick={handleSubmit}
            style={{
              ...inputStyle,
              cursor: isValid && !processing ? 'pointer' : 'not-allowed',
              opacity: isValid && !processing ? 1 : 0.5,
              fontWeight: 'bold',
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem',
            }}
          >
            {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      ) : (
        // Desktop: Original physics-based layout
        <>
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
              width: ${isMobile ? 'calc(100vw - 48px)' : 'clamp(200px, 70vw, 300px)'} !important;
              border-radius: 0 !important;
              box-sizing: border-box !important;
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
        // Hide wallet item if not available
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
              autoComplete="name"
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
              autoComplete="email"
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
              autoComplete="street-address"
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
              autoComplete="address-level2"
              style={{...inputStyle, width: isMobile ? 'calc(100vw - 48px)' : 'clamp(150px, 50vw, 200px)'}}
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
            />
          );
        } else if (item.id === 'state') {
          content = (
            <input
              type="text"
              placeholder="State"
              autoComplete="address-level1"
              style={{...inputStyle, width: isMobile ? 'calc(100vw - 48px)' : 'clamp(100px, 30vw, 150px)'}}
              value={formData.state}
              onChange={e => setFormData({...formData, state: e.target.value})}
            />
          );
        } else if (item.id === 'zip') {
          content = (
            <input
              type="text"
              placeholder="ZIP"
              autoComplete="postal-code"
              style={{...inputStyle, width: isMobile ? 'calc(100vw - 48px)' : 'clamp(100px, 30vw, 150px)'}}
              value={formData.zip}
              onChange={e => setFormData({...formData, zip: e.target.value})}
            />
          );
        } else if (item.id === 'shipping') {
          content = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: isMobile ? 'calc(100vw - 48px)' : 'clamp(250px, 70vw, 400px)', boxSizing: 'border-box' }}>
              <label style={{ fontSize: isMobile ? '0.9rem' : 'clamp(0.9rem, 2.5vw, 1.2rem)', color: textColor }}>
                Shipping:
              </label>
              <select
                value={shippingOption}
                onChange={e => setShippingOption(e.target.value as any)}
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <option value="standard">Standard (2 weeks) - Free</option>
                <option value="express">Express (2 weeks) - +$10</option>
                <option value="rush">Rush (3 days) - +$25</option>
              </select>
            </div>
          );
        } else if (item.id === 'coupon') {
          content = (
            <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? 'calc(100vw - 48px)' : 'clamp(250px, 70vw, 400px)', alignItems: 'flex-end', boxSizing: 'border-box' }}>
              <input
                type="text"
                placeholder="Promo Code"
                style={{...inputStyle, flex: 1, minWidth: 0}}
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCouponApply()}
              />
              <button
                onClick={handleCouponApply}
                disabled={!couponCode.trim()}
                style={{
                  ...inputStyle,
                  cursor: couponCode.trim() ? 'pointer' : 'not-allowed',
                  opacity: couponCode.trim() ? 1 : 0.5,
                  width: 'auto',
                  padding: '0.5rem 1rem',
                  flexShrink: 0,
                }}
              >
                Apply
              </button>
            </div>
          );
        } else if (item.id === 'summary') {
          content = (
            <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 'clamp(250px, 70vw, 400px)', fontSize: isMobile ? '0.9rem' : 'clamp(0.9rem, 2.5vw, 1.2rem)', boxSizing: 'border-box' }}>
              <div style={{ marginBottom: '0.5rem' }}>Footglove: ${BASE_PRICE}</div>
              <div style={{ marginBottom: '0.5rem' }}>
                Shipping: {shippingOption === 'standard' ? 'Free' : shippingOption === 'express' ? `+$${EXPRESS_SHIPPING}` : `+$${RUSH_SHIPPING}`}
              </div>
              {discount > 0 && (
                <div style={{ marginBottom: '0.5rem', color: '#00aa00' }}>
                  Discount: -${discount.toFixed(2)}
                </div>
              )}
              <div style={{ fontWeight: 'bold', borderTop: `2px solid ${borderColor}`, paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                Total: ${total.toFixed(2)}
              </div>
            </div>
          );
        } else if (item.id === 'wallet') {
          if (!walletAvailable || !paymentRequest) {
            return null;
          }
          content = (
            <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 'clamp(200px, 70vw, 300px)', boxSizing: 'border-box' }}>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: brightness > 0 ? 'light' : 'dark',
                      height: '48px',
                      type: 'default',
                    },
                  },
                }}
              />
            </div>
          );
        } else if (item.id === 'card') {
          content = (
            <div style={{ width: isMobile ? 'calc(100vw - 48px)' : 'clamp(200px, 70vw, 300px)', boxSizing: 'border-box' }}>
              {walletAvailable && (
                <div style={{ fontSize: isMobile ? '0.85rem' : 'clamp(0.8rem, 2vw, 1rem)', marginBottom: '0.5rem', color: textColor }}>
                  or enter card details:
                </div>
              )}
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
              {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
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
      </>
      )}
    </main>
  );
}

export default function CheckoutPage() {
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
