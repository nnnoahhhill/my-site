'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'item1', label: 'Premium LED FootGloves™ (white)', mass: 30, href: '/goods/footgloving' },
  { id: 'item1b', label: 'Premium LED FootGloves™ (black)', mass: 30, href: '/goods/footgloving' },
  { id: 'item2', label: 'super cool art car build', mass: 25, href: '/services/art-car' },
];

export default function GoodsPage() {
  const { randomMode, getColorFromHomePalette } = useTheme();

  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach(item => {
      colors[item.id] = getColorFromHomePalette(item.id);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {ITEMS.map(item => (
        <FloatingItem
          key={item.id}
          id={item.id}
          label={item.label}
          href={item.href}
          registerRef={registerRef(item.id)}
          setHovered={setHovered}
          style={{ 
            color: itemColors[item.id],
            fontSize: item.id === 'item2' 
              ? 'clamp(0.8rem, 2.5vw, 1.5rem)' 
              : 'clamp(0.9rem, 3vw, 2rem)',
            whiteSpace: 'normal',
            maxWidth: 'clamp(200px, 80vw, 600px)',
            wordWrap: 'break-word'
          }}
        />
      ))}
    </main>
  );
}
