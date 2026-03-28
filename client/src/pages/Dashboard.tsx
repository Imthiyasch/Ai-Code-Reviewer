import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { ReviewHistoryTable } from '../components/ReviewHistoryTable';
import { Avatar } from '../components/ui/Avatar';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface Stats { total: number; avgScore: number; topLang: string; }

export default function Dashboard() {
  const { user } = useAuthStore();
  const { toasts, removeToast, success, error } = useToast();
  const [stats, setStats] = useState<Stats|null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/reviews?page=1').then(res => {
      const reviews = res.data.reviews;
      const total = res.data.total;
      const avgScore = reviews.length > 0
        ? Math.round(reviews.reduce((s: number, r: any) => s + r.quality_score, 0) / reviews.length)
        : 0;
      const langCounts: Record<string,number> = {};
      reviews.forEach((r: any) => { if (r.language) langCounts[r.language] = (langCounts[r.language]??0)+1; });
      const topLang = Object.entries(langCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—';
      setStats({ total, avgScore, topLang });
    }).catch(() => {}).finally(() => setStatsLoading(false));
  }, [refreshKey]);

  return (
    <div style={{ minHeight:'100vh', position: 'relative' }}>
      <div className="app-background" />
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:40, paddingBottom:64 }}>
        {/* Header */}
        <div className="animate-fadeIn" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:40, flexWrap:'wrap', gap:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Avatar src={user?.avatar_url} name={user?.name ?? 'User'} size={56} />
            <div>
              <h1 style={{ fontSize:28, marginBottom:4 }}>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
              <p style={{ fontSize:14, color:'var(--color-text-2)' }}>{user?.email}</p>
            </div>
          </div>
          <Link to="/review/new" style={{ textDecoration: 'none' }}>
            <button className="btn-pill" style={{ padding: '14px 28px', fontSize: '15px' }}>
              <span style={{ fontSize: '18px' }}>✨</span> Start New Review
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom:40 }}>
          {statsLoading
            ? Array.from({length:3}).map((_,i) => (
              <div className="glass" key={i} style={{ borderRadius:'var(--radius-xl)', padding:24 }}>
                <div className="skeleton" style={{ height:18, width:'50%', marginBottom:16 }} />
                <div className="skeleton" style={{ height:36, width:'60%', marginBottom:12 }} />
                <div className="skeleton" style={{ height:14, width:'80%' }} />
              </div>
            ))
            : <>
              <StatCard label="Total Reviews" value={stats?.total ?? 0} icon="📝" color="var(--color-primary)" />
              <StatCard label="Avg Quality Score" value={stats?.avgScore ? `${stats.avgScore}/10` : '—'} icon="⭐" color="var(--color-warning)" />
              <StatCard label="Top Language" value={stats?.topLang ?? '—'} icon="💻" color="var(--color-success)" />
            </>
          }
        </div>

        {/* History Table */}
        <div className="animate-fadeIn" style={{ animationDelay:'0.1s' }}>
          <ReviewHistoryTable
            onDelete={() => setRefreshKey(k=>k+1)}
            onToast={(type,msg) => type==='success' ? success(msg) : error(msg)}
          />
        </div>
      </div>
    </div>
  );
}
