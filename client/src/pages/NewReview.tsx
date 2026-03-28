import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Tabs } from '../components/ui/Tabs';
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
  const { submitReview } = useReviews();
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
    <div style={{ minHeight:'100vh', position: 'relative' }}>
      <div className="app-background" />
      <Navbar />
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="page-container" style={{ paddingTop:40, paddingBottom:64 }}>
        {/* Breadcrumb HUD */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, background: 'rgba(0,0,0,0.03)', padding: '10px 24px', borderRadius: '100px', width: 'fit-content' }}>
          {(['input','viewer','results'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize:13, fontWeight:700, 
                  color:step===s?'var(--color-primary)': i < ['input','viewer','results'].indexOf(step) ? '#111' : 'var(--color-text-3)',
                  cursor: (s==='viewer'&&step==='results') || (s==='input' && step !== 'input') ? 'pointer':'default',
                  transition: 'all 0.2s'
                }} 
                onClick={() => s==='input'&&step!=='input' ? setStep('input') : s==='viewer'&&step==='results' ? setStep('viewer') : undefined}
              >
                <div style={{ 
                  width: 22, height: 22, borderRadius: '50%', 
                  background: step===s ? 'var(--color-primary)' : i < ['input','viewer','results'].indexOf(step) ? '#111' : 'transparent',
                  border: step===s || i < ['input','viewer','results'].indexOf(step) ? 'none' : '1.5px solid var(--color-text-3)',
                  color: step===s || i < ['input','viewer','results'].indexOf(step) ? '#fff' : 'var(--color-text-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px'
                }}>{i+1}</div>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s==='input'?'Input':s==='viewer'?'Preview':'Results'}</span>
              </div>
              {i < 2 && <div style={{ width: 40, height: 1, background: 'rgba(0,0,0,0.1)', margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 1: INPUT ── */}
        {step === 'input' && (
          <div className="animate-fadeIn glass" style={{ padding: '48px', borderRadius: 'var(--radius-xl)' }}>
            <h1 style={{ marginBottom:32, fontSize: '32px' }}>Start a New Analysis</h1>
            <Tabs
              tabs={[
                { id:'paste', label:'📋 Paste Code' },
                { id:'github', label:'🐙 GitHub URL' },
              ]}
              onChange={(id) => setSourceType(id as any)}
            >
              {/* Paste tab */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <label style={{ color: '#111', fontWeight: 700, marginBottom: 8, display: 'block' }}>Selection Language</label>
                    <select value={language} onChange={e=>setLanguage(e.target.value)} style={{ width:'100%', marginBottom:24, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}>
                      {LANGUAGES.map(l=><option key={l}>{l}</option>)}
                    </select>
                    
                    <div style={{ background: 'var(--color-primary-glow)', padding: '24px', borderRadius: '20px', border: '1px solid var(--color-primary-glow)' }}>
                      <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--color-primary)', fontWeight: 600, margin: 0 }}>
                        Tip: Our AI model works best when you provide full functional contexts or complete files.
                      </p>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#111', fontWeight: 700, marginBottom: 8, display: 'block' }}>Source Code</label>
                    <textarea
                      value={code}
                      onChange={e=>setCode(e.target.value)}
                      placeholder="Paste your source code here for instant AI review..."
                      rows={14}
                      style={{ 
                        fontFamily:'var(--font-mono)', resize:'vertical', lineHeight:1.7, 
                        width: '100%', padding: '20px', borderRadius: '20px', 
                        border: '1px solid rgba(0,0,0,0.1)', background: '#fff'
                      }}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, marginBottom:32 }}>
                      <span style={{ fontSize:12, color:'var(--color-text-3)', fontWeight: 600 }}>{lineCount.toLocaleString()} LINES · {charCount.toLocaleString()} CHARS</span>
                      {charCount > 20000 && <span style={{ fontSize:12, color:'var(--color-warning)', fontWeight: 700 }}>⚠ Large file — will be chunked</span>}
                    </div>
                    <button className="btn-pill" onClick={handlePasteSubmit} disabled={!code.trim()} style={{ width: '100%', padding: '16px' }}>
                      Continue to Preview <span style={{ marginLeft: 8 }}>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GitHub tab */}
              <div>
                <div style={{ maxWidth: '600px' }}>
                  <label style={{ color: '#111', fontWeight: 700, marginBottom: 8, display: 'block' }}>GitHub Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/owner/repository"
                    value={githubUrl}
                    onChange={e=>handleGitHubUrl(e.target.value)}
                    style={{ 
                      marginBottom:24, width: '100%', padding: '14px 20px', 
                      borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)',
                      fontSize: '15px'
                    }}
                  />
                  {treeError && <div style={{ color:'var(--color-danger)', marginBottom:16, fontSize:13, fontWeight: 600 }}>⚠ {treeError}</div>}
                  {treeLoading && <div style={{ color:'var(--color-text-3)', marginBottom:16, fontSize: '14px' }}>⏳ Accessing repository tree...</div>}
                  
                  {fileTree.length > 0 && (
                    <div className="animate-slideIn" style={{ marginBottom:32 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems: 'center' }}>
                        <label style={{ marginBottom:0, fontWeight: 700 }}>Select Files ({selected.size})</label>
                        <button onClick={()=>setSelected(new Set())} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-text-3)',fontSize:12, fontWeight: 600 }}>CLEAR SELECTION</button>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px', background: 'rgba(0,0,0,0.02)' }}>
                        <FileTree files={fileTree} selected={selected} onSelect={toggleFile} />
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="btn-pill" 
                    onClick={handleGithubSubmit} 
                    disabled={selected.size===0}
                    style={{ width: '100%', padding: '16px' }}
                  >
                    {treeLoading ? 'Connecting...' : 'Fetch Selected Code →'}
                  </button>
                </div>
              </div>
            </Tabs>
          </div>
        )}

        {/* ── STEP 2: CODE VIEWER ── */}
        {step === 'viewer' && (
          <div className="animate-fadeIn glass" style={{ padding: '48px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
              <h1 style={{ fontSize: '32px' }}>Code Preview</h1>
              <button className="btn-pill" style={{ padding: '8px 20px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111', fontSize: '13px' }} onClick={()=>setStep('input')}>
                ← Back to Input
              </button>
            </div>
            <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-lg)' }}>
              <CodeViewer code={submittedCode} language={submittedLang} />
            </div>
            <div style={{ marginTop:40, display:'flex', alignItems: 'center', gap:24 }}>
              <button className="btn-pill" onClick={runAnalysis} disabled={analyzing} style={{ padding: '16px 40px', fontSize: '16px' }}>
                <span style={{ marginRight: 8 }}>🤖</span> {analyzing ? 'Analyzing Architecture...' : 'Trigger AI Review Engine'}
              </button>
              {analyzing && (
                <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--color-primary)', fontSize:14, fontWeight: 700 }}>
                  <div className="pulse" style={{ width:10,height:10,borderRadius:'50%',background:'currentColor' }} />
                  Processing analysis with Gemini 2.0...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: RESULTS ── */}
        {step === 'results' && review && (
          <div className="animate-fadeIn">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
              <h1 style={{ fontSize: '32px' }}>Analysis Intelligence</h1>
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn-pill" style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#111', fontSize: '14px' }} onClick={handleExport}>
                  <span style={{ marginRight: 6 }}>⬇</span> Export Results
                </button>
                <button className="btn-pill" onClick={()=>navigate(`/review/${review.id}`)}>
                  Permanent Link <span style={{ marginLeft: 6 }}>↗</span>
                </button>
              </div>
            </div>

            {/* Quality score hero */}
            <div className="glass animate-slideIn" style={{ padding:40, borderRadius: 'var(--radius-xl)', marginBottom:32, display:'flex', alignItems:'center', gap:40 }}>
              <QualityRing score={review.quality_score} size={160} />
              <div>
                <h2 style={{ marginBottom:12, fontSize: '28px' }}>Executive Summary</h2>
                <p style={{ maxWidth:600, fontSize: '16px', lineHeight: 1.7, color: 'var(--color-text-2)' }}>{review.summary}</p>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
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
