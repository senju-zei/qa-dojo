import { useEffect, useRef, useState } from 'react';
import type { Answer } from '../engine/types';
import { TRANSITIONS, isTerminal, lifecycleGoal, type BugState } from '../engine/sandboxes';
import { Arrow, Reset } from '../components/Icons';

interface Props {
  locked: boolean;
  onSubmit: (a: Answer) => void;
}

const POS: Record<BugState, [number, number]> = {
  New: [70, 150],
  Assigned: [200, 150],
  Open: [330, 150],
  Fixed: [460, 150],
  Retest: [590, 150],
  Closed: [700, 52],
  Reopened: [460, 252],
  Duplicate: [70, 48],
  Rejected: [200, 48],
  Deferred: [200, 252],
};
const W = 104;
const H = 34;
const SOLUTION: BugState[] = ['New', 'Assigned', 'Open', 'Fixed', 'Retest', 'Reopened', 'Open', 'Fixed', 'Retest', 'Closed'];

function edgePath(a: BugState, b: BugState) {
  const [x1, y1] = POS[a];
  const [x2, y2] = POS[b];
  if (a === 'Retest' && b === 'Reopened') return `M${x1},${y1 + H / 2} Q${x1},${y2} ${x2 + W / 2},${y2}`;
  if (a === 'Reopened' && b === 'Open') return `M${x1 - W / 2},${y1} Q${x2},${y1} ${x2},${y2 + H / 2}`;
  if (a === 'Retest' && b === 'Closed') return `M${x1 + 20},${y1 - H / 2} Q${x1 + 30},${y2} ${x2 - W / 2},${y2}`;
  if (y1 === y2) return `M${x1 + (x2 > x1 ? W / 2 : -W / 2)},${y1} L${x2 + (x2 > x1 ? -W / 2 : W / 2)},${y2}`;
  const dy = y2 > y1 ? H / 2 : -H / 2;
  return `M${x1 + (x2 - x1) * 0.15},${y1 + dy} L${x2 - (x2 - x1) * 0.15},${y2 - dy}`;
}

const ALL_EDGES = (Object.keys(TRANSITIONS) as BugState[]).flatMap((from) => TRANSITIONS[from].map((t) => [from, t.to] as const));

export function Lifecycle({ locked, onSubmit }: Props) {
  const [path, setPath] = useState<BugState[]>(locked ? SOLUTION : ['New']);
  const [verdict, setVerdict] = useState<'ok' | 'bad' | null>(null);
  const submitted = useRef(false);
  const current = path[path.length - 1];

  useEffect(() => {
    if (locked || !isTerminal(current) || submitted.current) return;
    submitted.current = true;
    const res = lifecycleGoal(path);
    setVerdict(res.correct ? 'ok' : 'bad');
    onSubmit({ kind: 'sandbox', value: res.correct, detail: res.detail });
  }, [current, locked, path, onSubmit]);

  const reset = () => {
    submitted.current = false;
    setVerdict(null);
    setPath(['New']);
  };

  const travelled = new Set(path.slice(1).map((s, i) => `${path[i]}>${s}`));
  const reopenedAt = path.indexOf('Reopened');

  return (
    <div className="sandbox">
      <svg className="lc-svg" viewBox="0 0 770 290" role="img" aria-label={`Bug life cycle diagram. Current state: ${current}.`}>
        <defs>
          {(['muted', 'accent', 'info'] as const).map((c) => (
            <marker key={c} id={`arr-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={`var(--${c === 'muted' ? 'line-2' : c})`} />
            </marker>
          ))}
        </defs>
        {ALL_EDGES.map(([a, b]) => {
          const done = travelled.has(`${a}>${b}`);
          const avail = !locked && a === current;
          const color = done ? 'accent' : avail ? 'info' : 'muted';
          return (
            <path
              key={`${a}-${b}`}
              className="lc-edge"
              d={edgePath(a, b)}
              fill="none"
              stroke={`var(--${color === 'muted' ? 'line-2' : color})`}
              strokeWidth={done ? 2.5 : 1.5}
              strokeDasharray={avail && !done ? '5 4' : undefined}
              markerEnd={`url(#arr-${color})`}
            />
          );
        })}
        {(Object.keys(POS) as BugState[]).map((s) => {
          const [cx, cy] = POS[s];
          const isCur = s === current;
          const visited = path.includes(s);
          const terminal = isTerminal(s);
          const fill = isCur ? (verdict === 'ok' || (locked && s === 'Closed') ? 'var(--ok-soft)' : verdict === 'bad' ? 'var(--bad-soft)' : 'var(--accent-soft)') : visited ? 'var(--surface-3)' : 'var(--surface)';
          const stroke = isCur ? (verdict === 'ok' || (locked && s === 'Closed') ? 'var(--ok)' : verdict === 'bad' ? 'var(--bad)' : 'var(--accent)') : visited ? 'var(--line-2)' : 'var(--line)';
          return (
            <g key={s} className={`lc-node ${isCur && !verdict && !locked ? 'current' : ''}`}>
              <rect x={cx - W / 2} y={cy - H / 2} width={W} height={H} rx={terminal ? H / 2 : 9} fill={fill} stroke={stroke} strokeWidth={isCur ? 2 : 1} strokeDasharray={terminal && !visited ? '4 3' : undefined} />
              <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={13} fontWeight={isCur ? 700 : 500} fill={visited ? 'var(--text)' : 'var(--muted)'}>
                {s}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="trail" aria-label="Path so far">
        {path.map((s, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && '→'}
            <span className={reopenedAt >= 0 && i >= reopenedAt && s !== 'Closed' ? 'rework' : ''}>{s}</span>
          </span>
        ))}
      </div>

      {!locked && (
        <div className="moves" aria-live="polite">
          {TRANSITIONS[current].map((t) => (
            <button key={t.to} className="btn sm" disabled={verdict !== null} onClick={() => setPath((p) => [...p, t.to])}>
              {t.label} <Arrow size={13} /> <b>{t.to}</b>
            </button>
          ))}
          {(path.length > 1 || verdict) && (
            <button className="btn ghost sm" onClick={reset}>
              <Reset /> Reset to New
            </button>
          )}
        </div>
      )}
    </div>
  );
}
