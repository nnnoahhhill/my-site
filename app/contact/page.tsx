'use client';

import { useState, useMemo } from 'react';
import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';

const ITEMS = [
  { id: 'blurb1', label: 'message me here to get in touch', mass: 15 },
  { id: 'blurb2', label: 'response time varies but usually asap', mass: 15 },
  { id: 'name', mass: 20 },
  { id: 'email', mass: 20 },
  { id: 'subject', mass: 20 },
  { id: 'message', mass: 40 },
  { id: 'submit', mass: 15 },
];

export default function ContactPage() {
  const { randomMode, brightness, getColorFromHomePalette } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Theme-aware border color: dark in light mode, white in dark mode
  const borderColor = brightness > 0 ? '#000' : '#fff';
  const textColor = brightness > 0 ? '#000' : '#fff';

  // Validation
  const isValid = 
    formData.name.length > 0 && 
    formData.email.includes('@') && 
    formData.subject.length > 0 && 
    formData.message.length > 0;

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label || item.id,
      mass: item.mass
    }));
    // Add back button as static physics body
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
      // Use both itemId and index to ensure each item gets a different color
      colors[item.id] = getColorFromHomePalette(`${item.id}-${index}`);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      alert('Message sent!');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      console.error('Failed to submit:', e);
      alert('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const getInputStyle = () => ({
    background: 'transparent',
    border: `3px solid #000`,
    color: textColor,
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
    pointerEvents: 'auto' as const, // Ensure inputs are clickable
    width: 'clamp(200px, 70vw, 300px)',
  });
  
  const inputStyle = getInputStyle();

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Register back button with physics - invisible collision body */}
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
      `}</style>
      {ITEMS.map(item => {
        const color = itemColors[item.id];
        const style = { color };

        let content;
        if (item.id === 'blurb1' || item.id === 'blurb2') {
          content = <span style={{ fontSize: 'clamp(0.9rem, 3vw, 1.4rem)' }}>{item.label}</span>;
        } else if (item.id === 'name') {
          content = <input 
            type="text" 
            placeholder="Name" 
            style={inputStyle}
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />;
        } else if (item.id === 'email') {
          content = <input 
            type="email" 
            placeholder="Email" 
            style={inputStyle}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />;
        } else if (item.id === 'subject') {
          content = <input 
            type="text" 
            placeholder="Subject" 
            style={inputStyle}
            value={formData.subject}
            onChange={e => setFormData({...formData, subject: e.target.value})}
          />;
        } else if (item.id === 'message') {
          content = <textarea 
            placeholder="Message" 
            style={{ ...inputStyle, width: 'clamp(200px, 70vw, 400px)', height: 'clamp(100px, 30vh, 200px)', resize: 'none' }}
            value={formData.message}
            onChange={e => setFormData({...formData, message: e.target.value})}
          />;
        } else if (item.id === 'submit') {
          content = <button 
            disabled={!isValid} 
            onClick={handleSubmit}
            style={{ 
                ...inputStyle, 
                cursor: isValid ? 'pointer' : 'not-allowed',
                opacity: isValid ? 1 : 0.5,
                fontWeight: 'bold'
            }}
          >
            Submit
          </button>;
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
