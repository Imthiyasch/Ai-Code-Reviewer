import { CodeBlock } from './CodeBlock';
import { Badge } from './ui/Badge';

interface CodeViewerProps {
  code: string;
  language: string;
}

export function CodeViewer({ code, language }: CodeViewerProps) {
  return (
    <div style={{ border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 16px', background:'var(--color-surface)',
        borderBottom:'1px solid var(--color-border)',
      }}>
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ width:12,height:12,borderRadius:'50%',background:'#ef4444' }} />
          <div style={{ width:12,height:12,borderRadius:'50%',background:'#f59e0b' }} />
          <div style={{ width:12,height:12,borderRadius:'50%',background:'#22c55e' }} />
        </div>
        <Badge variant="info">{language}</Badge>
      </div>
      <CodeBlock code={code} language={language} showLineNumbers maxHeight="500px" />
    </div>
  );
}

export default CodeViewer;
