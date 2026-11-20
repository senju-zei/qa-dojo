import { useState } from 'react';
import type { Answer } from '../engine/types';
import { AGE_MAX, AGE_MIN, MAX_TESTS, MUTANTS, runSuite, spec } from '../engine/sandboxes';
import { Reset } from '../components/Icons';

interface Props {
  locked: boolean;
  onSubmit: (a: Answer) => void;
}

const LO = 10;
const HI = 70;

export function MutantLab({ locked, onSubmit }: Props) {
  const [tests, setTests] = useState<number[]>(locked ? [17, 18, 60, 61] : []);
  const [draft, setDraft] = useState('');
  const [ran, setRan] = useState<number[] | null>(locked ? [17, 18, 60, 61] : null);
  const [error, setError] = useState('');

  const add = (n: number) => {
    if (locked) return;
    if (!Number.isInteger(n) || n < 0 || n > 120) return setError('Use a whole number from 0 to 120.');
    if (tests.includes(n)) return setError(`${n} is already in the suite.`);
    if (tests.length >= 10) return setError('Suite is full. Remove a test first.');
    setError('');
    setTests((t) => [...t, n].sort((a, b) => a - b));
  };

  const run = () => {
    const res = runSuite(tests);
    setRan(tests);
    const detail = !res.allKilled
      ? `${res.killed} of ${MUTANTS.length} mutants killed. ${MUTANTS.length - res.killed} survived.`
      : !res.withinBudget
        ? `All killed, but ${tests.length} tests is over the budget of ${MAX_TESTS}.`
        : undefined;
    onSubmit({ kind: 'sandbox', value: res.allKilled && res.withinBudget, detail });
  };

  const stale = ran !== null && ran.join() !== tests.join();
  const shown = ran ?? [];
  const results = runSuite(shown).results;
  const x = (v: number) => 20 + ((Math.min(HI, Math.max(LO, v)) - LO) / (HI - LO)) * 520;

  return (
    <div className="sandbox">
      <svg
        className="viz-svg"
        viewBox="0 0 560 90"
        role="img"
        aria-label="Number line from 10 to 70. Click to add a test age."
        style={{ cursor: locked ? 'default' : 'crosshair' }}
        onClick={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * 560;
          add(Math.round(LO + ((px - 20) / 520) * (HI - LO)));
        }}
      >
        <rect x={x(AGE_MIN) - 4} y={22} width={x(AGE_MAX) - x(AGE_MIN) + 8} height={14} rx={7} fill="var(--ok-soft)" stroke="var(--ok)" strokeOpacity={0.4} />
        <line x1={20} x2={540} y1={29} y2={29} stroke="var(--line-2)" strokeWidth={2} />
        {Array.from({ length: (HI - LO) / 5 + 1 }, (_, i) => LO + i * 5).map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={25} y2={33} stroke="var(--line-2)" />
            <text x={x(v)} y={54} textAnchor="middle" fontSize={11} fill="var(--muted)">{v}</text>
          </g>
        ))}
        <text x={(x(AGE_MIN) + x(AGE_MAX)) / 2} y={14} textAnchor="middle" fontSize={11} fill="var(--ok)">spec: 18 ≤ age ≤ 60</text>
        {tests.map((t, i) => {
          const crowded = i > 0 && x(t) - x(tests[i - 1]) < 18 && i % 2 === 1;
          return (
            <g key={t}>
              <circle cx={x(t)} cy={29} r={6} fill={spec(t) ? 'var(--ok)' : 'var(--bad)'} stroke="var(--surface)" strokeWidth={2} />
              <text x={x(t)} y={crowded ? 84 : 70} textAnchor="middle" fontSize={10} fontWeight={600} fontFamily="var(--font-mono)" fill="var(--text)">{t}</text>
            </g>
          );
        })}
      </svg>

      {!locked && (
        <form
          className="add-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add(Number(draft));
            setDraft('');
          }}
        >
          <label className="sr-only" htmlFor="age-test">Test age</label>
          <input id="age-test" className="value-input" inputMode="numeric" placeholder="Add a test age, or click the line" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button className="btn" type="submit">Add</button>
        </form>
      )}

      <div className="test-chips" aria-live="polite">
        {tests.length === 0 && <span className="muted" style={{ fontSize: 13 }}>No tests yet.</span>}
        {tests.map((t) => (
          <span key={t} className="test-chip">
            {t}
            {!locked && (
              <button type="button" aria-label={`Remove ${t}`} onClick={() => setTests((ts) => ts.filter((v) => v !== t))}>×</button>
            )}
          </span>
        ))}
        <span className={`budget ${tests.length > MAX_TESTS ? 'over' : ''}`}>{tests.length}/{MAX_TESTS} tests</span>
      </div>
      {error && <div className="feedback bad" role="alert">{error}</div>}

      <div className={`table-wrap ${stale ? 'stale' : ''}`}>
        <table className="mutant-table">
          <thead>
            <tr>
              <th>Implementation</th>
              {shown.map((t) => <th key={t} className="cell">{t}</th>)}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="spec-row">
              <td><code>spec ✓</code></td>
              {shown.map((t) => <td key={t} className="cell">{spec(t) ? 'ACC' : 'REJ'}</td>)}
              <td><span className="status idle">TRUTH</span></td>
            </tr>
            {results.map(({ mutant, killer }) => (
              <tr key={mutant.id}>
                <td><code>{mutant.code}</code></td>
                {shown.map((t) => {
                  const diff = mutant.accepts(t) !== spec(t);
                  return <td key={t} className={`cell ${diff ? 'diff' : 'same'}`}>{mutant.accepts(t) ? 'ACC' : 'REJ'}</td>;
                })}
                <td>
                  {ran === null ? <span className="status idle">IDLE</span> : killer !== null ? <span className="status killed">KILLED</span> : <span className="status alive">ALIVE</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!locked && (
        <div className="check-row" style={{ marginTop: 0 }}>
          <button className="btn primary" onClick={run} disabled={tests.length === 0} data-check>
            Run suite
          </button>
          <button className="btn ghost sm" onClick={() => { setTests([]); setRan(null); setError(''); }}>
            <Reset /> Clear
          </button>
          {stale && <span className="muted" style={{ fontSize: 13 }}>Suite changed. Run again.</span>}
        </div>
      )}
    </div>
  );
}
