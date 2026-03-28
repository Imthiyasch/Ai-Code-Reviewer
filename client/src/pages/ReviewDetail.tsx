import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CodeViewer } from '../components/CodeViewer';
import { QualityRing } from '../components/QualityRing';
import { BugReportCard } from '../components/BugReportCard';
import { ImprovementsCard } from '../components/ImprovementsCard';
import { DocsCard } from '../components/DocsCard';
import { Modal } from '../components/ui/Modal';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { useReviews } from '../hooks/useReviews';
import type { Review } from '../hooks/useReviews';
import { SkeletonCard } from '../components/ui/Skeleton';
import { generateMarkdown, downloadMarkdown } from '../lib/markdownExporter';
import api from '../lib/api';

export default function ReviewDetail() {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const { fetchReview } = useReviews();
  const { toasts, removeToast, success, error } = useToast();
  const [review, setReview] = useState<Review|null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchReview(id).then(setReview).catch(()=>error('Failed to load review')).finally(()=>setLoading(false));
  }, [id]);

  const handleExport = () => {
    if (!review) return;
    downloadMarkdown(generateMarkdown(review), `review-${review.id}.md`);
    success('Markdown exported!');
  };

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review.id}`);
      success('Review deleted'); navigate('/dashboard');
    } catch { error('Failed to delete review'); }
    setDeleting(false);
  };

  return (
    <div style={{ minHeight:'100vh', position: 'relative' }}>
      <div className="app-background" />
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:40, paddingBottom:64 }}>
        {loading
          ? <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          : review
            ? (
              <div className="animate-fadeIn">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:40, flexWrap:'wrap', gap:20 }}>
                  <div>
                    <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111', fontSize: '12px', padding: '6px 16px', marginBottom: 12 }} onClick={()=>navigate('/dashboard')}>
                      ← Return to Dashboard
                    </button>
                    <h1 style={{ fontSize: '32px' }}>Analysis Intelligence</h1>
                    <p style={{ color:'var(--color-text-3)', fontSize:14, fontWeight: 600, marginTop: 4 }}>
                      {new Date(review.created_at).toLocaleDateString()} · {review.language?.toUpperCase() ?? 'GENERIC'} · {review.source_type.toUpperCase()}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }} onClick={handleExport}>
                      <span style={{ marginRight: 6 }}>⬇</span> Export .md
                    </button>
                    <button className="btn-pill" style={{ background: 'var(--color-danger)', border: 'none', color: '#fff' }} onClick={()=>setDeleteOpen(true)}>
                      Delete Review
                    </button>
                  </div>
                </div>

                <div className="glass animate-slideIn" style={{ padding:40, borderRadius:'var(--radius-xl)', marginBottom:32, display:'flex', alignItems:'center', gap:40 }}>
                  <QualityRing score={review.quality_score} size={150} />
                  <div>
                    <h2 style={{ marginBottom:12, fontSize: '24px' }}>Executive Summary</h2>
                    <p style={{ maxWidth:500, fontSize: '16px', lineHeight: 1.7, color: 'var(--color-text-2)' }}>{review.summary}</p>
                  </div>
                </div>

                <div style={{ marginBottom:40 }}>
                  <h3 style={{ marginBottom:16, fontSize: '18px', fontWeight: 800 }}>Submitted Source</h3>
                  <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-lg)' }}>
                    <CodeViewer code={review.full_code} language={review.language ?? 'text'} />
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  <BugReportCard bugs={review.bugs ?? []} />
                  <ImprovementsCard improvements={review.improvements ?? []} language={review.language ?? 'text'} />
                  <DocsCard documentation={review.documentation ?? []} />
                </div>
              </div>
            )
            : <div style={{ textAlign:'center', padding:100 }} className="glass">
                <h2 style={{ marginBottom: 20 }}>Analysis instance not found</h2>
                <button className="btn-pill" onClick={()=>navigate('/dashboard')}>Return to Dashboard</button>
              </div>
        }
      </div>

      <Modal open={deleteOpen} onClose={()=>setDeleteOpen(false)} title="Delete Review">
        <p style={{ marginBottom:32, fontSize: '16px', lineHeight: 1.6, color: 'var(--color-text-2)' }}>
          Are you sure you want to permanently delete this analysis? This action cannot be undone.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111' }} onClick={()=>setDeleteOpen(false)}>
            Keep Review
          </button>
          <button className="btn-pill" style={{ background: 'var(--color-danger)', border: 'none', color: '#fff' }} onClick={handleDelete}>
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
