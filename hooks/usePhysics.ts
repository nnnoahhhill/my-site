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
  static?: boolean; // If true, body doesn't move but still collides
  centerSpawn?: boolean; // If true, spawn in middle 50% of screen
  mobileX?: number; // Fixed X position on mobile
  mobileY?: number; // Fixed Y position on mobile
  mobileOrder?: number; // Order for stacking on mobile (lower = higher on screen)
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

      // On mobile, collect items with mobileOrder for stacking
      const mobileItems: Array<{ def: PhysicsItemDef; rect: DOMRect }> = [];
      const regularItems: Array<{ def: PhysicsItemDef; rect: DOMRect }> = [];

      initialItems.forEach((def) => {
        const el = itemsRef.current.get(def.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        
        // On mobile, if item has mobile positioning, use it; otherwise use regular positioning
        if (isMobile && (def.mobileX !== undefined || def.mobileY !== undefined || def.mobileOrder !== undefined)) {
          mobileItems.push({ def, rect });
        } else {
          // Regular items (desktop or items without mobile positions)
          regularItems.push({ def, rect });
        }
      });

      // Sort mobile items by order
      mobileItems.sort((a, b) => (a.def.mobileOrder ?? 999) - (b.def.mobileOrder ?? 999));

      // Process mobile items first to calculate stacked positions
      let mobileYOffset = 20; // Start 20px from top
      const mobileXPadding = 24; // 24px padding on sides (more padding to prevent overflow)
      const mobileItemGap = 16; // 16px gap between items

      mobileItems.forEach(({ def, rect }) => {
        const baseMass = 10;
        const mass = def.mass ?? (baseMass * (1 + def.label.length * 0.05));

        let x: number, y: number;

        if (def.mobileX !== undefined) {
          x = def.mobileX;
        } else {
          // Center horizontally with padding, ensure it fits
          x = mobileXPadding;
          // Ensure element doesn't overflow
          const maxWidth = containerW - (mobileXPadding * 2);
          if (rect.width > maxWidth) {
            // Element is too wide, we'll need to constrain it via CSS
          }
        }

        if (def.mobileY !== undefined) {
          y = def.mobileY;
        } else if (def.mobileOrder !== undefined) {
          // Stack based on order
          y = mobileYOffset;
          mobileYOffset += rect.height + mobileItemGap;
        } else {
          y = mobileYOffset;
          mobileYOffset += rect.height + mobileItemGap;
        }

        // Random velocity for mobile items too (so they drift around)
        let vx = 0;
        let vy = 0;
        if (!def.static) {
          const baseSpeed = 0.2;
          const speedVariation = 0.2;
          const speedMultiplier = def.speedMultiplier ?? 1.0;
          const speed = (baseSpeed + (Math.random() * speedVariation)) * speedMultiplier;
          const angle = Math.random() * Math.PI * 2;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed;
        }

        newBodies.push({
          id: def.id,
          x,
          y,
          vx,
          vy,
          width: rect.width,
          height: rect.height,
          mass: def.static ? Infinity : mass,
          static: def.static,
        });
      });

      // Process regular items (desktop or items without mobile positions)
      regularItems.forEach(({ def, rect }) => {
        const baseMass = 10;
        const mass = def.mass ?? (baseMass * (1 + def.label.length * 0.05));

        // Rejection sampling to avoid overlaps
        let x: number, y: number;
        let attempts = 0;
        const maxAttempts = 50;
        
        if (def.x !== undefined && def.y !== undefined) {
          x = def.x;
          y = def.y;
        } else if (def.static && def.id === 'back-button') {
        // Special handling for back button: position at bottom left
        x = 12; // 0.75rem
        y = containerH - rect.height - 12; // 0.75rem from bottom
      } else if (def.centerSpawn) {
        // Spawn in middle 50% of screen (25% to 75%)
        const minX = containerW * 0.25;
        const maxX = containerW * 0.75 - rect.width;
        const minY = containerH * 0.25;
        const maxY = containerH * 0.75 - rect.height;
        
        // Ensure valid bounds
        const validMinX = Math.max(0, minX);
        const validMaxX = Math.max(validMinX, maxX);
        const validMinY = Math.max(0, minY);
        const validMaxY = Math.max(validMinY, maxY);
        
        do {
          x = validMinX + Math.random() * (validMaxX - validMinX);
          y = validMinY + Math.random() * (validMaxY - validMinY);
          // Clamp to ensure it's within bounds
          x = Math.max(0, Math.min(x, validMaxX));
          y = Math.max(0, Math.min(y, validMaxY));
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
      } else {
        // Ensure initial position keeps item fully on screen
        const maxX = Math.max(0, containerW - rect.width);
        const maxY = Math.max(0, containerH - rect.height);
        
        do {
          x = Math.random() * maxX;
          y = Math.random() * maxY;
          // Clamp to ensure it's within bounds
          x = Math.max(0, Math.min(x, maxX));
          y = Math.max(0, Math.min(y, maxY));
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

      // Random velocity - slower base speed with randomization (skip for static bodies)
      let vx = 0;
      let vy = 0;
      if (!def.static) {
        const baseSpeed = 0.2; // slower base speed (reduced from 0.3)
        const speedVariation = 0.2; // random variation range (0.2 to 0.4, shifted down from 0.3 to 0.5)
        const speedMultiplier = def.speedMultiplier ?? 1.0;
        const speed = (baseSpeed + (Math.random() * speedVariation)) * speedMultiplier; // each item gets random speed
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }

      newBodies.push({
        id: def.id,
        x,
        y,
        vx,
        vy,
        width: rect.width,
        height: rect.height,
        mass: def.static ? Infinity : mass, // Static bodies have infinite mass
        static: def.static,
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

  // Expose bodies to window for drag and throw
  useEffect(() => {
    if (typeof window !== 'undefined' && ready) {
      if (!(window as any).__physicsBodies) {
        (window as any).__physicsBodies = new Map();
      }
      bodiesRef.current.forEach(body => {
        (window as any).__physicsBodies.set(body.id, body);
      });
    }
  }, [ready]);

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

    // Update DOM (skip static bodies as they don't move)
    bodiesRef.current.forEach((body) => {
      if (body.static) return; // Don't update position for static bodies
      const el = itemsRef.current.get(body.id);
      if (el) {
        el.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
      }
      // Update window reference
      if (typeof window !== 'undefined' && (window as any).__physicsBodies) {
        (window as any).__physicsBodies.set(body.id, body);
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
