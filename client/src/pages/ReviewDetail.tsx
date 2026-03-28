import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CodeViewer } from '../components/CodeViewer';
import { QualityRing } from '../components/QualityRing';
import { BugReportCard } from '../components/BugReportCard';
import { ImprovementsCard } from '../components/ImprovementsCard';
import { DocsCard } from '../components/DocsCard';
import { Button } from '../components/ui/Button';
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
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:32, paddingBottom:64 }}>
        {loading
          ? <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {Array.from({length:4}).map((_,i)=><SkeletonCard key={i}/>)}
            </div>
          : review
            ? (
              <div className="animate-fadeIn">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                  <div>
                    <Button variant="ghost" size="sm" onClick={()=>navigate('/dashboard')} style={{ marginBottom:8 }}>← Dashboard</Button>
                    <h1>Code Review</h1>
                    <p style={{ color:'var(--color-text-3)', fontSize:13 }}>
                      {new Date(review.created_at).toLocaleString()} · {review.language ?? 'Unknown'} · {review.source_type}
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <Button variant="secondary" onClick={handleExport} icon="⬇">Export .md</Button>
                    <Button variant="danger" onClick={()=>setDeleteOpen(true)}>Delete</Button>
                  </div>
                </div>

                <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:20, display:'flex', alignItems:'center', gap:28 }}>
                  <QualityRing score={review.quality_score} size={130} />
                  <div>
                    <h2 style={{ marginBottom:8 }}>Quality Score</h2>
                    <p style={{ maxWidth:480 }}>{review.summary}</p>
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <h3 style={{ marginBottom:12 }}>Submitted Code</h3>
                  <CodeViewer code={review.full_code} language={review.language ?? 'text'} />
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <BugReportCard bugs={review.bugs ?? []} />
                  <ImprovementsCard improvements={review.improvements ?? []} language={review.language ?? 'text'} />
                  <DocsCard documentation={review.documentation ?? []} />
                </div>
              </div>
            )
            : <div style={{ textAlign:'center', padding:60 }}><h2>Review not found</h2><Button variant="primary" onClick={()=>navigate('/dashboard')}>Go to Dashboard</Button></div>
        }
      </div>

      <Modal open={deleteOpen} onClose={()=>setDeleteOpen(false)} title="Delete Review">
        <p style={{ marginBottom:20 }}>Delete this review permanently? This cannot be undone.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <Button variant="secondary" onClick={()=>setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
