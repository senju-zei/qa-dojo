import { useEffect, useMemo, useRef, useState } from 'react';
import { PATH } from '../content/path';
import type { Progress } from '../engine/progress';
import { Search } from './Icons';

export interface PaletteAction {
  id: string;
  group: 'Actions' | 'Rooms' | 'Tasks';
  label: string;
  sub?: string;
  icon: string;
  run: () => void;
}

function score(q: string, text: string): number {
  if (!q) return 1;
  const t = text.toLowerCase();
  const query = q.toLowerCase().trim();
  if (t.includes(query)) return 100 - t.indexOf(query);
  let ti = 0;
  for (const ch of query) {
    ti = t.indexOf(ch, ti);
    if (ti === -1) return 0;
    ti++;
  }
  return 10;
}

interface Props {
  progress: Progress;
  actions: PaletteAction[];
  onOpenTask: (roomId: string, index: number) => void;
  onClose: () => void;
}

export function CommandPalette({ progress, actions, onOpenTask, onClose }: Props) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => input.current?.focus(), []);

  const items = useMemo(() => {
    const all: PaletteAction[] = [
      ...actions,
      ...PATH.rooms.map((r) => ({ id: `room-${r.id}`, group: 'Rooms' as const, label: r.title, sub: r.tagline, icon: r.glyph, run: () => onOpenTask(r.id, 0) })),
      ...PATH.rooms.flatMap((r) =>
        r.tasks.map((t, i) => {
          const tp = progress.tasks[t.id];
          return {
            id: `task-${t.id}`,
            group: 'Tasks' as const,
            label: t.title,
            sub: `${r.title} · ${tp?.solved ? (tp.clean ? 'clean ✓' : 'solved ✓') : `${t.xp} XP`}`,
            icon: tp?.solved ? '✓' : String(i + 1),
            run: () => onOpenTask(r.id, i),
          };
        }),
      ),
    ];
    return all
      .map((a) => ({ a, s: score(q, `${a.label} ${a.sub ?? ''}`) }))
      .filter((x) => x.s > 0)
      .sort((x, y) => (q ? y.s - x.s : 0))
      .map((x) => x.a);
  }, [q, actions, progress, onOpenTask]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const run = (a: PaletteAction | undefined) => {
    if (!a) return;
    onClose();
    a.run();
  };

  let lastGroup = '';
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(items.length - 1, s + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
          else if (e.key === 'Enter') { e.preventDefault(); run(items[sel]); }
        }}
      >
        <div className="palette-input">
          <Search size={17} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a room, task or action…" aria-label="Search" aria-controls="palette-list" aria-activedescendant={items[sel] ? `pal-${items[sel].id}` : undefined} />
          <kbd>esc</kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox">
          {items.length === 0 && <li className="muted" style={{ padding: 14, fontSize: 14 }}>No matches.</li>}
          {items.map((a, i) => {
            const header = a.group !== lastGroup ? a.group : null;
            lastGroup = a.group;
            return (
              <li key={a.id}>
                {header && <div className="group">{header}</div>}
                <button id={`pal-${a.id}`} role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={() => run(a)} tabIndex={-1}>
                  <span className="ico">{a.icon}</span>
                  <span>
                    {a.label}
                    {a.sub && <div className="sub">{a.sub}</div>}
                  </span>
                  {i === sel && <kbd>↵</kbd>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="palette-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>H</kbd> hint · <kbd>F</kbd> focus · <kbd>J</kbd>/<kbd>K</kbd> tasks</span>
        </div>
      </div>
    </div>
  );
}
