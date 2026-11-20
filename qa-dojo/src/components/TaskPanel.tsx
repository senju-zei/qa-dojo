import { useCallback, useEffect, useRef, useState } from 'react';
import { initialAnswer, isEmpty, solvedAnswer } from '../engine/answers';
import { evaluate } from '../engine/evaluate';
import type { Mode, TaskProgress } from '../engine/progress';
import type { Answer, Room, Task } from '../engine/types';
import { prefersReducedMotion } from '../hooks';
import { Lifecycle } from '../sandboxes/Lifecycle';
import { MutantLab } from '../sandboxes/MutantLab';
import { SandboxStage, Stage } from '../visuals/Visuals';
import { HintDrawer } from './HintDrawer';
import { Arrow, Check } from './Icons';
import { Rich } from './Rich';
import { ChoiceRunner, ClassifyRunner, MultiRunner, OrderRunner, ValueRunner } from './Runners';

interface Props {
  room: Room;
  task: Task;
  index: number;
  tp: TaskProgress | undefined;
  mode: Mode;
  isLast: boolean;
  onAttempt: (correct: boolean) => number;
  onHint: () => void;
  onNext: () => void;
}

function Burst({ amount }: { amount: number }) {
  return (
    <span className="burst" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} style={{ ['--a' as string]: `${(360 / 14) * i}deg`, ['--d' as string]: `${38 + (i % 3) * 12}px` }} />
      ))}
      <b>+{amount} XP</b>
    </span>
  );
}

