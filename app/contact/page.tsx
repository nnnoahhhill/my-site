'use client';

import { useState, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';

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

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

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

  const inputStyle = {
    background: 'transparent',
    border: '3px solid #fff',
    color: '#fff',
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: '1rem',
    pointerEvents: 'auto' as const, // Ensure inputs are clickable
    width: '300px',
  };

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {ITEMS.map(item => {
        const color = itemColors[item.id];
        const style = { color };

        let content;
        if (item.id === 'blurb1' || item.id === 'blurb2') {
          content = <span style={{ fontSize: '1.4rem' }}>{item.label}</span>;
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
            style={{ ...inputStyle, width: '400px', height: '200px', resize: 'none' }}
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
