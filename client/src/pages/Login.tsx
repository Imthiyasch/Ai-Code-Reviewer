import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';

export function Login() {
  const { isLoggedIn, loginWithCredential } = useAuth();
  const { toasts, error, removeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard');
  }, [isLoggedIn, navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fa', fontFamily: 'var(--font-sans)' }}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* ─── LEFT: Authentication Panel ─── */}
      <div style={{ 
        flex: '0 0 45%', display: 'flex', flexDirection: 'column', 
        padding: '60px 80px', background: '#ffffff', zIndex: 10,
        boxShadow: '20px 0 60px rgba(0,0,0,0.03)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'auto' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'var(--color-primary)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>🤖</div>
          <span style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
            CodeLens.AI
          </span>
        </div>

        {/* Login Form */}
        <div className="animate-slideIn" style={{ marginTop: '80px', marginBottom: 'auto', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '42px', marginBottom: '16px', color: '#111' }}>Log in to your dashboard</h1>
          <p style={{ fontSize: '16px', color: 'var(--color-text-2)', marginBottom: '40px', lineHeight: 1.6 }}>
            Connect to your AI-powered code analysis environment. Build, debug, and review effortlessly.
          </p>

          <div style={{ 
            padding: '4px', background: '#f3f4f8', borderRadius: 'var(--radius-full)', 
            border: '1px solid var(--color-border-2)', display: 'inline-block'
          }}>
            <GoogleLogin
              onSuccess={(res) => { if (res.credential) loginWithCredential(res.credential); }}
              onError={() => error('Google Login Failed')}
              shape="pill" size="large" theme="filled_black" text="continue_with"
            />
          </div>

          <div style={{ marginTop: '40px', display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--color-text-3)', fontWeight: 500 }}>
            <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
            <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Beautiful Dashboard Showcase / Hero ─── */}
      <div style={{ 
        flex: 1, position: 'relative', overflow: 'hidden', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #ffe3d8 0%, #fbd5c8 40%, #f5f7fa 100%)'
      }}>
        
        {/* Decorative Grid Background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: 'linear-gradient(#fa5a2a 1px, transparent 1px), linear-gradient(90deg, #fa5a2a 1px, transparent 1px)',
          backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
        }} />

        {/* Floating Glass Dashboard Elements */}
        <div className="animate-float" style={{ position: 'relative', zIndex: 2 }}>
          {/* ─── 2D Animated SVG Robot ─── */}
          <div className="animate-float" style={{ position: 'relative', width: '400px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 30px 60px rgba(250,90,42,0.25))' }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff8a65" />
                  <stop offset="100%" stopColor="#fa5a2a" />
                </linearGradient>
                <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a1c23" />
                  <stop offset="100%" stopColor="#0a0a0c" />
                </linearGradient>
                <style>
                  {`
                    @keyframes blink {
                      0%, 96%, 98% { transform: scaleY(1); }
                      97% { transform: scaleY(0.1); }
                    }
                    @keyframes scanline {
                      0% { transform: translateY(-50px); opacity: 0; }
                      10% { opacity: 0.5; }
                      90% { opacity: 0.5; }
                      100% { transform: translateY(150px); opacity: 0; }
                    }
                    @keyframes earPulse {
                      0%, 100% { fill: #facc15; }
                      50% { fill: #10b981; }
                    }
                    .bot-eye { animation: blink 4s infinite ease-in-out; transform-origin: center; }
                    .bot-scan { animation: scanline 3s infinite linear; }
                    .bot-ear { animation: earPulse 2s infinite ease-in-out; }
                  `}
                </style>
              </defs>
              
              {/* Ears/Antennas */}
              <rect x="25" y="80" width="10" height="40" rx="4" fill="#cbd5e1" />
              <rect x="165" y="80" width="10" height="40" rx="4" fill="#cbd5e1" />
              <circle cx="25" cy="100" r="6" className="bot-ear" />
              <circle cx="175" cy="100" r="6" className="bot-ear" />
              
              {/* Top Antenna */}
              <rect x="97" y="20" width="6" height="30" rx="3" fill="#cbd5e1" />
              <circle cx="100" cy="20" r="8" fill="#10b981">
                <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Main Head Chassis */}
              <rect x="40" y="45" width="120" height="110" rx="30" fill="url(#robotGrad)" />
              
              {/* Face Screen */}
              <rect x="55" y="60" width="90" height="60" rx="16" fill="url(#screenGrad)" stroke="#eb4613" strokeWidth="2" />
              
              {/* Digital Eyes */}
              <g className="bot-eye">
                <rect x="70" y="80" width="20" height="12" rx="6" fill="#10b981" />
                <rect x="110" y="80" width="20" height="12" rx="6" fill="#10b981" />
              </g>

              {/* Cheeks */}
              <circle cx="68" cy="102" r="5" fill="#ef4444" opacity="0.6" />
              <circle cx="132" cy="102" r="5" fill="#ef4444" opacity="0.6" />

              {/* Holographic Scanline */}
              <g className="bot-scan">
                <rect x="55" y="60" width="90" height="2" fill="#10b981" opacity="0.8" />
                <rect x="55" y="60" width="90" height="10" fill="url(#scanGrad)" opacity="0.2" />
              </g>

              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Floating HUD Card 1 */}
          <div className="glass" style={{
            position: 'absolute', top: '10%', left: '-80px', padding: '20px',
            borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)', display: 'flex', gap: '16px', alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.6)'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px'}}>✨</div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-2)', fontWeight: 600 }}>Code Quality</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#111' }}>9.8 <span style={{fontSize:'14px', color:'var(--color-text-3)'}}>/ 10</span></div>
            </div>
          </div>

          {/* Floating HUD Card 2 */}
          <div className="glass" style={{
            position: 'absolute', bottom: '15%', right: '-60px', padding: '24px',
            borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.85)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.6)', width: '280px'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-2)', fontWeight: 600, marginBottom: '12px' }}>AI Insights Generated</div>
            {/* Mock code lines */}
            <div style={{ height: 8, background: '#f3f4f8', borderRadius: 4, width: '100%', marginBottom: 8 }} />
            <div style={{ height: 8, background: '#f3f4f8', borderRadius: 4, width: '80%', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ background: '#fa5a2a', color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>Zero Bugs</span>
              <span style={{ background: '#111', color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 }}>Optimized</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
