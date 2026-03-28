import React, { useState, useCallback } from 'react';

interface Tab { id: string; label: React.ReactNode; }
interface TabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
  defaultTab?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, children, defaultTab, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const handleKey = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(id); onChange?.(id); }
  }, [onChange]);
  const activeIdx = tabs.findIndex(t => t.id === active);
  return (
    <div>
      <div role="tablist" className="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`tab-btn ${tab.id === active ? 'active' : ''}`}
            onClick={() => { setActive(tab.id); onChange?.(tab.id); }}
            onKeyDown={(e) => handleKey(e, tab.id)}
            tabIndex={tab.id === active ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`tabpanel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        {children[activeIdx]}
      </div>
    </div>
  );
}

const tabStyles = `
.tablist {
  display:flex; gap:4px; background:var(--color-surface);
  border:1px solid var(--color-border); border-radius:var(--radius-md);
  padding:4px; width:fit-content; margin-bottom:20px;
}
.tab-btn {
  padding:8px 20px; border:none; background:transparent; cursor:pointer;
  font-family:var(--font-sans); font-size:14px; font-weight:500;
  color:var(--color-text-2); border-radius:var(--radius-sm); transition:all var(--transition);
}
.tab-btn:hover { color:var(--color-text); background:var(--color-bg-3); }
.tab-btn.active { background:var(--color-primary); color:#fff; font-weight:600; box-shadow:0 2px 8px var(--color-primary-glow); }
`;
if (typeof document !== 'undefined' && !document.getElementById('tab-styles')) {
  const s = document.createElement('style'); s.id='tab-styles'; s.textContent=tabStyles; document.head.appendChild(s);
}

export default Tabs;
