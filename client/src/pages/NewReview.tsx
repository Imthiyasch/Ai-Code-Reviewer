import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CodeViewer } from '../components/CodeViewer';
import { QualityRing } from '../components/QualityRing';
import { BugReportCard } from '../components/BugReportCard';
import { ImprovementsCard } from '../components/ImprovementsCard';
import { DocsCard } from '../components/DocsCard';
import { FileTree } from '../components/FileTree';
import type { FileNode } from '../components/FileTree';
import { ToastContainer } from '../components/ui/Toast';
import { useToast } from '../hooks/useToast';
import { useReviews } from '../hooks/useReviews';
import type { Review } from '../hooks/useReviews';
import { generateMarkdown, downloadMarkdown } from '../lib/markdownExporter';

const LANGUAGES = ['Auto-detect','JavaScript','TypeScript','Python','Go','Rust','Java','C++','C#','PHP','Ruby','Swift'];

type Step = 'input' | 'viewer' | 'results';

export default function NewReview() {
  const navigate = useNavigate();
  const { submitReview, loading } = useReviews();
  const { toasts, removeToast, success, error: toastError, info } = useToast();

  // Step state
  const [step, setStep] = useState<Step>('input');

  // Paste tab state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto-detect');

  // GitHub tab state
  const [githubUrl, setGithubUrl] = useState('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeError, setTreeError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Review result
  const [review, setReview] = useState<Review|null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [sourceType, setSourceType] = useState<'paste'|'github'>('paste');
  const [submittedCode, setSubmittedCode] = useState('');
  const [submittedLang, setSubmittedLang] = useState('');

  // GitHub URL handler
  const handleGitHubUrl = useCallback((url: string) => {
    setGithubUrl(url);
    setTreeError('');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!url.includes('github.com')) return;
      setTreeLoading(true);
      try {
        const cacheKey = `gh-tree-${url}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) { setFileTree(JSON.parse(cached)); setTreeLoading(false); return; }
        const [owner, repo] = new URL(url).pathname.split('/').filter(Boolean);
        if (!owner || !repo) { setTreeError('Invalid GitHub URL'); setTreeLoading(false); return; }
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
        if (!res.ok) throw new Error(res.status === 404 ? 'Repo not found or private' : 'GitHub rate limit reached');
        const data = await res.json();
        const files = data.tree.filter((f: any) => f.type === 'blob' && f.size < 500000);
        sessionStorage.setItem(cacheKey, JSON.stringify(files));
        setFileTree(files);
      } catch (e: any) { setTreeError(e.message); setFileTree([]); }
      setTreeLoading(false);
    }, 500);
  }, []);

  const toggleFile = (path: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handlePasteSubmit = () => {
    if (!code.trim()) { toastError('Please paste some code'); return; }
    setSubmittedCode(code); setSubmittedLang(language === 'Auto-detect' ? 'text' : language);
    setSourceType('paste'); setStep('viewer');
  };

  const handleGithubSubmit = async () => {
    if (selected.size === 0) { toastError('Select at least one file'); return; }
    info('Fetching selected files…');
    try {
      const [owner, repo] = new URL(githubUrl).pathname.split('/').filter(Boolean);
      const contents = await Promise.all(
        [...selected].map(async path => {
          const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
          const d = await r.json();
          return atob(d.content.replace(/\n/g, ''));
        })
      );
      const combined = contents.join('\n\n// ─── NEXT FILE ───\n\n');
      setSubmittedCode(combined); setSubmittedLang('text');
      setSourceType('github'); setStep('viewer');
    } catch { toastError('Failed to fetch file contents'); }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await submitReview({
        code: submittedCode, language: submittedLang,
        source_type: sourceType,
        ...(sourceType === 'github' ? { github_url: githubUrl } : {}),
      });
      setReview(result); setStep('results');
      success('Analysis complete!');
    } catch (e: any) { toastError(e.message ?? 'Analysis failed'); }
    setAnalyzing(false);
  };

  const handleExport = () => {
    if (!review) return;
    const md = generateMarkdown(review);
    downloadMarkdown(md, `review-${review.id}.md`);
    success('Markdown exported!');
  };

  const charCount = code.length;
  const lineCount = code.split('\n').length;

  return (
    <div style={{ minHeight:'100vh' }}>
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:32, paddingBottom:64 }}>
        {/* Breadcrumb steps */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:28 }}>
          {(['input','viewer','results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <span style={{ fontSize:13, fontWeight:step===s?700:400, color:step===s?'var(--color-primary)':'var(--color-text-3)',
                cursor: (s==='viewer'&&step==='results') ? 'pointer':'default'
              }} onClick={() => s==='input'&&step!=='input' ? setStep('input') : s==='viewer'&&step==='results' ? setStep('viewer') : undefined}>
                {i+1}. {s==='input'?'Input':s==='viewer'?'Code Viewer':'Results'}
              </span>
              {i < 2 && <span style={{ color:'var(--color-text-3)' }}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: INPUT ── */}
        {step === 'input' && (
          <div className="animate-fadeIn">
            <h1 style={{ marginBottom:20 }}>New Code Review</h1>
            <Tabs
              tabs={[
                { id:'paste', label:'📋 Paste Code' },
                { id:'github', label:'🐙 GitHub URL' },
              ]}
              onChange={(id) => setSourceType(id as any)}
            >
              {/* Paste tab */}
              <div>
                <label>Language</label>
                <select value={language} onChange={e=>setLanguage(e.target.value)} style={{ width:'auto', marginBottom:16 }}>
                  {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                </select>
                <label>Code</label>
                <textarea
                  value={code}
                  onChange={e=>setCode(e.target.value)}
                  placeholder="Paste your code here…"
                  rows={18}
                  style={{ fontFamily:'monospace', resize:'vertical', lineHeight:1.7 }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, marginBottom:20 }}>
                  <span style={{ fontSize:12, color:'var(--color-text-3)' }}>{lineCount.toLocaleString()} lines · {charCount.toLocaleString()} chars</span>
                  {charCount > 20000 && <span style={{ fontSize:12, color:'var(--color-warning)' }}>⚠ Large file — will be chunked</span>}
                </div>
                <Button variant="primary" size="lg" onClick={handlePasteSubmit} disabled={!code.trim()}>Preview Code →</Button>
              </div>

              {/* GitHub tab */}
              <div>
                <label>GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={e=>handleGitHubUrl(e.target.value)}
                  style={{ marginBottom:16 }}
                />
                {treeError && <div style={{ color:'var(--color-danger)', marginBottom:12, fontSize:13 }}>⚠ {treeError}</div>}
                {treeLoading && <div style={{ color:'var(--color-text-3)', marginBottom:12 }}>⏳ Loading file tree…</div>}
                {fileTree.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                      <label style={{ marginBottom:0 }}>Select Files ({selected.size} selected)</label>
                      <button onClick={()=>setSelected(new Set())} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-text-3)',fontSize:12 }}>Clear all</button>
                    </div>
                    <FileTree files={fileTree} selected={selected} onSelect={toggleFile} />
                  </div>
                )}
                <Button variant="primary" size="lg" onClick={handleGithubSubmit} disabled={selected.size===0} loading={treeLoading}>
                  Analyze Selected Files →
                </Button>
              </div>
            </Tabs>
          </div>
        )}

        {/* ── STEP 2: CODE VIEWER ── */}
        {step === 'viewer' && (
          <div className="animate-fadeIn">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h1>Code Preview</h1>
              <Button variant="ghost" size="sm" onClick={()=>setStep('input')}>← Back</Button>
            </div>
            <CodeViewer code={submittedCode} language={submittedLang} />
            <div style={{ marginTop:20, display:'flex', gap:12 }}>
              <Button variant="primary" size="lg" onClick={runAnalysis} loading={analyzing} icon="🤖">
                {analyzing ? 'Analyzing…' : 'Run AI Analysis'}
              </Button>
              {analyzing && (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--color-text-3)', fontSize:13 }}>
                  <span style={{ display:'inline-block', width:8,height:8,borderRadius:'50%',background:'var(--color-primary)', animation:'pulse 1.2s ease infinite' }} />
                  Gemini is evaluating your code…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ── */}
        {step === 'results' && review && (
          <div className="animate-fadeIn">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h1>Analysis Results</h1>
              <div style={{ display:'flex', gap:10 }}>
                <Button variant="secondary" onClick={handleExport} icon="⬇">Export .md</Button>
                <Button variant="primary" onClick={()=>navigate(`/review/${review.id}`)}>View Saved Review</Button>
              </div>
            </div>

            {/* Quality score hero */}
            <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:28, marginBottom:20, display:'flex', alignItems:'center', gap:28 }}>
              <QualityRing score={review.quality_score} size={140} />
              <div>
                <h2 style={{ marginBottom:8 }}>Quality Score</h2>
                <p style={{ maxWidth:500 }}>{review.summary}</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <BugReportCard bugs={review.bugs ?? []} />
              <ImprovementsCard improvements={review.improvements ?? []} language={submittedLang} />
              <DocsCard documentation={review.documentation ?? []} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
