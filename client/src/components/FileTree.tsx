import React, { useState, useCallback } from 'react';

export interface FileNode {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

interface TreeNode { [key: string]: TreeNode | FileNode; }

function buildTree(files: FileNode[]): TreeNode {
  const tree: TreeNode = {};
  for (const f of files) {
    const parts = f.path.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = {};
      node = node[parts[i]] as TreeNode;
    }
    node[parts[parts.length - 1]] = f;
  }
  return tree;
}

function isFile(node: TreeNode | FileNode): node is FileNode {
  return 'sha' in node;
}

interface NodeProps {
  name: string;
  node: TreeNode | FileNode;
  selected: Set<string>;
  onToggle: (path: string) => void;
  depth?: number;
}

function TreeNodeComp({ name, node, selected, onToggle, depth = 0 }: NodeProps) {
  const [open, setOpen] = useState(depth === 0);
  if (isFile(node)) {
    return (
      <label style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 8px', paddingLeft: depth*16+8, cursor:'pointer', borderRadius:'var(--radius-sm)', transition:'background var(--transition)' }}
        className="tree-file">
        <input type="checkbox" checked={selected.has(node.path)} onChange={() => onToggle(node.path)} style={{ accentColor:'var(--color-primary)', width:14, height:14 }} />
        <span style={{ fontSize:13 }}>📄</span>
        <span style={{ fontSize:13, color:'var(--color-text)' }}>{name}</span>
        {node.size && <span style={{ fontSize:11, color:'var(--color-text-3)', marginLeft:'auto' }}>{(node.size/1024).toFixed(1)}kb</span>}
      </label>
    );
  }
  return (
    <div>
      <button onClick={() => setOpen(o=>!o)} style={{
        display:'flex', alignItems:'center', gap:8, width:'100%', padding:'4px 8px', paddingLeft:depth*16+8,
        background:'none', border:'none', cursor:'pointer', borderRadius:'var(--radius-sm)',
        color:'var(--color-text-2)', fontFamily:'var(--font-sans)', fontSize:13,
      }} className="tree-dir">
        <span>{open?'▾':'▸'}</span>
        <span>📁</span>
        <span style={{ fontWeight:600 }}>{name}</span>
      </button>
      {open && Object.entries(node as TreeNode)
        .sort(([,a],[,b]) => {
          const aFile = isFile(a); const bFile = isFile(b);
          if (aFile !== bFile) return aFile ? 1 : -1;
          return 0;
        })
        .map(([k, v]) => <TreeNodeComp key={k} name={k} node={v} selected={selected} onToggle={onToggle} depth={depth+1} />)
      }
    </div>
  );
}

interface FileTreeProps {
  files: FileNode[];
  selected: Set<string>;
  onSelect: (path: string) => void;
}

export function FileTree({ files, selected, onSelect }: FileTreeProps) {
  const tree = buildTree(files);
  return (
    <div style={{ background:'var(--color-surface)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-lg)', padding:8, maxHeight:400, overflowY:'auto' }}>
      {Object.entries(tree)
        .sort(([,a],[,b]) => { const aF=isFile(a); const bF=isFile(b); return aF!==bF?aF?1:-1:0; })
        .map(([k,v]) => <TreeNodeComp key={k} name={k} node={v} selected={selected} onToggle={onSelect} depth={0} />)
      }
    </div>
  );
}

const treeStyles = `
.tree-file:hover { background: var(--color-bg-3); }
.tree-dir:hover { background: var(--color-bg-3); }
`;
if (typeof document !== 'undefined' && !document.getElementById('tree-styles')) {
  const s=document.createElement('style'); s.id='tree-styles'; s.textContent=treeStyles; document.head.appendChild(s);
}

export default FileTree;
