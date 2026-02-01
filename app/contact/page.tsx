'use client';

import { useState, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';

const ITEMS = [
  { id: 'title', label: 'Contact', mass: 50 },
  { id: 'name', mass: 20 },
  { id: 'email', mass: 20 },
  { id: 'subject', mass: 20 },
  { id: 'message', mass: 40 },
  { id: 'submit', mass: 15 },
];

export default function ContactPage() {
  const { randomMode, seed } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const isValid = 
    formData.name.length > 0 && 
    formData.email.includes('@') && 
    formData.subject.length > 0 && 
    formData.message.length > 0;

  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label || item.id,
    mass: item.mass
  })), []);

  const { containerRef, registerRef } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach(item => {
      colors[item.id] = getRandomColor();
    });
    return colors;
  }, [randomMode, seed]);

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    console.log('Submitting', formData);
    // Log only as requested
    // await fetch('/api/contact', ...)
    setTimeout(() => {
        setSubmitting(false);
        alert('Logged (conceptually)');
    }, 1000);
  };

  const inputStyle = {
    background: 'transparent',
    border: '1px solid currentColor',
    color: 'inherit',
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '1rem',
    pointerEvents: 'auto' as const, // Ensure inputs are clickable
  };

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {ITEMS.map(item => {
        const color = itemColors[item.id];
        const style = { color };

        let content;
        if (item.id === 'title') {
          content = <h1 style={{ margin: 0, fontSize: '2rem' }}>Contact</h1>;
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
            style={{ ...inputStyle, width: '300px', height: '150px', resize: 'none' }}
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
            style={style}
          >
            {content}
          </FloatingItem>
        );
      })}
    </main>
  );
}
