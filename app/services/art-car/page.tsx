'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'title', label: 'cool as fuck art car', mass: 40 },
  { id: 'price', label: '$28,500', mass: 30 },
  { id: 'desc1', label: 'With $28,500 I could build a really really cool art car playa ready', mass: 25 },
  { id: 'desc2', label: 'with soundsystem to fit 4-8 people', mass: 20 },
  { id: 'desc3', label: 'and I\'ll help you get approved', mass: 15 },
  { id: 'desc4', label: 'transport it there', mass: 10 },
  { id: 'desc5', label: 'train you how to ride it', mass: 15 },
  { id: 'desc6', label: 'be on call for problems during the burn', mass: 25 },
  { id: 'desc7', label: 'I have my own ideas but I\'m happy to bring your vision to life as well', mass: 30 },
  { id: 'checkout', label: 'commission ur very own art car', mass: 30, href: '/checkout/art-car' },
];

export default function ArtCarPage() {
  const { randomMode, getColorFromHomePalette } = useTheme();

  // Make movement barely noticeable - very slow speed and high mass
  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      mass: (item.mass || 20) * 10, // 10x mass to slow movement significantly
      speedMultiplier: 0.1, // 10% of normal speed - barely moving
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
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
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
          href={(item as any).href}
          registerRef={registerRef(item.id)}
          setHovered={setHovered}
          style={{ 
            color: itemColors[item.id],
            fontSize: '1.2rem' // Smaller text
          }}
        />
      ))}
    </main>
  );
}
