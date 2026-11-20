import { useLayoutEffect, useRef, useState } from 'react';
import type { Answer, Check } from '../engine/types';
import { Down, Up } from './Icons';

type Of<K extends Check['kind']> = Extract<Check, { kind: K }>;
type Ans<K extends Answer['kind']> = Extract<Answer, { kind: K }>;
interface RunnerProps<K extends Check['kind'] & Answer['kind']> {
  check: Of<K>;
  answer: Ans<K>;
  onChange: (a: Ans<K>) => void;
  locked: boolean;
  onSubmit?: () => void;
}

const LETTERS = 'ABCDEFGH';

export function ChoiceRunner({ check, answer, onChange, locked }: RunnerProps<'choice'>) {
  return (
    <div className={`options ${locked ? 'locked' : ''}`} role="radiogroup" aria-label={check.prompt}>
      {check.options.map((o, i) => {
        const sel = answer.value === i;
        return (
          <label key={i} className={`option ${sel ? (locked ? 'correct' : 'selected') : ''}`}>
            <input type="radio" name="choice" checked={sel} disabled={locked} onChange={() => onChange({ kind: 'choice', value: i })} />
            <span className="option-key">{LETTERS[i]}</span>
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

export function MultiRunner({ check, answer, onChange, locked }: RunnerProps<'multi'>) {
  const toggle = (i: number) =>
    onChange({ kind: 'multi', value: answer.value.includes(i) ? answer.value.filter((x) => x !== i) : [...answer.value, i] });
  return (
    <div className={`options ${locked ? 'locked' : ''}`} role="group" aria-label={check.prompt}>
      {check.options.map((o, i) => {
        const sel = answer.value.includes(i);
        return (
          <label key={i} className={`option multi ${sel ? (locked ? 'correct' : 'selected') : ''}`}>
            <input type="checkbox" checked={sel} disabled={locked} onChange={() => toggle(i)} />
            <span className="option-key">{sel ? '✓' : LETTERS[i]}</span>
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ValueRunner({ check, answer, onChange, locked, onSubmit }: RunnerProps<'value'>) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <label className="sr-only" htmlFor="value-answer">{check.prompt}</label>
      <input
        id="value-answer"
        className="value-input"
        value={answer.value}
        placeholder={check.placeholder}
        disabled={locked}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange({ kind: 'value', value: e.target.value })}
      />
    </form>
  );
}

/** Reorderable list: drag, or use the arrow buttons. Rows glide to new positions (FLIP). */
export function OrderRunner({ check, answer, onChange, locked }: RunnerProps<'order'>) {
  const refs = useRef(new Map<number, HTMLLIElement>());
  const rects = useRef(new Map<number, DOMRect>());
  const [dragging, setDragging] = useState<number | null>(null);

  useLayoutEffect(() => {
    refs.current.forEach((el, key) => {
      const prev = rects.current.get(key);
      const next = el.getBoundingClientRect();
      if (prev) {
        const dy = prev.top - next.top;
        if (dy) {
          el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
            duration: 220,
            easing: 'cubic-bezier(.2,.8,.2,1)',
          });
        }
      }
      rects.current.set(key, next);
    });
  }, [answer.value]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= answer.value.length || from === to) return;
    const v = [...answer.value];
    const [item] = v.splice(from, 1);
    v.splice(to, 0, item);
    onChange({ kind: 'order', value: v });
  };

  return (
    <ol className={`order-list ${locked ? 'locked' : ''}`} aria-label={check.prompt}>
      {answer.value.map((stepIdx, pos) => (
        <li
          key={stepIdx}
          ref={(el) => {
            if (el) refs.current.set(stepIdx, el);
            else refs.current.delete(stepIdx);
          }}
          className={`order-row ${dragging === stepIdx ? 'dragging' : ''} ${locked ? 'correct' : ''}`}
          draggable={!locked}
          onDragStart={(e) => {
            setDragging(stepIdx);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => setDragging(null)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragging === null || dragging === stepIdx) return;
            move(answer.value.indexOf(dragging), pos);
          }}
        >
          <span className="grip" aria-hidden>⋮⋮</span>
          <span className="order-pos">{pos + 1}</span>
          <span>{check.steps[stepIdx]}</span>
          {!locked && (
            <span className="order-btns">
              <button type="button" className="icon-btn" onClick={() => move(pos, pos - 1)} disabled={pos === 0} aria-label={`Move "${check.steps[stepIdx]}" up`}>
                <Up />
              </button>
              <button type="button" className="icon-btn" onClick={() => move(pos, pos + 1)} disabled={pos === answer.value.length - 1} aria-label={`Move "${check.steps[stepIdx]}" down`}>
                <Down />
              </button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ClassifyRunner({ check, answer, onChange, locked }: RunnerProps<'classify'>) {
  const set = (i: number, b: string) => {
    const v = [...answer.value];
    v[i] = v[i] === b ? null : b;
    onChange({ kind: 'classify', value: v });
  };
  return (
    <div className={`classify ${locked ? 'locked' : ''}`}>
      {check.items.map((it, i) => (
        <div key={i} className={`cls-item ${answer.value[i] ? 'placed' : ''} ${locked ? 'correct' : ''}`}>
          <div className="cls-label">
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            <span>{it.label}</span>
          </div>
          <div className="chips" role="group" aria-label={`Category for: ${it.label}`}>
            {check.buckets.map((b) => (
              <button key={b} type="button" className="chip" aria-pressed={answer.value[i] === b} disabled={locked && answer.value[i] !== b} onClick={() => !locked && set(i, b)}>
                {b}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
