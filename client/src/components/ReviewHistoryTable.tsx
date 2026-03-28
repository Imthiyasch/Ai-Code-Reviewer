import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Review } from '../hooks/useReviews';
import { useReviews } from '../hooks/useReviews';
import { Badge } from './ui/Badge';
import { SkeletonRow } from './ui/Skeleton';
import { Modal } from './ui/Modal';
import api from '../lib/api';

interface ReviewHistoryTableProps {
  onDelete?: () => void;
  onToast?: (type: 'success'|'error', msg: string) => void;
}

const LANGUAGES = ['All','JavaScript','TypeScript','Python','Go','Rust','Java','C++','C#','PHP','Ruby','Swift'];

export function ReviewHistoryTable({ onDelete, onToast }: ReviewHistoryTableProps) {
  const { fetchReviews } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviews({
        page,
        ...(lang !== 'All' ? { language: lang } : {}),
      });
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {}
    setLoading(false);
  }, [page, lang, fetchReviews]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${deleteTarget}`);
      onToast?.('success', 'Review deleted');
      setDeleteTarget(null);
      load();
      onDelete?.();
    } catch {
      onToast?.('error', 'Failed to delete review');
    }
    setDeleting(false);
  };

  const scoreColor = (s: number) => s >= 8 ? '#22c55e' : s >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h3 style={{ color:'var(--color-text)', fontSize: 18, fontWeight: 800 }}>Analysis History <span style={{ color:'var(--color-text-3)', fontWeight:500, fontSize:14 }}>({total})</span></h3>
        <select value={lang} onChange={e=>{setLang(e.target.value);setPage(1);}} style={{ width:'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '6px 12px' }}>
          {LANGUAGES.map(l=><option key={l}>{l}</option>)}
        </select>
      </div>

      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'20px', overflow:'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading
          ? <div style={{ padding:'12px 20px' }}>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>)}</div>
          : reviews.length === 0
            ? <div style={{ padding:60, textAlign:'center', color:'var(--color-text-3)' }}>
                <p style={{ marginBottom: 16 }}>No analysis history yet.</p>
                <Link to="/review/new" className="btn-pill" style={{ textDecoration: 'none' }}>Start New Analysis</Link>
              </div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Language</th>
                      <th>Efficiency</th>
                      <th>Context Snippet</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(r => (
                      <tr key={r.id}>
                        <td style={{ color:'var(--color-text-3)', fontSize:12, whiteSpace:'nowrap', fontWeight: 500 }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td><Badge variant="info">{r.language ?? 'auto'}</Badge></td>
                        <td>
                          <span style={{ fontWeight:800, color:scoreColor(r.quality_score), fontSize: 13 }}>{r.quality_score}/10</span>
                        </td>
                        <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--color-text-2)', fontFamily:'monospace', fontSize:11, opacity: 0.8 }}>
                          {r.code_snippet}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:8 }}>
                            <Link to={`/review/${r.id}`} style={{ textDecoration:'none' }}>
                              <button className="btn-pill" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '4px 12px', fontSize: 12 }}>View</button>
                            </Link>
                            <button className="btn-pill" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 12px', fontSize: 12 }} onClick={()=>setDeleteTarget(r.id)}>Delete</button>
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

      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginTop:24 }}>
          <button className="btn-pill" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', opacity: page === 1 ? 0.5 : 1 }} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Back</button>
          <span style={{ color:'var(--color-text-2)', fontSize:13, fontWeight: 600 }}>{page} / {totalPages}</span>
          <button className="btn-pill" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', opacity: page === totalPages ? 0.5 : 1 }} disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Analysis">
        <p style={{ marginBottom:32, fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-2)' }}>
          Are you sure you want to permanently delete this analysis record? This cannot be undone.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }} onClick={()=>setDeleteTarget(null)}>
            Keep Entry
          </button>
          <button className="btn-pill" style={{ background: 'var(--color-danger)', border: 'none', color: '#fff' }} onClick={handleDelete}>
            {deleting ? 'Processing...' : 'Delete Permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default ReviewHistoryTable;
