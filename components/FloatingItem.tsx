import React, { useState, useEffect, useRef } from 'react';
import styles from './FloatingItem.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = {
  id: string;
  label?: string;
  href?: string;
  onClick?: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  setHovered?: (id: string, isHovered: boolean) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const FloatingItem = ({ id, label, href, onClick, registerRef, setHovered, style, children }: Props) => {
  const [tapped, setTapped] = useState(false);
  const [splitContent, setSplitContent] = useState<{ line1: string; line2: string; alignLeft: boolean } | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Check if text needs to be split on mobile
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      setSplitContent(null);
      return;
    }
    if (children || !label) {
      setSplitContent(null);
      return; // Only split text labels, not custom children
    }
    
    const checkAndSplit = () => {
      if (!itemRef.current || !label) return;
      
      const viewportWidth = window.innerWidth;
      const threshold = viewportWidth * 0.7;
      
      // Get computed style to match actual rendering
      const computedStyle = window.getComputedStyle(itemRef.current);
      const fontSize = computedStyle.fontSize || style?.fontSize || '3rem';
      const fontFamily = computedStyle.fontFamily || 'inherit';
      const fontWeight = computedStyle.fontWeight || 'bold';
      
      // Create a temporary element to measure text width with exact same styling
      const tempEl = document.createElement('span');
      tempEl.style.position = 'absolute';
      tempEl.style.visibility = 'hidden';
      tempEl.style.whiteSpace = 'nowrap';
      tempEl.style.fontSize = fontSize;
      tempEl.style.fontWeight = fontWeight;
      tempEl.style.fontFamily = fontFamily;
      tempEl.style.padding = computedStyle.padding || '0.5rem 1rem';
      tempEl.textContent = label;
      document.body.appendChild(tempEl);
      
      const textWidth = tempEl.offsetWidth;
      document.body.removeChild(tempEl);
      
      if (textWidth > threshold) {
        // Split text roughly in half (try to break at word boundary)
        const words = label.split(' ');
        if (words.length === 1) {
          // Single word - split in middle of word
          const mid = Math.ceil(label.length / 2);
          const line1 = label.slice(0, mid);
          const line2 = label.slice(mid);
          const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const alignLeft = seed % 2 === 0;
          setSplitContent({ line1, line2, alignLeft });
        } else {
          const midPoint = Math.ceil(words.length / 2);
          const line1 = words.slice(0, midPoint).join(' ');
          const line2 = words.slice(midPoint).join(' ');
          
          // Randomly decide alignment (use id as seed for consistency)
          const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const alignLeft = seed % 2 === 0;
          
          setSplitContent({ line1, line2, alignLeft });
        }
      } else {
        setSplitContent(null);
      }
    };
    
    // Check after element is positioned (physics system positions elements)
    // Use multiple attempts to catch element after positioning
    const attempts = [100, 300, 500];
    const timeouts = attempts.map(delay => setTimeout(checkAndSplit, delay));
    
    // Also check on resize
    window.addEventListener('resize', checkAndSplit);
    
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('resize', checkAndSplit);
    };
  }, [id, label, children, style?.fontSize]);

  let content: React.ReactNode = label;

  if (splitContent && typeof window !== 'undefined' && window.innerWidth <= 768) {
    // Render split content with random alignment
    content = (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.2rem',
        width: '100%'
      }}>
        <div style={{ textAlign: splitContent.alignLeft ? 'left' : 'right' }}>
          {splitContent.line1}
        </div>
        <div style={{ textAlign: splitContent.alignLeft ? 'right' : 'left' }}>
          {splitContent.line2}
        </div>
      </div>
    );
  } else if (children) {
    content = children;
  } else if (href) {
    content = <Link href={href}>{label}</Link>;
  } else {
    content = <span>{label}</span>;
  }

  const handleTouch = (e: React.TouchEvent) => {
    // Only handle touch for items with href or onClick
    if (!href && !onClick) return;
    
    // Prevent default link behavior on first tap
    if (!tapped) {
      e.preventDefault();
      setTapped(true);
      // Reset after delay if no second tap
      setTimeout(() => setTapped(false), 2000);
    } else {
      // Second tap - navigate or trigger action
      if (href) {
        router.push(href);
      } else if (onClick) {
        onClick();
      }
      setTapped(false);
    }
  };

  const combinedRef = (el: HTMLDivElement | null) => {
    itemRef.current = el;
    registerRef(el);
  };

  return (
    <div
      ref={combinedRef}
      className={styles.item}
      onClick={onClick}
      onTouchEnd={handleTouch}
      onMouseEnter={() => setHovered?.(id, true)}
      onMouseLeave={() => setHovered?.(id, false)}
      style={{
        ...style,
        textDecoration: tapped ? 'underline' : style?.textDecoration,
        opacity: 0, // Hidden until positioned
      }}
      id={`floating-${id}`}
    >
      {content}
    </div>
  );
};
