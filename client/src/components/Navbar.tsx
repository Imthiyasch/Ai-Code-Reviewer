import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { Avatar } from './ui/Avatar';
import { Button } from './ui/Button';
import api from '../lib/api';

export function Navbar() {
  const { user, logout: storeLogout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    storeLogout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <div className="page-container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:65 }}>
        <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <div style={{
            width:36, height:36, borderRadius:'var(--radius-full)',
            background:'var(--color-primary)',
            color: '#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
          }}>🤖</div>
          <span style={{ fontWeight:800, fontSize:18, color:'var(--color-text)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
            CodeLens.AI
          </span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {user?.role === 'admin' && (
            <Link to="/admin" style={{ textDecoration: 'none' }}>
              <span className="btn-pill" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border-2)', padding: '8px 16px' }}>
                Admin Dash
              </span>
            </Link>
          )}
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background: 'var(--color-surface)', padding: '4px 12px 4px 4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
              <Avatar src={user.avatar_url} name={user.name} size={32} />
              <span style={{ fontSize:14, fontWeight:600, color:'var(--color-text)' }}>{user.name.split(' ')[0]}</span>
            </div>
          )}
          <button className="btn-pill" onClick={handleLogout} style={{ opacity: 0.9 }}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
