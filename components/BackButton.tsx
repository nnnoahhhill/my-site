'use client';

import { usePathname } from 'next/navigation';

export function BackButton() {
  const pathname = usePathname();
  
  // Don't show on home page
  if (pathname === '/') {
    return null;
  }
  
  return (
    <button
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
      }}
      aria-label="Go back"
    >
      ←
    </button>
  );
}
