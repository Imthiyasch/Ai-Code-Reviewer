import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../hooks/useToast';

const icons = { success: '✓', error: '✕', info: 'ℹ' };

interface ToastContainerProps {
  toasts: { id: string; type: 'success'|'error'|'info'; message: string }[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return createPortal(
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span style={{ fontSize:16, fontWeight:700 }}>{icons[t.type]}</span>
          <span style={{ flex:1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-text-3)',fontSize:16,padding:0,lineHeight:1 }}>×</button>
        </div>
      ))}
    </div>,
    document.body
  );
}

export default ToastContainer;
