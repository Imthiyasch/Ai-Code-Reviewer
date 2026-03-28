import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position: 'relative' }}>
      <div className="app-background" />
      <div className="glass animate-fadeIn" style={{ display: 'flex', flexDirection:'column', gap: 20, textAlign:'center', padding: '60px 80px', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ fontSize:72, margin: '0 auto', background: 'var(--color-surface)', width: 120, height: 120, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>🔍</div>
        <h1 style={{ fontSize:64, fontWeight:800, margin: 0 }}>404</h1>
        <p style={{ color:'var(--color-text-2)', fontSize: 18, marginBottom: 12 }}>This page doesn't exist or was moved.</p>
        <Link to="/dashboard" style={{ textDecoration: 'none', margin: '0 auto' }}>
          <button className="btn-pill">
            Return to Dashboard <span className="arrow">↗</span>
          </button>
        </Link>
      </div>
    </div>
  );
}

export function Forbidden() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position: 'relative' }}>
      <div className="app-background" />
      <div className="glass animate-fadeIn" style={{ display: 'flex', flexDirection:'column', gap: 20, textAlign:'center', padding: '60px 80px', borderRadius: 'var(--radius-xl)' }}>
        <div style={{ fontSize:72, margin: '0 auto', background: 'var(--color-surface)', width: 120, height: 120, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}>🔒</div>
        <h1 style={{ fontSize:64, fontWeight:800, margin: 0, color: 'var(--color-danger)' }}>403</h1>
        <p style={{ color:'var(--color-text-2)', fontSize: 18, marginBottom: 12 }}>You don't have permission to access this page.</p>
        <Link to="/dashboard" style={{ textDecoration: 'none', margin: '0 auto' }}>
          <button className="btn-pill">
            Return to Dashboard <span className="arrow">↗</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