export function TaskPanel({ room, task, index, tp, mode, isLast, onAttempt, onHint, onNext }: Props) {
  const solved = !!tp?.solved;
  const [answer, setAnswer] = useState<Answer>(() => (solved ? solvedAnswer(task) : initialAnswer(task)));
  const [retrying, setRetrying] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'right'>('idle');
  const [feedback, setFeedback] = useState('');
  const [shaking, setShaking] = useState(false);
  const [burst, setBurst] = useState<{ key: number; amount: number } | null>(null);
  const [localHints, setLocalHints] = useState(0);
  const [lastGain, setLastGain] = useState<number | null>(null);

  const locked = (solved && !retrying) || status === 'right';
  const revealed = mode === 'learn' ? tp?.hints ?? 0 : Math.max(tp?.hints ?? 0, localHints);
  const c = task.check;

  const revealHint = useCallback(() => {
    if (revealed >= 3) return;
    if (mode === 'learn') onHint();
    else setLocalHints(revealed + 1);
  }, [mode, onHint, revealed]);

  const submit = (a: Answer) => {
    if (locked) return;
    const res = evaluate(c, a);
    if (!res.correct && a.kind !== 'sandbox' && isEmpty(a)) {
      setFeedback(res.detail ?? 'Answer first.');
      setStatus('idle');
      return;
    }
    const gained = onAttempt(res.correct);
    if (res.correct) {
      setStatus('right');
      setRetrying(false);
      setLastGain(gained);
      setFeedback(gained > 0 ? `Solved. +${gained} XP` : mode === 'practice' ? 'Still got it.' : 'Solved.');
      if (gained > 0 && !prefersReducedMotion()) {
        setBurst({ key: Date.now(), amount: gained });
        window.setTimeout(() => setBurst(null), 1100);
      }
    } else {
      setStatus('wrong');
      setShaking(true);
      setFeedback(`Not quite. ${res.detail ?? 'Adjust and try again, or open a hint.'}`);
    }
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;
  const submitSandbox = useCallback((a: Answer) => submitRef.current(a), []);

  useEffect(() => {
    const onHintEv = () => revealHint();
    const onCheckEv = () => {
      if (c.kind === 'sandbox') (document.querySelector('[data-check]') as HTMLButtonElement | null)?.click();
      else submitRef.current(answer);
    };
    window.addEventListener('dojo:hint', onHintEv);
    window.addEventListener('dojo:check', onCheckEv);
    return () => {
      window.removeEventListener('dojo:hint', onHintEv);
      window.removeEventListener('dojo:check', onCheckEv);
    };
  }, [revealHint, answer, c.kind]);

  const change = (a: Answer) => {
    setAnswer(a);
    if (status === 'wrong') setStatus('idle');
  };

  const retry = () => {
    setAnswer(initialAnswer(task));
    setRetrying(true);
    setRetryKey((k) => k + 1);
    setStatus('idle');
    setFeedback('');
    setLastGain(null);
  };

  const runner = (() => {
    const common = { locked, onSubmit: () => submit(answer) };
    switch (c.kind) {
      case 'choice': return answer.kind === 'choice' && <ChoiceRunner check={c} answer={answer} onChange={change} {...common} />;
      case 'multi': return answer.kind === 'multi' && <MultiRunner check={c} answer={answer} onChange={change} {...common} />;
      case 'value': return answer.kind === 'value' && <ValueRunner check={c} answer={answer} onChange={change} {...common} />;
      case 'order': return answer.kind === 'order' && <OrderRunner check={c} answer={answer} onChange={change} {...common} />;
      case 'classify': return answer.kind === 'classify' && <ClassifyRunner check={c} answer={answer} onChange={change} {...common} />;
      default: return null;
    }
  })();

  const sandbox =
    c.kind === 'sandbox' ? (
      <div className={shaking ? 'shake' : ''} onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}>
        <SandboxStage title={c.sandbox === 'mutant-lab' ? 'Mutant lab' : 'Bug life cycle'}>
          {c.sandbox === 'mutant-lab' ? (
            <MutantLab key={retryKey} locked={locked} onSubmit={submitSandbox} />
          ) : (
            <Lifecycle key={retryKey} locked={locked} onSubmit={submitSandbox} />
          )}
        </SandboxStage>
      </div>
    ) : null;

  const hasStage = !!task.visual || !!sandbox;
  const showSolvedCard = locked;
  const gainShown = lastGain ?? (mode === 'learn' ? 0 : tp?.xpEarned ?? 0);

  return (
    <article>
      <div className="task-head">
        <div>
          <div className="eyebrow">Task {String(index + 1).padStart(2, '0')} / {String(room.tasks.length).padStart(2, '0')} · {room.title}</div>
          <h1>{task.title}</h1>
        </div>
        <div className="task-tools">
          {status === 'right' ? (
            <span className="mode-chip" style={{ color: 'var(--ok)', background: 'var(--ok-soft)' }}>SOLVED ✓</span>
          ) : (
            <>
              {mode === 'learn' && <span className="xp-chip">+{task.xp} XP</span>}
              {mode === 'review' && <span className="mode-chip">REVIEW · +10 XP</span>}
              {mode === 'practice' && <span className="mode-chip">PRACTICE</span>}
            </>
          )}
        </div>
      </div>

      <div className={`task-body ${hasStage ? '' : 'no-stage'}`}>
        <section className="panel">
          <div className="brief">
            {task.brief.map((p, i) => (
              <p key={i}><Rich text={p} /></p>
            ))}
          </div>
          <div className="drawer">
            <p className="prompt">{c.prompt}</p>
            {runner && (
              <div className={shaking ? 'shake' : ''} onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}>
                {runner}
              </div>
            )}

            {c.kind !== 'sandbox' && !locked && (
              <div className="check-row">
                <span className="burst-host">
                  <button className="btn primary" onClick={() => submit(answer)} disabled={isEmpty(answer)}>
                    Check answer <kbd>↵</kbd>
                  </button>
                </span>
              </div>
            )}

            <div className={`feedback ${status === 'wrong' ? 'bad' : status === 'right' ? 'ok' : ''}`} role="status" aria-live="polite" style={{ marginTop: 12 }}>
              {burst && (
                <span className="burst-host" style={{ width: 0, height: 0, marginLeft: 36 }}>
                  <Burst key={burst.key} amount={burst.amount} />
                </span>
              )}
              {feedback}
            </div>


            {showSolvedCard && (
              <div className="solved-card">
                <span className="tick"><Check size={14} /></span>
                <div style={{ flex: 1 }}>
                  <b>{status === 'right' ? 'Solved' : 'Cleared'}</b>
                  {gainShown > 0 && <span className="mono muted"> · +{gainShown} XP</span>}
                  {tp?.solved && status !== 'right' && (
                    <span className="mono muted"> · {tp.clean ? 'clean solve' : `${tp.hints} hint${tp.hints === 1 ? '' : 's'}`}</span>
                  )}
                  <p>{task.explain}</p>
                  <div className="check-row" style={{ marginTop: 12 }}>
                    <button className="btn primary sm" onClick={onNext}>
                      {isLast ? 'Room summary' : 'Next task'} <Arrow size={14} />
                    </button>
                    {!retrying && status !== 'right' && (
                      <button className="btn sm" onClick={retry}>
                        {mode === 'review' ? 'Review now' : 'Practice again'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <HintDrawer hints={task.hints} revealed={solved && !retrying ? 3 : revealed} free={mode !== 'learn'} onReveal={revealHint} solvedView={solved && !retrying} />
          </div>
        </section>

        {sandbox ?? (task.visual && <Stage visual={task.visual} task={task} answer={answer} solved={locked} />)}
      </div>
    </article>
  );
}
