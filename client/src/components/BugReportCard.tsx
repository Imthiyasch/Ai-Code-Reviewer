import React, { useState } from 'react';
import type { Bug } from '../hooks/useReviews';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface BugReportCardProps { bugs: Bug[]; }

export function BugReportCard({ bugs }: BugReportCardProps) {
  const sorted = [...bugs].sort((a,b) => {
    const o: Record<string,number> = { high:0, medium:1, low:2 };
    return (o[a.severity]??2)-(o[b.severity]??2);
  });

  return (
    <Card collapsible title={
      <span style={{ display:'flex', alignItems:'center', gap:8 }}>
        🐛 Bug Report
        {bugs.length > 0 && <Badge variant="high">{bugs.length}</Badge>}
      </span>
    } defaultOpen>
      {bugs.length === 0
        ? <div style={{ textAlign:'center', padding:'32px 0', color:'var(--color-text-3)', fontSize:24 }}>🎉 No bugs found!</div>
        : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Suggested Fix</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((bug, i) => (
                  <tr key={i}>
                    <td><code style={{ color:'var(--color-text-2)' }}>{bug.line ?? '—'}</code></td>
                    <td><Badge variant={bug.severity}>{bug.severity}</Badge></td>
                    <td style={{ color:'var(--color-text)', maxWidth:320 }}>{bug.description}</td>
                    <td style={{ color:'var(--color-text-2)', maxWidth:260 }}>{bug.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </Card>
  );
}

export default BugReportCard;
