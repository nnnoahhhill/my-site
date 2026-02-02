'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
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

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      mass: item.mass, 
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
  }, []);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach((item, index) => {
      // Use both itemId and index to ensure each item gets a different color
      colors[item.id] = getColorFromHomePalette(`${item.id}-${index}`);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette]);

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
