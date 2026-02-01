'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'software', label: 'Software Stuff', href: '/services/software', mass: 20 },
  { id: 'startups', label: 'Startup Stuff', href: '/services/startups', mass: 20 },
  { id: 'creative', label: 'Creative Engineering', href: '/services/creative', mass: 25 },
  { id: 'tech', label: 'Tech Consulting', href: '/services/tech', mass: 20 },
  { id: 'general', label: 'General Consulting', href: '/services/general', mass: 20 },
  { id: 'everything', label: 'Everything Else', href: '/services/everything', mass: 20 },
  { id: 'artcar', label: 'cool as fuck art car', href: '/services/art-car', mass: 30 },
];

export default function ServicesPage() {
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
    <main ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
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
            fontSize: item.id === 'artcar' ? '2rem' : undefined
          }}
        />
      ))}
    </main>
  );
}
