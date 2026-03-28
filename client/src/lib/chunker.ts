export function chunkCode(code: string, maxSize = 24000): string[] {
  if (code.length <= maxSize) return [code];
  const chunks: string[] = [];
  let start = 0;
  while (start < code.length) {
    let end = start + maxSize;
    if (end >= code.length) { chunks.push(code.slice(start)); break; }
    const boundary = code.lastIndexOf('\n\n', end);
    if (boundary > start + maxSize / 2) end = boundary;
    else { const nl = code.lastIndexOf('\n', end); if (nl > start) end = nl; }
    chunks.push(code.slice(start, end));
    start = end;
  }
  return chunks;
}
