import { useState } from 'react';
import { Bulb, Lock } from './Icons';
import { Rich } from './Rich';

const NAMES = ['Nudge', 'Structural clue', 'Full walkthrough'];
const COST = ['−20% XP', '−40% XP', '−60% XP'];

interface Props {
  hints: [string, string, string];
  revealed: number;
  free: boolean;
  solvedView: boolean;
  onReveal: () => void;
}

export function HintDrawer({ hints, revealed, free, solvedView, onReveal }: Props) {
  const [open, setOpen] = useState(revealed > 0 && !solvedView);
  const isOpen = open || (revealed > 0 && !solvedView);
  return (
    <div className="hints">
      <div className="hints-head">
        <button className="btn ghost sm" onClick={() => setOpen((o) => !o)} aria-expanded={isOpen}>
          <Bulb size={14} /> Hints <span className="mono muted">{Math.min(revealed, 3)}/3</span>
        </button>
        {!solvedView && revealed < 3 && (
          <span className="muted" style={{ fontSize: 12 }}>
            Press <kbd>H</kbd> for the next hint
          </span>
        )}
      </div>
      {isOpen &&
        hints.map((h, i) => {
          const shown = i < revealed;
          const next = i === revealed;
          return (
            <div key={i} className={`hint ${shown ? 'open' : 'locked'}`}>
              <div className="hint-top">
                <span className="hint-step">{i + 1}</span>
                <span className="eyebrow">Hint {i + 1} · {NAMES[i]}</span>
                {!shown && next && (
                  <button className="btn sm" onClick={onReveal}>
                    Reveal{!free && <span className="mono muted"> {COST[i]}</span>}
                  </button>
                )}
                {!shown && !next && <Lock />}
              </div>
              {shown && (
                <div className="hint-body">
                  <Rich text={h} />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
