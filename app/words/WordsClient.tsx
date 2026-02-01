'use client';

import { useState, useMemo } from 'react';
import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import type { Post } from '@/lib/posts';

export default function WordsClient({ posts }: { posts: Post[] }) {
  const { randomMode, seed } = useTheme();
  const [suggestion, setSuggestion] = useState({ email: '', idea: '' });

  // Items: Title, Suggestion Form, Posts
  // We need to generate IDs for posts
  
  const postItems = posts.map(post => ({
    id: `post-${post.slug}`,
    label: post.title,
    mass: 15,
    href: `/words/${post.slug}`,
    isFeatured: post.featured
  }));

  const staticItems = [
    { id: 'title', label: 'Words', mass: 40 },
    { id: 'suggest-label', label: 'Suggest a topic:', mass: 20 },
    { id: 'suggest-email', mass: 15 },
    { id: 'suggest-idea', mass: 25 },
    { id: 'suggest-submit', mass: 10 },
  ];
  
  const allItems = [...staticItems, ...postItems];

  const physicsDefs = useMemo(() => allItems.map(item => ({
    id: item.id,
    label: item.label || item.id,
    mass: item.mass
  })), [allItems]);

  const { containerRef, registerRef } = usePhysics(physicsDefs);
  
  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    allItems.forEach(item => {
      colors[item.id] = getRandomColor();
    });
    return colors;
  }, [randomMode, seed, allItems]);

  const handleSuggest = () => {
    alert('Suggestion logged (conceptually)');
    setSuggestion({ email: '', idea: '' });
  };

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {allItems.map(item => {
        let content;
        const style = { color: itemColors[item.id] };
        
        // Handle Form Inputs
        if (item.id === 'suggest-email') {
             content = <input 
               placeholder="Your Email" 
               value={suggestion.email} 
               onChange={e => setSuggestion({...suggestion, email: e.target.value})}
               style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem' }}
             />
        } else if (item.id === 'suggest-idea') {
             content = <textarea 
               placeholder="What should I write about?" 
               value={suggestion.idea} 
               onChange={e => setSuggestion({...suggestion, idea: e.target.value})}
               style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem', width: '200px', height: '100px' }}
             />
        } else if (item.id === 'suggest-submit') {
             content = <button onClick={handleSuggest} style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.5rem' }}>Submit</button>
        }

        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href} // For posts
            registerRef={registerRef(item.id)}
            style={{ 
               ...style, 
               fontWeight: (item as any).isFeatured ? 'bold' : 'normal',
               textDecoration: (item as any).isFeatured ? 'underline' : 'none'
            }}
          >
            {content}
          </FloatingItem>
        );
      })}
    </main>
  );
}
