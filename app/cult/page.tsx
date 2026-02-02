'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';

const ITEMS_INPUT = [
  { id: 'blurb1', label: 'join the movement', mass: 20 },
  { id: 'blurb2', label: 'i might email you later', mass: 25 },
  { id: 'blurb3', label: 'tell everybody you love', mass: 15 },
  { id: 'name', mass: 15 },
  { id: 'email', mass: 15 },
  { id: 'join', mass: 10 },
];

const ITEMS_DONE = [
  { id: 'dope', label: 'dope, thanks', mass: 30 },
  { id: 'blurb3', label: 'tell your friends', mass: 20 },
  { id: 'invite', label: 'Invite a Friend', mass: 20 },
];

export default function CultPage() {
  const { brightness } = useTheme();
  const [stage, setStage] = useState<'input' | 'gif' | 'fade' | 'done'>('input');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Theme-aware border color: dark in light mode, white in dark mode
  const borderColor = brightness > 0 ? '#000' : '#fff';
  const textColor = brightness > 0 ? '#000' : '#fff';
  
  // We switch items based on stage
  const items = stage === 'input' ? ITEMS_INPUT : (stage === 'done' ? ITEMS_DONE : []);
  
  const physicsDefs = useMemo(() => {
    const physicsItems = items.map(item => ({
      id: item.id,
      label: item.label || item.id,
      mass: item.mass
    }));
    // Add back button as static physics body
    physicsItems.push({
      id: 'back-button',
      label: '←',
      mass: Infinity,
      static: true,
      x: 12,
      y: undefined,
    });
    return physicsItems;
  }, [items]); // Dependencies: items (which changes when stage changes)

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const handleJoin = async () => {
    const isValidEmail = email.includes('@') && email.length > 3;
    if (!isValidEmail) return;
    
    try {
      await fetch('/api/cult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
    } catch (e) {
      console.error('Failed to sign up:', e);
    }
    
    setStage('gif');
    // Simulate GIF duration
    setTimeout(() => {
      setStage('fade');
      setTimeout(() => {
        setStage('done');
      }, 2000); // 2 seconds fade/empty
    }, 4000); // 4 seconds GIF?
  };
  
  const handleInvite = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard');
  };

  if (stage === 'gif') {
    return (
      <div style={{ 
        width: '100vw', height: '100vh', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'black' 
      }}>
         <img 
           src="https://media.tenor.com/zyzx_DAbmeUp.gif" 
           alt="Dab me up" 
           style={{ maxWidth: '100%', maxHeight: '100%' }}
         />
      </div>
    );
  }

  if (stage === 'fade') {
    return <div style={{ width: '100vw', height: '100vh', background: 'black' }} />;
  }

  const isValidEmail = email.includes('@') && email.length > 3;

  const inputStyle = useMemo(() => ({
    background: 'transparent',
    border: `3px solid #000`,
    color: textColor,
    padding: '0.5rem',
    fontFamily: 'inherit',
    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
    pointerEvents: 'auto' as const,
    width: 'clamp(200px, 70vw, 300px)',
  }), [textColor]);

  const emailInputStyle = useMemo(() => ({
    ...inputStyle,
    width: 'clamp(200px, 70vw, 400px)',
  }), [inputStyle]);

  const joinButtonStyle = useMemo(() => ({
    ...inputStyle,
    width: 'clamp(100px, 40vw, 150px)',
  }), [inputStyle]);

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
        input::placeholder {
          color: ${textColor};
          opacity: 0.6;
        }
      `}</style>
       {items.map(item => {
          let content;
          if (item.id === 'blurb1' || item.id === 'blurb2') {
            content = <span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)' }}>{item.label}</span>;
          } else if (item.id === 'blurb3') {
            content = <span style={{ fontSize: 'clamp(0.6rem, 1.8vw, 0.7rem)' }}>{item.label}</span>;
          } else if (item.id === 'name') {
             content = <input 
               type="text"
               placeholder="Name" 
               value={name} 
               onChange={e => setName(e.target.value)}
               style={inputStyle}
             />
          } else if (item.id === 'email') {
             content = <input 
               type="email"
               placeholder="Email" 
               value={email} 
               onChange={e => setEmail(e.target.value)}
               style={emailInputStyle}
             />
          } else if (item.id === 'join') {
             content = <button 
               onClick={handleJoin} 
               disabled={!isValidEmail}
               style={{ 
                 ...joinButtonStyle, 
                 cursor: isValidEmail ? 'pointer' : 'not-allowed',
                 opacity: isValidEmail ? 1 : 0.5,
                 fontWeight: 'bold'
               }}
             >
               Join
             </button>
          } else if (item.id === 'invite') {
             content = <button 
               onClick={handleInvite} 
               style={{ 
                 ...inputStyle, 
                 cursor: 'pointer',
                 fontWeight: 'bold'
               }}
             >
               Invite a Friend
             </button>
          }

          return (
            <FloatingItem
              key={item.id}
              id={item.id}
              label={item.label}
              registerRef={registerRef(item.id)}
              setHovered={setHovered}
            >
              {content}
            </FloatingItem>
          );
       })}
    </main>
  );
}
