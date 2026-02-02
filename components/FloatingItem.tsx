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
  const [splitContent, setSplitContent] = useState<{ lines: string[] } | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Check if text needs to be split on mobile (50% max width constraint)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      setSplitContent(null);
      return;
    }
    if (children || !label) {
      setSplitContent(null);
      return; // Only split text labels, not custom children
    }
    
    const measureText = (text: string): number => {
      const tempEl = document.createElement('span');
      tempEl.style.position = 'absolute';
      tempEl.style.visibility = 'hidden';
      tempEl.style.whiteSpace = 'nowrap';
      const computedStyle = window.getComputedStyle(itemRef.current!);
      tempEl.style.fontSize = computedStyle.fontSize || (style?.fontSize ? String(style.fontSize) : '3rem');
      tempEl.style.fontWeight = computedStyle.fontWeight || 'bold';
      tempEl.style.fontFamily = computedStyle.fontFamily || 'inherit';
      tempEl.style.padding = computedStyle.padding || '0.5rem 1rem';
      tempEl.textContent = text;
      document.body.appendChild(tempEl);
      const width = tempEl.offsetWidth;
      document.body.removeChild(tempEl);
      return width;
    };
    
    const checkAndSplit = () => {
      if (!itemRef.current || !label) return;
      
      const viewportWidth = window.innerWidth;
      const maxWidth = viewportWidth * 0.5; // 50% max width
      
      const fullWidth = measureText(label);
      
      if (fullWidth <= maxWidth) {
        setSplitContent(null);
        return;
      }
      
      // Split in half first
      const words = label.split(' ');
      let line1: string, line2: string;
      
      if (words.length === 1) {
        // Single word - split in middle
        const mid = Math.ceil(label.length / 2);
        line1 = label.slice(0, mid);
        line2 = label.slice(mid);
      } else {
        const midPoint = Math.ceil(words.length / 2);
        line1 = words.slice(0, midPoint).join(' ');
        line2 = words.slice(midPoint).join(' ');
      }
      
      // Check if either line is still too wide
      const line1Width = measureText(line1);
      const line2Width = measureText(line2);
      
      if (line1Width > maxWidth || line2Width > maxWidth) {
        // Split first part into thirds
        const firstWords = line1.split(' ');
        if (firstWords.length === 1) {
          // Single word - split into thirds
          const third = Math.ceil(firstWords[0].length / 3);
          const line1a = firstWords[0].slice(0, third);
          const line1b = firstWords[0].slice(third, third * 2);
          const line1c = firstWords[0].slice(third * 2);
          setSplitContent({ lines: [line1a, line1b, line1c, line2] });
        } else {
          const thirdPoint = Math.ceil(firstWords.length / 3);
          const line1a = firstWords.slice(0, thirdPoint).join(' ');
          const line1b = firstWords.slice(thirdPoint, thirdPoint * 2).join(' ');
          const line1c = firstWords.slice(thirdPoint * 2).join(' ');
          setSplitContent({ lines: [line1a, line1b, line1c, line2] });
        }
      } else {
        // Two lines is enough
        setSplitContent({ lines: [line1, line2] });
      }
    };
    
    // Check after element is positioned (physics system positions elements)
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
    // Render split content - always left align consecutive lines
    content = (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.2rem',
        width: '100%',
        textAlign: 'left'
      }}>
        {splitContent.lines.map((line, idx) => (
          <div key={idx} style={{ textAlign: 'left' }}>
            {line}
          </div>
        ))}
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
