'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'item1', label: 'Premium LED FootGloves™ (white)', mass: 30, href: '/goods/footgloving' },
  { id: 'item1b', label: 'Premium LED FootGloves™ (black)', mass: 30, href: '/goods/footgloving' },
  { id: 'item2', label: 'super cool art car build', mass: 25, href: '/services/art-car' },
];

export default function GoodsPage() {
  const { randomMode, seed } = useTheme();

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
          setHovered={setHovered}
          style={{ 
            color: itemColors[item.id],
            fontSize: item.id === 'item2' ? '1.5rem' : undefined // Even smaller
          }}
        />
      ))}
    </main>
  );
}
