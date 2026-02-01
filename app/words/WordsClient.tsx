'use client';

import { useState, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import type { Post } from '@/lib/posts';

export default function WordsClient({ posts }: { posts: Post[] }) {
  const { randomMode, seed } = useTheme();
  const [suggestion, setSuggestion] = useState({ idea: '' });

  // Ensure posts is an array
  const safePosts = Array.isArray(posts) ? posts : [];
  
  const postItems = safePosts.map(post => ({
    id: `post-${post.slug}`,
    label: post.title,
    mass: 20,
    href: `/words/${encodeURIComponent(post.slug)}`,
  }));

  const staticItems = [
    { id: 'suggest-idea', mass: 25, label: '' },
    { id: 'suggest-submit', mass: 10, label: '' },
  ];
  
  const allItems = [...postItems, ...staticItems];

  const physicsDefs = useMemo(() => allItems.map(item => ({
    id: item.id,
    label: (item as any).label || item.id,
    mass: item.mass
  })), [allItems]);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);
  
  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    allItems.forEach(item => {
      colors[item.id] = getRandomColor();
    });
    return colors;
  }, [randomMode, seed, allItems]);

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
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {allItems.map(item => {
        let content;
        const style = { color: itemColors[item.id] };
        
        // Handle Form Inputs
        if (item.id === 'suggest-idea') {
             content = <textarea 
               placeholder="What should I write about?" 
               value={suggestion.idea} 
               onChange={e => setSuggestion({...suggestion, idea: e.target.value})}
               style={{ 
                 background: 'transparent', 
                 border: '3px solid #fff', 
                 color: '#fff', 
                 padding: '0.5rem', 
                 width: '400px', 
                 maxWidth: '90vw',
                 height: '150px',
                 fontSize: '1rem',
                 fontFamily: 'inherit'
               }}
             />
        } else if (item.id === 'suggest-submit') {
             content = <button 
               onClick={handleSuggest} 
               disabled={!isValid}
               style={{ 
                 background: 'transparent', 
                 border: '3px solid #fff', 
                 color: '#fff', 
                 padding: '0.5rem',
                 cursor: isValid ? 'pointer' : 'not-allowed',
                 opacity: isValid ? 1 : 0.5,
                 fontWeight: 'bold'
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
