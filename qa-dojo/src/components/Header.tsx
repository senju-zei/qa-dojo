import { useEffect, useRef, useState } from 'react';
import { levelInfo } from '../engine/progress';
import { prefersReducedMotion, useCountUp } from '../hooks';
import { FocusIcon, Mark, Search, Spark } from './Icons';

interface Props {
  xp: number;
  streak: number;
  dueCount: number;
  crumb?: { room: string; task: string };
  focus: boolean;
  onHome: () => void;
  onPalette: () => void;
  onFocus: () => void;
  onReview: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function Header({ xp, streak, dueCount, crumb, focus, onHome, onPalette, onFocus, onReview }: Props) {
  const shown = useCountUp(xp);
  const lv = levelInfo(shown);
  const prevXp = useRef(xp);
  const prevLevel = useRef(levelInfo(xp).level);
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const gained = xp - prevXp.current;
    prevXp.current = xp;
    if (gained > 0 && !prefersReducedMotion()) {
      const id = Date.now();
      setFloats((f) => [...f, { id, amount: gained }]);
      window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1200);
    }
    const level = levelInfo(xp).level;
    if (level > prevLevel.current) {
      setPulse(true);
      window.setTimeout(() => setPulse(false), 700);
    }
    prevLevel.current = level;
  }, [xp]);

  return (
    <header className="header">
      <button className="brand" onClick={onHome} aria-label="QA Dojo home">
        <span className="brand-mark"><Mark /></span>
        <span className="brand-name">QA<span>/</span>Dojo</span>
      </button>
      {crumb && (
        <div className="crumb">
          <b>{crumb.room}</b> · {crumb.task}
        </div>
      )}
      {focus && <span className="focus-banner">FOCUS</span>}
      <div className="header-spacer" />
      <div className="hud">
        {dueCount > 0 && (
          <button className="pill due hide-focus" onClick={onReview} title="Start the review queue">
            {dueCount} due
          </button>
        )}
        <span className={`pill streak ${streak === 0 ? 'cold' : ''}`} title={`${streak}-day streak`}>
          <Spark size={13} /> {streak}
          <span className="sr-only">day streak</span>
        </span>
        <div className={`xp-meter ${pulse ? 'pulse' : ''}`} aria-label={`Level ${lv.level}, ${xp} XP`}>
          <span className="level-chip">LV {lv.level}</span>
          <div className="xp-stack">
            <div className="xp-row">
              <span>{shown} XP</span>
              <span className="muted">{lv.span - lv.into} to go</span>
            </div>
            <div className="bar"><i style={{ width: `${Math.round(lv.pct * 100)}%` }} /></div>
          </div>
          {floats.map((f) => (
            <span key={f.id} className="xp-float">+{f.amount}</span>
          ))}
        </div>
        <button className="btn sm cmdk-trigger" onClick={onPalette} aria-label="Open command palette">
          <Search size={14} />
          <span>Jump to</span>
          <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd>
        </button>
        <button className="icon-btn" onClick={onFocus} aria-pressed={focus} aria-label="Toggle focus mode (F)" title="Focus mode (F)">
          <FocusIcon size={15} />
        </button>
      </div>
    </header>
  );
}
