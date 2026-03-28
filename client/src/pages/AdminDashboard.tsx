import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { SkeletonRow } from '../components/ui/Skeleton';
import { AdminCharts } from '../components/AdminCharts';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import api from '../lib/api';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { toasts, removeToast, success, error } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null);
  const [deleting, setDeleting] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/403" replace />;

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch { error('Failed to load admin data'); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget}`);
      success('User deleted');
      setDeleteTarget(null);
      loadData();
    } catch { error('Failed to delete user'); }
    setDeleting(false);
  };

  return (
    <div style={{ minHeight:'100vh', position: 'relative' }}>
      <div className="app-background" />
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:40, paddingBottom:64 }}>
        <div className="animate-fadeIn" style={{ marginBottom:40 }}>
          <h1 style={{ marginBottom:4, fontSize: '32px' }}>Admin Dashboard <span style={{ fontSize:14, color:'var(--color-text-3)', fontWeight:400 }}>🔐</span></h1>
          <p style={{ fontSize: '18px', color:'var(--color-text-2)' }}>Platform-wide analytics and user management</p>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom:40 }}>
          <StatCard label="Total Reviews" value={stats?.totals?.total ?? '…'} icon="📝" color="var(--color-primary)" />
          <StatCard label="Reviews Today" value={stats?.totals?.today ?? '…'} icon="📅" color="var(--color-info)" />
          <StatCard label="This Week" value={stats?.totals?.this_week ?? '…'} icon="📊" color="var(--color-success)" />
        </div>

        {/* Charts */}
        {stats && <div style={{ marginBottom:40 }}><AdminCharts daily={stats.daily ?? []} topBugs={stats.topBugs ?? []} /></div>}

        {/* User table */}
        <div className="glass animate-fadeIn" style={{ animationDelay: '0.1s', borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
          <div style={{ padding:'24px 32px', borderBottom:'1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '20px' }}>Active Users ({users.length})</h3>
            <button className="btn-pill" style={{ background: '#111', color: '#fff', fontSize: '13px', padding: '8px 20px' }} onClick={loadData}>
              Refresh
            </button>
          </div>
          {loading
            ? <div style={{ padding:'40px 32px' }}>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i} />)}</div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '16px 32px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>User Identity</th>
                      <th style={{ padding: '16px 12px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Last Seen</th>
                      <th style={{ padding: '16px 12px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Activity</th>
                      <th style={{ padding: '16px 12px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Score Avg</th>
                      <th style={{ padding: '16px 32px', fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-3)' }}>Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <td style={{ padding: '20px 32px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                            <Avatar src={u.avatar_url} name={u.name} size={40} />
                            <div>
                              <div style={{ fontWeight:700, fontSize:15, color: '#111' }}>{u.name}</div>
                              <div style={{ color:'var(--color-text-3)', fontSize:13 }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '20px 12px', color:'var(--color-text-2)', fontSize:14 }}>
                          {new Date(u.last_active_at).toLocaleString(undefined, {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </td>
                        <td style={{ padding: '20px 12px' }}>
                          <span style={{ fontWeight:700, color:'var(--color-primary)', background: 'var(--color-primary-glow)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px' }}>
                            {u.review_count} Reviews
                          </span>
                        </td>
                        <td style={{ padding: '20px 12px' }}>
                          <div style={{ fontWeight: 800, fontSize: '16px', color: (u.avg_score >= 8 ? 'var(--color-success)' : u.avg_score >= 5 ? 'var(--color-warning)' : 'var(--color-danger)') }}>
                            {u.avg_score ? `${u.avg_score} / 10` : '—'}
                          </div>
                        </td>
                        <td style={{ padding: '20px 32px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                            <Badge variant={u.role==='admin'?'high':'default'}>{u.role}</Badge>
                            {u.id !== user?.id && (
                              <button 
                                className="btn-pill" 
                                style={{ 
                                  padding: '8px 16px', fontSize: '12px', 
                                  background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)',
                                  opacity: 0.6, transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.opacity = '1'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.opacity = '0.6'; }}
                                onClick={()=>setDeleteTarget(u.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>

      <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete User">
        <p style={{ marginBottom:32, fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-2)' }}>
          This will permanently delete the user and <strong>ALL</strong> their reviews from the database. This action is destructive and cannot be undone.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }} onClick={()=>setDeleteTarget(null)}>
            Keep User
          </button>
          <button className="btn-pill" style={{ background: 'var(--color-danger)', border: 'none', color: '#fff' }} onClick={handleDelete}>
            {deleting ? 'Processing...' : 'Delete User Permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
