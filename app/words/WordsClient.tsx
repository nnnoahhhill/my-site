'use client';

import { useState, useMemo } from 'react';
import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import type { Post } from '@/lib/posts';

export default function WordsClient({ posts }: { posts: Post[] }) {
  const { randomMode, brightness, getColorFromHomePalette } = useTheme();
  const [suggestion, setSuggestion] = useState({ idea: '' });
  
  // Theme-aware border color: dark in light mode, white in dark mode
  const borderColor = brightness > 0 ? '#000' : '#fff';
  const textColor = brightness > 0 ? '#000' : '#fff';

  // Ensure posts is an array
  const safePosts = Array.isArray(posts) ? posts : [];
  
  const postItems = useMemo(() => safePosts.map(post => ({
    id: `post-${post.slug}`,
    label: post.title,
    mass: 20,
    href: `/words/${encodeURIComponent(post.slug)}`,
  })), [safePosts]);

  const staticItems = useMemo(() => [
    { id: 'suggest-idea', mass: 25, label: '' },
    { id: 'suggest-submit', mass: 10, label: '' },
  ], []);
  
  const allItems = useMemo(() => [...postItems, ...staticItems], [postItems, staticItems]);

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = allItems.map(item => ({
      id: item.id,
      label: (item as any).label || item.id,
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
  }, [allItems]);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);
  
  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    allItems.forEach((item, index) => {
      // Use both itemId and index to ensure each item gets a different color
      colors[item.id] = getColorFromHomePalette(`${item.id}-${index}`);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette, allItems]);

  const handleItemClick = (item: any) => {
    if (item.href) {
      window.location.href = item.href;
    }
  };

  const isValid = suggestion.idea.trim().length > 0;

  const handleSuggest = async () => {
    if (!isValid) return;
    try {
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mood: 'suggestion', 
          text: suggestion.idea,
          timestamp: Date.now() 
        }),
      });
    } catch (e) {
      console.error('Failed to submit suggestion:', e);
    }
    setSuggestion({ idea: '' });
  };

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
        textarea::placeholder {
          color: ${textColor};
          opacity: 0.6;
        }
      `}</style>
      {allItems.map(item => {
        let content;
        const style = { color: itemColors[item.id] };
        
        // Handle Form Inputs
        if (item.id === 'suggest-idea') {
             content = (
               <textarea 
                 placeholder="What should I write about?" 
                 value={suggestion.idea} 
                 onChange={e => setSuggestion({...suggestion, idea: e.target.value})}
                 style={{ 
                   background: 'transparent', 
                   border: `3px solid #000`, 
                   color: textColor, 
                   padding: '0.5rem', 
                   width: 'clamp(200px, 70vw, 400px)', 
                   maxWidth: '90vw',
                   height: 'clamp(80px, 25vh, 150px)',
                   fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                   fontFamily: 'inherit'
                 }}
               />
             );
        } else if (item.id === 'suggest-submit') {
             content = <button 
               onClick={handleSuggest} 
               disabled={!isValid}
               style={{ 
                 background: 'transparent', 
                 border: `3px solid #000`, 
                 color: textColor, 
                 padding: '0.5rem',
                 cursor: isValid ? 'pointer' : 'not-allowed',
                 opacity: isValid ? 1 : 0.5,
                 fontWeight: 'bold',
                 fontSize: 'clamp(0.8rem, 2.5vw, 1rem)'
               }}
             >
               Send
             </button>
        }

        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={(item as any).label || item.id}
            href={(item as any).href}
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
