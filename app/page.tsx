'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';
import { MoodPopup } from '@/components/MoodPopup';

// Note: Metadata should be in a separate non-client file, but since this is client-only,
// we'll handle it via layout or a wrapper. For now, metadata is in layout.tsx

const ITEMS = [
  { id: 'title', label: 'Noah Hill', mass: 300 }, 
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'music', label: 'Music', href: '/music' },
  { id: 'words', label: 'Words', href: '/words' },
  { id: 'goods', label: 'Goods', href: '/goods' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'cult', label: 'Cult', href: '/cult' },
  { id: 'brighter', label: 'light', action: 'brighter' },
  { id: 'darker', label: 'dark', action: 'darker' },
  { id: 'random', label: 'random', action: 'random' },
];

export default function Home() {
  const { changeBrightness, triggerRandom, randomMode, seed } = useTheme();

  // Map items to physics definitions
  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []); // constant

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const handleAction = (action?: string) => {
    if (!action) return;
    if (action === 'brighter') changeBrightness(1);
    if (action === 'darker') changeBrightness(-1);
    if (action === 'random') triggerRandom();
  };

  // Memoize random colors so they don't change on every physics frame (which shouldn't re-render anyway, but safety)
  // They only change when 'seed' changes.
  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach(item => {
      colors[item.id] = getRandomColor();
    });
    return colors;
  }, [randomMode, seed]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {ITEMS.map(item => {
        const isActionButton = item.action !== undefined;
        const fontSize = item.id === 'title' 
          ? 'clamp(2.5rem, 8vw, 5.5rem)'  // Smaller on mobile
          : isActionButton 
            ? 'clamp(0.9rem, 2.5vw, 1.8rem)'  // Even smaller on mobile
            : 'clamp(1.8rem, 6vw, 4rem)';  // Smaller on mobile
        
        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            onClick={() => handleAction(item.action)}
            style={{ 
              color: itemColors[item.id],
              fontSize
            }}
          />
        );
      })}
                <MoodPopup />
              </main>
            );
          }
          