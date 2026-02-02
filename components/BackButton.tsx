'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function BackButton({ registerRef }: { registerRef?: (el: HTMLButtonElement | null) => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile and on words/[slug] page
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 && pathname?.startsWith('/words/'));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [pathname]);
  
  // Handle scroll direction on mobile words pages
  useEffect(() => {
    if (!isMobile) {
      setIsVisible(true);
      return;
    }
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY]);
  
  // Register with physics if registerRef is provided
  useEffect(() => {
    if (registerRef && buttonRef.current) {
      registerRef(buttonRef.current);
    }
    return () => {
      if (registerRef) {
        registerRef(null);
      }
    };
  }, [registerRef]);

  // Don't show on home page
  if (pathname === '/') {
    return null;
  }
  
  return (
    <button
      ref={buttonRef}
      onClick={() => window.history.back()}
      style={{
        position: 'fixed',
        bottom: '0.75rem',
        left: '0.75rem',
        zIndex: 10000,
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0.5rem',
        fontFamily: 'inherit',
        lineHeight: 1,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}
      aria-label="Go back"
    >
      ←
    </button>
  );
}
