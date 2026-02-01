'use client';

import { usePhysics } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme, getRandomColor } from '@/components/ThemeProvider';
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
  const { randomMode, seed } = useTheme();

  const physicsDefs = useMemo(() => ITEMS.map(item => ({
    id: item.id,
    label: item.label,
    mass: item.mass, 
  })), []);

  const { containerRef, registerRef, setHovered } = usePhysics(physicsDefs);

  const itemColors = useMemo(() => {
    if (!randomMode || typeof seed !== 'number' || isNaN(seed)) return {};
    const colors: Record<string, string> = {};
    ITEMS.forEach(item => {
      colors[item.id] = getRandomColor(seed, item.id);
    });
    return colors;
  }, [randomMode, seed]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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
