import type { ReactNode } from 'react';

type BadgeVariant = 'low' | 'medium' | 'high' | 'info' | 'default';

const styles: Record<BadgeVariant, string> = {
  low:     'background:rgba(34,197,94,0.18);color:#22c55e;border:1px solid rgba(34,197,94,0.3)',
  medium:  'background:rgba(245,158,11,0.18);color:#f59e0b;border:1px solid rgba(245,158,11,0.3)',
  high:    'background:rgba(239,68,68,0.18);color:#ef4444;border:1px solid rgba(239,68,68,0.3)',
  info:    'background:rgba(56,189,248,0.18);color:#38bdf8;border:1px solid rgba(56,189,248,0.3)',
  default: 'background:var(--color-surface-2);color:var(--color-text-2);border:1px solid var(--color-border)',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

export function Badge({ variant = 'default', children, pulse, className = '' }: BadgeProps) {
  return (
    <span
      className={`badge ${pulse ? 'badge-pulse' : ''} ${className}`}
      style={{ ...Object.fromEntries(styles[variant].split(';').filter(Boolean).map(p => {
        const [k, ...v] = p.split(':');
        return [k.trim().replace(/-([a-z])/g, (_,c) => c.toUpperCase()), v.join(':').trim()];
      })) }}
    >
      {children}
    </span>
  );
}

const badgeStyles = `
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 3px 8px;
  border-radius: var(--radius-full); white-space: nowrap;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.badge-pulse { animation: pulse 2s ease-in-out infinite; }
`;
if (typeof document !== 'undefined' && !document.getElementById('badge-styles')) {
  const s = document.createElement('style'); s.id = 'badge-styles'; s.textContent = badgeStyles;
  document.head.appendChild(s);
}

export default Badge;
