'use client';
import { useState, useEffect } from 'react';

export function MoodPopup() {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<'select' | 'input' | 'done'>('select');
  const [obscureText, setObscureText] = useState('');

  useEffect(() => {
    // Check if already logged this session? 
    // For now just timer.
    const timer = setTimeout(() => {
      setShow(true);
    }, 11000);
    return () => clearTimeout(timer);
  }, []);

  const handleMood = (mood: string) => {
    if (mood === 'obscure') {
      setStage('input');
    } else {
      console.log('Mood logged:', mood);
      setStage('done');
      setTimeout(() => setShow(false), 2000);
    }
  };

  const handleSubmitObscure = () => {
    console.log('Mood logged: obscure -', obscureText);
    setStage('done');
    setTimeout(() => setShow(false), 2000);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'var(--bg-color)', // match theme? Or contrast?
      border: '1px solid currentColor',
      padding: '1rem',
      zIndex: 100,
      width: '300px'
    }}>
      {stage === 'select' && (
        <>
          <p style={{ margin: '0 0 1rem 0' }}>how are you feeling?</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button onClick={() => handleMood('sad')} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>😞</button>
            <button onClick={() => handleMood('neutral')} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>😐</button>
            <button onClick={() => handleMood('happy')} style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer' }}>😄</button>
          </div>
          <button 
            onClick={() => handleMood('obscure')}
            style={{ fontSize: '0.8rem', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
          >
            im feeling an obscure fourth thing
          </button>
        </>
      )}

      {stage === 'input' && (
        <>
          <p style={{ margin: '0 0 0.5rem 0' }}>okay how come?</p>
          <input 
            type="text" 
            value={obscureText}
            onChange={e => setObscureText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmitObscure()}
            autoFocus
            style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}
          />
        </>
      )}

      {stage === 'done' && (
        <p>recorded.</p>
      )}
    </div>
  );
}
