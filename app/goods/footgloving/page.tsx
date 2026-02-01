'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'desc1', label: 'light gloving but with toe socks', mass: 30 },
  { id: 'desc2', label: 'get in touch if you want a pair', mass: 30, href: '/contact' },
  { id: 'desc3', label: 'handmade to order', mass: 15, small: true },
  { id: 'img1', label: 'image', mass: 40, isImage: true, src: '/footglove-big.png' },
  { id: 'img2', label: 'image2', mass: 40, isImage: true, src: '/footgloves-slay.png' },
];

export default function FootGlovingPage() {
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
      colors[item.id] = getRandomColor(seed, item.id);
    });
    return colors;
  }, [randomMode, seed]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {ITEMS.map(item => {
        const isImage = (item as any).isImage;
        const imageSrc = (item as any).src;
        const isSmall = (item as any).small;
        
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
              fontSize: isSmall ? '0.7rem' : undefined
            }}
          >
            {isImage && imageSrc ? (
              <img 
                src={imageSrc} 
                alt={item.label || 'FootGloves'} 
                style={{ 
                  maxWidth: 'clamp(200px, 80vw, 400px)', 
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
