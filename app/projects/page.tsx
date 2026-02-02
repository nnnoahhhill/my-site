'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'blurb1', label: 'this is just a small sample of my work', mass: 25 },
  { id: 'blurb2', label: 'hmu if u really wanna see more', mass: 25, href: '/contact' },
  { id: 'p1', label: 'delightful.day', mass: 30, href: 'https://delightful.day/' },
  { id: 'p2', label: 'oh.opulent.day', mass: 30, href: 'https://oh.opulent.day/' },
  { id: 'p3', label: 'www.protondemand.com', mass: 35, href: 'https://www.protondemand.com/' },
  { id: 'p4', label: 'www.weisest.com', mass: 30, href: 'https://www.weisest.com/' },
  { id: 'p5', label: 'www.weisest.com/create', mass: 35, href: 'https://www.weisest.com/create' },
  { id: 'p7', label: 'hey.iloveyou.dog', mass: 30, href: 'https://hey.iloveyou.dog/' },
  { id: 'p8', label: 'www.nationalrubber.com', mass: 35, href: 'https://www.nationalrubber.com/' },
  { id: 'p9', label: 'Lura Health', mass: 35, href: 'https://lurahealth.com/' },
  { id: 'p10', label: 'Sidework', mass: 40, href: 'https://www.sidework.co/' },
];

export default function ProjectsPage() {
  const { randomMode, seed, getColorFromHomePalette } = useTheme();

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
      x: 12, // 0.75rem = 12px
      y: undefined, // Will be calculated from bottom
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
          width: '2.5rem', // Approximate button size
          height: '2.5rem',
          pointerEvents: 'none', // Let clicks pass through to actual button
          opacity: 0,
        }}
        aria-hidden="true"
      >
        ←
      </div>
      {ITEMS.map(item => {
        const isBlurb = item.id === 'blurb1' || item.id === 'blurb2';
        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={item.href}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            style={{ 
              color: itemColors[item.id],
              fontSize: isBlurb ? 'clamp(0.9rem, 3vw, 1.4rem)' : 'clamp(1.2rem, 5vw, 2.8rem)'
            }}
          />
        );
      })}
    </main>
  );
}
