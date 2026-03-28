import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
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
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:32, paddingBottom:64 }}>
        <div className="animate-fadeIn" style={{ marginBottom:32 }}>
          <h1 style={{ marginBottom:4 }}>Admin Dashboard <span style={{ fontSize:14, color:'var(--color-text-3)', fontWeight:400 }}>🔐</span></h1>
          <p style={{ color:'var(--color-text-2)' }}>Platform-wide analytics and user management</p>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:32 }}>
          <StatCard label="Total Reviews" value={stats?.totals?.total ?? '…'} icon="📝" color="var(--color-primary)" />
          <StatCard label="Reviews Today" value={stats?.totals?.today ?? '…'} icon="📅" color="var(--color-info)" />
          <StatCard label="This Week" value={stats?.totals?.this_week ?? '…'} icon="📊" color="var(--color-success)" />
        </div>

        {/* Charts */}
        {stats && <div style={{ marginBottom:32 }}><AdminCharts daily={stats.daily ?? []} topBugs={stats.topBugs ?? []} /></div>}

        {/* User table */}
        <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
            <h3>All Users ({users.length})</h3>
          </div>
          {loading
            ? <div style={{ padding:'8px 16px' }}>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i} />)}</div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Login Time</th>
                      <th>Work Done</th>
                      <th>Result</th>
                      <th>Role & Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <Avatar src={u.avatar_url} name={u.name} size={32} />
                            <div>
                              <div style={{ fontWeight:600, fontSize:14 }}>{u.name}</div>
                              <div style={{ color:'var(--color-text-3)', fontSize:12 }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color:'var(--color-text-2)', fontSize:13 }}>
                          {new Date(u.last_active_at).toLocaleString(undefined, {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </td>
                        <td>
                          <div style={{ fontWeight:600, color:'var(--color-primary)'}}>
                            {u.review_count} Reviews
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: (u.avg_score >= 8 ? 'var(--color-success)' : u.avg_score >= 5 ? 'var(--color-warning)' : 'var(--color-danger)') }}>
                            {u.avg_score ? `${u.avg_score} / 10` : '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Badge variant={u.role==='admin'?'high':'default'}>{u.role}</Badge>
                            {u.id !== user?.id && (
                              <button 
                                className="btn-pill" 
                                style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--color-danger)', border: 'none', color: '#fff' }}
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
        <p style={{ marginBottom:20 }}>This will permanently delete the user and ALL their reviews. This cannot be undone.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={()=>setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete User</Button>
        </div>
      </Modal>
    </div>
  );
}
