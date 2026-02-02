'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'p1', label: 'Forbes 30u30 Manufacturing & Industry', mass: 35 },
  { id: 'p2', label: 'really like music like a lot', mass: 25 },
  { id: 'p3', label: 'full stack software engineering', mass: 30 },
  { id: 'p4', label: 'Embedded systems and smart hardware', mass: 35 },
  { id: 'p5', label: 'General ai finessery of varying sorts', mass: 35 },
  { id: 'p6', label: 'formidably creative', mass: 20 },
  { id: 'p7', label: 'has a propensity to dream', mass: 25, larger: true },
  { id: 'p8', label: 'has the urge to make dreams come true', mass: 35, larger: true },
  { id: 'p9', label: 'helped raise and manage $10M+', mass: 30 },
  { id: 'p10', label: 'really cool and a pleasure to work with', mass: 35 },
  { id: 'p11', label: 'more than five granted patents', mass: 30 },
  { id: 'p12', label: 'ten years working on early stage startups', mass: 35 },
  { id: 'p13', label: 'built software used by Fortune 500 customers', mass: 35 },
  { id: 'p14', label: 'built software used in FDA Human Clinical Trials', mass: 40 },
  { id: 'p15', label: 'founded multiple tech startups', mass: 30 },
  { id: 'p16', label: 'global supply chain management', mass: 35 },
  { id: 'p17', label: 'advanced manufacturing and scalable design', mass: 40 },
];

export default function AboutPage() {
  const { randomMode, getColorFromHomePalette } = useTheme();

  // Increase mass significantly and reduce speed to slow down movement
  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      mass: (item.mass || 20) * 5, // 5x the mass to slow movement significantly
      speedMultiplier: 0.4, // Reduce speed to 40% of normal
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

  // Generate deterministic but varied font sizes based on item ID
  const fontSizes = useMemo(() => {
    const sizes: Record<string, string> = {};
    ITEMS.forEach((item, index) => {
      // Use a simple hash of the item ID to create deterministic randomness
      let hash = 0;
      for (let i = 0; i < item.id.length; i++) {
        hash = ((hash << 5) - hash) + item.id.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      // Normalize to 0-1 range
      const normalized = Math.abs(hash % 1000) / 1000;
      
      // Make all text smaller except "propensity to dream" and "dreams come true"
      const baseSize = (item as any).larger ? 2.5 : 1.4; // Smaller base sizes for desktop
      const variation = 0.15; // ±0.15rem variation
      const offset = (normalized - 0.5) * 2 * variation; // Between -variation and +variation
      sizes[item.id] = `clamp(${baseSize - variation}rem, 3vw, ${baseSize + variation}rem)`; // Responsive with smaller max
    });
    return sizes;
  }, []);

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
          registerRef={registerRef(item.id)}
          setHovered={setHovered}
          style={{ 
            color: itemColors[item.id],
            fontSize: fontSizes[item.id]
          }}
        />
      ))}
    </main>
  );
}
