import React, { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  danger:    'btn-danger',
  ghost:     'btn-ghost',
};

const sizeStyles: Record<string, string> = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...rest
}, ref) => (
  <button
    ref={ref}
    className={`btn ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <span className="btn-spinner" /> : icon}
    {children}
  </button>
));
Button.displayName = 'Button';

// ─── Styles injected via a <style> tag ───────────────
const styleSheet = `
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 8px; font-family: var(--font-sans); font-weight: 600;
  border: none; cursor: pointer; border-radius: var(--radius-md);
  transition: all var(--transition); white-space: nowrap; position: relative;
  text-decoration: none;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm  { font-size: 12px; padding: 6px 12px; }
.btn-md  { font-size: 14px; padding: 10px 20px; }
.btn-lg  { font-size: 16px; padding: 13px 28px; }
.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), #5b52e8);
  color: #fff;
  box-shadow: 0 0 20px var(--color-primary-glow);
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 30px var(--color-primary-glow), 0 4px 12px rgba(0,0,0,0.3);
}
.btn-primary:active:not(:disabled) { transform: translateY(0); }
.btn-secondary {
  background: var(--color-surface-2); color: var(--color-text);
  border: 1px solid var(--color-border-2);
}
.btn-secondary:hover:not(:disabled) { background: var(--color-bg-3); border-color: var(--color-primary); }
.btn-danger { background: var(--color-danger); color: #fff; }
.btn-danger:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
.btn-ghost { background: transparent; color: var(--color-text-2); }
.btn-ghost:hover:not(:disabled) { background: var(--color-surface-2); color: var(--color-text); }
.btn-spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin 0.7s linear infinite; display: inline-block;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('btn-styles')) {
  const s = document.createElement('style');
  s.id = 'btn-styles'; s.textContent = styleSheet;
  document.head.appendChild(s);
}

export default Button;
