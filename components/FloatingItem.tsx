import React from 'react';
import styles from './FloatingItem.module.css';
import Link from 'next/link';

type Props = {
  id: string;
  label?: string;
  href?: string;
  onClick?: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const FloatingItem = ({ id, label, href, onClick, registerRef, style, children }: Props) => {
  let content: React.ReactNode = label;

  if (children) {
    content = children;
  } else if (href) {
    content = <Link href={href}>{label}</Link>;
  } else {
    content = <span>{label}</span>;
  }

  return (
    <div
      ref={registerRef}
      className={styles.item}
      onClick={onClick}
      style={style}
      id={`floating-${id}`}
    >
      {content}
    </div>
  );
};
