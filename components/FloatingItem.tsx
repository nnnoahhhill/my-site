import React, { useState } from 'react';
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
  const router = useRouter();

  let content: React.ReactNode = label;

  if (children) {
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

  return (
    <div
      ref={registerRef}
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
