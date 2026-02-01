'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
import { useMemo } from 'react';

const ITEMS = [
  { id: 'title', label: 'Services', mass: 40 },
  { id: 'software', label: 'Software Consulting', mass: 20 },
  { id: 'startups', label: 'Startup Advising', mass: 20 },
  { id: 'artcar', label: 'Sick as Fuck Art Car — $20,000', mass: 50 },
  { id: 'desc1', label: 'Playa ready', mass: 10 },
  { id: 'desc2', label: 'Soundsystem for 8', mass: 15 },
  { id: 'desc3', label: 'Transport & Training included', mass: 20 },
  { id: 'desc4', label: 'I am on call for burn problems', mass: 20 },
];

export default function ServicesPage() {
  const { randomMode, seed } = useTheme();

  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []);

  const { containerRef, registerRef } = usePhysics(physicsDefs);

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
          registerRef={registerRef(item.id)}
          style={{ color: itemColors[item.id] }}
        />
      ))}
    </main>
  );
}
