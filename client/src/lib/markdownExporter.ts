import type { Review } from '../hooks/useReviews';

function severityEmoji(s: string) {
  if (s === 'high') return '🔴 High';
  if (s === 'medium') return '🟡 Medium';
  return '🟢 Low';
}

export function generateMarkdown(review: Review): string {
  const date = new Date(review.created_at).toISOString().split('T')[0];
  const lang = review.language ?? 'Unknown';
  const source = review.source_type === 'github' && review.github_url
    ? `GitHub: ${review.github_url}` : 'Pasted Code';

  let md = `# Code Review Report\n\n**Date:** ${date}\n**Language:** ${lang}\n**Source:** ${source}\n**Quality Score:** ${review.quality_score}/10\n\n## Summary\n${review.summary ?? 'N/A'}\n\n---\n\n## Bug Report\n\n`;

  if (!review.bugs?.length) { md += '_No bugs found_ 🎉\n'; }
  else {
    md += `| Severity | Line | Description | Fix |\n|---|---|---|---|\n`;
    [...review.bugs].sort((a,b)=>({high:0,medium:1,low:2}[a.severity]??2)-({high:0,medium:1,low:2}[b.severity]??2))
      .forEach(b => { md += `| ${severityEmoji(b.severity)} | ${b.line??'–'} | ${b.description} | ${b.fix} |\n`; });
  }

  md += `\n---\n\n## Improvement Suggestions\n\n`;
  if (!review.improvements?.length) { md += '_No improvements suggested._\n'; }
  else review.improvements.forEach((imp,i) => {
    md += `### ${i+1}. ${imp.description}\n\n**Before:**\n\`\`\`${lang.toLowerCase()}\n${imp.before}\n\`\`\`\n\n**After:**\n\`\`\`${lang.toLowerCase()}\n${imp.after}\n\`\`\`\n\n`;
  });

  md += `---\n\n## Auto-Generated Documentation\n\n`;
  if (!review.documentation?.length) { md += '_No documentation generated._\n'; }
  else review.documentation.forEach(doc => {
    md += `### \`${doc.name}\`\n${doc.description}\n\n`;
    if (doc.params?.length) {
      md += `**Parameters:**\n`;
      doc.params.forEach(p => { md += `- \`${p.name}\` (${p.type}) — ${p.description}\n`; });
      md += '\n';
    }
    md += `**Returns:** ${doc.returns}\n\n`;
  });

  return md;
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
