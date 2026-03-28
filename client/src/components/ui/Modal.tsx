import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} 
      role="dialog" aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, 
        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div className="glass animate-slideIn" style={{ 
        width: '90%', maxWidth: '500px', padding: '40px', 
        borderRadius: 'var(--radius-xl)', boxShadow: '0 40px 100px rgba(0,0,0,0.15)',
        position: 'relative'
      }}>
        {title && <h2 style={{ marginBottom: 20, fontSize: '24px', fontWeight: 800 }}>{title}</h2>}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--color-text-3)' }}
        >
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
