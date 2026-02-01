import { useEffect, useRef, useState, useCallback } from 'react';
import { PhysicsBody, resolveCollisions } from '../lib/physics';

export type PhysicsItemDef = {
  id: string;
  label: string; // Used for mass calc
  mass?: number;
  // Optional initial overrides
  x?: number;
  y?: number;
};

export function usePhysics(initialItems: PhysicsItemDef[]) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const frameRef = useRef<number>();

  // Initialize bodies on mount/change
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // 1. Measure and Create Bodies
    const newBodies: PhysicsBody[] = [];
    const { width: containerW, height: containerH } = container.getBoundingClientRect();

    initialItems.forEach((def) => {
      const el = itemsRef.current.get(def.id);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const baseMass = 10;
      const mass = def.mass ?? (baseMass * (1 + def.label.length * 0.05));

      // Random position if not set (rejection sampling could go here, but strict "no overlap" at start is complex)
      // We'll just spread them out randomly for now.
      const x = def.x ?? Math.random() * (containerW - rect.width);
      const y = def.y ?? Math.random() * (containerH - rect.height);

      // Random velocity
      const speed = 2; // base speed
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
    setReady(true);
  }, [initialItems]);

  const update = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    // Run Physics
    resolveCollisions(bodiesRef.current, { width, height });

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

  return { containerRef, registerRef, ready };
}
