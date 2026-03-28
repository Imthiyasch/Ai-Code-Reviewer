import React, { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  collapsible?: boolean;
  title?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  defaultOpen?: boolean;
}

export function Card({ children, collapsible, title, className = '', style, defaultOpen = true }: CardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`card ${className}`} style={style}>
      {(collapsible || title) && (
        <div
          className={`card-header ${collapsible ? 'collapsible' : ''}`}
          onClick={() => collapsible && setOpen(o => !o)}
        >
          <span className="card-title">{title}</span>
          {collapsible && (
            <span className={`card-chevron ${open ? 'open' : ''}`}>▾</span>
          )}
        </div>
      )}
      {(!collapsible || open) && <div className="card-body">{children}</div>}
    </div>
  );
}

const cardStyles = `
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition);
}
.card:hover { border-color: var(--color-border-2); }
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}
.card-header.collapsible { cursor: pointer; user-select: none; }
.card-header.collapsible:hover { background: var(--color-bg-3); }
.card-title { font-weight: 600; font-size: 15px; }
.card-chevron { font-size: 18px; color: var(--color-text-3); transition: transform var(--transition); }
.card-chevron.open { transform: rotate(180deg); }
.card-body { padding: 20px; }
`;
if (typeof document !== 'undefined' && !document.getElementById('card-styles')) {
  const s = document.createElement('style'); s.id = 'card-styles'; s.textContent = cardStyles;
  document.head.appendChild(s);
}

export default Card;
