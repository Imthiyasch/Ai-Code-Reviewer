import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../hooks/useTheme';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export function CodeBlock({ code, language = 'text', showLineNumbers = false, maxHeight }: CodeBlockProps) {
  const { isDark } = useTheme();
  return (
    <div style={{ borderRadius:'var(--radius-md)', overflow:'hidden', maxHeight, overflowY: maxHeight ? 'auto' : undefined }}>
      <SyntaxHighlighter
        language={language.toLowerCase()}
        style={isDark ? oneDark : oneLight}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0, padding: '16px', fontSize: '13px',
          background: isDark ? '#1a1a2e' : '#f8f8ff',
          borderRadius: 0,
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;
