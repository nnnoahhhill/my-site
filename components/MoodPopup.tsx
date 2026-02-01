'use client';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function MoodPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<'select' | 'input' | 'done'>('select');
  const [obscureText, setObscureText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const activeTimeRef = useRef(0);
  const lastCheckRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only show on homepage
    if (pathname !== '/') return;

    // Check if already shown in last 24 hours
    const lastShown = localStorage.getItem('moodPopupLastShown');
    if (lastShown) {
      const lastShownTime = parseInt(lastShown, 10);
      const now = Date.now();
      if (now - lastShownTime < 24 * 60 * 60 * 1000) {
        return; // Don't show if shown within last 24 hours
      }
    }

    // Track active time using Page Visibility API
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden, save accumulated time
        const now = Date.now();
        activeTimeRef.current += now - lastCheckRef.current;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        // Page became visible, start tracking again
        lastCheckRef.current = Date.now();
        intervalRef.current = setInterval(() => {
          if (!document.hidden) {
            activeTimeRef.current += 100; // 100ms intervals
            if (activeTimeRef.current >= 18000) {
              setShow(true);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
            }
          }
        }, 100);
      }
    };

    // Start tracking
    if (!document.hidden) {
      lastCheckRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          activeTimeRef.current += 100; // 100ms intervals
          if (activeTimeRef.current >= 18000) {
            setShow(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        }
      }, 100);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname]);

  const handleMood = (mood: string) => {
    // All moods go to input stage for "how come"
    setSelectedMood(mood);
    setObscureText(''); // Clear any previous text
    setStage('input');
  };

  const handleSubmitObscure = async () => {
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: selectedMood, 
          text: obscureText,
          timestamp: Date.now() 
        }),
      });
    } catch (e) {
      console.error('Failed to log mood:', e);
    }
    // Mark as shown for 24 hours
    localStorage.setItem('moodPopupLastShown', Date.now().toString());
    setStage('done');
    setTimeout(() => setShow(false), 2000);
  };

  if (!show) return null;

  return (
    <>
      {/* Blurred grey overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9998,
      }} />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-color)',
        border: '2px solid currentColor',
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        zIndex: 9999,
        width: '600px',
        maxWidth: '90vw',
        textAlign: 'center'
      }}>
        {stage === 'select' && (
          <>
            <p style={{ margin: '0 0 2rem 0', fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>how are you feeling?</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', gap: 'clamp(1rem, 4vw, 3rem)', padding: '0 clamp(0.5rem, 2vw, 2rem)' }}>
              <button 
                onClick={() => handleMood('sad')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <img src="/sad.png" alt="sad" style={{ height: 'clamp(40px, 10vw, 80px)', width: 'auto', maxWidth: '100%' }} />
              </button>
              <button 
                onClick={() => handleMood('neutral')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <img src="/flat.png" alt="neutral" style={{ height: 'clamp(40px, 10vw, 80px)', width: 'auto', maxWidth: '100%' }} />
              </button>
              <button 
                onClick={() => handleMood('happy')} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
              >
                <img src="/happy.png" alt="happy" style={{ height: 'clamp(40px, 10vw, 80px)', width: 'auto', maxWidth: '100%' }} />
              </button>
            </div>
            <button 
              onClick={() => handleMood('obscure')}
              style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
            >
              im feeling an obscure fourth thing
            </button>
          </>
        )}

        {stage === 'input' && (
          <>
            <p style={{ margin: '0 0 1rem 0', fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>okay how come?</p>
            <input 
              type="text" 
              value={obscureText}
              onChange={e => setObscureText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitObscure()}
              autoFocus
              style={{ width: '100%', padding: '1rem', background: 'transparent', border: '2px solid currentColor', color: 'inherit', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)' }}
            />
          </>
        )}

        {stage === 'done' && (
          <p style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>recorded.</p>
        )}
      </div>
    </>
  );
}
