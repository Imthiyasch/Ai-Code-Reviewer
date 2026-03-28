import { ReviewResult } from './llm.js';

interface FullReview {
  id: string;
  language: string | null;
  source_type: string;
  github_url: string | null;
  full_code: string;
  quality_score: number;
  summary: string | null;
  bugs: ReviewResult['bugs'];
  improvements: ReviewResult['improvements'];
  documentation: ReviewResult['documentation'];
  created_at: string;
}

function severityEmoji(s: string): string {
  if (s === 'high') return '🔴 High';
  if (s === 'medium') return '🟡 Medium';
  return '🟢 Low';
}

export function generateMarkdown(review: FullReview): string {
  const date = new Date(review.created_at).toISOString().split('T')[0];
  const lang = review.language ?? 'Unknown';
  const source =
    review.source_type === 'github' && review.github_url
      ? `GitHub: ${review.github_url}`
      : 'Pasted Code';

  let md = `# Code Review Report

**Date:** ${date}
**Language:** ${lang}
**Source:** ${source}
**Quality Score:** ${review.quality_score}/10

## Summary
${review.summary ?? 'No summary available.'}

---

## Bug Report

`;

  if (review.bugs.length === 0) {
    md += '_No bugs found_ 🎉\n';
  } else {
    md += `| Severity | Line | Description | Fix |\n|---|---|---|---|\n`;
    const sorted = [...review.bugs].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
    for (const bug of sorted) {
      md += `| ${severityEmoji(bug.severity)} | ${bug.line ?? '–'} | ${bug.description} | ${bug.fix} |\n`;
    }
  }

  md += `\n---\n\n## Improvement Suggestions\n\n`;

  if (review.improvements.length === 0) {
    md += '_No improvements suggested._\n';
  } else {
    review.improvements.forEach((imp, i) => {
      md += `### ${i + 1}. ${imp.description}\n\n`;
      md += `**Before:**\n\`\`\`${lang.toLowerCase()}\n${imp.before}\n\`\`\`\n\n`;
      md += `**After:**\n\`\`\`${lang.toLowerCase()}\n${imp.after}\n\`\`\`\n\n`;
    });
  }

  md += `---\n\n## Auto-Generated Documentation\n\n`;

  if (review.documentation.length === 0) {
    md += '_No documentation generated._\n';
  } else {
    for (const doc of review.documentation) {
      md += `### \`${doc.name}\`\n${doc.description}\n\n`;
      if (doc.params.length > 0) {
        md += `**Parameters:**\n`;
        for (const p of doc.params) {
          md += `- \`${p.name}\` (${p.type}) — ${p.description}\n`;
        }
        md += '\n';
      }
      md += `**Returns:** ${doc.returns}\n\n`;
    }
  }

  return md;
}
