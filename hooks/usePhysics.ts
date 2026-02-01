import { useEffect, useRef, useState, useCallback } from 'react';
import { PhysicsBody, resolveCollisions } from '../lib/physics';

export type PhysicsItemDef = {
  id: string;
  label: string; // Used for mass calc
  mass?: number;
  // Optional initial overrides
  x?: number;
  y?: number;
  speedMultiplier?: number; // Multiply initial speed (default 1.0)
};

export function usePhysics(initialItems: PhysicsItemDef[]) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const frameRef = useRef<number>();
  const hoveredItemsRef = useRef<Set<string>>(new Set());

  // Initialize bodies on mount/change
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    const initializeBodies = () => {
      // 1. Measure and Create Bodies
      const newBodies: PhysicsBody[] = [];
      const containerRect = container.getBoundingClientRect();
      
      // On mobile, use window.innerHeight to get actual visible viewport (excluding browser UI)
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const containerW = containerRect.width;
      const containerH = isMobile ? window.innerHeight : containerRect.height;

      initialItems.forEach((def) => {
        const el = itemsRef.current.get(def.id);
        if (!el) return;

      const rect = el.getBoundingClientRect();
      const baseMass = 10;
      const mass = def.mass ?? (baseMass * (1 + def.label.length * 0.05));

      // Rejection sampling to avoid overlaps
      let x: number, y: number;
      let attempts = 0;
      const maxAttempts = 50;
      
      if (def.x !== undefined && def.y !== undefined) {
        x = def.x;
        y = def.y;
      } else {
        do {
          x = Math.random() * (containerW - rect.width);
          y = Math.random() * (containerH - rect.height);
          attempts++;
          
          // Check overlap with existing bodies
          const overlaps = newBodies.some(existing => {
            return !(
              x + rect.width < existing.x ||
              x > existing.x + existing.width ||
              y + rect.height < existing.y ||
              y > existing.y + existing.height
            );
          });
          
          if (!overlaps || attempts >= maxAttempts) break;
        } while (attempts < maxAttempts);
      }

      // Random velocity - slower base speed with randomization
      const baseSpeed = 0.3; // slower base speed
      const speedVariation = 0.2; // random variation range (0.3 to 0.5)
      const speedMultiplier = def.speedMultiplier ?? 1.0;
      const speed = (baseSpeed + (Math.random() * speedVariation)) * speedMultiplier; // each item gets random speed
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      newBodies.push({
        id: def.id,
        x,
        y,
        vx,
        vy,
        width: rect.width,
        height: rect.height,
        mass,
      });
    });

      bodiesRef.current = newBodies;
      
      // Position all items immediately before showing them
      newBodies.forEach((body) => {
        const el = itemsRef.current.get(body.id);
        if (el) {
          el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
          el.style.opacity = '1'; // Make visible once positioned
        }
      });
      
      setReady(true);
    };
    
    // Wait for next frame to ensure all elements are registered and measured
    const initFrame = requestAnimationFrame(() => {
      // Check if all items are registered
      const allRegistered = initialItems.every(def => itemsRef.current.has(def.id));
      if (!allRegistered) {
        // If not all registered, try again next frame
        requestAnimationFrame(initializeBodies);
        return;
      }
      
      initializeBodies();
    });

    return () => cancelAnimationFrame(initFrame);
  }, [initialItems]);

  const update = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // On mobile, use window.innerHeight to get actual visible viewport (excluding browser UI)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const width = containerRect.width;
    const height = isMobile ? window.innerHeight : containerRect.height;

    // Run Physics - pass hovered items so they skip velocity updates but still collide
    const hoveredSet = hoveredItemsRef.current;
    resolveCollisions(bodiesRef.current, { width, height }, hoveredSet);

    // Update DOM
    bodiesRef.current.forEach((body) => {
      const el = itemsRef.current.get(body.id);
      if (el) {
        el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
      }
    });

    frameRef.current = requestAnimationFrame(update);
  }, []);

  useEffect(() => {
    if (ready) {
      frameRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [ready, update]);

  // Ref callback to register elements
  const registerRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      itemsRef.current.set(id, el);
    } else {
      itemsRef.current.delete(id);
    }
  };

  // Hover handlers
  const setHovered = useCallback((id: string, isHovered: boolean) => {
    if (isHovered) {
      hoveredItemsRef.current.add(id);
    } else {
      hoveredItemsRef.current.delete(id);
    }
  }, []);

  return { containerRef, registerRef, ready, setHovered };
}
