'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';

const ITEMS_INPUT = [
  { id: 'title', label: 'Cult', mass: 30 },
  { id: 'desc', label: 'Enter email to join. I may send emails later.', mass: 20 },
  { id: 'email', mass: 15 },
  { id: 'join', mass: 10 },
];

const ITEMS_DONE = [
  { id: 'dope', label: 'dope, thanks', mass: 30 },
  { id: 'invite', label: 'Invite a Friend', mass: 20 },
];

export default function CultPage() {
  const [stage, setStage] = useState<'input' | 'gif' | 'fade' | 'done'>('input');
  const [email, setEmail] = useState('');
  
  // We switch items based on stage
  const items = stage === 'input' ? ITEMS_INPUT : (stage === 'done' ? ITEMS_DONE : []);
  
  const physicsDefs = useMemo(() => items.map(item => ({
    id: item.id,
    label: item.label || item.id,
    mass: item.mass
  })), [items]); // Dependencies: items (which changes when stage changes)

  const { containerRef, registerRef } = usePhysics(physicsDefs);

  const handleJoin = () => {
    if (!email.includes('@')) return;
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

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
       {items.map(item => {
          let content;
          if (item.id === 'email') {
             content = <input 
               placeholder="Email" 
               value={email} 
               onChange={e => setEmail(e.target.value)}
               style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem' }}
             />
          } else if (item.id === 'join') {
             content = <button onClick={handleJoin} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem', cursor: 'pointer' }}>Join</button>
          } else if (item.id === 'invite') {
             content = <button onClick={handleInvite} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem', cursor: 'pointer' }}>Invite a Friend</button>
          }

          return (
            <FloatingItem
              key={item.id}
              id={item.id}
              label={item.label}
              registerRef={registerRef(item.id)}
            >
              {content}
            </FloatingItem>
          );
       })}
    </main>
  );
}
