import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { Review } from '../hooks/useReviews';
import { useReviews } from '../hooks/useReviews';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Skeleton, SkeletonRow } from './ui/Skeleton';
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

  const scoreColor = (s: number) => s >= 8 ? 'var(--color-success)' : s >= 5 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <h3 style={{ color:'var(--color-text)' }}>Review History <span style={{ color:'var(--color-text-3)', fontWeight:400, fontSize:14 }}>({total})</span></h3>
        <select value={lang} onChange={e=>{setLang(e.target.value);setPage(1);}} style={{ width:'auto' }}>
          {LANGUAGES.map(l=><option key={l}>{l}</option>)}
        </select>
      </div>

      <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        {loading
          ? <div style={{ padding:'8px 16px' }}>{Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>)}</div>
          : reviews.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'var(--color-text-3)' }}>No reviews yet. <Link to="/review/new">Start your first review →</Link></div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Language</th>
                      <th>Score</th>
                      <th>Snippet</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(r => (
                      <tr key={r.id}>
                        <td style={{ color:'var(--color-text-3)', fontSize:12, whiteSpace:'nowrap' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td><Badge variant="info">{r.language ?? 'auto'}</Badge></td>
                        <td>
                          <span style={{ fontWeight:700, color:scoreColor(r.quality_score) }}>{r.quality_score}/10</span>
                        </td>
                        <td style={{ maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--color-text-2)', fontFamily:'monospace', fontSize:12 }}>
                          {r.code_snippet}
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <Link to={`/review/${r.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                            <Button variant="danger" size="sm" onClick={()=>setDeleteTarget(r.id)}>Delete</Button>
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
        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center', marginTop:16 }}>
          <Button variant="secondary" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</Button>
          <span style={{ color:'var(--color-text-2)', fontSize:13 }}>Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next →</Button>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Review">
        <p style={{ marginBottom:20 }}>Are you sure you want to delete this review? This action cannot be undone.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={()=>setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default ReviewHistoryTable;
