import type { DocItem } from '../hooks/useReviews';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface DocsCardProps { documentation: DocItem[]; }

export function DocsCard({ documentation }: DocsCardProps) {
  return (
    <Card collapsible title="📚 Auto-Generated Documentation" defaultOpen>
      {documentation.length === 0
        ? <p style={{ color:'var(--color-text-3)', textAlign:'center', padding:'24px 0' }}>No documentation generated.</p>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {documentation.map((doc, i) => (
              <div key={i} style={{ borderLeft:'3px solid var(--color-primary)', paddingLeft:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <code style={{ fontSize:15, fontWeight:700, color:'var(--color-primary)' }}>{doc.name}</code>
                  <Badge variant="info">function</Badge>
                </div>
                <p style={{ color:'var(--color-text-2)', marginBottom:10 }}>{doc.description}</p>
                {doc.params?.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Parameters</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {doc.params.map((p, j) => (
                        <div key={j} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                          <code style={{ color:'var(--color-primary-2)', flexShrink:0 }}>{p.name}</code>
                          <Badge variant="default">{p.type}</Badge>
                          <span style={{ color:'var(--color-text-2)', fontSize:13 }}>— {p.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span style={{ fontSize:12, fontWeight:600, color:'var(--color-text-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Returns: </span>
                  <span style={{ color:'var(--color-text-2)', fontSize:13 }}>{doc.returns}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </Card>
  );
}

export default DocsCard;
