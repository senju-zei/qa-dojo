import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Answer, Task, VisualId } from '../engine/types';

interface VProps {
  task: Task;
  answer: Answer;
  solved: boolean;
}

/* ---------- QA ⊃ QC ⊃ Testing ---------- */
const RINGS = [
  { id: 'QA', r: 128, cx: 200, cy: 150, label: 'Quality Assurance', text: 'The whole process that prevents defects: planning, standards, reviews, testing. "Making sure we build it right."' },
  { id: 'QC', r: 86, cx: 222, cy: 168, label: 'Quality Control', text: 'Checking the finished product for defects. "Checking that what we built is right."' },
  { id: 'T', r: 44, cx: 240, cy: 186, label: 'Testing', text: 'Running the software to find bugs. "Trying it to see what breaks."' },
];

function QaRings({ solved }: VProps) {
  const [hot, setHot] = useState<string | null>(null);
  const active = RINGS.find((r) => r.id === hot);
  return (
    <>
      <svg className="viz-svg" viewBox="0 0 420 300" role="img" aria-label="Three nested rings: Testing inside QC inside QA">
        {RINGS.map((r, i) => {
          const on = hot === r.id || (solved && !hot);
          return (
            <g
              key={r.id}
              tabIndex={0}
              role="button"
              aria-label={`${r.label}: ${r.text}`}
              onMouseEnter={() => setHot(r.id)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(r.id)}
              onBlur={() => setHot(null)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              <circle
                cx={r.cx}
                cy={r.cy}
                r={r.r}
                fill={hot === r.id ? 'var(--accent-soft)' : 'var(--surface-2)'}
                stroke={on ? 'var(--accent)' : 'var(--line-2)'}
                strokeWidth={hot === r.id ? 2.5 : 1.5}
                style={{ transition: 'all 200ms' }}
              />
              <text x={r.cx} y={r.cy - r.r + (i === 2 ? 48 : 24)} textAnchor="middle" fontSize={i === 2 ? 13 : 14} fontWeight={600} fill={on ? 'var(--accent)' : 'var(--text-2)'}>
                {r.id === 'T' ? 'Testing' : r.id}
              </text>
            </g>
          );
        })}
        <text x={370} y={40} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="var(--font-mono)">prevent ↑</text>
        <text x={370} y={280} textAnchor="end" fontSize={11} fill="var(--muted)" fontFamily="var(--font-mono)">do ↓</text>
      </svg>
      <p className="stage-caption" aria-live="polite">
        {active ? <><b>{active.label}.</b> {active.text}</> : 'Hover or tab through the rings.'}
      </p>
    </>
  );
}

/* ---------- SDLC → STLC pipeline ---------- */
const SDLC = ['Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Maintenance'];

function Stlc({ task, answer, solved }: VProps) {
  if (task.check.kind !== 'order' || answer.kind !== 'order') return null;
  const steps = task.check.steps;
  const order = answer.value;
  return (
    <>
      <svg className="viz-svg" viewBox="0 0 480 300" role="img" aria-label={`Your STLC order: ${order.map((i) => steps[i]).join(', ')}`}>
        {SDLC.map((s, i) => {
          const x = 8 + i * 78;
          const hot = s === 'Testing';
          return (
            <g key={s}>
              <rect x={x} y={8} width={72} height={28} rx={7} fill={hot ? 'var(--accent-soft)' : 'var(--surface-2)'} stroke={hot ? 'var(--accent)' : 'var(--line)'} />
              <text x={x + 36} y={26} textAnchor="middle" fontSize={9.5} fontWeight={hot ? 700 : 500} fill={hot ? 'var(--accent)' : 'var(--muted)'}>{s}</text>
            </g>
          );
        })}
        <text x={8} y={52} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">SDLC</text>
        <path d="M242 36 L40 74 M278 36 L440 74" stroke="var(--accent)" strokeOpacity={0.4} strokeDasharray="3 3" fill="none" />
        <text x={8} y={86} fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">STLC · your order</text>
        {order.map((stepIdx, pos) => {
          const col = pos % 3;
          const row = Math.floor(pos / 3);
          const x = row === 0 ? 20 + col * 152 : 20 + (2 - col) * 152;
          const y = 104 + row * 96;
          return (
            <g key={stepIdx} style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 300ms cubic-bezier(.2,.8,.2,1)' }}>
              <rect width={136} height={56} rx={10} fill={solved ? 'var(--ok-soft)' : 'var(--surface-2)'} stroke={solved ? 'var(--ok)' : 'var(--line-2)'} style={{ transition: `all 300ms ${pos * 70}ms` }} />
              <text x={12} y={21} fontSize={10} fontFamily="var(--font-mono)" fill={solved ? 'var(--ok)' : 'var(--accent)'}>{String(pos + 1).padStart(2, '0')}</text>
              <text x={12} y={41} fontSize={12.5} fontWeight={600} fill="var(--text)">{steps[stepIdx]}</text>
            </g>
          );
        })}
        <path d="M156 132 h12 M308 132 h12 M392 160 v40 M320 228 h-12 M168 228 h-12" stroke="var(--line-2)" strokeWidth={2} fill="none" />
      </svg>
      <p className="stage-caption">{solved ? 'Requirements in, lessons learned out. Every phase feeds the next.' : 'The pipeline follows your list. It snakes left to right, then back.'}</p>
    </>
  );
}

/* ---------- Boundary value analysis line ---------- */
function BvaLine({ solved }: VProps) {
  const [min, setMin] = useState(18);
  const [max, setMax] = useState(60);
  const [probe, setProbe] = useState(25);
  const LO = Math.max(0, min - 6);
  const HI = max + 6;
  const x = (v: number) => 24 + ((v - LO) / (HI - LO)) * 432;
  const points = [
    { v: min - 1, ok: false, label: 'just below' },
    { v: min, ok: true, label: 'minimum' },
    { v: max, ok: true, label: 'maximum' },
    { v: max + 1, ok: false, label: 'just above' },
  ];
  const accepted = probe >= min && probe <= max;
  const preset = (a: number, b: number) => {
    setMin(a);
    setMax(b);
    setProbe(Math.round((a + b) / 2));
  };
  return (
    <>
      <div className="preset-row">
        <button className="btn sm" onClick={() => preset(18, 60)}>Age 18–60</button>
        <button className="btn sm" onClick={() => preset(8, 20)}>Password 8–20</button>
      </div>
      <svg className="viz-svg" viewBox="0 0 480 214" role="img" aria-label={`Valid range ${min} to ${max}. Boundary tests: ${points.map((p) => p.v).join(', ')}`}>
        <rect x={x(min)} y={56} width={x(max) - x(min)} height={18} rx={4} fill="var(--ok-soft)" style={{ transition: 'all 250ms' }} />
        <text x={(x(LO) + x(min)) / 2} y={48} textAnchor="middle" fontSize={11} fill="var(--bad)">too low</text>
        <text x={(x(min) + x(max)) / 2} y={48} textAnchor="middle" fontSize={11} fill="var(--ok)">valid</text>
        <text x={(x(max) + x(HI)) / 2} y={48} textAnchor="middle" fontSize={11} fill="var(--bad)">too high</text>
        <line x1={24} x2={456} y1={65} y2={65} stroke="var(--line-2)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={x(p.v)} cy={65} r={5} fill={p.ok ? 'var(--ok)' : 'var(--bad)'} stroke="var(--surface)" strokeWidth={2} style={{ transition: 'cx 250ms cubic-bezier(.2,.8,.2,1)' }} />
        ))}
        <g style={{ transform: `translateX(${x(Math.min(HI, Math.max(LO, probe)))}px)`, transition: 'transform 120ms' }}>
          <path d="M0,30 l-6,-10 h12 z" fill="var(--info)" />
          <line y1={30} y2={78} stroke="var(--info)" strokeDasharray="2 2" />
          <text y={14} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="var(--font-mono)" fill="var(--info)">{probe}</text>
        </g>
        {/* magnifiers: each limit zoomed so the off-by-one pair is legible */}
        {[
          { at: min, pair: [points[0], points[1]], bx: 24, title: 'lower limit' },
          { at: max, pair: [points[2], points[3]], bx: 252, title: 'upper limit' },
        ].map(({ at, pair, bx, title }) => (
          <g key={title}>
            <path d={`M${x(at)},72 L${bx + 102},104`} stroke="var(--line-2)" strokeDasharray="3 3" fill="none" style={{ transition: 'd 250ms' }} />
            <rect x={bx} y={104} width={204} height={98} rx={10} fill="var(--surface-2)" stroke="var(--line-2)" />
            <text x={bx + 12} y={122} fontSize={9.5} fontFamily="var(--font-mono)" letterSpacing="0.08em" fill="var(--muted)">{title.toUpperCase()} · ZOOM</text>
            <line x1={bx + 16} x2={bx + 188} y1={146} y2={146} stroke="var(--line-2)" strokeWidth={2} />
            {pair.map((p, k) => {
              const px = bx + 66 + k * 72;
              return (
                <g key={k}>
                  <circle cx={px} cy={146} r={8} fill={p.ok ? 'var(--ok)' : 'var(--bad)'} stroke="var(--surface-2)" strokeWidth={3} />
                  <text x={px} y={176} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-mono)" fill="var(--text)">{p.v}</text>
                  <text x={px} y={192} textAnchor="middle" fontSize={9.5} fill={p.ok ? 'var(--ok)' : 'var(--bad)'}>{p.label}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      {solved && <p className="stage-caption" style={{ color: 'var(--ok)', minHeight: 0, marginTop: 4 }}>At and just past each limit ✓</p>}
      <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
        <label className="slider-row">Min <input type="range" min={1} max={max - 1} value={min} onChange={(e) => setMin(+e.target.value)} /><output>{min}</output></label>
        <label className="slider-row">Max <input type="range" min={min + 1} max={80} value={max} onChange={(e) => setMax(+e.target.value)} /><output>{max}</output></label>
        <label className="slider-row">Probe <input type="range" min={LO} max={HI} value={probe} onChange={(e) => setProbe(+e.target.value)} /><output>{probe}</output></label>
      </div>
      <p className="stage-caption" aria-live="polite">
        Probe <b className="mono">{probe}</b> → <span className={`verdict ${accepted ? 'ok' : 'bad'}`}>{accepted ? 'ACCEPTED' : 'REJECTED'}</span>
        {(probe === min || probe === max) && ' Exactly on a limit. A > instead of >= bug shows up here.'}
      </p>
    </>
  );
}

/* ---------- Equivalence partitions ---------- */
function Partitions({ task, answer, solved }: VProps) {
  if (task.check.kind !== 'multi' || answer.kind !== 'multi') return null;
  const opts = task.check.options;
  const LO = 10;
  const HI = 70;
  const x = (v: number) => 20 + ((v - LO) / (HI - LO)) * 440;
  const lanes = [
    { label: 'below 18', from: LO, to: 17.5, color: 'var(--bad)' },
    { label: 'valid 18–60', from: 17.5, to: 60.5, color: 'var(--ok)' },
    { label: 'above 60', from: 60.5, to: HI, color: 'var(--bad)' },
  ];
  const chosen = (i: number) => answer.value.includes(i);
  const numeric = opts.map((o, i) => ({ o, i, n: Number(o) })).filter((p) => Number.isFinite(p.n));
  const other = opts.map((o, i) => ({ o, i, n: Number(o) })).filter((p) => !Number.isFinite(p.n));
  return (
    <>
      <svg className="viz-svg" viewBox="0 0 480 200" role="img" aria-label="Number line with partitions below range, valid range and above range">
        {lanes.map((l) => (
          <g key={l.label}>
            <rect x={x(l.from)} y={40} width={x(l.to) - x(l.from)} height={40} fill={l.color} fillOpacity={0.09} stroke={l.color} strokeOpacity={0.35} rx={6} />
            <text x={(x(l.from) + x(l.to)) / 2} y={30} textAnchor="middle" fontSize={11} fill={l.color}>{l.label}</text>
          </g>
        ))}
        {[10, 20, 30, 40, 50, 60, 70].map((v) => (
          <text key={v} x={x(v)} y={98} textAnchor="middle" fontSize={10} fill="var(--muted)">{v}</text>
        ))}
        <circle cx={x(25)} cy={60} r={7} fill="none" stroke="var(--text)" strokeWidth={2} strokeDasharray="3 2" />
        <text x={x(25)} y={116} textAnchor="middle" fontSize={10} fill="var(--text-2)">25 (reference)</text>
        {numeric.map(({ o, i, n }) => {
          const whole = Number.isInteger(n);
          const on = chosen(i);
          return (
            <g key={i} style={{ transform: `translate(${x(n)}px, ${whole ? 60 : 136}px)` }}>
              <circle r={on ? 8 : 6} fill={on ? 'var(--info)' : 'var(--surface-3)'} stroke={on ? 'var(--surface)' : 'var(--line-2)'} strokeWidth={2} style={{ transition: 'all 200ms' }} />
              <text y={whole ? -14 : 22} textAnchor="middle" fontSize={11} fontWeight={700} fontFamily="var(--font-mono)" fill={on ? 'var(--info)' : 'var(--text-2)'}>{o}</text>
            </g>
          );
        })}
        <rect x={20} y={126} width={300} height={22} rx={6} fill="var(--gold)" fillOpacity={0.07} stroke="var(--gold)" strokeOpacity={0.3} strokeDasharray="4 3" />
        <text x={330} y={141} fontSize={10.5} fill="var(--gold)">not a whole number</text>
        <rect x={20} y={160} width={300} height={28} rx={6} fill="var(--gold)" fillOpacity={0.07} stroke="var(--gold)" strokeOpacity={0.3} strokeDasharray="4 3" />
        <text x={330} y={178} fontSize={10.5} fill="var(--gold)">not a number</text>
        {other.map(({ o, i }, k) => (
          <g key={i} style={{ transform: `translate(${60 + k * 60}px, 174px)` }}>
            <rect x={-20} y={-9} width={40} height={18} rx={5} fill={chosen(i) ? 'var(--info)' : 'var(--surface-3)'} />
            <text y={4} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fontWeight={700} fill={chosen(i) ? 'var(--bg)' : 'var(--text-2)'}>{o}</text>
          </g>
        ))}
      </svg>
      <p className="stage-caption">{solved ? 'One value from the valid lane stands in for all of it.' : 'Your picks light up blue. Which lane does 25 share with them?'}</p>
    </>
  );
}

/* ---------- Bug report assembly ---------- */
const REPORT: Record<string, string> = {
  Title: 'Form submits twice when "Submit" is double-clicked',
  'Steps to reproduce': '1. Open the contact form\n2. Fill in all required fields correctly\n3. Click "Submit" twice quickly',
  'Expected vs actual': 'Expected: the form is sent once\nActual: sent twice (two identical entries saved)',
  Environment: 'Chrome 1xx, Windows 11',
  'Severity & priority': 'Severity: Medium · Priority: High',
  Evidence: 'screen recording attached',
};

function ReportAnatomy({ task, answer }: VProps) {
  const prev = useRef<number[]>([]);
  const order = answer.kind === 'order' ? answer.value : [];
  const moved = new Set(order.filter((v, i) => prev.current[i] !== v));
  useEffect(() => {
    prev.current = order;
  });
  if (task.check.kind !== 'order') return null;
  const steps = task.check.steps;
  return (
    <>
      <dl className="report-doc">
        {order.map((i) => (
          <div key={`${i}-${moved.has(i) ? order.join('') : ''}`} className={`report-sec ${moved.has(i) && prev.current.length ? 'flash' : ''}`}>
            <dt>{steps[i]}</dt>
            <dd>{REPORT[steps[i]]}</dd>
          </div>
        ))}
      </dl>
      <p className="stage-caption">Read it top to bottom as a developer would. Does it flow from "what" to "proof"?</p>
    </>
  );
}

/* ---------- Severity × priority matrix ---------- */
function SevMatrix({ task, answer, solved }: VProps) {
  if (task.check.kind !== 'classify' || answer.kind !== 'classify') return null;
  const { buckets, items } = task.check;
  const cells = [buckets[0], buckets[2], buckets[1], buckets[3]];
  const place = (b: string) => items.map((it, i) => ({ it, i })).filter(({ i }) => answer.value[i] === b);
  const unplaced = items.map((it, i) => ({ it, i })).filter(({ i }) => answer.value[i] === null);
  return (
    <>
      <div className="matrix">
        {cells.map((b, ci) => {
          const [sev, pri] = b.split(' · ');
          return (
            <div key={b} className="matrix-cell" aria-label={b} style={{ gridColumn: (ci % 2) + 2, gridRow: Math.floor(ci / 2) + 1 }}>
              <span className="eyebrow">{sev} · {pri}</span>
              {place(b).map(({ it, i }) => (
                <div key={i} className={`matrix-card ${solved ? 'ok' : ''}`}>
                  <span className="mono muted">{String(i + 1).padStart(2, '0')} </span>{it.label}
                </div>
              ))}
            </div>
          );
        })}
        <span className="axis-y" style={{ gridRow: 1 }}>HIGH PRIORITY</span>
        <span className="axis-y" style={{ gridRow: 2 }}>LOW PRIORITY</span>
        <span className="axis-x" style={{ gridColumn: 2 }}>HIGH SEVERITY</span>
        <span className="axis-x" style={{ gridColumn: 3 }}>LOW SEVERITY</span>
      </div>
      {unplaced.length > 0 && (
        <div className="tray">
          {unplaced.map(({ i }) => <span key={i} className="tag">#{String(i + 1).padStart(2, '0')} unsorted</span>)}
        </div>
      )}
    </>
  );
}

const MAP: Record<VisualId, (p: VProps) => JSX.Element | null> = {
  'qa-rings': QaRings,
  stlc: Stlc,
  'bva-line': BvaLine,
  partitions: Partitions,
  'report-anatomy': ReportAnatomy,
  'sev-matrix': SevMatrix,
};

const TITLES: Record<VisualId, string> = {
  'qa-rings': 'Scope rings',
  stlc: 'Pipeline',
  'bva-line': 'Boundary lab',
  partitions: 'Partition map',
  'report-anatomy': 'Live report',
  'sev-matrix': 'Triage matrix',
};

export function Stage({ visual, ...props }: VProps & { visual: VisualId }) {
  const V = MAP[visual];
  return (
    <aside className="stage" aria-label={`Visual stage: ${TITLES[visual]}`}>
      <div className="stage-head">
        <span className="eyebrow"><span className="live-dot" />{TITLES[visual]}</span>
        <span className="eyebrow">interactive</span>
      </div>
      <div className="stage-body">
        <V {...props} />
      </div>
    </aside>
  );
}

export function SandboxStage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="stage" aria-label={`Sandbox: ${title}`}>
      <div className="stage-head">
        <span className="eyebrow"><span className="live-dot" />{title}</span>
        <span className="eyebrow">sandbox</span>
      </div>
      <div className="stage-body">{children}</div>
    </aside>
  );
}
