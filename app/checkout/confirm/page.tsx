'use client';

import { usePhysics, type PhysicsItemDef } from '@/hooks/usePhysics';
import { FloatingItem } from '@/components/FloatingItem';
import { useTheme } from '@/components/ThemeProvider';
import { useMemo, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const ITEMS = [
  { id: 'title', label: 'order confirmed', mass: 25 },
  { id: 'message1', label: 'thanks for your order', mass: 20 },
  { id: 'message2', label: 'check your email for confirmation', mass: 20 },
  { id: 'message3', label: 'we\'ll send tracking when it ships', mass: 20 },
];

function ConfirmPageContent() {
  const { randomMode, getColorFromHomePalette } = useTheme();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('orderId');
    setOrderId(id);
  }, [searchParams]);

  const physicsDefs = useMemo(() => {
    const items: PhysicsItemDef[] = ITEMS.map(item => ({
      id: item.id,
      label: item.label || item.id,
      mass: item.mass
    }));
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
      colors[item.id] = getColorFromHomePalette(`${item.id}-${index}`);
    });
    return colors;
  }, [randomMode, getColorFromHomePalette]);

  return (
    <main ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
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
        const color = itemColors[item.id];
        const style = { color };
        const href = (item as any).href;

        let content;
        if (item.id === 'title') {
          content = <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 'bold' }}>{item.label}</span>;
        } else {
          content = <span style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>{item.label}</span>;
        }

        return (
          <FloatingItem
            key={item.id}
            id={item.id}
            label={item.label}
            href={href}
            registerRef={registerRef(item.id)}
            setHovered={setHovered}
            style={style}
          >
            {content}
          </FloatingItem>
        );
      })}
      {orderId && (
        <div style={{ 
          position: 'absolute', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: 'clamp(0.8rem, 2vw, 1rem)',
          opacity: 0.7,
        }}>
          Order ID: {orderId.slice(0, 20)}...
        </div>
      )}
    </main>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <main style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </main>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}
