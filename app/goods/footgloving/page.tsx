'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'desc1', label: 'light gloving but with toe socks', mass: 30 },
  { id: 'desc2', label: 'get in touch if you want a pair', mass: 30, href: '/contact' },
  { id: 'desc3', label: 'handmade to order', mass: 15, small: true },
  { id: 'img1', label: 'image', mass: 40, isImage: true, src: '/footglove-big.png' },
];

export default function FootGlovingPage() {
  const { randomMode, getColorFromHomePalette } = useTheme();

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label,
      mass: item.mass,
      centerSpawn: (item as any).isImage, // Spawn images in middle 50%
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
      {ITEMS.map(item => {
        const isImage = (item as any).isImage;
        const imageSrc = (item as any).src;
        const isSmall = (item as any).small;
        
        // Make all text segments larger and single line
        const fontSize = isSmall 
          ? 'clamp(1.2rem, 4vw, 2rem)' 
          : (item.id === 'desc1' || item.id === 'desc2')
            ? 'clamp(1.5rem, 5vw, 2.5rem)' // Larger font size
            : 'clamp(1.3rem, 4.5vw, 2.2rem)'; // Larger for other text
        
        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={(item as any).href}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            style={{ 
              color: itemColors[item.id],
              fontSize,
              whiteSpace: 'nowrap' // Force single line
            }}
          >
            {isImage && imageSrc ? (
              <img 
                src={imageSrc} 
                alt={item.label || 'FootGloves'} 
                style={{ 
                  maxWidth: 'clamp(150px, 60vw, 400px)', // Smaller on mobile, larger on desktop
                  height: 'auto',
                  display: 'block',
                  width: 'auto'
                }} 
              />
            ) : null}
          </FloatingItem>
        );
      })}
    </main>
  );
}
