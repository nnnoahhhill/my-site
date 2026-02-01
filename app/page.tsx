'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';
import { MoodPopup } from '@/components/MoodPopup';

const ITEMS = [
  { id: 'title', label: 'Noah Hill', mass: 40 }, 
  { id: 'about', label: 'About', href: '/about' },
  { id: 'contact', label: 'Contact', href: '/contact' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'music', label: 'Music', href: '/music' },
  { id: 'words', label: 'Words', href: '/words' },
  { id: 'goods', label: 'Goods', href: '/goods' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'cult', label: 'Cult', href: '/cult' },
  { id: 'brighter', label: 'Brighter', action: 'brighter' },
  { id: 'darker', label: 'Darker', action: 'darker' },
  { id: 'random', label: 'Random', action: 'random' },
];

export default function Home() {
  const { changeBrightness, triggerRandom, randomMode, seed } = useTheme();

  // Map items to physics definitions
  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []); // constant

  const { containerRef, registerRef } = usePhysics(physicsDefs);

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
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {ITEMS.map(item => (
        <FloatingItem
          key={item.id}
          id={item.id}
          label={item.label}
          href={item.href}
          registerRef={registerRef(item.id)}
          onClick={() => handleAction(item.action)}
                    style={{ color: itemColors[item.id] }} // Will be undefined (inherit) if not random
                  />
                ))}
                <MoodPopup />
              </main>
            );
          }
          