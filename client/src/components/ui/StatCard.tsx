import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: number;
  color?: string;
}

export function StatCard({ label, value, icon, trend, color = 'var(--color-primary)' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</span>
        {trend !== undefined && (
          <span style={{ fontSize:12, color: trend >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:600 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const statStyles = `
.stat-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  transition: box-shadow var(--transition), transform var(--transition);
}
.stat-card:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(250,90,42,0.08); }
.stat-icon {
  display:inline-flex; align-items:center; justify-content:center;
  width:48px; height:48px; border-radius:12px; font-size:22px;
}
.stat-value { font-size:36px; font-weight:800; color:#111; line-height:1; margin-bottom:8px; letter-spacing: -0.03em; }
.stat-label { font-size:14px; color:var(--color-text-2); font-weight:600; text-transform: uppercase; letter-spacing: 0.05em; }
`;
if (typeof document !== 'undefined' && !document.getElementById('stat-styles')) {
  const s = document.createElement('style'); s.id='stat-styles'; s.textContent=statStyles; document.head.appendChild(s);
}

export default StatCard;
