import React, { useState } from 'react';
import type { Improvement } from '../hooks/useReviews';
import { Card } from './ui/Card';
import { CodeBlock } from './CodeBlock';

interface ImprovementsCardProps { improvements: Improvement[]; language: string; }

export function ImprovementsCard({ improvements, language }: ImprovementsCardProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  return (
    <Card collapsible title="💡 Improvement Suggestions" defaultOpen>
      {improvements.length === 0
        ? <p style={{ color:'var(--color-text-3)', textAlign:'center', padding:'24px 0' }}>No improvements suggested.</p>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {improvements.map((imp, i) => (
              <div key={i} style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)', overflow:'hidden' }}>
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'12px 16px', background:'var(--color-surface-2)', border:'none',
                    cursor:'pointer', color:'var(--color-text)', fontFamily:'var(--font-sans)',
                    fontWeight:500, fontSize:14, textAlign:'left',
                  }}
                >
                  <span>{i+1}. {imp.description}</span>
                  <span style={{ color:'var(--color-text-3)', fontSize:18 }}>{expanded.has(i)?'▴':'▾'}</span>
                </button>
                {expanded.has(i) && (
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12, borderTop:'1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:'var(--color-danger)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Before</p>
                      <CodeBlock code={imp.before} language={language} />
                    </div>
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:'var(--color-success)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>After</p>
                      <CodeBlock code={imp.after} language={language} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </Card>
  );
}

export default ImprovementsCard;
